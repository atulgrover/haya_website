'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PASS 4: Batch Editorial Quality Review                                  ║
 * ║  [👤 100% Human-In-The-Loop — Zero Auto-Overwrites]                     ║
 * ║                                                                          ║
 * ║  Sweeps all QPs with pipeline_status = 'video_harvested',               ║
 * ║  scores each PC's current video against its pc_intent,                   ║
 * ║  searches for better YouTube candidates where score < 65,                ║
 * ║  and queues swap suggestions in video_swap_suggestions for              ║
 * ║  Admin review in dashboard.html.                                         ║
 * ║                                                                          ║
 * ║  Usage:                                                                  ║
 * ║    node scripts/nsqf_pass4_editorial_review.js --qp=NIE/ELE/Q0803      ║
 * ║    node scripts/nsqf_pass4_editorial_review.js --limit=10              ║
 * ║    node scripts/nsqf_pass4_editorial_review.js --all                   ║
 * ║    node scripts/nsqf_pass4_editorial_review.js --all --resume          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const fs   = require('fs');
const db   = require('../server/db');
const { searchYouTubeVideos } = require('../server/utils/videoHarvester');

const CHECKPOINT_PATH      = path.join(__dirname, '..', 'data', '.pass4_checkpoint.json');
const AUDIT_SCORE_THRESHOLD = 65;   // PCs with score < 65 trigger a search for better candidates
const MIN_IMPROVEMENT       = 8;    // Minimum score delta to create a swap suggestion

// ── Multi-Factor PC Intent → Video Title Alignment Scorer ────────────────────
function scoreVideoAlignment(pcIntent, videoTitle, videoDescription = '') {
    if (!pcIntent || !videoTitle) return 50;

    const intentTerms = pcIntent.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2);
    const titleLower = (videoTitle + ' ' + (videoDescription || '')).toLowerCase();

    let matches = 0;
    intentTerms.forEach(term => { if (titleLower.includes(term)) matches++; });
    const matchRatio = intentTerms.length > 0 ? (matches / intentTerms.length) : 0.5;
    let score = Math.round(50 + (matchRatio * 40));

    // Bonus for clear educational/practical keywords
    if (/tutorial|guide|how to|inspection|demonstration|step by step|explained|practical|repair|assemble|install/i.test(titleLower)) {
        score += 8;
    }
    // Penalty for non-educational content
    if (/unboxing|review|prank|reaction|shorts|teaser|music|song|vlog/i.test(titleLower)) {
        score -= 15;
    }

    return Math.min(99, Math.max(30, score));
}

// ── YouTube Search (Official YouTube Data API v3) ───────────────────
async function searchForBetterCandidate(searchQuery, currentVideoId, currentScore, excludedIds = new Set()) {
    try {
        const results = await searchYouTubeVideos(searchQuery, 6);
        let bestCand  = null;
        let bestScore = currentScore;

        for (const vid of results) {
            const vId = vid.video_id;
            if (!vId || vId.length !== 11) continue;
            if (vId === currentVideoId) continue;
            if (excludedIds.has(vId)) continue;

            const candScore = scoreVideoAlignment(searchQuery, vid.video_title || '');
            if (candScore > bestScore + MIN_IMPROVEMENT) {
                bestScore = candScore;
                bestCand  = {
                    videoId:    vId,
                    videoTitle: vid.video_title || 'NSQF Practical Demonstration',
                    videoUrl:   `https://www.youtube.com/watch?v=${vId}`,
                    score:      candScore
                };
            }
        }

        return bestCand;
    } catch (_) {
        return null;
    }
}

// ── Checkpoint Helpers ────────────────────────────────────────────────────────
function loadCheckpoint() {
    try { if (fs.existsSync(CHECKPOINT_PATH)) return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8')); } catch {}
    return null;
}
function saveCheckpoint(qpCode, processedCount) {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({ last_qp: qpCode, processed_count: processedCount, timestamp: new Date().toISOString() }), 'utf-8');
}
function clearCheckpoint() { try { fs.unlinkSync(CHECKPOINT_PATH); } catch {} }

// ── Mark QP as editorial complete if no pending suggestions remain ────────────
async function markQpEditorialComplete(qpCode, pool) {
    try {
        const pending = await pool.query(
            `SELECT COUNT(*) as cnt FROM video_swap_suggestions WHERE qp_code = $1 AND status = 'pending'`,
            [qpCode]
        );
        if (parseInt(pending.rows[0].cnt) === 0) {
            await pool.query(
                `UPDATE nsqf_qps SET pipeline_status = 'editorial_approved' WHERE qp_code = $1`,
                [qpCode]
            );
        }
    } catch (_) {}
}

// ── Main Batch Pass 4 ─────────────────────────────────────────────────────────
async function runPass4EditorialReview() {
    const args      = process.argv.slice(2);
    const doAll     = args.includes('--all');
    const doResume  = args.includes('--resume');
    const limitFlag = args.find(a => a.startsWith('--limit='));
    const qpFlag    = args.find(a => a.startsWith('--qp='));

    const limit    = limitFlag ? parseInt(limitFlag.split('=')[1]) : 5;
    const targetQp = qpFlag    ? qpFlag.split('=')[1].trim()       : null;

    console.log('================================================================================');
    console.log('👤 [PASS 4] BATCH EDITORIAL QUALITY REVIEW (Human-In-The-Loop)');
    console.log('   YouTube Search: ✅ Official YouTube Data API v3 Active');
    console.log('================================================================================\n');

    const pool = { query: db.query.bind(db) };

    // ── 1. Fetch QPs to review ────────────────────────────────────────────────
    let qpRows = [];
    if (targetQp) {
        const clean = targetQp.replace(/\//g, '_');
        const res = await pool.query(
            `SELECT qp_code, qp_name, sector FROM nsqf_qps WHERE qp_code = $1 OR qp_code = $2`,
            [targetQp, clean]
        );
        qpRows = res.rows;
    } else if (doAll) {
        const res = await pool.query(
            `SELECT qp_code, qp_name, sector FROM nsqf_qps WHERE pipeline_status = 'video_harvested' ORDER BY id ASC`
        );
        qpRows = res.rows;
    } else {
        const res = await pool.query(
            `SELECT qp_code, qp_name, sector FROM nsqf_qps WHERE pipeline_status = 'video_harvested' ORDER BY id ASC LIMIT $1`,
            [limit]
        );
        qpRows = res.rows;
    }

    if (qpRows.length === 0) {
        console.log('ℹ️  No QPs with pipeline_status = \'video_harvested\' found. Run Pass 3 first.');
        process.exit(0);
    }

    // ── 2. Resume support ─────────────────────────────────────────────────────
    let startIdx = 0;
    if (doResume && !targetQp) {
        const cp = loadCheckpoint();
        if (cp && cp.last_qp) {
            const idx = qpRows.findIndex(q => q.qp_code === cp.last_qp);
            if (idx >= 0) {
                startIdx = idx;
                console.log(`⏩  Resuming from QP ${cp.last_qp} (skipping ${startIdx} QPs)...\n`);
            }
        }
    }

    const qpsToProcess = qpRows.slice(startIdx);
    console.log(`Scanning ${qpsToProcess.length} QP(s) for editorial review...\n`);

    const startTime      = Date.now();
    let totalAudited     = 0;
    let totalSuggestions = 0;
    let totalHighScore   = 0;
    let totalNeedReview  = 0;

    for (const qp of qpsToProcess) {
        console.log(`────────────────────────────────────────────────────────────────────────────────`);
        console.log(`🔍 Auditing: ${qp.qp_code} — ${qp.qp_name || ''}`);

        // Fetch all PCs for this QP
        const pcRes = await pool.query(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_intent, p.pc_description,
                   p.video_id, p.video_title, p.video_url, p.contextual_search_query,
                   COALESCE(n.nos_title, 'NOS') AS nos_title,
                   COALESCE(m.module_title, 'Module') AS module_title
            FROM nsqf_pcs p
            LEFT JOIN nsqf_nos n ON p.qp_code = n.qp_code AND p.nos_code = n.nos_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE p.qp_code = $1
            ORDER BY p.sequence_order, p.id
        `, [qp.qp_code]);

        const pcs = pcRes.rows;
        if (pcs.length === 0) {
            console.log(`   ℹ️  No PCs found — skipping.`);
            continue;
        }

        let qpSuggestions = 0;
        const excludedIds = new Set();

        for (const pc of pcs) {
            totalAudited++;
            const intentText   = pc.pc_intent || pc.pc_description || '';
            const currentScore = scoreVideoAlignment(intentText, pc.video_title || '');

            if (pc.video_id && pc.video_id !== 'x9PQgbB4y6M' && currentScore >= AUDIT_SCORE_THRESHOLD) {
                totalHighScore++;
                excludedIds.add(pc.video_id);
                continue; // Video is good — skip
            }

            totalNeedReview++;

            // Search for a better candidate
            const searchQuery = pc.contextual_search_query || `${qp.qp_name} ${intentText} practical tutorial`;
            const betterCand  = ytsr ? await searchForBetterCandidate(searchQuery, pc.video_id, currentScore, excludedIds) : null;

            if (betterCand) {
                const rationale = `AI editorial review: candidate "${betterCand.videoTitle}" scores ${betterCand.score}% vs current "${pc.video_title || 'N/A'}" at ${currentScore}%. Aligns with PC intent: "${intentText}".`;

                try {
                    await pool.query(`
                        INSERT INTO video_swap_suggestions
                            (qp_code, nos_code, module_title, pc_id, pc_intent,
                             current_video_id, current_video_title, current_audit_score,
                             suggested_video_id, suggested_video_title, suggested_video_url,
                             suggested_audit_score, ai_rationale, status)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending')
                        ON CONFLICT (qp_code, pc_id, suggested_video_id) DO UPDATE SET
                            current_video_title    = EXCLUDED.current_video_title,
                            current_audit_score    = EXCLUDED.current_audit_score,
                            suggested_video_title  = EXCLUDED.suggested_video_title,
                            suggested_video_url    = EXCLUDED.suggested_video_url,
                            suggested_audit_score  = EXCLUDED.suggested_audit_score,
                            ai_rationale           = EXCLUDED.ai_rationale,
                            status                 = 'pending'
                    `, [
                        qp.qp_code, pc.nos_code, pc.module_title,
                        pc.pc_code || String(pc.id), intentText,
                        pc.video_id || '', pc.video_title || 'N/A', currentScore,
                        betterCand.videoId, betterCand.videoTitle, betterCand.videoUrl,
                        betterCand.score, rationale
                    ]);

                    excludedIds.add(betterCand.videoId);
                    qpSuggestions++;
                    totalSuggestions++;
                } catch (e) {
                    console.warn(`   ⚠️  Suggestion insert failed for ${pc.pc_code}: ${e.message}`);
                }
            }
        }

        // Mark QP as pending editorial review
        await pool.query(
            `UPDATE nsqf_qps SET pipeline_status = 'pending_editorial_review' WHERE qp_code = $1`,
            [qp.qp_code]
        );

        console.log(`   ✅  Audited: ${pcs.length} PCs | Suggestions queued: ${qpSuggestions} | Status: pending_editorial_review`);
        saveCheckpoint(qp.qp_code, totalAudited);
    }

    clearCheckpoint();
    const elapsedMs = Date.now() - startTime;

    console.log('\n================================================================================');
    console.log(`📊 PASS 4 EDITORIAL REVIEW SUMMARY:`);
    console.log(`   QPs Processed:           ${qpsToProcess.length.toLocaleString()}`);
    console.log(`   Total PCs Audited:       ${totalAudited.toLocaleString()}`);
    console.log(`   High Score (>= ${AUDIT_SCORE_THRESHOLD}%):     ${totalHighScore.toLocaleString()} — No action needed`);
    console.log(`   Need Review (< ${AUDIT_SCORE_THRESHOLD}%):      ${totalNeedReview.toLocaleString()}`);
    console.log(`   Swap Suggestions Queued: ${totalSuggestions.toLocaleString()} (in video_swap_suggestions)`);
    console.log(`   Execution Time:          ${(elapsedMs / 1000).toFixed(2)} seconds`);
    console.log(`\n   👉 Next Step: Open dashboard.html → IBC Agents tab to review & accept/reject suggestions`);
    console.log('================================================================================\n');

    process.exit(0);
}

runPass4EditorialReview().catch(e => {
    console.error('\n❌ Fatal error in Pass 4 Editorial Review:', e.message);
    console.error(e.stack);
    process.exit(1);
});
