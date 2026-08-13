'use strict';

require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('❌ ERROR: Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env file!');
    console.error('Please add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to .env before running this script.');
    process.exit(1);
}

console.log(`🚀 Connecting to Turso Cloud DB at: ${url}`);
const tursoClient = createClient({ url, authToken });

const localDbPath = path.join(__dirname, '..', 'server', 'portal_database.db');
console.log(`📂 Opening local SQLite database at: ${localDbPath}`);
const localDb = new Database(localDbPath);

async function migrateTable(tableName, pkeyColumn = 'id', batchSize = 250) {
    console.log(`\n⏳ Migrating table [${tableName}]...`);
    
    // Check if table exists locally
    const checkTable = localDb.prepare(`SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
    if (!checkTable || checkTable.c === 0) {
        console.log(`⚠️ Table [${tableName}] does not exist in local database. Skipping.`);
        return;
    }

    const rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`📊 Total local rows in [${tableName}]: ${rows.length}`);
    if (rows.length === 0) return;

    // Get column names
    const sampleRow = rows[0];
    const columns = Object.keys(sampleRow);
    const placeholders = columns.map(() => '?').join(', ');
    const colsSql = columns.map(c => `"${c}"`).join(', ');

    const sql = `INSERT OR REPLACE INTO "${tableName}" (${colsSql}) VALUES (${placeholders})`;

    let migrated = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const stmts = batch.map(row => {
            const args = columns.map(col => row[col]);
            return { sql, args };
        });

        try {
            await tursoClient.batch(stmts, 'write');
            migrated += batch.length;
            process.stdout.write(`\r   Uploaded ${migrated} / ${rows.length} rows...`);
        } catch (err) {
            console.error(`\n❌ Batch error in table [${tableName}]:`, err.message);
        }
    }
    console.log(`\n✅ Completed table [${tableName}] (${migrated} rows synced).`);
}

async function runFullMigration() {
    try {
        console.log('--- STARTING TURSO MIGRATION ---');

        // Create Schema on Turso first
        console.log('🔨 Verifying & creating schema on Turso Cloud...');
        const db = require('../server/db');

        // Sync core tables
        const tables = [
            'users',
            'custom_skills',
            'skill_progress',
            'subscriptions',
            'licenses',
            'download_logs',
            'user_purchases',
            'user_payment_methods',
            'report_orders',
            'nsqf_qps',
            'nsqf_nos',
            'nsqf_modules',
            'nsqf_pcs',
            'nsqf_video_audit_logs',
            'nsqf_curricula',
            'nsqf_videos',
            'video_swap_suggestions',
            'user_pc_progress',
            'youtube_search_cache'
        ];

        for (const tbl of tables) {
            await migrateTable(tbl);
        }

        console.log('\n🎉 ALL TABLES SUCCESSFULLY MIGRATED TO TURSO CLOUD DB!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runFullMigration();
