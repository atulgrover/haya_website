'use strict';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  🔒 HUMAN-IN-THE-LOOP NEON PUBLISHER                                     ║
 * ║                                                                           ║
 * ║  This is the ONLY script authorised to write to Neon Cloud PostgreSQL.   ║
 * ║  It requires explicit interactive confirmation before any data is pushed. ║
 * ║                                                                           ║
 * ║  Usage (explicit human command only):                                     ║
 * ║    node scripts/push_local_pg_to_neon.js                                 ║
 * ║    node scripts/push_local_pg_to_neon.js --tables=nsqf_pcs,nsqf_videos   ║
 * ║    node scripts/push_local_pg_to_neon.js --dry-run   (safe preview)      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Flow:
 *   1. Connect to LOCAL hayadb (source of truth)
 *   2. Show row counts diff vs Neon
 *   3. Require user to type "PUSH TO NEON" to proceed
 *   4. Bulk-upsert selected tables from local → Neon
 *   5. Verify row counts match after push
 */

require('dotenv').config();
const { Pool }   = require('pg');
const readline   = require('readline');

// ── Safety: verify we have both URLs ─────────────────────────────────────────
const LOCAL_URL = process.env.LOCAL_DATABASE_URL;
const NEON_URL  = process.env.NEON_DATABASE_URL;

if (!LOCAL_URL) {
    console.error('❌  LOCAL_DATABASE_URL not set in .env'); process.exit(1);
}
if (!NEON_URL) {
    console.error('❌  NEON_DATABASE_URL not set in .env'); process.exit(1);
}
if (LOCAL_URL.includes('neon.tech')) {
    console.error('❌  LOCAL_DATABASE_URL must not point to Neon.'); process.exit(1);
}

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const isDryRun  = args.includes('--dry-run');
const tableFlag = args.find(a => a.startsWith('--tables='));
const TABLES_TO_PUSH = tableFlag
    ? tableFlag.replace('--tables=', '').split(',')
    : ['nsqf_qps', 'nsqf_nos', 'nsqf_modules', 'nsqf_pcs',
       'nsqf_videos', 'nsqf_curricula', 'nsqf_video_audit_logs',
       'youtube_search_cache', 'video_swap_suggestions',
       'users', 'licenses', 'subscriptions', 'download_logs',
       'report_orders', 'skill_progress', 'user_pc_progress',
       'user_purchases', 'user_payment_methods', 'custom_skills'];

// ── DB pools ──────────────────────────────────────────────────────────────────
const localPool = new Pool({ connectionString: LOCAL_URL });
const urlObj    = new URL(NEON_URL);
const neonPool  = new Pool({
    user:     decodeURIComponent(urlObj.username),
    password: decodeURIComponent(urlObj.password),
    host:     '52.76.108.241',
    port:     5432,
    database: urlObj.pathname.slice(1),
    ssl:      { rejectUnauthorized: false, servername: urlObj.hostname }
});

// ── HIL confirmation prompt ───────────────────────────────────────────────────
function confirm(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function getCount(pool, table) {
    try {
        const r = await pool.query(`SELECT COUNT(*) AS c FROM ${table}`);
        return parseInt(r.rows[0].c);
    } catch { return -1; }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n================================================================================');
    console.log('🔒 HAYA PORTAL — LOCAL → NEON CLOUD PUBLISHER  (Human-in-the-Loop)');
    if (isDryRun) console.log('   ⚠️  DRY-RUN MODE — no data will be written to Neon');
    console.log('================================================================================\n');
    console.log(`📁 Source (local):  ${LOCAL_URL.replace(/:([^:@]+)@/, ':***@')}`);
    console.log(`☁️  Target (Neon):   ${urlObj.hostname}/${urlObj.pathname.slice(1)}\n`);

    // ── Show diff ────────────────────────────────────────────────────────────
    console.log('📊 Row count comparison (local → Neon):\n');
    console.log('  Table                      Local      Neon       Δ');
    console.log('  ─────────────────────────  ─────────  ─────────  ──────');
    const diffs = [];
    for (const table of TABLES_TO_PUSH) {
        const local = await getCount(localPool, table);
        const neon  = await getCount(neonPool, table);
        const delta = local - neon;
        const flag  = delta > 0 ? '▲' : delta < 0 ? '▼' : '✓';
        console.log(`  ${table.padEnd(25)}  ${String(local).padStart(9)}  ${String(neon).padStart(9)}  ${flag} ${Math.abs(delta)}`);
        if (delta !== 0) diffs.push({ table, local, neon, delta });
    }
    console.log();

    if (diffs.length === 0) {
        console.log('✅  Local and Neon are already in sync. Nothing to push.\n');
        await cleanup(); return;
    }

    console.log(`⚠️  ${diffs.length} table(s) differ between local and Neon.\n`);

    if (isDryRun) {
        console.log('ℹ️  Dry-run complete. No data was written.\n');
        await cleanup(); return;
    }

    // ── HIL gate ─────────────────────────────────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  WARNING: This will overwrite data in the Neon production database.');
    console.log('   Ensure you have thoroughly tested locally before proceeding.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const answer = await confirm('  Type exactly "PUSH TO NEON" to confirm, or anything else to abort: ');

    if (answer !== 'PUSH TO NEON') {
        console.log('\n❌  Aborted. No data was written to Neon.\n');
        await cleanup(); return;
    }

    // ── Push via pg_dump | psql ───────────────────────────────────────────────
    const { execSync } = require('child_process');
    console.log('\n🚀 Pushing to Neon...\n');

    for (const { table } of diffs) {
        process.stdout.write(`  ➜  ${table.padEnd(30)}`);
        try {
            const dumpCmd = `pg_dump "${LOCAL_URL}" --no-owner --no-acl -t ${table} --data-only`;
            const restoreCmd = `psql "${NEON_URL}"`;
            execSync(`${dumpCmd} | ${restoreCmd}`, { stdio: ['pipe', 'pipe', 'pipe'] });
            const after = await getCount(neonPool, table);
            console.log(`✅  ${after} rows`);
        } catch (e) {
            console.log(`❌  Error: ${e.message.slice(0, 80)}`);
        }
    }

    // ── Verify ────────────────────────────────────────────────────────────────
    console.log('\n📊 Verification (row counts after push):\n');
    let allMatch = true;
    for (const { table } of diffs) {
        const local = await getCount(localPool, table);
        const neon  = await getCount(neonPool, table);
        const ok    = local === neon;
        if (!ok) allMatch = false;
        console.log(`  ${table.padEnd(28)}  local=${local}  neon=${neon}  ${ok ? '✅' : '❌ MISMATCH'}`);
    }
    console.log();
    if (allMatch) {
        console.log('✅  All tables verified. Push complete.\n');
    } else {
        console.log('⚠️  Some tables have row count mismatches — check for conflicts.\n');
    }

    await cleanup();
}

async function cleanup() {
    await localPool.end();
    await neonPool.end();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
