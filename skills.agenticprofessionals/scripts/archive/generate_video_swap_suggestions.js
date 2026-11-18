'use strict';

/**
 * Run ReelCurator AI Agent to populate video_swap_suggestions table
 * Audits QPs across sectors and queues high-quality video swap recommendations for Admin Review
 */

require('dotenv').config();
const db = require('../server/db');
const { searchYouTubeVideos } = require('../server/utils/videoHarvester');
const { scoreVideoAlignment } = require('../server/services/reelCuratorAgent');

async function generateSwapSuggestions() {
    console.log('🤖 [ReelCurator AI Agent] Generating Video Swap Suggestions for Admin Review...\n');

    // Pick 10 sample QPs across different sectors
    const qpRows = await db.prepare(`
        SELECT qp_code, qp_name, sector FROM nsqf_qps 
        ORDER BY id ASC 
        LIMIT 10
    `).all();

    let totalSuggestions = 0;

    for (const qp of qpRows) {
        console.log(`\n🔍 Auditing QP: ${qp.qp_name} (${qp.qp_code}) [Sector: ${qp.sector}]...`);

        const pcs = await db.prepare(`
            SELECT * FROM nsqf_pcs 
            WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?
            ORDER BY id ASC
            LIMIT 5
        `).all(qp.qp_code, qp.qp_code.replace('/', '_'));

        for (const pc of pcs) {
            const intentText = pc.pc_intent || pc.pc_description || '';
            const currentScore = scoreVideoAlignment(intentText, pc.video_title);

            const searchQ = `${qp.qp_name} ${intentText} tutorial ${qp.sector}`;
            const candidates = await searchYouTubeVideos(searchQ, 3);

            for (const cand of candidates) {
                if (cand.isFallback || ['sR7RKyHHyTg', 'x9PQgbB4y6M', '3vK7G62p0M8', 'FW_bw9jdrlQ'].includes(cand.video_id)) continue;
                if (cand.video_id === pc.video_id) continue;

                const candScore = scoreVideoAlignment(intentText, cand.video_title);

                if (candScore > currentScore) {
                    const rationale = `AI Curator evaluated "${cand.video_title}" with ${candScore}% match score (vs. current ${currentScore}%). Demonstrates exact PC intent: "${intentText}".`;

                    try {
                        await db.prepare(`
                            INSERT OR REPLACE INTO video_swap_suggestions
                            (qp_code, nos_code, module_title, pc_id, pc_intent, current_video_id, current_video_title, current_audit_score, suggested_video_id, suggested_video_title, suggested_video_url, suggested_audit_score, ai_rationale, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                        `).run(
                            pc.qp_code,
                            pc.nos_code || 'NOS',
                            pc.module_title || 'Module',
                            pc.pc_code || String(pc.id),
                            intentText,
                            pc.video_id || '',
                            pc.video_title || 'Current Video',
                            currentScore,
                            cand.video_id,
                            cand.video_title,
                            cand.video_url,
                            cand.audit_score || candScore,
                            rationale
                        );
                        totalSuggestions++;
                        console.log(`   💡 QUEUED SUGGESTION: [${cand.video_id}] "${cand.video_title}" (${candScore}% match)`);
                    } catch (e) {
                        console.warn(`   ⚠️ Error queuing suggestion: ${e.message}`);
                    }
                    break; // Queue top candidate per PC
                }
            }
        }
    }

    console.log(`\n🎉 SUCCESS: Generated ${totalSuggestions} Video Swap Suggestions in video_swap_suggestions table!`);
    process.exit(0);
}

generateSwapSuggestions();
