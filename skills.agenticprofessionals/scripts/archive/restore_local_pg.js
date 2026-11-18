'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  NATIVE POSTGRESQL RESTORE UTILITY: HAYADB                               ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Restores local PostgreSQL database (hayadb) from ./data/hayadb_latest.dump║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   npm run db:restore
 *   node scripts/restore_local_pg.js
 *   node scripts/restore_local_pg.js ./data/backups/hayadb_backup_XXXX.dump
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');
const readline     = require('readline');
const db           = require('../server/db');

const DEFAULT_DUMP = path.join(__dirname, '..', 'data', 'hayadb_latest.dump');

async function restoreLocalPg() {
    console.log('================================================================================');
    console.log('🔄 [DB RESTORE] NATIVE POSTGRESQL (hayadb) RESTORE');
    console.log('================================================================================\n');

    const dumpFile = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_DUMP;

    if (!fs.existsSync(dumpFile)) {
        console.error(`❌ Dump file not found: ${dumpFile}`);
        process.exit(1);
    }

    const stats = fs.statSync(dumpFile);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Found Dump File: ${dumpFile} (${sizeMb} MB)`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (str) => new Promise(res => rl.question(str, res));

    const confirm = await question(`⚠️  This will restore hayadb from dump. Type "RESTORE" to proceed: `);
    rl.close();

    if (confirm.trim() !== 'RESTORE') {
        console.log('❌ Restore cancelled by user.');
        process.exit(0);
    }

    console.log(`\n⏳ Running pg_restore on hayadb...`);
    const startTime = Date.now();

    try {
        const pgUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:hayapass@localhost:5432/hayadb';
        execSync(`pg_restore --clean --if-exists -d "${pgUrl}" -v "${dumpFile}"`, { stdio: 'inherit' });

        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

        // Verify restoration
        const pool = { query: db.query.bind(db) };
        const tablesRes = await pool.query(`
            SELECT table_name,
                   (xpath('/row/cnt/text()', xml_count))[1]::text::int AS row_count
            FROM (
                SELECT table_name, 
                       query_to_xml(format('SELECT count(*) AS cnt FROM %I', table_name), false, true, '') AS xml_count
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ) t
            ORDER BY row_count DESC;
        `);

        console.log('\n📊 Restored hayadb Table Statistics:');
        let totalRows = 0;
        for (const r of tablesRes.rows) {
            console.log(`   • ${r.table_name.padEnd(26)} : ${Number(r.row_count).toLocaleString()} rows`);
            totalRows += Number(r.row_count);
        }

        console.log('\n================================================================================');
        console.log('✅ RESTORE COMPLETED SUCCESSFULLY:');
        console.log(`   Total Restored Rows: ${totalRows.toLocaleString()} rows`);
        console.log(`   Duration:            ${elapsedSec} seconds`);
        console.log('================================================================================\n');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ pg_restore execution failed:', err.message);
        process.exit(1);
    }
}

restoreLocalPg().catch(err => {
    console.error('Fatal restore error:', err);
    process.exit(1);
});
