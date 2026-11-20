'use strict';
require('dotenv').config();
const { Pool } = require('pg');

async function main() {
    const local = new Pool({ connectionString: process.env.LOCAL_DATABASE_URL });
    const neon = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

    const tables = ['nsqf_qps', 'nsqf_nos', 'nsqf_modules', 'nsqf_pcs', 'video_swap_suggestions', 'pc_explanations_cache'];

    for (const t of tables) {
        const localCols = await local.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t}'`);
        const neonCols = await neon.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t}'`);

        const localMap = new Set(localCols.rows.map(r => r.column_name));
        const neonMap = new Set(neonCols.rows.map(r => r.column_name));

        const missingInNeon = [...localMap].filter(c => !neonMap.has(c));
        const missingInLocal = [...neonMap].filter(c => !localMap.has(c));

        console.log(`Table ${t}: Local = ${localCols.rows.length} cols, Neon = ${neonCols.rows.length} cols`);
        if (missingInNeon.length) console.log('  ⚠️ Missing in Neon:', missingInNeon);
        if (missingInLocal.length) console.log('  ℹ️ Extra in Neon:', missingInLocal);
    }

    await local.end();
    await neon.end();
}

main().catch(console.error);
