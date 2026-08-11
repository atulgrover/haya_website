'use strict';
/**
 * Official YouTube Data API v3 Search Endpoint
 * Route: GET /api/search-video?q=QUERY
 * Uses YOUTUBE_API_KEY from environment variables to query Google's YouTube v3 API.
 * Returns official YouTube video candidates with titles, channel names, thumbnails, and video IDs.
 */

const express = require('express');
const router  = express.Router();
const { searchYouTubeVideos } = require('../utils/videoHarvester');

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

  try {
    const results = await searchYouTubeVideos(query, 6);
    return res.json({
      success: true,
      query: query.trim(),
      results
    });
  } catch (err) {
    console.error('[YOUTUBE-API] Search error:', err.message);
    return res.status(500).json({
      success: false,
      query: query.trim(),
      results: [],
      error: err.message
    });
  }
});

router.options('/', (req, res) => res.sendStatus(204));

module.exports = router;
