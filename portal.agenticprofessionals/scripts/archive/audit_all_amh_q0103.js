'use strict';

/**
 * Audit all 32 Performance Criteria videos for AMH/Q0103
 * Evaluates match score % against PC intent and populates video_swap_suggestions table
 */

const db = require('../server/db');
const agent = require('../server/services/reelCuratorAgent');

async function main() {
    console.log('🚀 Starting Full 32 PC Audit for AMH/Q0103...');
    if (db.readyPromise) await db.readyPromise;

    // Reset audit scores to force deep fresh audit across all 32 PCs
    await db.prepare("UPDATE nsqf_videos SET audit_score = 50 WHERE qp_code = 'AMH/Q0103'").run();

    const result = await agent.auditQpVideos('AMH/Q0103', true);
    console.log('\n================================================================================');
    console.log(`✅ FINAL AUDIT RESULT: Audited ${result.audited} PCs, Created ${result.suggestionsCreated} Swap Suggestions.`);
    console.log('================================================================================\n');

    const pending = await db.prepare("SELECT * FROM video_swap_suggestions WHERE qp_code = 'AMH/Q0103' AND status = 'pending' ORDER BY id ASC").all();
    console.log(`📋 Total Pending Swap Suggestions in DB: ${pending.length}`);
    pending.forEach((p, idx) => {
        console.log(`${idx + 1}. [${p.pc_id}]: "${p.pc_intent}"`);
        console.log(`   Current: [${p.current_video_id}] "${p.current_video_title}" (${p.current_audit_score}%)`);
        console.log(`   Suggested: [${p.suggested_video_id}] "${p.suggested_video_title}" (${p.suggested_audit_score}%)`);
        console.log(`   AI Rationale: ${p.ai_rationale}\n`);
    });

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal audit error:', err);
    process.exit(1);
});
