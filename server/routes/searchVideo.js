'use strict';
/**
 * YouTube Video Search Proxy — Express port of skillpedia Cloudflare function
 * Route: GET /api/search-video?q=QUERY
 * DuckDuckGo video search → extract YouTube video IDs → return candidates
 */

const express = require('express');
const router  = express.Router();

router.get('/', async (req, res) => {
  const query = req.query.q;

  // CORS headers for browser fetch calls
  res.set({
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type':                 'application/json'
  });

  if (!query || typeof query !== 'string') {
    return res.json({ query: '', results: [], log: 'Missing query parameter' });
  }

  try {
    const cleanQ   = query.trim();
    const qEncoded = encodeURIComponent(`${cleanQ} youtube`);
    const searchUrl = `https://duckduckgo.com/?q=${qEncoded}&t=h_&iax=videos&ia=videos`;

    console.log(`[SEARCH-PROXY] Fetching DDG token for: "${cleanQ}"`);

    const htmlRes = await fetch(searchUrl, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!htmlRes.ok) {
      console.warn(`[SEARCH-PROXY] DDG HTML fetch failed: ${htmlRes.status}`);
      return res.json({ query: cleanQ, results: [], log: `DDG HTTP ${htmlRes.status}` });
    }

    const htmlText = await htmlRes.text();

    // Extract vqd token — supports all DuckDuckGo HTML variants
    const vqdMatch = htmlText.match(/vqd=['"]?([\d-]+)['"]?/)
                  || htmlText.match(/["']vqd["']\s*:\s*["']([\d-]+)["']/)
                  || htmlText.match(/vqd=([a-zA-Z0-9_-]+)/);

    if (!vqdMatch) {
      console.warn('[SEARCH-PROXY] vqd token not found in DDG response');
      return res.json({ query: cleanQ, results: [], log: 'vqd token missing' });
    }

    const vqd = vqdMatch[1];
    const videoApiUrl = `https://duckduckgo.com/v.js?q=${qEncoded}&vqd=${vqd}&p=1`;

    const apiRes = await fetch(videoApiUrl, {
      headers: {
        'User-Agent':        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept':            'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With':  'XMLHttpRequest'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!apiRes.ok) {
      console.warn(`[SEARCH-PROXY] DDG Video API failed: ${apiRes.status}`);
      return res.json({ query: cleanQ, results: [], log: `DDG API HTTP ${apiRes.status}` });
    }

    const data       = await apiRes.json();
    const candidates = [];

    if (data && Array.isArray(data.results)) {
      for (const item of data.results) {
        if (candidates.length >= 3) break;
        if (item.content && item.content.includes('youtube.com')) {
          const match = item.content.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          if (match && match[1]) {
            const vid = match[1];
            if (!candidates.some(c => c.video_id === vid)) {
              candidates.push({
                video_id:  vid,
                title:     item.title || cleanQ,
                publisher: item.publisher || 'YouTube'
              });
            }
          }
        }
      }
    }

    console.log(`[SEARCH-PROXY] "${cleanQ}" → ${candidates.length} candidates`);
    return res.json({ query: cleanQ, results: candidates, log: 'Success' });

  } catch (err) {
    console.error(`[SEARCH-PROXY] Exception: ${err.message}`);
    return res.json({ query, results: [], log: `Exception: ${err.message}` });
  }
});

// Handle OPTIONS preflight
router.options('/', (req, res) => res.sendStatus(204));

module.exports = router;
