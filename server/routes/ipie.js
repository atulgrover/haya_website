'use strict';

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

// In-memory storage for user completed iPIE simulation stages
const userStageCompletions = new Map(); // userId -> Set of stageIds

/**
 * POST /api/ipie/submit-payload
 * Accepts IDE output payload file data or JSON envelope and awards stage completion.
 */
router.post('/submit-payload', authenticateToken, express.json({ limit: '10mb' }), (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user.email : 'demo-user';
        const { payloadText, filename } = req.body || {};

        if (!payloadText && !req.body) {
            return res.status(400).json({ success: false, error: 'No payload content provided.' });
        }

        const contentStr = typeof payloadText === 'string' ? payloadText : JSON.stringify(req.body);
        const contentLower = contentStr.toLowerCase();
        let stageId = 1; // Default to Commencement

        // Detect stage based on content indicators
        if (contentLower.includes('form h') || contentLower.includes('resolution plan') || contentLower.includes('30(2)')) {
            stageId = 5;
        } else if (contentLower.includes('coc') || contentLower.includes('voting share') || contentLower.includes('5(24)')) {
            stageId = 3;
        } else if (contentLower.includes('pufe') || contentLower.includes('avoidance') || contentLower.includes('section 43')) {
            stageId = 4;
        } else if (contentLower.includes('claim') || contentLower.includes('form b') || contentLower.includes('form c')) {
            stageId = 2;
        } else if (contentLower.includes('monitoring committee') || contentLower.includes('tranche')) {
            stageId = 6;
        } else if (contentLower.includes('waterfall') || contentLower.includes('section 53') || contentLower.includes('liquidation')) {
            stageId = 7;
        } else if (contentLower.includes('ibbi') || contentLower.includes('cirp-1') || contentLower.includes('xbrl')) {
            stageId = 8;
        } else if (contentLower.includes('nclt') || contentLower.includes('interlocutory') || contentLower.includes('ia tracker')) {
            stageId = 9;
        } else if (contentLower.includes('cost') || contentLower.includes('cirp-4') || contentLower.includes('expense')) {
            stageId = 10;
        } else if (contentLower.includes('timeline') || contentLower.includes('commencement') || contentLower.includes('form a')) {
            stageId = 1;
        }

        if (!userStageCompletions.has(userId)) {
            userStageCompletions.set(userId, new Set());
        }

        const userStages = userStageCompletions.get(userId);
        userStages.add(stageId);

        const STAGE_NAMES = {
            1: 'Commencement',
            2: 'Claims Collation',
            3: 'CoC Constitution',
            4: 'Records & VDR',
            5: 'Resolution Plan & Form H',
            6: 'Implementation & Monitoring',
            7: 'Liquidation & Estate',
            8: 'Compliance Management',
            9: 'Litigation Management',
            10: 'Finance & Cost Management'
        };

        return res.json({
            success: true,
            stageId,
            stageName: STAGE_NAMES[stageId],
            completedCount: userStages.size,
            message: `Verified Stage ${stageId} (${STAGE_NAMES[stageId]}) output payload! Awarded iPIE milestone.`
        });
    } catch (e) {
        console.error('[iPIE Router] Error processing payload upload:', e);
        return res.status(500).json({ success: false, error: 'Internal server error processing payload.' });
    }
});

module.exports = router;
