'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'hayagriva';

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
});

const CATALOG = [
    // 1. Desktop App Installers
    { id: 'hayagriva-mac-x64.dmg', r2Key: 'builds/hayagriva-mac-x64.dmg', category: 'app', name: 'Hayagriva Desktop IDE — macOS (Intel / Apple Silicon)', tier: 'starter', size: '120 MB', description: 'Native Electron IDE bundle for macOS.' },
    { id: 'hayagriva-win-x64.exe', r2Key: 'builds/hayagriva-win-x64.exe', category: 'app', name: 'Hayagriva Desktop IDE — Windows 10 / 11 (64-bit)', tier: 'starter', size: '140 MB', description: 'Native Standalone Windows Setup Installer.' },
    { id: 'hayagriva-linux-x64.AppImage', r2Key: 'builds/hayagriva-linux-x64.AppImage', category: 'app', name: 'Hayagriva Desktop IDE — Linux (AppImage / x64)', tier: 'starter', size: '130 MB', description: 'Portable Linux binary package.' },

    // 2. LLM Models (.gguf)
    { id: 'legalparam-2.9b.gguf', r2Key: 'models/legalparam-2.9b.gguf', category: 'model', name: 'LegalParam 2.9B LLM (Q4_K_M)', tier: 'starter', size: '1.70 GB', description: 'Quantized LLM for Indian legal analysis & IBC drafting.' },
    { id: 'financeparam-2.9b.gguf', r2Key: 'models/financeparam-2.9b.gguf', category: 'model', name: 'FinanceParam 2.9B LLM (Q4_K_M)', tier: 'starter', size: '1.70 GB', description: 'Quantized LLM for financial auditing & claim calculations.' },

    // 3. Agent Packs (.vlt)
    { id: 'legal_agents.vlt', r2Key: 'agent_packs/legal_agents.vlt', category: 'agent', name: 'Legal Subagents Pack', tier: 'starter', size: '10 MB', description: '21 specialized legal subagents (Advisor, Forms, Doc Agent).' },
    { id: 'finance_agents.vlt', r2Key: 'agent_packs/finance_agents.vlt', category: 'agent', name: 'Finance Subagents Pack', tier: 'starter', size: '10 MB', description: 'Forensic audit and financial analysis subagents.' },
    { id: 'coding_agents.vlt', r2Key: 'agent_packs/coding_agents.vlt', category: 'agent', name: 'Coding Subagents Pack', tier: 'starter', size: '10 MB', description: 'IDE extension development & custom skill subagents.' },

    // 4. Encrypted 768-Dimension Domain Vaults (.vlt / .zip)
    { id: 'laws_vault.zip', r2Key: 'vaults/laws_vault.zip', category: 'vault', name: 'IBC Statutory Laws & Acts Vault (768-Dim)', tier: 'starter', size: '34 MB', description: 'Full text vector index of IBC 2016, Companies Act, and Amendments.' },
    { id: 'cases_vault.zip', r2Key: 'vaults/cases_vault.zip', category: 'vault', name: 'Supreme Court & NCLAT Cases Vault (768-Dim)', tier: 'starter', size: '133 MB', description: 'Indexed 768-dim vector precedent database of NCLAT and SC judgements.' },
    { id: 'documents_vault.zip', r2Key: 'vaults/documents_vault.zip', category: 'vault', name: 'Corporate Documents & Dossiers Vault (768-Dim)', tier: 'starter', size: '29 MB', description: 'Corporate resolutions, CIRP dossiers, & due-diligence data.' },
    { id: 'forms_vault.zip', r2Key: 'vaults/forms_vault.zip', category: 'vault', name: 'Model Forms & Form H Precedents Vault (768-Dim)', tier: 'starter', size: '1.5 MB', description: 'Resolution plan skeletons, Regulation 39(4) Form H, & voting ballots.' }
];

// GET /api/downloads/catalog
router.get('/catalog', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const sub = await db.prepare('SELECT tier FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
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
router.get('/file/:assetId', authenticateToken, async (req, res) => {
    try {
        const { assetId } = req.params;
        const userId = req.user.userId;

        const item = CATALOG.find(c => c.id === assetId);
        if (!item) return res.status(404).json({ error: 'Asset not found in catalog.' });

        // Generate 15-minute presigned download URL from Cloudflare R2
        let downloadUrl = null;
        try {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: item.r2Key
            });
            downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
        } catch (s3Err) {
            console.warn('[R2 Presign Warning]:', s3Err.message);
        }

        // Log download event
        await db.prepare(`
            INSERT INTO download_logs (user_id, asset_id, ip_address)
            VALUES (?, ?, ?)
        `).run(userId, assetId, req.ip || '127.0.0.1');

        res.json({
            success: true,
            assetId,
            downloadUrl,
            message: `Asset ${assetId} package ready for direct R2 download.`
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
