'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const neon = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    const totalRows = 176727;
    
    // Get all columns with their types
    const colRes = await neon.query(`
        SELECT attname AS col, atttypid::regtype AS type
        FROM pg_attribute
        WHERE attrelid = 'nsqf_pcs'::regclass AND attnum > 0 AND NOT attisdropped
        ORDER BY attnum
    `);

    const textCols = colRes.rows
        .filter(c => ['text', 'character varying', 'varchar', 'json', 'jsonb'].includes(c.type))
        .map(c => c.col);

    console.log('Auditing text columns in nsqf_pcs for null rates & sizes...\n');
    console.log('Column'.padEnd(35), 'Non-Null%'.padStart(10), 'Avg Bytes'.padStart(11), 'Est Total MB'.padStart(14));
    console.log('-'.repeat(73));

    for (const col of textCols) {
        try {
            const q = `SELECT COUNT("${col}") AS cnt, ROUND(AVG(octet_length("${col}"::text))) AS avg_bytes FROM nsqf_pcs`;
            const r = await neon.query(q);
            const cnt = parseInt(r.rows[0].cnt, 10);
            const avg = parseFloat(r.rows[0].avg_bytes) || 0;
            const estMB = ((cnt * avg) / 1024 / 1024).toFixed(1);
            const pct = ((cnt / totalRows) * 100).toFixed(0);
            console.log(col.padEnd(35), (pct + '%').padStart(10), String(Math.round(avg)).padStart(11), (estMB + ' MB').padStart(14));
        } catch (e) {
            console.log(col.padEnd(35), 'ERROR: ' + e.message);
        }
    }

    const dbSize = await neon.query(`SELECT pg_size_pretty(pg_total_relation_size('nsqf_pcs')) AS size`);
    console.log('\nnsqf_pcs total on disk:', dbSize.rows[0].size);
    await neon.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
