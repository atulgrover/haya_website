'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  NSQF PIPELINE ORCHESTRATOR                                              ║
 * ║  Single entry point for the full PDF → Production pipeline.              ║
 * ║                                                                          ║
 * ║  Pipeline FSM:                                                           ║
 * ║    Step 1.1: nsqf_pdf_harvester.js       → pdf_downloaded               ║
 * ║    Step 1.2: nsqf_pdf_to_md.py           → md_converted                 ║
 * ║    Pass 1:   nsqf_pass1_structure_ingest → structure_ingested            ║
 * ║    Pass 2:   nsqf_pass2_unified          → intent_synthesized            ║
 * ║    Pass 3:   nsqf_video_harvester        → video_harvested               ║
 * ║    Pass 4:   nsqf_pass4_editorial_review → pending_editorial_review      ║
 * ║                                                                          ║
 * ║  Usage:                                                                  ║
 * ║    node scripts/nsqf_pipeline_orchestrator.js --status                  ║
 * ║    node scripts/nsqf_pipeline_orchestrator.js --integrity               ║
 * ║    node scripts/nsqf_pipeline_orchestrator.js --pass=pass2 --all        ║
 * ║    node scripts/nsqf_pipeline_orchestrator.js --pass=pass2 --all --mode=hybrid  ║
 * ║    node scripts/nsqf_pipeline_orchestrator.js --from=pass2 --to=pass3 --qp=ELE/Q0803 ║
 * ║    node scripts/nsqf_pipeline_orchestrator.js --full --all              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const { execSync, spawnSync } = require('child_process');
const path  = require('path');
const db    = require('../server/db');

const SCRIPTS = path.join(__dirname);

// ── Pipeline FSM: ordered pass definitions ────────────────────────────────────
const PASSES = [
    {
        id:          'step1.1',
        name:        'Step 1.1: PDF Download',
        script:      'nsqf_pdf_harvester.js',
        prereq:      null,
        setsStatus:  'pdf_downloaded',
    },
    {
        id:          'step1.2',
        name:        'Step 1.2: PDF → Markdown',
        script:      'nsqf_pdf_to_md.py',
        isPython:    true,
        prereq:      'pdf_downloaded',
        setsStatus:  'md_converted',
    },
    {
        id:          'pass1',
        name:        'Pass 1: Structure Ingest',
        script:      'nsqf_pass1_structure_ingest.js',
        prereq:      'md_converted',
        setsStatus:  'structure_ingested',
    },
    {
        id:          'pass2',
        name:        'Pass 2: Intent Synthesis (Hybrid)',
        script:      'nsqf_pass2_unified.js',
        prereq:      'structure_ingested',
        setsStatus:  'intent_synthesized',
        defaultArgs: ['--mode=hybrid'],
    },
    {
        id:          'pass3',
        name:        'Pass 3: Video Harvesting',
        script:      'nsqf_video_harvester.js',
        prereq:      'intent_synthesized',
        setsStatus:  'video_harvested',
    },
    {
        id:          'pass4',
        name:        'Pass 4: Editorial Review',
        script:      'nsqf_pass4_editorial_review.js',
        prereq:      'video_harvested',
        setsStatus:  'pending_editorial_review',
    },
];

// ── Status Dashboard ──────────────────────────────────────────────────────────
async function showStatus() {
    const pool = { query: db.query.bind(db) };
    const res = await pool.query(`
        SELECT pipeline_status, COUNT(*) as count
        FROM nsqf_qps
        GROUP BY pipeline_status
        ORDER BY count DESC
    `);

    const totalRes = await pool.query('SELECT COUNT(*) as total FROM nsqf_qps');
    const total = parseInt(totalRes.rows[0].total);

    console.log('\n================================================================================');
    console.log('📊 NSQF PIPELINE STATUS DASHBOARD');
    console.log(`   Total QPs in hayadb: ${total.toLocaleString()}`);
    console.log('────────────────────────────────────────────────────────────────────────────────');
    for (const row of res.rows) {
        const pct   = ((parseInt(row.count) / total) * 100).toFixed(1);
        const bar   = '█'.repeat(Math.round(parseInt(row.count) / total * 40));
        const label = (row.pipeline_status || 'NULL').padEnd(30);
        console.log(`   ${label} ${String(row.count).padStart(6)}  (${pct.padStart(5)}%)  ${bar}`);
    }
    console.log('────────────────────────────────────────────────────────────────────────────────');

    // Suggestions summary
    try {
        const suggRes = await pool.query(`
            SELECT status, COUNT(*) as count FROM video_swap_suggestions GROUP BY status
        `);
        console.log('\n   Video Swap Suggestions:');
        for (const r of suggRes.rows) {
            console.log(`     ${(r.status || 'unknown').padEnd(15)} ${r.count}`);
        }
    } catch (_) {}

    console.log('================================================================================\n');
}

// ── Integrity Check ───────────────────────────────────────────────────────────
async function runIntegrityCheck() {
    const pool = { query: db.query.bind(db) };

    console.log('\n================================================================================');
    console.log('🔍 PIPELINE INTEGRITY CHECK');
    console.log('================================================================================\n');

    const checks = [
        {
            name: 'QPs with structure_ingested but 0 PCs',
            sql: `SELECT COUNT(*) as cnt FROM nsqf_qps WHERE pipeline_status = 'structure_ingested' AND total_pcs = 0`,
            expected: 0
        },
        {
            name: 'PCs with video_id but no pc_intent (Pass 2 skipped?)',
            sql: `SELECT COUNT(*) as cnt FROM nsqf_pcs WHERE video_id IS NOT NULL AND pc_intent IS NULL`,
            expected: 0
        },
        {
            name: 'PCs with NULL video_id but pipeline_status = video_harvested',
            sql: `SELECT COUNT(*) as cnt FROM nsqf_pcs p JOIN nsqf_qps q ON p.qp_code = q.qp_code WHERE q.pipeline_status = 'video_harvested' AND p.video_id IS NULL`,
            expected: 0
        },
        {
            name: 'Cache entries in youtube_search_cache',
            sql: `SELECT COUNT(*) as cnt FROM youtube_search_cache`,
            expected: null // informational
        },
        {
            name: 'Stale cache entries (> 90 days old)',
            sql: `SELECT COUNT(*) as cnt FROM youtube_search_cache WHERE cached_at < NOW() - INTERVAL '90 days'`,
            expected: 0
        },
        {
            name: 'Orphaned nsqf_pcs with no parent in nsqf_qps',
            sql: `SELECT COUNT(*) as cnt FROM nsqf_pcs p LEFT JOIN nsqf_qps q ON p.qp_code = q.qp_code WHERE q.qp_code IS NULL`,
            expected: 0
        },
        {
            name: 'Active nsqf_videos references (should be 0 post-Phase5B)',
            sql: `SELECT COUNT(*) as cnt FROM nsqf_videos`,
            expected: null // informational — table deprecated but may have historical data
        },
    ];

    let passCount = 0, warnCount = 0;

    for (const check of checks) {
        try {
            const res = await pool.query(check.sql);
            const cnt = parseInt(res.rows[0].cnt);
            if (check.expected === null) {
                console.log(`   ℹ️  ${check.name}: ${cnt}`);
            } else if (cnt === check.expected) {
                console.log(`   ✅  ${check.name}: ${cnt} (OK)`);
                passCount++;
            } else {
                console.log(`   ⚠️  ${check.name}: ${cnt} (expected ${check.expected})`);
                warnCount++;
            }
        } catch (e) {
            console.log(`   ❌  ${check.name}: ERROR — ${e.message}`);
            warnCount++;
        }
    }

    console.log('\n────────────────────────────────────────────────────────────────────────────────');
    console.log(`   Result: ${passCount} passed, ${warnCount} warnings`);
    console.log('================================================================================\n');
}

// ── Run a Single Pass ─────────────────────────────────────────────────────────
function runPass(passDef, extraArgs = []) {
    const args = [...(passDef.defaultArgs || []), ...extraArgs];

    if (passDef.isPython) {
        console.log(`\n🐍 Running: python3 scripts/${passDef.script} ${args.join(' ')}`);
        const result = spawnSync('python3', [path.join(SCRIPTS, passDef.script), ...args], {
            stdio: 'inherit',
            cwd:   path.join(SCRIPTS, '..')
        });
        if (result.status !== 0) throw new Error(`${passDef.script} exited with code ${result.status}`);
    } else {
        console.log(`\n⚡ Running: node scripts/${passDef.script} ${args.join(' ')}`);
        const result = spawnSync('node', [path.join(SCRIPTS, passDef.script), ...args], {
            stdio: 'inherit',
            cwd:   path.join(SCRIPTS, '..')
        });
        if (result.status !== 0) throw new Error(`${passDef.script} exited with code ${result.status}`);
    }
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────
async function main() {
    const args     = process.argv.slice(2);
    const doStatus = args.includes('--status');
    const doCheck  = args.includes('--integrity');
    const doFull   = args.includes('--full');
    const doAll    = args.includes('--all');
    const doResume = args.includes('--resume');
    const doForce  = args.includes('--force');

    const passFlag = args.find(a => a.startsWith('--pass='));
    const fromFlag = args.find(a => a.startsWith('--from='));
    const toFlag   = args.find(a => a.startsWith('--to='));
    const qpFlag   = args.find(a => a.startsWith('--qp='));
    const modeFlag = args.find(a => a.startsWith('--mode='));
    const limitFlag = args.find(a => a.startsWith('--limit='));

    if (doStatus) {
        await showStatus();
        return process.exit(0);
    }

    if (doCheck) {
        await runIntegrityCheck();
        return process.exit(0);
    }

    // Build passthrough args for child scripts
    const passthroughArgs = [];
    if (doAll)    passthroughArgs.push('--all');
    if (doResume) passthroughArgs.push('--resume');
    if (doForce)  passthroughArgs.push('--force');
    if (qpFlag)   passthroughArgs.push(qpFlag);
    if (modeFlag) passthroughArgs.push(modeFlag);
    if (limitFlag) passthroughArgs.push(limitFlag);

    let passesToRun = [];

    if (doFull) {
        passesToRun = PASSES;
    } else if (passFlag) {
        const passId = passFlag.split('=')[1];
        const found  = PASSES.find(p => p.id === passId);
        if (!found) {
            console.error(`❌  Unknown pass: ${passId}. Valid: ${PASSES.map(p => p.id).join(', ')}`);
            process.exit(1);
        }
        passesToRun = [found];
    } else if (fromFlag || toFlag) {
        const fromId    = fromFlag ? fromFlag.split('=')[1] : PASSES[0].id;
        const toId      = toFlag   ? toFlag.split('=')[1]   : PASSES[PASSES.length - 1].id;
        const fromIdx   = PASSES.findIndex(p => p.id === fromId);
        const toIdx     = PASSES.findIndex(p => p.id === toId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx > toIdx) {
            console.error(`❌  Invalid --from/--to range. Valid IDs: ${PASSES.map(p => p.id).join(', ')}`);
            process.exit(1);
        }
        passesToRun = PASSES.slice(fromIdx, toIdx + 1);
    } else {
        console.log('Usage:');
        console.log('  --status                            Show pipeline status dashboard');
        console.log('  --integrity                         Run integrity checks');
        console.log('  --pass=<id> [--all|--qp=...]        Run a single pass');
        console.log('  --from=<id> --to=<id> [--qp=...]    Run a range of passes');
        console.log('  --full [--all]                      Run full pipeline');
        console.log('\nValid pass IDs:', PASSES.map(p => p.id).join(', '));
        process.exit(0);
    }

    console.log('================================================================================');
    console.log('⚡ NSQF PIPELINE ORCHESTRATOR');
    console.log(`   Passes to run: ${passesToRun.map(p => p.id).join(' → ')}`);
    console.log(`   Args: ${passthroughArgs.join(' ') || '(none)'}`);
    console.log('================================================================================\n');

    for (const pass of passesToRun) {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`▶  ${pass.name}`);
        console.log(`${'─'.repeat(80)}`);

        try {
            runPass(pass, passthroughArgs);
            console.log(`✅  ${pass.name} completed.`);
        } catch (e) {
            console.error(`❌  ${pass.name} failed: ${e.message}`);
            console.error('   Stopping pipeline. Fix the error and re-run with --resume to continue.');
            process.exit(1);
        }
    }

    console.log('\n================================================================================');
    console.log('✅  All requested passes completed successfully!');
    console.log('================================================================================\n');

    await showStatus();
    process.exit(0);
}

main().catch(e => {
    console.error('\n❌ Fatal orchestrator error:', e.message);
    process.exit(1);
});
