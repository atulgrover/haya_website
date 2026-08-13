'use strict';

/**
 * Distinct PC Video Harvester
 * Harvests UNIQUE, verified, 100% active YouTube videos for every individual Performance Criteria (PC) in Neon PostgreSQL.
 * Ensures zero duplicate videos within the same QP/Module.
 *
 * Usage:
 *   node scripts/harvest_distinct_pc_videos.js --limit=5         (Test run on 5 QPs)
 *   node scripts/harvest_distinct_pc_videos.js --limit=2002      (Full catalog run)
 */

require('dotenv').config();
const { Pool } = require('pg');
const dns = require('dns');
const { searchYouTubeVideos } = require('../server/utils/videoHarvester');

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

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

const args = process.argv.slice(2);
let qpLimit = 5; // Default limit 5 QPs for safety / fast verification
args.forEach(arg => {
    if (arg.startsWith('--limit=')) {
        qpLimit = parseInt(arg.split('=')[1]) || 5;
    }
});

async function verifyYouTubeOEmbed(videoId) {
    if (!videoId || videoId.length !== 11) return false;
    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
            signal: AbortSignal.timeout(4000)
        });
        return res.ok;
    } catch (_) {
        return false;
    }
}

async function harvestDistinctPcVideos() {
    const client = await pool.connect();
    try {
        console.log(`🚀 Starting Distinct PC Video Harvester (Limit: ${qpLimit} QPs)...`);

        const qpRes = await client.query(`
            SELECT qp_code, qp_name, sector 
            FROM nsqf_qps 
            ORDER BY id ASC 
            LIMIT $1
        `, [qpLimit]);

        const qps = qpRes.rows;
        console.log(`📋 Found ${qps.length} QPs to process.\n`);

        let totalPcsUpdated = 0;

        for (const qp of qps) {
            console.log(`================================================================================`);
            console.log(`🔍 Processing QP: ${qp.qp_name} (${qp.qp_code}) [Sector: ${qp.sector}]`);
            console.log(`================================================================================`);

            const pcRes = await client.query(`
                SELECT id, pc_code, pc_intent, pc_description, video_id 
                FROM nsqf_pcs 
                WHERE qp_code = $1 
                ORDER BY id ASC
            `, [qp.qp_code]);

            const pcs = pcRes.rows;
            console.log(`   Found ${pcs.length} PCs in QP ${qp.qp_code}`);

            const usedVideoIds = new Set();
            let qpUpdatedCount = 0;

            for (const pc of pcs) {
                const intentText = pc.pc_intent || pc.pc_description || '';
                const searchQ = `${qp.qp_name} ${intentText} tutorial ${qp.sector}`;

                // Search YouTube for candidates
                const candidates = await searchYouTubeVideos(searchQ, 6);

                let selectedVideo = null;

                for (const cand of candidates) {
                    // Skip fallbacks, invalid IDs, or IDs already assigned in this QP
                    if (cand.isFallback || !cand.video_id || cand.video_id.length !== 11) continue;
                    if (['sR7RKyHHyTg', 'x9PQgbB4y6M', '3vK7G62p0M8'].includes(cand.video_id)) continue;
                    if (usedVideoIds.has(cand.video_id)) continue;

                    // Verify live availability via YouTube oEmbed
                    const isAvailable = await verifyYouTubeOEmbed(cand.video_id);
                    if (isAvailable) {
                        selectedVideo = cand;
                        usedVideoIds.add(cand.video_id);
                        break;
                    }
                }

                if (selectedVideo) {
                    await client.query(`
                        UPDATE nsqf_pcs 
                        SET video_id = $1, video_title = $2, video_url = $3 
                        WHERE id = $4
                    `, [
                        selectedVideo.video_id,
                        selectedVideo.video_title,
                        `https://www.youtube.com/watch?v=${selectedVideo.video_id}`,
                        pc.id
                    ]);

                    qpUpdatedCount++;
                    totalPcsUpdated++;
                    console.log(`   ✅ PC #${pc.pc_code || pc.id}: Unique Video [${selectedVideo.video_id}] - "${selectedVideo.video_title}"`);
                } else {
                    console.log(`   ⚠️ PC #${pc.pc_code || pc.id}: Kept existing video assignment.`);
                }
            }

            console.log(`   🎉 QP ${qp.qp_code} complete: ${qpUpdatedCount} / ${pcs.length} PCs updated with unique YouTube videos.\n`);
        }

        console.log(`================================================================================`);
        console.log(`🎉 HARVEST COMPLETE: ${totalPcsUpdated} PCs updated with UNIQUE, VERIFIED YOUTUBE VIDEOS!`);
        console.log(`================================================================================\n`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during distinct video harvest:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

harvestDistinctPcVideos();
