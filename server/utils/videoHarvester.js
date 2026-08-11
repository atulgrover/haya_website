'use strict';

/**
 * Universal Video Harvester Utility
 * Provides a common video search engine with automatic failover:
 * 1. Primary: Official YouTube Data API v3 (using YOUTUBE_API_KEY)
 * 2. Failover: youtube-sr Scraper (No-Key / Unlimited)
 * 3. Persistence: Saves videos FOREVER into SQLite nsqf_videos table
 */

const db = require('../db');
let YouTubeSR = null;
try {
    YouTubeSR = require('youtube-sr').default || require('youtube-sr');
} catch (e) {
    console.warn('[Harvester] youtube-sr import warning:', e.message);
}

/**
 * Search YouTube for a query using Official API v3 with automatic youtube-sr failover
 * @param {string} query Search query string
 * @param {number} maxResults Max results to return (default: 6)
 * @returns {Promise<Array<{video_id: string, video_title: string, video_url: string, thumbnail: string, channelTitle: string}>>}
 */
async function searchYouTubeVideos(query, maxResults = 6) {
    if (!query || typeof query !== 'string' || !query.trim()) {
        return [];
    }

    const cleanQ = query.trim();

    // 1. Try Official YouTube Data API v3
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey && apiKey.trim()) {
        try {
            const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&q=${encodeURIComponent(cleanQ)}&key=${apiKey.trim()}`;
            const apiRes = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });

            if (apiRes.ok) {
                const data = await apiRes.json();
                if (Array.isArray(data.items) && data.items.length > 0) {
                    const results = data.items.map(item => ({
                        video_id: item.id.videoId,
                        video_title: item.snippet.title,
                        video_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
                        channelTitle: item.snippet.channelTitle || 'YouTube'
                    }));
                    return results;
                }
            } else {
                console.warn(`[Harvester] Official API returned HTTP ${apiRes.status}. Failing over to youtube-sr...`);
            }
        } catch (err) {
            console.warn(`[Harvester] Official API error: ${err.message}. Failing over to youtube-sr...`);
        }
    }

    // 2. Automatic Failover: youtube-sr Scraper (No Key Required / Unlimited)
    if (YouTubeSR && typeof YouTubeSR.search === 'function') {
        try {
            console.log(`[Harvester] Querying youtube-sr for: "${cleanQ}"`);
            const srResults = await YouTubeSR.search(cleanQ, { limit: maxResults, type: 'video' });
            if (Array.isArray(srResults) && srResults.length > 0) {
                return srResults.map(v => ({
                    video_id: v.id,
                    video_title: v.title || `${cleanQ} Demonstration`,
                    video_url: `https://www.youtube.com/watch?v=${v.id}`,
                    thumbnail: v.thumbnail?.url || `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
                    channelTitle: v.channel?.name || 'YouTube'
                }));
            }
        } catch (srErr) {
            console.warn(`[Harvester] youtube-sr search warning: ${srErr.message}`);
        }
    }

    // 3. Fallback placeholder if both fail
    return [{
        video_id: 'sR7RKyHHyTg',
        video_title: `${cleanQ} Demonstration`,
        video_url: 'https://www.youtube.com/watch?v=sR7RKyHHyTg',
        thumbnail: 'https://img.youtube.com/vi/sR7RKyHHyTg/mqdefault.jpg',
        channelTitle: 'HAYAGRIVA Skillpedia'
    }];
}

/**
 * Permanently save video mapping into nsqf_videos SQLite table FOREVER
 */
async function saveVideoForever({ qpCode, nosCode, nosTitle, moduleTitle, pcId, pcIntent, pcDesc, videoId, videoTitle, videoUrl, auditScore = 95 }) {
    try {
        const vUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;
        await db.prepare(`
            INSERT OR REPLACE INTO nsqf_videos
            (qp_code, nos_code, nos_title, module_title, pc_id, pc_intent, pc_desc, video_id, video_title, video_url, audit_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            qpCode,
            nosCode || 'NOS',
            nosTitle || '',
            moduleTitle,
            pcId,
            pcIntent || pcDesc || pcId,
            pcDesc || pcIntent || '',
            videoId,
            videoTitle || `${pcIntent} Demonstration`,
            vUrl,
            auditScore
        );
    } catch (e) {
        console.warn(`[Harvester] DB Save warning for ${qpCode} ${pcId}:`, e.message);
    }
}

module.exports = {
    searchYouTubeVideos,
    saveVideoForever
};
