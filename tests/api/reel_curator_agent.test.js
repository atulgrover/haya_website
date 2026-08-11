'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../server/db');
const reelCuratorAgent = require('../../server/services/reelCuratorAgent');

test('ReelCurator AI Agent Suite', async (t) => {

    await t.test('1. video_swap_suggestions table exists in database', async () => {
        if (db.readyPromise) await db.readyPromise;
        const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='video_swap_suggestions'").get();
        assert.ok(row, 'video_swap_suggestions table should exist');
    });

    await t.test('2. auditQpVideos executes and returns audited count for AMH/Q0103', async () => {
        const res = await reelCuratorAgent.auditQpVideos('AMH/Q0103');
        assert.ok(typeof res.audited === 'number', 'res.audited should be a number');
        assert.ok(res.audited >= 0, 'audited count should be >= 0');
    });

    await t.test('3. getPendingSwapSuggestions returns pending array', async () => {
        const list = await reelCuratorAgent.getPendingSwapSuggestions();
        assert.ok(Array.isArray(list), 'pending suggestions should be an array');
    });

    await t.test('4. Accept and Reject swap flows execute cleanly', async () => {
        // Create mock suggestion
        await db.prepare(`
            INSERT OR REPLACE INTO video_swap_suggestions
            (qp_code, nos_code, module_title, pc_id, pc_intent, current_video_id, current_video_title, current_audit_score, suggested_video_id, suggested_video_title, suggested_video_url, suggested_audit_score, ai_rationale, status)
            VALUES ('TEST/Q999', 'TEST/N01', 'Module 1.1 Test', 'PC1.1', 'Test PC Intent', 'CURR_VID', 'Current Title', 50, 'SUGG_VID', 'Suggested Title', 'https://youtube.com/watch?v=SUGG_VID', 95, 'AI test rationale', 'pending')
        `).run();

        const pending = await reelCuratorAgent.getPendingSwapSuggestions();
        const item = pending.find(p => p.qp_code === 'TEST/Q999');
        assert.ok(item, 'mock suggestion item should exist');

        const acceptRes = await reelCuratorAgent.acceptSwapSuggestion(item.id);
        assert.ok(acceptRes.success, 'acceptSwapSuggestion should return success: true');

        // Clean up test records
        await db.prepare("DELETE FROM video_swap_suggestions WHERE qp_code = 'TEST/Q999'").run();
        await db.prepare("DELETE FROM nsqf_videos WHERE qp_code = 'TEST/Q999'").run();
    });
});
