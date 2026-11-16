'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  NATIVE POSTGRESQL BACKUP UTILITY: HAYADB                                ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Creates a compressed binary backup (.dump) of local PostgreSQL         ║
 * ║  database (hayadb) into ./data/backups/                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   npm run db:backup
 *   node scripts/backup_local_pg.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');
const db           = require('../server/db');

const BACKUP_DIR  = path.join(__dirname, '..', 'data', 'backups');
const LATEST_DUMP = path.join(__dirname, '..', 'data', 'hayadb_latest.dump');

async function backupLocalPg() {
    console.log('================================================================================');
    console.log('💾 [DB BACKUP] NATIVE POSTGRESQL (hayadb) BACKUP');
    console.log('================================================================================\n');

    fs.makedirsSync ? fs.makedirsSync(BACKUP_DIR) : fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const timestamp  = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `hayadb_backup_${timestamp}.dump`);

    // Verify DB connection & get row counts
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

    console.log('📊 Current hayadb Table Statistics:');
    let totalRows = 0;
    for (const r of tablesRes.rows) {
        console.log(`   • ${r.table_name.padEnd(26)} : ${Number(r.row_count).toLocaleString()} rows`);
        totalRows += Number(r.row_count);
    }
    console.log(`   Total Rows Across ${tablesRes.rows.length} Tables: ${totalRows.toLocaleString()}\n`);

    console.log(`⏳ Running pg_dump on hayadb...`);
    const startTime = Date.now();

    try {
        const pgUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:hayapass@localhost:5432/hayadb';
        execSync(`pg_dump "${pgUrl}" -F c -b -v -f "${backupFile}"`, { stdio: 'inherit' });
        fs.copyFileSync(backupFile, LATEST_DUMP);

        const stats = fs.statSync(backupFile);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n================================================================================');
        console.log('✅ BACKUP COMPLETED SUCCESSFULLY:');
        console.log(`   Backup Archive:  ${backupFile}`);
        console.log(`   Latest Link:     ${LATEST_DUMP}`);
        console.log(`   Archive Size:    ${sizeMb} MB`);
        console.log(`   Duration:        ${elapsedSec} seconds`);
        console.log('================================================================================\n');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ pg_dump execution failed:', err.message);
        process.exit(1);
    }
}

backupLocalPg().catch(err => {
    console.error('Fatal backup error:', err);
    process.exit(1);
});
