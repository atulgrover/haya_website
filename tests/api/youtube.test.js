'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

test('Official YouTube Data API v3 Search Endpoint Suite', async (t) => {
  const apiKey = process.env.YOUTUBE_API_KEY;

  await t.test('YOUTUBE_API_KEY is configured in .env', () => {
    assert.ok(apiKey, 'YOUTUBE_API_KEY environment variable should be set');
    assert.ok(apiKey.startsWith('AIzaSy'), 'YOUTUBE_API_KEY should be a valid Google API key format');
  });

  await t.test('Queries official YouTube Data API v3 directly and returns valid items', async () => {
    const query = 'NCLT CIRP claims verification';
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${apiKey}`;

    const res = await fetch(apiUrl);
    assert.strictEqual(res.status, 200, 'Google YouTube API should return HTTP 200');

    const data = await res.json();
    assert.ok(data.items, 'Data should contain items array');
    assert.ok(data.items.length > 0, 'Items array should contain at least 1 video result');

    const firstItem = data.items[0];
    assert.ok(firstItem.id.videoId, 'First item must have id.videoId');
    assert.strictEqual(typeof firstItem.id.videoId, 'string');
    assert.strictEqual(firstItem.id.videoId.length, 11, 'YouTube Video ID must be 11 characters');
    assert.ok(firstItem.snippet.title, 'First item must have snippet.title');
  });
});
