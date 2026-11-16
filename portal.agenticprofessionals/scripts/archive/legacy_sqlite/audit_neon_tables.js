'use strict';

require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const { Pool } = require('pg');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const localDbPath = path.join(__dirname, '..', 'server', 'portal_database.db');
const localDb = new Database(localDbPath);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL in .env');
    process.exit(1);
}

const urlObj = new URL(databaseUrl);
const pool = new Pool({
    user: decodeURIComponent(urlObj.username),
    password: decodeURIComponent(urlObj.password),
    host: '52.76.108.241',
    port: 5432,
    database: urlObj.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: urlObj.hostname }
});

async function auditTables() {
    const client = await pool.connect();
    try {
        console.log('🔍 DEEP-DIVE AUDIT: Comparing Local SQLite vs Neon Cloud PostgreSQL...\n');

        // 1. Get all table names from local SQLite
        const sqliteTables = localDb.prepare(`
            SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name
        `).all().map(t => t.name);

        // 2. Get all table names from Neon Postgres
        const postgresTablesRes = await client.query(`
            SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name
        `);
        const postgresTables = postgresTablesRes.rows.map(t => t.table_name);

        console.log(`📋 Tables found in Local SQLite: ${sqliteTables.length}`);
        console.log(`📋 Tables found in Neon Postgres: ${postgresTables.length}\n`);

        const auditReport = [];

        for (const tableName of sqliteTables) {
            // Count in SQLite
            const sqliteCount = localDb.prepare(`SELECT COUNT(*) as c FROM "${tableName}"`).get().c;

            // Check if table exists in Postgres
            const pgExists = postgresTables.includes(tableName);
            let pgCount = 'MISSING';
            let status = '❌ MISSING TABLE';

            if (pgExists) {
                try {
                    const res = await client.query(`SELECT COUNT(*) as c FROM "${tableName}"`);
                    pgCount = parseInt(res.rows[0].c);

                    if (sqliteCount === pgCount) {
                        status = '✅ PERFECT MATCH';
                    } else if (pgCount === 0 && sqliteCount > 0) {
                        status = '⚠️ EMPTY TABLE';
                    } else {
                        status = `⚠️ COUNT MISMATCH (${pgCount} vs ${sqliteCount})`;
                    }
                } catch (err) {
                    status = `❌ QUERY ERROR: ${err.message}`;
                }
            }

            auditReport.push({
                table: tableName,
                local_sqlite_count: sqliteCount,
                neon_postgres_count: pgCount,
                status
            });
        }

        console.table(auditReport);

        // 3. Detailed Data Integrity Check on Key Tables
        console.log('\n🧪 Data Integrity Spot-Checks:');

        // Check QPs
        const qpRes = await client.query('SELECT COUNT(DISTINCT qp_code) as distinct_qps, COUNT(*) as total FROM nsqf_qps');
        console.log(`  • nsqf_qps: ${qpRes.rows[0].distinct_qps} distinct QPs (${qpRes.rows[0].total} total rows)`);

        // Check PCs
        const pcRes = await client.query('SELECT COUNT(DISTINCT id) as distinct_pcs, COUNT(DISTINCT qp_code) as distinct_qps_in_pcs FROM nsqf_pcs');
        console.log(`  • nsqf_pcs: ${pcRes.rows[0].distinct_pcs} distinct PCs across ${pcRes.rows[0].distinct_qps_in_pcs} QPs`);

        // Check Users
        const userRes = await client.query('SELECT COUNT(*) as c FROM users');
        console.log(`  • users: ${userRes.rows[0].c} registered users`);

        // Check Licenses
        const licRes = await client.query('SELECT COUNT(*) as c FROM licenses');
        console.log(`  • licenses: ${licRes.rows[0].c} active licenses`);

        console.log('\n🎉 AUDIT COMPLETE!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Audit script failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

auditTables();
