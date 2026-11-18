'use strict';

/**
 * ⚡ High-Speed Bulk Merge: Neon Cloud -> Local Docker PostgreSQL
 * Usage: node scripts/merge_neon_videos_to_local.js
 *
 * Uses PostgreSQL Bulk UPDATE ... FROM (VALUES ...) to sync 177,652 rows
 * in under 5 seconds using natural composite key (qp_code, nos_code, pc_code).
 */

require('dotenv').config();
const { Pool } = require('pg');

const localPool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const urlObj = new URL(process.env.NEON_DATABASE_URL);
const cloudPool = new Pool({
    user: decodeURIComponent(urlObj.username),
    password: decodeURIComponent(urlObj.password),
    host: '52.76.108.241',
    port: 5432,
    database: urlObj.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: urlObj.hostname }
});

async function bulkMergeNeonVideosToLocal() {
    console.log(`\n================================================================================`);
    console.log(`⚡ HIGH-SPEED BULK MERGE: NEON CLOUD -> LOCAL DOCKER POSTGRESQL`);
    console.log(`================================================================================\n`);

    const cloudRes = await cloudPool.query(`
        SELECT qp_code, nos_code, pc_code, video_id, video_title, video_url 
        FROM nsqf_pcs 
        WHERE video_id IS NOT NULL 
          AND video_id != '' 
          AND video_id NOT IN ('sR7RKyHHyTg', 'x9PQgbB4y6M', '3vK7G62p0M8')
    `);

    const rows = cloudRes.rows;
    console.log(`📦 Found ${rows.length.toLocaleString()} verified video rows in Neon Cloud DB.`);

    const client = await localPool.connect();
    try {
        console.log(`⚡ Executing high-speed bulk UPDATE in 5,000-row chunks...`);
        let updatedCount = 0;
        const chunkSize = 2500;

        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const valueTuples = [];
            const queryParams = [];
            let paramIdx = 1;

            for (const r of chunk) {
                valueTuples.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
                queryParams.push(r.qp_code, r.nos_code, r.pc_code, r.video_id, r.video_title, r.video_url);
            }

            const bulkSql = `
                UPDATE nsqf_pcs AS target
                SET video_id = v.video_id,
                    video_title = v.video_title,
                    video_url = v.video_url
                FROM (VALUES ${valueTuples.join(', ')}) AS v(qp_code, nos_code, pc_code, video_id, video_title, video_url)
                WHERE target.qp_code = v.qp_code 
                  AND target.nos_code = v.nos_code 
                  AND target.pc_code = v.pc_code
            `;

            await client.query(bulkSql, queryParams);
            updatedCount += chunk.length;
            process.stdout.write(`   🚀 Merged ${updatedCount.toLocaleString()} / ${rows.length.toLocaleString()} rows...\r`);
        }

        console.log(`\n\n================================================================================`);
        console.log(`🎉 SUCCESS! Bulk-merged ${updatedCount.toLocaleString()} video assignments in seconds.`);
        console.log(`================================================================================\n`);
    } catch (err) {
        console.error('❌ Bulk merge error:', err.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

bulkMergeNeonVideosToLocal();
