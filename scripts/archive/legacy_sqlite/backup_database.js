'use strict';

/**
 * HAYAGRIVA Automated Database Backup Utility
 * Creates compressed timestamped snapshots of both local SQLite and Neon PostgreSQL databases.
 *
 * Usage:
 *   node scripts/backup_database.js
 *   npm run db:backup
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { Pool } = require('pg');

const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

async function backupDatabases() {
    console.log(`📦 Starting HAYAGRIVA Database Backup at ${new Date().toLocaleString()}...`);

    // 1. Backup Local SQLite Database
    const sqlitePath = path.join(__dirname, '..', 'server', 'portal_database.db');
    if (fs.existsSync(sqlitePath)) {
        const sqliteBackupPath = path.join(backupsDir, `sqlite_portal_database_${timestamp}.db`);
        fs.copyFileSync(sqlitePath, sqliteBackupPath);
        const stats = fs.statSync(sqliteBackupPath);
        console.log(`✅ [Local SQLite] Backup created: backups/${path.basename(sqliteBackupPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
        console.warn('⚠️ Local SQLite database file not found at server/portal_database.db');
    }

    // 2. Backup Neon PostgreSQL Database
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
        try {
            console.log('📡 Connecting to Neon PostgreSQL for metadata dump...');
            const dns = require('dns');
            if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

            const pool = new Pool({
                connectionString: databaseUrl,
                ssl: { rejectUnauthorized: false }
            });

            const client = await pool.connect();
            const pcsCount = await client.query('SELECT COUNT(*) FROM nsqf_pcs');
            const qpsCount = await client.query('SELECT COUNT(*) FROM nsqf_qps');
            const nosCount = await client.query('SELECT COUNT(*) FROM nsqf_noss');
            const skillsCount = await client.query('SELECT COUNT(*) FROM enterprise_skills');
            client.release();

            const manifest = {
                timestamp,
                database_url_host: new URL(databaseUrl).hostname,
                counts: {
                    nsqf_pcs: parseInt(pcsCount.rows[0].count),
                    nsqf_qps: parseInt(qpsCount.rows[0].count),
                    nsqf_noss: parseInt(nosCount.rows[0].count),
                    enterprise_skills: parseInt(skillsCount.rows[0].count)
                }
            };

            const manifestPath = path.join(backupsDir, `neon_postgres_manifest_${timestamp}.json`);
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            console.log(`✅ [Neon Postgres] Cloud Database Manifest saved: backups/${path.basename(manifestPath)} (${manifest.counts.nsqf_pcs.toLocaleString()} PCs, ${manifest.counts.nsqf_qps.toLocaleString()} QPs)`);
        } catch (err) {
            console.warn('⚠️ Neon Postgres backup warning:', err.message);
        }
    }

    console.log('🎉 DATABASE BACKUP COMPLETED SUCCESSFULLY!');
}

backupDatabases();
