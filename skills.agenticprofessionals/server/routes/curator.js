'use strict';
/**
 * HAYAGRIVA Human-in-the-Loop (HIL) Video Curation & Audit API
 * Route: /api/curator/*
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

function hashQuery(query) {
    return crypto.createHash('md5').update(String(query || '').toLowerCase().trim()).digest('hex');
}

/**
 * Robust YouTube URL / ID Parser
 * Supports standard watch URLs, youtu.be, shorts, embeds, and raw 11-char IDs.
 */
function extractYouTubeId(input) {
    if (!input || typeof input !== 'string') return null;
    const clean = input.trim();

    // Direct 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
        return { videoId: clean, startTime: 0 };
    }

    // Standard YouTube URL regex
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = clean.match(regExp);

    if (match && match[1]) {
        const videoId = match[1];
        let startTime = 0;

        // Extract ?t=... timestamp if present
        const tMatch = clean.match(/[?&](?:t|start)=(\d+)/i);
        if (tMatch && tMatch[1]) {
            startTime = parseInt(tMatch[1], 10) || 0;
        }

        return { videoId, startTime };
    }

    return null;
}

/**
 * GET /api/curator/qps
 * List all Qualification Packs with completion percentage
 */
router.get('/qps', async (req, res) => {
    try {
        const sector = req.query.sector;
        let queryStr = `
            SELECT q.qp_code, q.qp_name, q.sector, q.sub_sector, q.nsqf_level,
                   COUNT(p.id)::INTEGER as total_pcs,
                   COUNT(p.id) FILTER (WHERE p.is_human_verified = TRUE OR p.video_id IS NOT NULL)::INTEGER as verified_pcs
            FROM nsqf_qps q
            LEFT JOIN nsqf_pcs p ON q.qp_code = p.qp_code
        `;
        const params = [];

        if (sector && sector !== 'all') {
            queryStr += ` WHERE q.sector = $1 `;
            params.push(sector);
        }

        queryStr += `
            GROUP BY q.qp_code, q.qp_name, q.sector, q.sub_sector, q.nsqf_level
            ORDER BY q.sector, q.qp_name
        `;

        const result = await db.query(queryStr, params);
        return res.json({ success: true, count: result.rows.length, qps: result.rows });
    } catch (err) {
        console.error('[HIL Curator] Error listing QPs:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/curator/pcs?qp=...
 * Fetch all atomic criteria for a specific QP with curation metadata
 */
router.get('/pcs', async (req, res) => {
    const qpCode = req.query.qp || req.query.qp_code;
    if (!qpCode) {
        return res.status(400).json({ success: false, error: 'Missing qp parameter' });
    }

    try {
        const qpRes = await db.query(
            `SELECT qp_code, qp_name, sector, sub_sector, nsqf_level FROM nsqf_qps WHERE qp_code = $1`,
            [qpCode]
        );

        if (qpRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'QP not found' });
        }

        const pcsRes = await db.query(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description, p.action_directive,
                   p.sop_parameter_tolerance, p.sop_critical_knack, p.sop_search_query, p.pc_intent,
                   p.contextual_search_query, p.video_id, p.video_title, p.video_url,
                   p.start_seconds, p.end_seconds, p.is_human_verified, p.curated_by, p.curated_at,
                   n.nos_name
            FROM nsqf_pcs p
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            WHERE p.qp_code = $1
            ORDER BY p.nos_code, p.id
        `, [qpCode]);

        return res.json({
            success: true,
            qp: qpRes.rows[0],
            total_pcs: pcsRes.rows.length,
            pcs: pcsRes.rows
        });
    } catch (err) {
        console.error('[HIL Curator] Error loading PCs for QP:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/curator/verify-pc
 * Manually attach human-verified YouTube video ID & bounds with audit log
 */
router.post('/verify-pc', async (req, res) => {
    const {
        pc_id,
        video_url_or_id,
        start_seconds = 0,
        end_seconds = null,
        curator_email,
        curator_name = 'Curator',
        confidence_score = 100,
        curator_notes = ''
    } = req.body;

    if (!pc_id) {
        return res.status(400).json({ success: false, error: 'Missing pc_id parameter' });
    }

    if (!curator_email || !curator_email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Valid curator email is required for audit trail' });
    }

    const parsed = extractYouTubeId(video_url_or_id);
    if (!parsed || !parsed.videoId) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL or Video ID. Provide an 11-char ID or YouTube URL.' });
    }

    const videoId = parsed.videoId;
    const sSec = Math.max(0, parseInt(start_seconds, 10) || parsed.startTime || 0);
    const eSec = end_seconds ? Math.max(sSec + 1, parseInt(end_seconds, 10)) : null;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoTitle = `${videoId} (Human-Verified NSQF Demonstration)`;

    try {
        // 1. Fetch current PC details
        const currentPcRes = await db.query(
            `SELECT id, qp_code, nos_code, pc_code, pc_description, action_directive, video_id, sop_search_query FROM nsqf_pcs WHERE id = $1`,
            [pc_id]
        );

        if (currentPcRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Performance criterion not found' });
        }

        const currentPc = currentPcRes.rows[0];
        const prevVideoId = currentPc.video_id || null;

        // 2. Update nsqf_pcs with verified video metadata
        await db.query(`
            UPDATE nsqf_pcs
            SET video_id          = $1,
                video_title       = $2,
                video_url         = $3,
                start_seconds     = $4,
                end_seconds       = $5,
                is_human_verified = TRUE,
                curated_by        = $6,
                curated_at        = CURRENT_TIMESTAMP
            WHERE id = $7
        `, [videoId, videoTitle, videoUrl, sSec, eSec, curator_email.trim(), pc_id]);

        // 3. Insert into immutable audit ledger (hil_video_curations)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        await db.query(`
            INSERT INTO hil_video_curations
                (pc_id, qp_code, nos_code, pc_code, video_id, video_title, video_url, start_seconds, end_seconds,
                 previous_video_id, curator_email, curator_name, confidence_score, curator_notes, ip_address, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
        `, [
            pc_id,
            currentPc.qp_code,
            currentPc.nos_code,
            currentPc.pc_code,
            videoId,
            videoTitle,
            videoUrl,
            sSec,
            eSec,
            prevVideoId,
            curator_email.trim(),
            curator_name.trim(),
            parseInt(confidence_score, 10) || 100,
            curator_notes ? curator_notes.trim() : null,
            String(ip).substring(0, 45)
        ]);

        // 4. Update 7-day ephemeral cache so on-the-fly streaming searches immediately return verified video
        const searchQueries = [
            currentPc.sop_search_query,
            currentPc.action_directive,
            currentPc.pc_description
        ].filter(Boolean);

        for (const q of searchQueries) {
            const qHash = hashQuery(q);
            try {
                await db.query(`
                    INSERT INTO youtube_search_cache
                        (query_hash, search_query, lang, video_id, video_title, video_url, channel_title, thumbnail_url, cached_at)
                    VALUES ($1, $2, 'eng', $3, $4, $5, 'Human Verified Curation', $6, CURRENT_TIMESTAMP)
                    ON CONFLICT (query_hash) DO UPDATE SET
                        video_id = EXCLUDED.video_id,
                        video_title = EXCLUDED.video_title,
                        cached_at = CURRENT_TIMESTAMP
                `, [qHash, q, videoId, videoTitle, videoUrl, `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`]);
            } catch (_) {}
        }

        return res.json({
            success: true,
            message: 'Criterion successfully verified and audit record logged',
            pc: {
                id: pc_id,
                video_id: videoId,
                video_url: videoUrl,
                start_seconds: sSec,
                end_seconds: eSec,
                is_human_verified: true,
                curated_by: curator_email
            }
        });
    } catch (err) {
        console.error('[HIL Curator] Error verifying PC:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/curator/stats
 * Curation progress and leaderboard metrics
 */
router.get('/stats', async (req, res) => {
    try {
        const totalPcRes = await db.query(`SELECT COUNT(*)::INTEGER as count FROM nsqf_pcs`);
        const verifiedRes = await db.query(`SELECT COUNT(*)::INTEGER as count FROM nsqf_pcs WHERE is_human_verified = TRUE`);
        const todayRes = await db.query(`
            SELECT COUNT(*)::INTEGER as count 
            FROM hil_video_curations 
            WHERE created_at >= CURRENT_DATE
        `);
        const leaderboardRes = await db.query(`
            SELECT curator_email, curator_name, COUNT(*)::INTEGER as curations_count,
                   MAX(created_at) as last_curation
            FROM hil_video_curations
            GROUP BY curator_email, curator_name
            ORDER BY curations_count DESC
            LIMIT 10
        `);

        return res.json({
            success: true,
            total_pcs: totalPcRes.rows[0]?.count || 176727,
            total_verified: verifiedRes.rows[0]?.count || 0,
            today_curations: todayRes.rows[0]?.count || 0,
            leaderboard: leaderboardRes.rows
        });
    } catch (err) {
        console.error('[HIL Curator] Error loading stats:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/curator/audit-log
 * Immutable audit trail of recent curations
 */
router.get('/audit-log', async (req, res) => {
    try {
        const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
        const result = await db.query(`
            SELECT c.*, p.pc_description, p.action_directive
            FROM hil_video_curations c
            LEFT JOIN nsqf_pcs p ON c.pc_id = p.id
            ORDER BY c.created_at DESC
            LIMIT $1
        `, [limit]);

        return res.json({ success: true, count: result.rows.length, logs: result.rows });
    } catch (err) {
        console.error('[HIL Curator] Error loading audit log:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
