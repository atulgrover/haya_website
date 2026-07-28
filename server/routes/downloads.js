'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

const CATALOG = [
    { id: 'legal_agents.vlt', name: 'Legal Agents Pack', type: 'vault', tier: 'starter', description: '21 legal & insolvency subagents.' },
    { id: 'finance_agents.vlt', name: 'Finance Agents Pack', type: 'vault', tier: 'starter', description: 'Forensic audit and financial analysis subagents.' },
    { id: 'coding_agents.vlt', name: 'Coding Agents Pack', type: 'vault', tier: 'starter', description: 'IDE extension development subagents.' },
    { id: 'legalparam-2.9b', name: 'LegalParam 2.9B LLM', type: 'model', tier: 'starter', sizeGb: 1.7, description: 'Bundled starter LLM for Indian legal domain.' },
    { id: 'financeparam-2.9b', name: 'FinanceParam 2.9B LLM', type: 'model', tier: 'starter', sizeGb: 1.7, description: 'Bundled starter LLM for Indian financial domain.' },
    { id: 'hayaparam-7b', name: 'HayaParam 7B LLM', type: 'model', tier: 'professional', sizeGb: 4.7, description: 'Fine-tuned on Indian legal & financial corpus (24K context).' },
    { id: 'hayaparam-14b', name: 'HayaParam 14B LLM', type: 'model', tier: 'enterprise', sizeGb: 8.5, description: 'Full document resolution plan analysis (64K context).' }
];

// GET /api/downloads/catalog
router.get('/catalog', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const sub = db.prepare('SELECT tier FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
        const userTier = sub ? sub.tier : 'starter';

        const items = CATALOG.map(item => {
            const isAccessible = item.tier === 'starter' || 
                                (item.tier === 'professional' && ['professional', 'enterprise'].includes(userTier)) ||
                                (item.tier === 'enterprise' && userTier === 'enterprise');
            return {
                ...item,
                accessible: isAccessible,
                downloadUrl: isAccessible ? `/api/downloads/file/${item.id}` : null
            };
        });

        res.json({ userTier, items });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/downloads/file/:assetId
router.get('/file/:assetId', authenticateToken, (req, res) => {
    try {
        const { assetId } = req.params;
        const userId = req.user.userId;

        // Log download
        db.prepare(`
            INSERT INTO download_logs (user_id, asset_id, ip_address)
            VALUES (?, ?, ?)
        `).run(userId, assetId, req.ip || '127.0.0.1');

        res.json({
            success: true,
            assetId,
            message: `Asset ${assetId} package ready for installation in Hayagriva Settings.`
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
