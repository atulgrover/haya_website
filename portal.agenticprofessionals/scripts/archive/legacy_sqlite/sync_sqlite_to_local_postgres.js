'use strict';

/**
 * 📦 Seed / Sync Local Docker PostgreSQL from Local SQLite
 * Usage: node scripts/sync_sqlite_to_local_postgres.js
 *
 * Populates your local Docker Postgres container (postgresql://postgres:hayapass@localhost:5432/hayadb)
 * with tables and rows from server/portal_database.db.
 */

require('dotenv').config();
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');

const sqlitePath = path.join(__dirname, '..', 'backups', 'archive_portal_database.db');
const sqliteDb = new Database(sqlitePath);

const localPgPool = new Pool({
    connectionString: process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:hayapass@localhost:5432/hayadb'
});

async function seedLocalPostgres() {
    console.log(`\n================================================================================`);
    console.log(`🚀 SEEDING LOCAL DOCKER POSTGRESQL FROM LOCAL SQLITE`);
    console.log(`================================================================================\n`);
    console.log(`📁 Source: Local SQLite (${sqlitePath})`);
    console.log(`🐘 Target: Local Docker Postgres (localhost:5432/hayadb)\n`);

    const client = await localPgPool.connect();

    try {
        // 1. Create nsqf_pcs table schema in local Postgres if missing
        await client.query(`
            CREATE TABLE IF NOT EXISTS nsqf_pcs (
                id INT PRIMARY KEY,
                qp_code VARCHAR(100),
                nos_code VARCHAR(100),
                pc_code VARCHAR(100),
                pc_intent TEXT,
                pc_description TEXT,
                video_id VARCHAR(50),
                video_title TEXT,
                video_url TEXT
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS nsqf_qps (
                id INT PRIMARY KEY,
                qp_code VARCHAR(100) UNIQUE,
                qp_name TEXT,
                sector TEXT,
                sub_sector TEXT,
                occupation TEXT,
                nsqf_level VARCHAR(50)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS nsqf_nos (
                id INT PRIMARY KEY,
                qp_code VARCHAR(100),
                nos_code VARCHAR(100),
                nos_title TEXT
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS nsqf_modules (
                id INT PRIMARY KEY,
                qp_code VARCHAR(100),
                nos_code VARCHAR(100),
                module_title TEXT
            );
        `);

        // Seed nsqf_nos if empty
        const nosCount = await client.query('SELECT COUNT(*) as c FROM nsqf_nos');
        if (parseInt(nosCount.rows[0].c) === 0) {
            console.log('⏳ Seeding nsqf_nos table into Local Docker Postgres...');
            const nosRows = sqliteDb.prepare(`SELECT id, qp_code, nos_code, nos_title FROM nsqf_nos`).all();
            for (let i = 0; i < nosRows.length; i += 1000) {
                const batch = nosRows.slice(i, i + 1000);
                await client.query('BEGIN');
                for (const r of batch) {
                    await client.query(`INSERT INTO nsqf_nos (id, qp_code, nos_code, nos_title) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`, [r.id, r.qp_code, r.nos_code, r.nos_title]);
                }
                await client.query('COMMIT');
            }
            console.log(`✅ Seeded ${nosRows.length.toLocaleString()} NOS records!`);
        }

        // Seed nsqf_modules if empty
        const modCount = await client.query('SELECT COUNT(*) as c FROM nsqf_modules');
        if (parseInt(modCount.rows[0].c) === 0) {
            console.log('⏳ Seeding nsqf_modules table into Local Docker Postgres...');
            const modRows = sqliteDb.prepare(`SELECT id, qp_code, nos_code, module_title FROM nsqf_modules`).all();
            for (let i = 0; i < modRows.length; i += 1000) {
                const batch = modRows.slice(i, i + 1000);
                await client.query('BEGIN');
                for (const r of batch) {
                    await client.query(`INSERT INTO nsqf_modules (id, qp_code, nos_code, module_title) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`, [r.id, r.qp_code, r.nos_code, r.module_title]);
                }
                await client.query('COMMIT');
            }
            console.log(`✅ Seeded ${modRows.length.toLocaleString()} Module records!`);
        }

        // Check if nsqf_pcs is already seeded
        const countRes = await client.query('SELECT COUNT(*) as c FROM nsqf_pcs');
        const existingCount = parseInt(countRes.rows[0].c);

        if (existingCount === 0) {
            console.log('⏳ Seeding nsqf_pcs table into local Postgres...');
            const pcs = sqliteDb.prepare(`SELECT id, qp_code, nos_code, pc_code, pc_intent, pc_description, video_id, video_title, video_url FROM nsqf_pcs`).all();

            for (let i = 0; i < pcs.length; i += 2000) {
                const batch = pcs.slice(i, i + 2000);
                await client.query('BEGIN');
                for (const row of batch) {
                    await client.query(`
                        INSERT INTO nsqf_pcs (id, qp_code, nos_code, pc_code, pc_intent, pc_description, video_id, video_title, video_url)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT (id) DO UPDATE SET video_id = EXCLUDED.video_id, video_title = EXCLUDED.video_title, video_url = EXCLUDED.video_url
                    `, [row.id, row.qp_code, row.nos_code, row.pc_code, row.pc_intent, row.pc_description, row.video_id, row.video_title, row.video_url]);
                }
                await client.query('COMMIT');
                console.log(`   Progress: ${Math.min(i + 2000, pcs.length).toLocaleString()} / ${pcs.length.toLocaleString()} PCs seeded...`);
            }
            console.log(`✅ Seeded ${pcs.length.toLocaleString()} PCs into local Docker Postgres!`);
        } else {
            console.log(`✅ Local Docker Postgres nsqf_pcs table already populated with ${existingCount.toLocaleString()} rows.`);
        }

        await client.query('COMMIT');
        console.log(`\n================================================================================`);
        console.log(`🎉 LOCAL POSTGRESQL READY FOR DEVELOPMENT AT localhost:5432/hayadb`);
        console.log(`================================================================================\n`);

        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

seedLocalPostgres();
