'use strict';

/**
 * 🇮🇳 Harvest & Sync Hindi Video Demonstrations for AGR/Q0101
 * Uses search_query_hi from data/stage2_agr0101_queries.json
 * Updates nsqf_pcs columns: video_id_hi, video_title_hi, video_url_hi
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { searchYouTubeVideos } = require('../server/utils/videoHarvester');

const queriesPath = path.join(__dirname, '../data/stage2_agr0101_queries.json');
if (!fs.existsSync(queriesPath)) {
    console.error('Queries file missing:', queriesPath);
    process.exit(1);
}

const queryData = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));
const items = queryData.items || [];
console.log(`📦 Loaded ${items.length} Hindi queries for ${queryData.qp_code}`);

const urlObj = new URL(process.env.NEON_DATABASE_URL);
const pool = new Pool({
    user: decodeURIComponent(urlObj.username),
    password: decodeURIComponent(urlObj.password),
    host: '52.76.108.241',
    port: 5432,
    database: urlObj.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: urlObj.hostname }
});

async function harvestHindiVideos() {
    console.log(`\n================================================================================`);
    console.log(`🇮🇳 HARVESTING HINDI DEMONSTRATION VIDEOS FOR AGR/Q0101 (PADDY CULTIVATOR)`);
    console.log(`================================================================================\n`);

    const client = await pool.connect();
    try {
        let updatedCount = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const qpCode = 'AGR/Q0101';
            const nosCode = item.nos_code;
            const pcCode = item.pc_code.trim();
            const queryHi = item.search_query_hi || `धान की खेती ${item.clean_intent || ''}`;

            // Search Hindi Video
            let candidates = [];
            try {
                candidates = await searchYouTubeVideos(queryHi, 3);
            } catch (e) {
                console.warn(`Search failed for ${pcCode}:`, e.message);
            }

            const best = candidates[0] || null;
            const videoIdHi = best?.video_id || '';
            const videoTitleHi = best?.video_title || '';
            const videoUrlHi = videoIdHi ? `https://www.youtube.com/watch?v=${videoIdHi}` : '';

            if (videoIdHi) {
                await client.query(`
                    UPDATE nsqf_pcs 
                    SET contextual_search_query_hi = $1,
                        video_id_hi = $2,
                        video_title_hi = $3,
                        video_url_hi = $4
                    WHERE qp_code = $5 AND nos_code = $6 AND pc_code = $7
                `, [queryHi, videoIdHi, videoTitleHi, videoUrlHi, qpCode, nosCode, pcCode]);
                updatedCount++;
            }

            process.stdout.write(`   ⚡ [${i + 1}/${items.length}] ${nosCode} - ${pcCode}: [${videoIdHi || 'N/A'}] ${(videoTitleHi || '').slice(0, 35)}...\r`);
            await new Promise(r => setTimeout(r, 200));
        }

        console.log(`\n\n✅ Finished! Successfully updated ${updatedCount} criteria with Hindi video demonstrations.`);
    } catch (err) {
        console.error('❌ Error harvesting Hindi videos:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

harvestHindiVideos();
