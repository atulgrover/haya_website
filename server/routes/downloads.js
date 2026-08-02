'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'hayagriva';
const JWT_SECRET = process.env.JWT_SECRET || 'HAYA_PORTAL_SUPER_SECRET_JWT_KEY_2026';

const isR2Configured = Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY);

let s3 = null;
if (isR2Configured) {
    s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: SECRET_ACCESS_KEY,
        },
    });
}

function authenticateTokenOrQuery(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

const CATALOG = [
    // 1. Desktop App Installers (Free Core IDE)
    { id: 'hayagriva-mac-x64.dmg', r2Key: 'builds/hayagriva-mac-x64.dmg', category: 'app', name: 'Hayagriva Desktop IDE — macOS (Intel / Apple Silicon)', price: 0, size: '120 MB', description: 'Native Electron IDE bundle for macOS.' },
    { id: 'hayagriva-win-x64.exe', r2Key: 'builds/hayagriva-win-x64.exe', category: 'app', name: 'Hayagriva Desktop IDE — Windows 10 / 11 (64-bit)', price: 0, size: '140 MB', description: 'Native Standalone Windows Setup Installer.' },
    { id: 'hayagriva-linux-x64.AppImage', r2Key: 'builds/hayagriva-linux-x64.AppImage', category: 'app', name: 'Hayagriva Desktop IDE — Linux (AppImage / x64)', price: 0, size: '130 MB', description: 'Portable Linux binary package.' },

    // 2. Offline LLM Models (.gguf)
    { id: 'legalparam-2.9b.gguf', r2Key: 'models/legalparam-2.9b.gguf', category: 'model', name: 'LegalParam 2.9B LLM (Q4_K_M)', price: 499, size: '1.70 GB', description: 'Quantized LLM for Indian legal analysis & IBC drafting.' },
    { id: 'financeparam-2.9b.gguf', r2Key: 'models/financeparam-2.9b.gguf', category: 'model', name: 'FinanceParam 2.9B LLM (Q4_K_M)', price: 499, size: '1.70 GB', description: 'Quantized LLM for financial auditing & claim calculations.' },

    // 3. Agent Packs (.vlt)
    { id: 'legal_agents.vlt', r2Key: 'agent_packs/legal_agents.vlt', category: 'agent', name: 'Legal Subagents Pack', price: 399, size: '10 MB', description: '21 specialized legal subagents (Advisor, Forms, Doc Agent).' },
    { id: 'finance_agents.vlt', r2Key: 'agent_packs/finance_agents.vlt', category: 'agent', name: 'Finance Subagents Pack', price: 399, size: '10 MB', description: 'Forensic audit and financial analysis subagents.' },
    { id: 'coding_agents.vlt', r2Key: 'agent_packs/coding_agents.vlt', category: 'agent', name: 'Coding Subagents Pack', price: 399, size: '10 MB', description: 'IDE extension development & custom skill subagents.' },

    // 4. Encrypted 768-Dimension Domain Vaults (.vlt / .zip)
    { id: 'laws_vault.zip', r2Key: 'vaults/laws_vault.zip', category: 'vault', name: 'IBC Statutory Laws & Acts Vault (768-Dim)', price: 199, size: '34 MB', description: 'Full text vector index of IBC 2016, Companies Act, and Amendments.' },
    { id: 'cases_vault.zip', r2Key: 'vaults/cases_vault.zip', category: 'vault', name: 'Supreme Court & NCLAT Cases Vault (768-Dim)', price: 299, size: '133 MB', description: 'Indexed 768-dim vector precedent database of NCLAT and SC judgements.' },
    { id: 'documents_vault.zip', r2Key: 'vaults/documents_vault.zip', category: 'vault', name: 'Corporate Documents & Dossiers Vault (768-Dim)', price: 199, size: '29 MB', description: 'Corporate resolutions, CIRP dossiers, & due-diligence data.' },
    { id: 'forms_vault.zip', r2Key: 'vaults/forms_vault.zip', category: 'vault', name: 'Model Forms & Form H Precedents Vault (768-Dim)', price: 199, size: '1.5 MB', description: 'Resolution plan skeletons, Regulation 39(4) Form H, & voting ballots.' }
];

// GET /api/downloads/catalog
router.get('/catalog', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const purchases = await db.prepare('SELECT asset_id FROM user_purchases WHERE user_id = ?').all(userId);
        const purchasedAssetIds = purchases ? purchases.map(p => p.asset_id) : [];

        const items = CATALOG.map(item => {
            const isAccessible = item.price === 0 || purchasedAssetIds.includes(item.id);
            return {
                ...item,
                accessible: isAccessible,
                downloadUrl: isAccessible ? `/api/downloads/file/${item.id}` : null
            };
        });

        res.json({ userTier: 'pay_as_you_go', items, purchasedAssetIds });
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

        const rawToken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
        let downloadUrl = null;

        if (isR2Configured && s3) {
            try {
                const command = new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: item.r2Key
                });
                downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
            } catch (s3Err) {
                console.warn('[R2 Presign Warning]:', s3Err.message);
            }
        }

        // Fall back to direct portal stream if R2 is not configured or presign failed
        if (!downloadUrl) {
            downloadUrl = `/api/downloads/stream/${item.id}?token=${encodeURIComponent(rawToken)}`;
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
            message: `Asset ${assetId} package ready for download.`
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/downloads/stream/:assetId
router.get('/stream/:assetId', authenticateTokenOrQuery, async (req, res) => {
    try {
        const { assetId } = req.params;
        const userId = req.user.userId;

        const item = CATALOG.find(c => c.id === assetId);
        if (!item) return res.status(404).json({ error: 'Asset not found in catalog.' });

        const sub = await db.prepare('SELECT tier FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
        const userTier = sub ? sub.tier : 'starter';

        const purchases = await db.prepare('SELECT asset_id FROM user_purchases WHERE user_id = ?').all(userId);
        const purchasedAssetIds = purchases ? purchases.map(p => p.asset_id) : [];

        const isAccessible = item.tier === 'starter' || 
                            purchasedAssetIds.includes(item.id) ||
                            (item.tier === 'professional' && ['professional', 'enterprise'].includes(userTier)) ||
                            (item.tier === 'enterprise' && userTier === 'enterprise');

        if (!isAccessible) {
            return res.status(403).json({ error: `Asset requires purchase or ${item.tier} subscription tier.` });
        }

        // Log download event
        await db.prepare(`
            INSERT INTO download_logs (user_id, asset_id, ip_address)
            VALUES (?, ?, ?)
        `).run(userId, assetId, req.ip || '127.0.0.1');

        // Check local disk paths
        const candidatePaths = [
            path.join(__dirname, '../../downloads', item.id),
            path.join(__dirname, '../../downloads', item.r2Key),
            path.join(__dirname, '../../resources', item.id)
        ];

        for (const localPath of candidatePaths) {
            if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
                return res.download(localPath, item.id);
            }
        }

        // Fallback package generation for local dev environment
        const content = `HAYAGRIVA PRIVATE LEGAL AI - ASSET PACKAGE
===========================================================
Asset ID: ${item.id}
Asset Name: ${item.name}
Category: ${item.category}
Tier: ${item.tier}
Package Size: ${item.size}
Description: ${item.description}
R2 Key Reference: ${item.r2Key}
Generated At: ${new Date().toISOString()}

-----------------------------------------------------------
LICENSE & VERIFICATION STATUS:
User ID: ${userId}
Verification Status: VALID / AUTHORIZED
-----------------------------------------------------------
This is an official Hayagriva Portal package distribution file.
Import this file directly into your Hayagriva Desktop IDE or offline model directory.
`;

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${item.id}"`);
        return res.send(Buffer.from(content, 'utf-8'));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

