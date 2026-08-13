'use strict';

/**
 * 🚀 Push Verified Local SQLite Database to Neon Cloud PostgreSQL
 * Usage: npm run db:push-to-neon
 *
 * Transfers local verified SQLite table updates to Neon Cloud PostgreSQL safely in batch transactions.
 */

require('dotenv').config();
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const sqlitePath = path.join(__dirname, '..', 'server', 'portal_database.db');
const sqliteDb = new Database(sqlitePath);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL in .env');
    process.exit(1);
}

const urlObj = new URL(databaseUrl);
const pgPool = new Pool({
    user: decodeURIComponent(urlObj.username),
    password: decodeURIComponent(urlObj.password),
    host: '52.76.108.241',
    port: 5432,
    database: urlObj.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: urlObj.hostname }
});

async function pushLocalToNeon() {
    console.log(`\n================================================================================`);
    console.log(`🚀 SYNCING LOCAL SQLITE DATABASE TO NEON CLOUD POSTGRESQL`);
    console.log(`================================================================================\n`);
    console.log(`📁 Source: Local SQLite (${sqlitePath})`);
    console.log(`☁️ Target: Neon PostgreSQL (${urlObj.hostname})\n`);

    const client = await pgPool.connect();

    try {
        await client.query('BEGIN');

        // 1. Sync nsqf_pcs
        const pcs = sqliteDb.prepare(`SELECT id, qp_code, nos_code, module_title, pc_code, pc_intent, pc_description, video_id, video_title, video_url FROM nsqf_pcs`).all();
        console.log(`📦 Found ${pcs.length.toLocaleString()} PCs in local SQLite.`);

        console.log(`⏳ Updating Neon nsqf_pcs in batch transactions...`);
        let syncedPcs = 0;

        for (let i = 0; i < pcs.length; i += 500) {
            const batch = pcs.slice(i, i + 500);
            for (const row of batch) {
                await client.query(`
                    UPDATE nsqf_pcs 
                    SET video_id = $1, video_title = $2, video_url = $3 
                    WHERE id = $4
                `, [row.video_id, row.video_title, row.video_url, row.id]);
                syncedPcs++;
            }
        }

        await client.query('COMMIT');
        console.log(`\n================================================================================`);
        console.log(`🎉 DATABASE SYNC COMPLETE: ${syncedPcs.toLocaleString()} PCs pushed to Neon Cloud!`);
        console.log(`================================================================================\n`);

        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Sync failed, transaction rolled back:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

pushLocalToNeon();
