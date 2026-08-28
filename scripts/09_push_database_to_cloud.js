'use strict';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  🔒 HAYA PORTAL — LOCAL → NEON CLOUD PUBLISHER (Stage 7 Pipeline)         ║
 * ║                                                                           ║
 * ║  Pushes 100% normalized local hayadb tables & canonical data to Neon Cloud║
 * ║  PostgreSQL (neondb) with automated schema mirroring & verification.      ║
 * ║                                                                           ║
 * ║  Usage:                                                                   ║
 * ║    node scripts/09_push_database_to_cloud.js --afresh                     ║
 * ║    node scripts/09_push_database_to_cloud.js --dry-run                    ║
 * ║    node scripts/09_push_database_to_cloud.js --tables=nsqf_pcs,nsqf_nos   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const { Pool } = require('pg');
const { execSync } = require('child_process');

const LOCAL_URL = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:hayapass@localhost:5432/hayadb';
const NEON_URL  = process.env.NEON_DATABASE_URL;

if (!LOCAL_URL || !NEON_URL) {
    console.error('❌ Missing LOCAL_DATABASE_URL or NEON_DATABASE_URL in .env');
    process.exit(1);
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isAfresh = args.includes('--afresh') || args.includes('--force');
const tableFlag = args.find(a => a.startsWith('--tables='));

const CANONICAL_TABLES = [
    'nsqf_qps',
    'nsqf_nos',
    'nsqf_modules',
    'nsqf_pcs',
    'nsqf_kus',
    'nsqf_gs',
    'video_swap_suggestions',
    'pc_explanations_cache',
    'users',
    'subscriptions',
    'licenses',
    'custom_skills',
    'skill_progress',
    'user_pc_progress',
    'download_logs',
    'user_purchases',
    'user_payment_methods',
    'report_orders',
    'nsqf_curricula',
    'nsqf_video_audit_logs',
    'youtube_search_cache'
];

const TABLES_TO_SYNC = tableFlag
    ? tableFlag.replace('--tables=', '').split(',')
    : CANONICAL_TABLES;

const localPool = new Pool({ connectionString: LOCAL_URL });
const neonPool  = new Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });

async function getCount(pool, table) {
    try {
        const r = await pool.query(`SELECT COUNT(*) AS c FROM "${table}"`);
        return parseInt(r.rows[0].c, 10);
    } catch {
        return -1;
    }
}

async function recreateNeonSchemaFromLocal() {
    console.log('\n🧹 [Neon Cloud] Resetting public schema & mirroring 100% exact local DDL...');

    // Drop and recreate clean public schema
    await neonPool.query(`
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO PUBLIC;
    `);

    // Apply exact schema from local hayadb
    const dumpSchemaCmd = `pg_dump "${LOCAL_URL}" --no-owner --no-acl --schema-only`;
    const restoreSchemaCmd = `psql "${NEON_URL}" -q -v ON_ERROR_STOP=1`;
    execSync(`${dumpSchemaCmd} | ${restoreSchemaCmd}`, { stdio: ['pipe', 'pipe', 'inherit'] });

    console.log('✅ [Neon Cloud] Exact canonical schema & indexes mirrored successfully.');
}

async function streamTable(table) {
    process.stdout.write(`  ➜ Uploading ${table.padEnd(26)} ... `);
    const start = Date.now();
    try {
        const dumpCmd = `pg_dump "${LOCAL_URL}" --no-owner --no-acl --table="${table}" --data-only`;
        const restoreCmd = `psql "${NEON_URL}" -q -v ON_ERROR_STOP=1`;
        execSync(`${dumpCmd} | ${restoreCmd}`, { stdio: ['pipe', 'pipe', 'inherit'] });

        // Reset sequence if exists
        try {
            await neonPool.query(`
                SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX(id), 1)) FROM "${table}"
            `);
        } catch (_) {}

        const neonCount = await getCount(neonPool, table);
        const durationSec = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`✅ ${neonCount.toLocaleString()} rows (${durationSec}s)`);
    } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
    }
}

async function main() {
    console.log('\n================================================================================');
    console.log('🚀 HAYA PORTAL — LOCAL → NEON CLOUD PUBLISHER (Stage 7)');
    console.log(` Mode: ${isDryRun ? 'DRY-RUN' : isAfresh ? 'AFRESH PURGE & UPLOAD' : 'INCREMENTAL SYNC'}`);
    console.log('================================================================================\n');

    console.log('🧹 [Local Maintenance] Purging expired YouTube API cache (Policy III.E.4 7-day TTL)...');
    try {
        const purgeRes = await localPool.query(`DELETE FROM youtube_search_cache WHERE cached_at < NOW() - INTERVAL '7 days'`);
        if (purgeRes.rowCount > 0) {
            console.log(`✅ Purged ${purgeRes.rowCount.toLocaleString()} expired cache entries from local hayadb.`);
            await localPool.query(`VACUUM FULL youtube_search_cache`);
            console.log(`✅ Reclaimed disk space via VACUUM FULL.`);
        } else {
            console.log(`✅ Cache is already clean.`);
        }
    } catch (e) {
        console.error('⚠️ Failed to purge cache:', e.message);
    }
    console.log();

    if (isDryRun) {
        console.log('📊 Row count comparison (local → Neon):\n');
        console.log('  Table                      Local      Neon       Δ');
        console.log('  ─────────────────────────  ─────────  ─────────  ──────');
        for (const table of TABLES_TO_SYNC) {
            const local = await getCount(localPool, table);
            const neon  = await getCount(neonPool, table);
            const delta = local - neon;
            const flag  = delta > 0 ? '▲' : delta < 0 ? '▼' : '✓';
            console.log(`  ${table.padEnd(25)}  ${String(local).padStart(9)}  ${String(neon).padStart(9)}  ${flag} ${Math.abs(delta)}`);
        }
        console.log('\nℹ️ Dry run complete.\n');
        return;
    }

    if (isAfresh) {
        await recreateNeonSchemaFromLocal();
    }

    console.log('\n📦 Streaming canonical data from local hayadb → Neon Cloud...\n');
    for (const table of TABLES_TO_SYNC) {
        await streamTable(table);
    }

    console.log('\n📊 Final Verification on Neon Cloud:');
    console.log('  ───────────────────────────────────────────────────────────────');
    let allOk = true;
    for (const table of TABLES_TO_SYNC) {
        const local = await getCount(localPool, table);
        const neon  = await getCount(neonPool, table);
        const match = local === neon;
        if (!match) allOk = false;
        console.log(`  ${table.padEnd(25)} : Local=${String(local).padStart(7)} | Neon=${String(neon).padStart(7)}  ${match ? '✅ OK' : '⚠️ MISMATCH'}`);
    }

    // Size check
    const sizeRes = await neonPool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS size, pg_database_size(current_database()) AS bytes
    `);
    console.log('\n☁️  Total Neon Production Database Size:', sizeRes.rows[0].size, `(${Number(sizeRes.rows[0].bytes).toLocaleString()} bytes)`);
    console.log(allOk ? '🎉 Neon Cloud synchronization 100% verified!' : '⚠️ Some tables had mismatches — review output above.');
    console.log();
}

main()
    .catch(err => {
        console.error('Fatal error during sync:', err);
        process.exit(1);
    })
    .finally(async () => {
        await localPool.end();
        await neonPool.end();
    });
