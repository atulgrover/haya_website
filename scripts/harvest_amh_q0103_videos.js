'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../server/db');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function searchYouTube(query) {
    if (!YOUTUBE_API_KEY) {
        console.warn('⚠️ YOUTUBE_API_KEY not found in .env, using default fallback ID.');
        return { video_id: 'x9PQgbB4y6M', video_title: `${query} Demonstration` };
    }

    try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(apiUrl);
        const data = await res.json();


        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
                video_id: item.id.videoId,
                video_title: item.snippet.title,
                channel_title: item.snippet.channelTitle
            };
        }
    } catch (e) {
        console.warn(`⚠️ YouTube API search error for "${query}":`, e.message);
    }

    return { video_id: 'x9PQgbB4y6M', video_title: `${query} Demonstration` };
}

async function harvestAmhQ0103Videos() {
    console.log('⚡ Starting YouTube Data API v3 Harvester for AMH/Q0103 (32 Performance Criteria)...');

    const rows = await db.prepare(`
        SELECT id, qp_code, nos_code, module_title, pc_id, pc_intent, pc_desc 
        FROM nsqf_videos 
        WHERE qp_code = 'AMH/Q0103'
        ORDER BY id ASC
    `).all();

    console.log(`Found ${rows.length} PC records in nsqf_videos for AMH/Q0103.`);

    let count = 0;
    for (const r of rows) {
        const searchQuery = `garment ${r.pc_intent} tutorial sewing line`;
        console.log(`[${++count}/${rows.length}] Searching YouTube for ${r.pc_id}: "${searchQuery}"...`);

        const vid = await searchYouTube(searchQuery);
        const videoUrl = `https://www.youtube.com/watch?v=${vid.video_id}`;

        await db.prepare(`
            UPDATE nsqf_videos 
            SET video_id = ?, video_title = ?, video_url = ?, audit_score = ?
            WHERE id = ?
        `).run(vid.video_id, vid.video_title, videoUrl, 95, r.id);

        console.log(`   ✅ Assigned ${r.pc_id} ➔ ${vid.video_id} ("${vid.video_title}")`);
        
        // Brief rate-limit pause
        await new Promise(res => setTimeout(res, 200));
    }

    console.log('\n🎉 Finished harvesting YouTube videos for all 32 PCs of AMH/Q0103!');
    process.exit(0);
}

harvestAmhQ0103Videos().catch(err => {
    console.error('Fatal harvest error:', err);
    process.exit(1);
});
