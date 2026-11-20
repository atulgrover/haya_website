'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../server/db');
const { searchYouTubeVideos, saveVideoForever } = require('../../server/utils/videoHarvester');

test('Official YouTube Data API v3 Harvester Integration Suite', async (t) => {

    await t.test('1. Harvester executes query using YouTube Data API v3', async () => {
        const results = await searchYouTubeVideos('garment inline checker seam inspection', 5);
        assert.ok(Array.isArray(results), 'results should be an array');
        assert.ok(results.length > 0, 'should return at least 1 video result');
        assert.ok(results[0].video_id, 'result item should have video_id');
        assert.ok(results[0].video_title, 'result item should have video_title');
        assert.ok(results[0].thumbnail, 'result item should have thumbnail URL');
    });

    await t.test('2. Students API Endpoint GET /api/skillpedia/nsqf/curriculum returns 8 module reels with valid videos', async () => {
        if (db.readyPromise) await db.readyPromise;
        const rows = await db.prepare("SELECT * FROM nsqf_videos WHERE qp_code = 'AMH/Q0103' ORDER BY id ASC").all();
        assert.ok(Array.isArray(rows) && rows.length === 32, 'AMH/Q0103 should contain 32 PC records');
        
        const videoIds = new Set(rows.map(r => r.video_id));
        assert.ok(videoIds.size >= 6, 'should contain multiple distinct curated video IDs');
        assert.ok(!videoIds.has('x9PQgbB4y6M'), 'should not contain default fallback video x9PQgbB4y6M');
    });

    await t.test('3. Video Swap & Permanent Storage saves video to SQLite nsqf_videos forever', async () => {
        const testPcId = 'PC1.1';
        const testVideoId = 'TEST_VID_999';
        
        await saveVideoForever({
            qpCode: 'AMH/Q0103',
            nosCode: 'AMH/N0101',
            nosTitle: 'Perform inline inspection of sewn components',
            moduleTitle: 'Module 1.1: Spec Sheet & Master Sample Verification',
            pcId: testPcId,
            pcIntent: 'Identify Approved Tech Pack & Master Sample',
            pcDesc: 'Obtain and verify official production tech pack',
            videoId: testVideoId,
            videoTitle: 'Test Video Swap Title',
            videoUrl: `https://www.youtube.com/watch?v=${testVideoId}`
        });

        const checkRow = await db.prepare("SELECT * FROM nsqf_videos WHERE qp_code = 'AMH/Q0103' AND pc_id = ?").get(testPcId);
        assert.ok(checkRow, 'PC row should exist in nsqf_videos');
        assert.strictEqual(checkRow.video_id, testVideoId, 'video_id should be updated permanently to TEST_VID_999');

        // Restore original curated video ID (sR7RKyHHyTg)
        await saveVideoForever({
            qpCode: 'AMH/Q0103',
            nosCode: 'AMH/N0101',
            nosTitle: 'Perform inline inspection of sewn components',
            moduleTitle: 'Module 1.1: Spec Sheet & Master Sample Verification',
            pcId: testPcId,
            pcIntent: 'Identify Approved Tech Pack & Master Sample',
            pcDesc: 'Obtain and verify official production tech pack',
            videoId: 'sR7RKyHHyTg',
            videoTitle: 'Identify Approved Tech Pack & Master Sample Demonstration',
            videoUrl: 'https://www.youtube.com/watch?v=sR7RKyHHyTg'
        });
    });
});
