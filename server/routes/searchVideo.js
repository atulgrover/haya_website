'use strict';
/**
 * Official YouTube Data API v3 Search Endpoint
 * Route: GET /api/search-video?q=QUERY
 * Uses YOUTUBE_API_KEY from environment variables to query Google's YouTube v3 API.
 * Returns official YouTube video candidates with titles, channel names, thumbnails, and video IDs.
 */

const express = require('express');
const router  = express.Router();

router.get('/', async (req, res) => {
  const query = req.query.q;

  res.set({
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type':                 'application/json'
  });

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, query: '', results: [], error: 'Missing query parameter' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.error('[YOUTUBE-API] Error: YOUTUBE_API_KEY is not configured in .env');
    return res.status(500).json({
      success: false,
      query,
      results: [],
      error: 'Official YOUTUBE_API_KEY missing in server .env configuration.'
    });
  }

  try {
    const cleanQ = query.trim();
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=6&q=${encodeURIComponent(cleanQ)}&key=${apiKey.trim()}`;

    console.log(`[YOUTUBE-API] Fetching official YouTube Data API v3 results for: "${cleanQ}"`);


    const apiRes = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error(`[YOUTUBE-API] Google API HTTP ${apiRes.status} Error: ${errText}`);
      return res.status(apiRes.status).json({
        success: false,
        query: cleanQ,
        results: [],
        error: `Official YouTube API Error (${apiRes.status}): ${errText}`
      });
    }

    const data = await apiRes.json();
    const candidates = [];

    if (data && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.id && item.id.videoId && item.snippet) {
          candidates.push({
            video_id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle || 'YouTube',
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
            publishedAt: item.snippet.publishedAt
          });
        }
      }
    }

    console.log(`[YOUTUBE-API] Successfully resolved ${candidates.length} official candidates for "${cleanQ}"`);
    return res.json({ success: true, query: cleanQ, results: candidates });

  } catch (err) {
    console.error(`[YOUTUBE-API] Exception during YouTube search: ${err.message}`);
    return res.status(500).json({
      success: false,
      query,
      results: [],
      error: `YouTube API Request Failed: ${err.message}`
    });
  }
});

router.options('/', (req, res) => res.sendStatus(204));

module.exports = router;
