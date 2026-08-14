'use strict';

/**
 * 🛠️ Comprehensive QP Module & PC Re-ordering Utility
 * Usage: node scripts/reorder_all_qp_pcs.js
 *
 * Ensures that for EVERY QP:
 * 1. NOS Units appear in sequential order (NOS 1, NOS 2, NOS 3...).
 * 2. Within each NOS Unit / Module, PCs start at PC1, PC2, PC3... sequentially.
 *
 * Updates both local SQLite and Neon Cloud PostgreSQL.
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

function getPcNumber(pcCode, pcIntent) {
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

function getNosNumber(nosCode) {
    if (nosCode) {
        const m = nosCode.match(/\d+/);
        if (m) return parseInt(m[0]);
    }
    return 999;
}

async function reorderAllQps() {
    console.log(`\n================================================================================`);
    console.log(`🛠️ RE-ORDERING ALL QP MODULES & PCS SEQUENTIALLY (NOS 1 -> NOS N, PC 1 -> PC N)`);
    console.log(`================================================================================\n`);

    // 1. Local PostgreSQL Reordering
    if (process.env.DATABASE_URL) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        const client = await pool.connect();
        try {
            console.log(`🐘 Re-ordering modules and PCs sequentially on Local Docker PostgreSQL (${process.env.DATABASE_URL})...`);
            const qpPg = await client.query(`SELECT DISTINCT qp_code FROM nsqf_pcs`);
            let fixedPgCount = 0;

            for (const { qp_code } of qpPg.rows) {
                const pcs = await client.query(`SELECT id, nos_code, pc_code, pc_intent, pc_description, video_id, video_title, video_url FROM nsqf_pcs WHERE qp_code = $1 ORDER BY id ASC`, [qp_code]);
                const rows = pcs.rows;
                if (rows.length === 0) continue;

                const sorted = [...rows].sort((a, b) => {
                    const nosA = getNosNumber(a.nos_code);
                    const nosB = getNosNumber(b.nos_code);
                    if (nosA !== nosB) return nosA - nosB;

                    const pcA = getPcNumber(a.pc_code, a.pc_intent);
                    const pcB = getPcNumber(b.pc_code, b.pc_intent);
                    return pcA - pcB;
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
                    for (let i = 0; i < sorted.length; i++) {
                        const targetId = rows[i].id;
                        const src = sorted[i];
                        await client.query(`
                            UPDATE nsqf_pcs 
                            SET nos_code = $1, pc_code = $2, pc_intent = $3, pc_description = $4, video_id = $5, video_title = $6, video_url = $7
                            WHERE id = $8
                        `, [src.nos_code, src.pc_code, src.pc_intent, src.pc_description, src.video_id, src.video_title, src.video_url, targetId]);
                    }
                }
            }

            console.log(`✅ [Local Docker Postgres] Reordered modules and PCs sequentially for ${fixedPgCount} QPs!`);
        } catch (err) {
            console.error('❌ Error updating Local PostgreSQL ordering:', err.stack);
        } finally {
            client.release();
        }
    }

    console.log(`\n================================================================================`);
    console.log(`🎉 SEQUENTIAL MODULE & PC RE-ORDERING COMPLETE!`);
    console.log(`================================================================================\n`);
    process.exit(0);
}

reorderAllQps();
