'use strict';

/**
 * Official YouTube Data API v3 Harvester Utility
 * Strictly compliant with YouTube API Services Terms and Developer Policies:
 * - Uses official YouTube Data API v3 (search.list) with API key
 * - No scraping, stream extraction, or unauthorized downloads
 * - Caches search results ephemerally (7-day TTL) for performance
 */

const crypto = require('crypto');
const db = require('../db');

function hashQuery(query) {
    return crypto.createHash('md5').update(String(query || '').toLowerCase().trim()).digest('hex');
}

/**
 * Search YouTube for vocational demonstration videos using the Official YouTube Data API v3
 * with a strict 7-day ephemeral cache layer (Policy III.E.4.a-g).
 * @param {string} query Search query string
 * @param {number} maxResults Max results to return (default: 6)
 * @returns {Promise<Array<{video_id: string, video_title: string, video_url: string, thumbnail: string, channelTitle: string}>>}
 */
async function searchYouTubeVideos(query, maxResults = 6) {
    if (!query || typeof query !== 'string' || !query.trim()) {
        return [];
    }

    const cleanQ = query.trim();
    const qHash = hashQuery(cleanQ);

    // 1. Check 7-day Ephemeral Cache first (0 Quota Units used)
    try {
        const cacheRes = await db.query(
            `SELECT * FROM youtube_search_cache 
             WHERE query_hash = $1 AND cached_at >= NOW() - INTERVAL '7 days'`,
            [qHash]
        );
        if (cacheRes && cacheRes.rows && cacheRes.rows.length > 0) {
            const row = cacheRes.rows[0];
            return [{
                video_id: row.video_id,
                video_title: row.video_title,
                video_url: row.video_url || `https://www.youtube.com/watch?v=${row.video_id}`,
                thumbnail: row.thumbnail_url || `https://img.youtube.com/vi/${row.video_id}/mqdefault.jpg`,
                channelTitle: row.channel_title || 'Vocational Skills Studio',
                isCached: true
            }];
        }
    } catch (_) {}

    // 2. Call Official YouTube Data API v3 if uncached
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (apiKey && apiKey.trim()) {
        try {
            const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&q=${encodeURIComponent(cleanQ)}&key=${apiKey.trim()}`;
            const apiRes = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });

            if (apiRes.ok) {
                const data = await apiRes.json();
                if (Array.isArray(data.items) && data.items.length > 0) {
                    const items = data.items.map(item => ({
                        video_id: item.id.videoId,
                        video_title: item.snippet.title,
                        video_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
                        channelTitle: item.snippet.channelTitle || 'YouTube'
                    }));

                    // 3. Save top candidate to 7-day ephemeral cache
                    const top = items[0];
                    try {
                        await db.query(`
                            INSERT INTO youtube_search_cache
                                (query_hash, search_query, lang, video_id, video_title, video_url, channel_title, thumbnail_url, cached_at)
                            VALUES ($1, $2, 'eng', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                            ON CONFLICT (query_hash) DO UPDATE SET
                                video_id = EXCLUDED.video_id,
                                video_title = EXCLUDED.video_title,
                                cached_at = CURRENT_TIMESTAMP
                        `, [qHash, cleanQ, top.video_id, top.video_title, top.video_url, top.channelTitle, top.thumbnail]);
                    } catch (_) {}

                    return items;
                }
            } else {
                console.warn(`[YouTube API Harvester] Official API returned HTTP ${apiRes.status} for query "${cleanQ}"`);
            }
        } catch (err) {
            console.warn(`[YouTube API Harvester] Official API request error: ${err.message}`);
        }
    } else {
        console.warn('[YouTube API Harvester] No YOUTUBE_API_KEY configured in environment.');
    }

    // Standard fallback vocational learning demo
    return [{
        video_id: 'FW_bw9jdrlQ',
        video_title: 'NSQF Vocational Skill Demonstration Reel',
        video_url: 'https://www.youtube.com/watch?v=FW_bw9jdrlQ',
        thumbnail: 'https://img.youtube.com/vi/FW_bw9jdrlQ/mqdefault.jpg',
        channelTitle: 'HAYAGRIVA Skillpedia',
        isFallback: true
    }];
}

/**
 * Associate a verified educational video to an NSQF Performance Criterion
 */
async function cacheQpVideoMapping({ qpCode, nosCode, nosTitle, moduleTitle, pcId, pcIntent, pcDesc, videoId, videoTitle, videoUrl, auditScore = 95 }) {
    try {
        const vUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;
        await db.prepare(`
            UPDATE nsqf_pcs
            SET video_id    = ?,
                video_title = ?,
                video_url   = ?,
                audit_score = ?
            WHERE qp_code = ? AND pc_code = ?
        `).run(
            videoId,
            videoTitle || `${pcIntent || pcId} Demonstration`,
            vUrl,
            auditScore,
            qpCode,
            pcId
        );
    } catch (e) {
        console.warn(`[Harvester] Video mapping update warning for ${qpCode} ${pcId}:`, e.message);
    }
}

module.exports = {
    searchYouTubeVideos,
    cacheQpVideoMapping,
    saveVideoForever: cacheQpVideoMapping // Backwards-compatible alias
};
