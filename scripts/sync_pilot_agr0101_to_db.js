'use strict';

/**
 * 🌾 Sync Pilot Stage 3 Scored Videos & Full Criteria to Database (Neon Cloud PostgreSQL)
 * 
 * Applies the 126 AI-verified, high-relevance video mappings and full un-truncated criteria
 * for AGR/Q0101 (Paddy Cultivator) from data/stage3_agr0101_scored.json.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const scoredPath = path.join(__dirname, '../data/stage3_agr0101_scored.json');
if (!fs.existsSync(scoredPath)) {
    console.error(`❌ Scored data file not found at: ${scoredPath}`);
    process.exit(1);
}

const scoredData = JSON.parse(fs.readFileSync(scoredPath, 'utf8'));
const items = scoredData.items || [];
console.log(`📦 Loaded ${items.length} scored criteria for ${scoredData.qp_code} (${scoredData.qp_name})`);

const urlObj = new URL(process.env.NEON_DATABASE_URL);
const pool = new Pool({
    user: decodeURIComponent(urlObj.username),
    password: decodeURIComponent(urlObj.password),
    host: '52.76.108.241',
    port: 5432,
    database: urlObj.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: urlObj.hostname }
});

async function syncToDatabase() {
    console.log(`\n================================================================================`);
    console.log(`🌾 SYNCING AGR/Q0101 AI-HARVESTED VIDEOS & UNTRUNCATED PCS TO NEON POSTGRESQL`);
    console.log(`================================================================================\n`);

    const client = await pool.connect();
    try {
        let updatedCount = 0;
        let insertedCount = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const qpCode = 'AGR/Q0101';
            const nosCode = item.nos_code;
            const pcCode = item.pc_code.trim();
            const fullDesc = item.full_description || '';
            const pcIntent = item.clean_intent || '';
            const videoId = item.selected_video_id || '';
            const videoTitle = item.selected_video_title || '';
            const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
            const thumbUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '';
            const auditScore = item.match_score || 90;
            const searchQueryEn = item.search_query_en || '';
            const searchQueryHi = item.search_query_hi || '';

            // Check if record exists
            const existing = await client.query(
                `SELECT id FROM nsqf_pcs WHERE qp_code = $1 AND nos_code = $2 AND pc_code = $3`,
                [qpCode, nosCode, pcCode]
            );

            if (existing.rows.length > 0) {
                // Update existing row
                await client.query(
                    `UPDATE nsqf_pcs 
                     SET pc_description = $1,
                         pc_intent = $2,
                         contextual_search_query = $3,
                         contextual_search_query_hi = $4,
                         video_id = $5,
                         video_title = $6,
                         video_url = $7,
                         thumbnail_url = $8,
                         audit_score = $9
                     WHERE id = $10`,
                    [fullDesc, pcIntent, searchQueryEn, searchQueryHi, videoId, videoTitle, videoUrl, thumbUrl, auditScore, existing.rows[0].id]
                );
                updatedCount++;
            } else {
                // Insert new row if missing
                await client.query(
                    `INSERT INTO nsqf_pcs 
                     (qp_code, nos_code, pc_code, pc_description, pc_intent, contextual_search_query, contextual_search_query_hi, video_id, video_title, video_url, thumbnail_url, audit_score)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [qpCode, nosCode, pcCode, fullDesc, pcIntent, searchQueryEn, searchQueryHi, videoId, videoTitle, videoUrl, thumbUrl, auditScore]
                );
                insertedCount++;
            }

            process.stdout.write(`   ⚡ Processed [${i + 1}/${items.length}] ${nosCode} - ${pcCode} (Score: ${auditScore}%)\r`);
        }

        console.log(`\n\n✅ Sync complete!`);
        console.log(`   - Updated existing criteria: ${updatedCount}`);
        console.log(`   - Inserted new criteria: ${insertedCount}`);
        console.log(`   - Total active criteria: ${updatedCount + insertedCount}`);

        // Verify summary
        const verifyRes = await client.query(`
            SELECT count(*) as total, 
                   count(video_id) as with_videos,
                   avg(audit_score) as avg_score
            FROM nsqf_pcs 
            WHERE qp_code = 'AGR/Q0101'
        `);
        console.log(`\n📊 Database Verification for AGR/Q0101:`, verifyRes.rows[0]);

    } catch (err) {
        console.error('❌ Sync error:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

syncToDatabase();
