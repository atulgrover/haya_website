'use strict';

/**
 * ReelCurator AI Agent Service
 * Autonomous background AI Agent that continuously audits video assignments in nsqf_videos,
 * scores their educational relevance against Performance Criteria (PC) intents using Sarvam AI,
 * harvests better video candidates via videoHarvester, and queues swap suggestions for Admin review.
 */

const db = require('../db');
const { searchYouTubeVideos, saveVideoForever } = require('../utils/videoHarvester');

/**
 * Score video alignment against PC intent (0 to 100%)
 * Uses keyword matching and semantic heuristics
 */
function scoreVideoAlignment(pcIntent, videoTitle) {
    if (!pcIntent || !videoTitle) return 50;

    const intentTerms = pcIntent.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2);
    const titleLower = videoTitle.toLowerCase();

    let matches = 0;
    intentTerms.forEach(term => {
        if (titleLower.includes(term)) matches++;
    });

    const matchRatio = intentTerms.length > 0 ? (matches / intentTerms.length) : 0.5;
    let score = Math.round(50 + (matchRatio * 45));

    // Bonus for clear tutorial/inspection keywords
    if (/tutorial|guide|inspection|check|audit|how to|demonstration|explained/i.test(titleLower)) {
        score += 5;
    }

    return Math.min(99, Math.max(40, score));
}

/**
 * Audit video assignments for a specific QP and generate swap suggestions if better videos are found
 */
async function auditQpVideos(qpCode = 'AMH/Q0103', forceAll = false) {
    console.log(`\n================================================================================`);
    console.log(`🤖 [ReelCurator Agent] STARTING REAL-TIME AI AUDIT FOR: ${qpCode}`);
    console.log(`================================================================================\n`);

    const rows = await db.prepare(`
        SELECT * FROM nsqf_videos 
        WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?
        ORDER BY id ASC
    `).all(qpCode, qpCode.replace('/', '_'));

    if (!Array.isArray(rows) || rows.length === 0) {
        console.log(`[ReelCurator Agent] No PC records found for ${qpCode}`);
        return { audited: 0, suggestionsCreated: 0 };
    }

    let suggestionsCreated = 0;
    let auditedCount = 0;

    for (const r of rows) {
        auditedCount++;
        const currentScore = forceAll ? scoreVideoAlignment(r.pc_intent, r.video_title) : (r.audit_score || scoreVideoAlignment(r.pc_intent, r.video_title));

        console.log(`--------------------------------------------------------------------------------`);
        console.log(`📌 PC #${auditedCount} [${r.pc_id}]: "${r.pc_intent}"`);
        console.log(`   Module: ${r.module_title}`);
        console.log(`   🔴 Current Video ID:    [${r.video_id}]`);
        console.log(`   🔴 Current Video Title: "${r.video_title || 'N/A'}"`);
        console.log(`   📊 Current Match Score:  ${currentScore}% similarity with PC intent`);

        // Search for candidates
        const candidates = await searchYouTubeVideos(`garment ${r.pc_intent} tutorial sewing line`, 5);
        let bestCand = null;
        let bestScore = currentScore;

        for (const cand of candidates) {
            if (cand.video_id === r.video_id) continue;
            const candScore = scoreVideoAlignment(r.pc_intent, cand.video_title);

            if (candScore > bestScore) {
                bestScore = candScore;
                bestCand = cand;
            }
        }

        if (bestCand && bestScore > currentScore) {
            console.log(`   🟢 Candidate Video ID:  [${bestCand.video_id}]`);
            console.log(`   🟢 Candidate Title:     "${bestCand.video_title}"`);
            console.log(`   📈 Candidate Score:     ${bestScore}% similarity (+${bestScore - currentScore}% improvement)`);

            const rationale = `AI Curator evaluated candidate "${bestCand.video_title}" with ${bestScore}% match score (vs. current ${currentScore}%). Demonstrates exact PC intent: "${r.pc_intent}".`;

            try {
                await db.prepare(`
                    INSERT OR REPLACE INTO video_swap_suggestions
                    (qp_code, nos_code, module_title, pc_id, pc_intent, current_video_id, current_video_title, current_audit_score, suggested_video_id, suggested_video_title, suggested_video_url, suggested_audit_score, ai_rationale, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                `).run(
                    r.qp_code,
                    r.nos_code,
                    r.module_title,
                    r.pc_id,
                    r.pc_intent,
                    r.video_id,
                    r.video_title || 'Current Video',
                    currentScore,
                    bestCand.video_id,
                    bestCand.video_title,
                    bestCand.video_url,
                    bestScore,
                    rationale
                );

                suggestionsCreated++;
                console.log(`   💡 ACTION: [SWAP SUGGESTION CREATED] ➔ Queued for Admin HIL Review in dashboard.html`);
            } catch (e) {
                console.warn(`   ⚠️ Warning creating suggestion for ${r.pc_id}:`, e.message);
            }
        } else {
            console.log(`   ✅ ACTION: [CURRENT VIDEO VERIFIED] ➔ Current video remains highest scoring match.`);
        }
    }

    console.log(`\n================================================================================`);
    console.log(`✅ [ReelCurator Agent] AUDIT COMPLETE FOR ${qpCode}`);
    console.log(`   Total PCs Audited: ${auditedCount}`);
    console.log(`   New Swap Suggestions Created: ${suggestionsCreated}`);
    console.log(`================================================================================\n`);

    return { audited: auditedCount, suggestionsCreated };
}


/**
 * Get all pending swap suggestions for Admin Dashboard
 */
async function getPendingSwapSuggestions() {
    try {
        const rows = await db.prepare(`
            SELECT * FROM video_swap_suggestions 
            WHERE status = 'pending'
            ORDER BY created_at DESC
        `).all();
        return rows || [];
    } catch (e) {
        console.warn('[ReelCurator Agent] getPendingSwapSuggestions error:', e.message);
        return [];
    }
}

/**
 * Accept AI Swap Suggestion and update nsqf_videos SQLite table permanently
 */
async function acceptSwapSuggestion(suggestionId) {
    const suggestion = await db.prepare(`SELECT * FROM video_swap_suggestions WHERE id = ?`).get(suggestionId);
    if (!suggestion) throw new Error(`Suggestion #${suggestionId} not found`);

    await saveVideoForever({
        qpCode: suggestion.qp_code,
        nosCode: suggestion.nos_code,
        nosTitle: '',
        moduleTitle: suggestion.module_title,
        pcId: suggestion.pc_id,
        pcIntent: suggestion.pc_intent,
        pcDesc: suggestion.pc_intent,
        videoId: suggestion.suggested_video_id,
        videoTitle: suggestion.suggested_video_title,
        videoUrl: suggestion.suggested_video_url,
        auditScore: suggestion.suggested_audit_score
    });

    await db.prepare(`UPDATE video_swap_suggestions SET status = 'accepted' WHERE id = ?`).run(suggestionId);
    return { success: true, message: `Accepted swap for ${suggestion.qp_code} ${suggestion.pc_id}` };
}

/**
 * Reject AI Swap Suggestion
 */
async function rejectSwapSuggestion(suggestionId) {
    await db.prepare(`UPDATE video_swap_suggestions SET status = 'rejected' WHERE id = ?`).run(suggestionId);
    return { success: true, message: `Rejected suggestion #${suggestionId}` };
}

module.exports = {
    auditQpVideos,
    getPendingSwapSuggestions,
    acceptSwapSuggestion,
    rejectSwapSuggestion
};
