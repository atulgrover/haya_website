'use strict';

/**
 * 🛠️ PC & Module Natural Re-ordering Utility
 * Usage: node scripts/fix_pc_ordering.js
 *
 * Audits all QPs in Neon PostgreSQL and local SQLite and re-sorts PC rows
 * so that PC1, PC2, PC3... and Module 1, Module 2, Module 3... are ALWAYS sequentially ordered.
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

function parsePcNumber(pcCode, pcIntent) {
    if (pcCode) {
        const m = pcCode.match(/\d+/);
        if (m) return parseInt(m[0]);
    }
    if (pcIntent) {
        const m = pcIntent.match(/pc\s*(\d+)/i) || pcIntent.match(/module\s*(\d+)/i);
        if (m) return parseInt(m[1]);
    }
    return 999;
}

async function fixOrdering() {
    console.log(`\n================================================================================`);
    console.log(`🛠️ FIXING QP MODULE & PC NATURAL SEQUENTIAL ORDERING`);
    console.log(`================================================================================\n`);

    // 1. Fix local SQLite
    const qpsSqlite = sqliteDb.prepare(`SELECT DISTINCT qp_code FROM nsqf_pcs`).all();
    console.log(`📂 Processing ${qpsSqlite.length} QPs in local SQLite...`);

    let fixedSqliteCount = 0;

    sqliteDb.transaction(() => {
        for (const { qp_code } of qpsSqlite) {
            const rows = sqliteDb.prepare(`SELECT * FROM nsqf_pcs WHERE qp_code = ?`).all(qp_code);
            if (rows.length === 0) continue;

            const sorted = [...rows].sort((a, b) => {
                const numA = parsePcNumber(a.pc_code, a.pc_intent);
                const numB = parsePcNumber(b.pc_code, b.pc_intent);
                return numA - numB;
            });

            // Check if ordering changed
            let isDifferent = false;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].id !== sorted[i].id) {
                    isDifferent = true;
                    break;
                }
            }

            if (isDifferent) {
                fixedSqliteCount++;
                // Delete and re-insert in natural order
                sqliteDb.prepare(`DELETE FROM nsqf_pcs WHERE qp_code = ?`).run(qp_code);
                const insertStmt = sqliteDb.prepare(`
                    INSERT INTO nsqf_pcs (id, qp_code, nos_code, pc_code, pc_intent, pc_description, video_id, video_title, video_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                sorted.forEach(r => {
                    insertStmt.run(r.id, r.qp_code, r.nos_code, r.pc_code, r.pc_intent, r.pc_description, r.video_id, r.video_title, r.video_url);
                });
            }
        }
    })();

    console.log(`✅ [SQLite] Fixed PC natural ordering for ${fixedSqliteCount} QPs!`);

    // 2. Fix Neon Cloud Postgres if DATABASE_URL present
    if (process.env.DATABASE_URL) {
        const urlObj = new URL(process.env.DATABASE_URL);
        const pool = new Pool({
            user: decodeURIComponent(urlObj.username),
            password: decodeURIComponent(urlObj.password),
            host: '52.76.108.241',
            port: 5432,
            database: urlObj.pathname.slice(1),
            ssl: { rejectUnauthorized: false, servername: urlObj.hostname }
        });

        const client = await pool.connect();
        try {
            console.log(`☁️ Syncing natural PC ordering to Neon Cloud PostgreSQL...`);
            const qpPg = await client.query(`SELECT DISTINCT qp_code FROM nsqf_pcs`);
            let fixedPgCount = 0;

            for (const { qp_code } of qpPg.rows) {
                const pcs = await client.query(`SELECT * FROM nsqf_pcs WHERE qp_code = $1`, [qp_code]);
                const rows = pcs.rows;
                if (rows.length === 0) continue;

                const sorted = [...rows].sort((a, b) => {
                    const numA = parsePcNumber(a.pc_code, a.pc_intent);
                    const numB = parsePcNumber(b.pc_code, b.pc_intent);
                    return numA - numB;
                });

                let isDifferent = false;
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i].id !== sorted[i].id) {
                        isDifferent = true;
                        break;
                    }
                }

                if (isDifferent) {
                    fixedPgCount++;
                    // Re-update video_id, pc_code, pc_intent in natural sequence
                    for (let i = 0; i < sorted.length; i++) {
                        const targetId = rows[i].id;
                        const src = sorted[i];
                        await client.query(`
                            UPDATE nsqf_pcs 
                            SET pc_code = $1, pc_intent = $2, pc_description = $3, video_id = $4, video_title = $5, video_url = $6
                            WHERE id = $7
                        `, [src.pc_code, src.pc_intent, src.pc_description, src.video_id, src.video_title, src.video_url, targetId]);
                    }
                }
            }

            console.log(`✅ [Neon Cloud Postgres] Fixed PC natural ordering for ${fixedPgCount} QPs!`);
        } catch (err) {
            console.error('❌ Error updating Neon ordering:', err.message);
        } finally {
            client.release();
        }
    }

    console.log(`\n================================================================================`);
    console.log(`🎉 MODULE & PC NATURAL SEQUENTIAL ORDERING COMPLETE!`);
    console.log(`================================================================================\n`);
    process.exit(0);
}

fixOrdering();
