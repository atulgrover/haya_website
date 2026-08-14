'use strict';

require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL in .env');
    process.exit(1);
}

const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const localDbPath = path.join(__dirname, '..', 'server', 'portal_database.db');
const localDb = new Database(localDbPath);

async function rollbackPcsToLocalSqlite() {
    const urlObj = new URL(databaseUrl);
    const host = urlObj.hostname;
    
    // Pre-resolve IP using dns.lookup
    let ip = '52.76.108.241';
    try {
        const resolved = await dns.promises.lookup(host, { family: 4 });
        ip = resolved.address;
        console.log(`📡 Resolved ${host} to IP ${ip}`);
    } catch (e) {
        console.warn(`DNS lookup warning for ${host}:`, e.message);
    }

    const poolConfig = {
        user: decodeURIComponent(urlObj.username),
        password: decodeURIComponent(urlObj.password),
        host: ip,
        port: urlObj.port || 5432,
        database: urlObj.pathname.slice(1),
        ssl: {
            rejectUnauthorized: false,
            servername: host
        }
    };

    const pool = new Pool(poolConfig);
    const client = await pool.connect();
    try {
        console.log('🔄 ROLLBACK: Restoring nsqf_pcs table in Neon PostgreSQL from local SQLite...');
        
        // Truncate nsqf_pcs in Neon Postgres
        await client.query('TRUNCATE TABLE nsqf_pcs RESTART IDENTITY');

        const rows = localDb.prepare('SELECT * FROM nsqf_pcs').all();
        console.log(`📊 Local SQLite nsqf_pcs rows: ${rows.length}`);

        const columns = Object.keys(rows[0]);
        const colsSql = columns.map(c => `"${c}"`).join(', ');

        const batchSize = 5000;
        let migrated = 0;

        await client.query('BEGIN');
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            let paramIndex = 1;
            const valueClauses = [];
            const values = [];

            for (const row of batch) {
                const rowParams = [];
                for (const col of columns) {
                    rowParams.push(`$${paramIndex++}`);
                    values.push(row[col]);
                }
                valueClauses.push(`(${rowParams.join(', ')})`);
            }

            const sql = `INSERT INTO nsqf_pcs (${colsSql}) VALUES ${valueClauses.join(', ')} ON CONFLICT DO NOTHING`;
            await client.query(sql, values);

            migrated += batch.length;
            process.stdout.write(`\r   Restored ${migrated} / ${rows.length} rows...`);
        }
        await client.query('COMMIT');

        console.log(`\n✅ ROLLBACK COMPLETE: Restored ${migrated} nsqf_pcs rows from local SQLite to Neon Postgres.`);
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Rollback failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

rollbackPcsToLocalSqlite();
