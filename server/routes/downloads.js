'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

const CATALOG = [
    // 1. Desktop App Installers
    { id: 'hayagriva-mac-x64.dmg', category: 'app', name: 'Hayagriva Desktop IDE — macOS (Intel / Apple Silicon)', tier: 'starter', size: '120 MB', description: 'Native Electron IDE bundle for macOS.' },
    { id: 'hayagriva-win-x64.exe', category: 'app', name: 'Hayagriva Desktop IDE — Windows 10 / 11 (64-bit)', tier: 'starter', size: '140 MB', description: 'Native Standalone Windows Setup Installer.' },
    { id: 'hayagriva-linux-x64.AppImage', category: 'app', name: 'Hayagriva Desktop IDE — Linux (AppImage / x64)', tier: 'starter', size: '130 MB', description: 'Portable Linux binary package.' },

    // 2. LLM Models (.gguf)
    { id: 'legalparam-2.9b.gguf', category: 'model', name: 'LegalParam 2.9B LLM (Q4_K_M)', tier: 'starter', size: '1.70 GB', description: 'Quantized LLM for Indian legal analysis & IBC drafting.' },
    { id: 'financeparam-2.9b.gguf', category: 'model', name: 'FinanceParam 2.9B LLM (Q4_K_M)', tier: 'starter', size: '1.70 GB', description: 'Quantized LLM for financial auditing & claim calculations.' },

    // 3. Agent Packs (.vlt)
    { id: 'legal_agents.vlt', category: 'agent', name: 'Legal Subagents Pack', tier: 'starter', size: '10 MB', description: '21 specialized legal subagents (Advisor, Forms, Doc Agent).' },
    { id: 'finance_agents.vlt', category: 'agent', name: 'Finance Subagents Pack', tier: 'starter', size: '10 MB', description: 'Forensic audit and financial analysis subagents.' },
    { id: 'coding_agents.vlt', category: 'agent', name: 'Coding Subagents Pack', tier: 'starter', size: '10 MB', description: 'IDE extension development & custom skill subagents.' },

    // 4. Domain Vaults (.vlt)
    { id: 'laws_vault.vlt', category: 'vault', name: 'IBC Statutory Laws & Acts Vault', tier: 'starter', size: '50 MB', description: 'Full text index of IBC 2016, Companies Act, and Amendments.' },
    { id: 'cases_vault.vlt', category: 'vault', name: 'Supreme Court & NCLAT Cases Vault', tier: 'starter', size: '350 MB', description: 'Indexed precedent database of NCLAT and SC judgements.' },
    { id: 'regulations_vault.vlt', category: 'vault', name: 'Statutory Regulations & Circulars Vault', tier: 'starter', size: '50 MB', description: 'IBBI Regulations, MCA notifications, and CIRP circulars.' },
    { id: 'precedents_vault.vlt', category: 'vault', name: 'Model Forms & Precedents Vault', tier: 'starter', size: '50 MB', description: 'Resolution plan skeletons, Form H compliance, & voting templates.' }
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
