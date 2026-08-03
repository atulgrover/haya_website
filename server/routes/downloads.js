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
    // 1. Desktop App Installers (Free Core IDE + Pre-bundled InLegal-SBERT & Starter Kit)
    { id: 'hayagriva-mac-x64.dmg', r2Key: 'builds/hayagriva-mac-x64.dmg', category: 'app', name: 'Hayagriva Desktop IDE — macOS (Intel / Apple Silicon)', price: 0, size: '120 MB', description: 'Native Electron IDE bundle with pre-bundled InLegal-SBERT & Starter Demo Pack.' },
    { id: 'hayagriva-win-x64.exe', r2Key: 'builds/hayagriva-win-x64.exe', category: 'app', name: 'Hayagriva Desktop IDE — Windows 10 / 11 (64-bit)', price: 0, size: '140 MB', description: 'Native Standalone Windows Setup Installer with pre-bundled InLegal-SBERT & Starter Kit.' },
    { id: 'hayagriva-linux-x64.AppImage', r2Key: 'builds/hayagriva-linux-x64.AppImage', category: 'app', name: 'Hayagriva Desktop IDE — Linux (AppImage / x64)', price: 0, size: '130 MB', description: 'Portable Linux binary package with pre-bundled InLegal-SBERT & Starter Kit.' },

    // 2. Offline LLM AI Engines (.gguf)
    { id: 'legalparam-2.9b.gguf', r2Key: 'models/legalparam-2.9b.gguf', category: 'model', name: 'LegalParam 2.9B LLM (Q4_K_M)', price: 499, size: '1.70 GB', description: 'Quantized LLM fine-tuned on Indian law, IBC 2016, court precedents & legal drafting.' },
    { id: 'financeparam-2.9b.gguf', r2Key: 'models/financeparam-2.9b.gguf', category: 'model', name: 'FinanceParam 2.9B LLM (Q4_K_M)', price: 499, size: '1.70 GB', description: 'Quantized LLM fine-tuned on financial auditing, voting shares & CIRP claim calculations.' },
    { id: 'param-1-2.9b-instruct.gguf', r2Key: 'models/param-1-2.9b-instruct.gguf', category: 'model', name: 'Param-1 2.9B Instruct LLM (Q4_K_M)', price: 399, size: '1.70 GB', description: 'Quantized multilingual instruction LLM for general legal assistant & Hindi-English translation.' },

    // 3. Embedding Vector Engines (ONNX 768-Dim)
    { id: 'inlegal-sbert.onnx', r2Key: 'models/inlegal-sbert.onnx', category: 'model', name: 'InLegal-SBERT (768-Dim Default Canonical Embedder)', price: 0, size: '120 MB', description: 'Pre-bundled 768-dim vector engine for legal prose, case files, PDFs, & 14 Data Vaults.' },
    { id: 'finance-embeddings.onnx', r2Key: 'models/finance-embeddings.onnx', category: 'model', name: 'Finance-Embeddings (768-Dim Optional Tabular Embedder)', price: 199, size: '120 MB', description: 'Optional 768-dim tabular vector engine for raw numerical Excel ledgers & balance sheets.' },

    // 4. Agent Packs (.vlt)
    { id: 'legal_agents.vlt', r2Key: 'agent_packs/legal_agents.vlt', category: 'agent', name: 'Legal Subagents Pack (21 Specialists)', price: 399, size: '10 MB', description: '21 specialized subagents including @advisor, @document, @forms, @coc, @evaluator, @nclt, & @avoidance.' },
    { id: 'finance_agents.vlt', r2Key: 'agent_packs/finance_agents.vlt', category: 'agent', name: 'Finance Subagents Pack', price: 399, size: '10 MB', description: 'Forensic audit, bank reconciliation, claim admission, & financial analysis subagents.' },
    { id: 'coding_agents.vlt', r2Key: 'agent_packs/coding_agents.vlt', category: 'agent', name: 'Coding Subagents Pack', price: 399, size: '10 MB', description: 'IDE extension development, custom skill creation & debugger subagents.' },

    // 5. Encrypted 768-Dimension Domain Vaults (.vlt / .zip)
    { id: 'laws_vault_2026-W31.zip', r2Key: 'vaults/laws_vault_2026-W31.zip', category: 'vault', name: 'Statutory Laws & Regulations Vault (768-Dim)', price: 199, size: '35.2 MB', description: 'AES-256 encrypted vector index of IBC 2016, Companies Act 2013, Competition Act, & Rules.' },
    { id: 'cases_vault_2026-W31.zip', r2Key: 'vaults/cases_vault_2026-W31.zip', category: 'vault', name: 'Supreme Court & NCLAT Cases Vault (768-Dim)', price: 299, size: '139.3 MB', description: 'Indexed 768-dim vector precedent database of 37,978 NCLAT and Supreme Court judgements.' },
    { id: 'ibc_vaults.zip', r2Key: 'vaults/ibc_vaults.zip', category: 'vault', name: 'Insolvency & Bankruptcy Code Case Law Vault (768-Dim)', price: 249, size: '81.5 MB', description: 'Comprehensive case law database for NCLT, NCLAT, High Court, & Supreme Court IBC rulings.' },
    { id: 'general_vaults.zip', r2Key: 'vaults/general_vaults.zip', category: 'vault', name: 'High Court & Supreme Court General Jurisprudence Vault', price: 249, size: '73.0 MB', description: 'Full text vector index of civil, constitutional, & commercial law precedents.' },
    { id: 'acord_clauses_vault_2026-W32.zip', r2Key: 'vaults/acord_clauses_vault_2026-W32.zip', category: 'vault', name: 'ACORD Standard Clause Vault (126k Rated Clauses)', price: 299, size: '34.1 MB', description: '126,000+ attorney-rated contract clauses & M&A dealpoint benchmarks.' },
    { id: 'rera_vaults.zip', r2Key: 'vaults/rera_vaults.zip', category: 'vault', name: 'RERA Real Estate Regulation Act Vault (768-Dim)', price: 149, size: '8.8 MB', description: 'Real estate regulatory authority judgments, orders, & homebuyer precedence.' },
    { id: 'debt_recovery_vaults.zip', r2Key: 'vaults/debt_recovery_vaults.zip', category: 'vault', name: 'DRT & DRAT Debt Recovery Proceedings Vault', price: 149, size: '7.9 MB', description: 'Debt Recovery Tribunal rulings, SARFAESI Act precedents, & recovery proceedings.' },
    { id: 'documents_corporate_vault_2026-W31.zip', r2Key: 'vaults/documents_corporate_vault_2026-W31.zip', category: 'vault', name: 'Corporate Contracts & M&A Dealpoints Vault', price: 199, size: '6.1 MB', description: 'Commercial contracts, board resolutions, M&A agreements, & corporate compendiums.' },
    { id: 'documents_tax_conveyancing_vault_2026-W31.zip', r2Key: 'vaults/documents_tax_conveyancing_vault_2026-W31.zip', category: 'vault', name: 'Tax Appeals & Conveyancing Deeds Vault', price: 149, size: '5.0 MB', description: 'Tax appeal skeletons, property title conveyancing deeds, & lease agreements.' },
    { id: 'documents_pleadings_vault_2026-W31.zip', r2Key: 'vaults/documents_pleadings_vault_2026-W31.zip', category: 'vault', name: 'Petitions, Writs & Plaints Skeletons Vault', price: 199, size: '3.9 MB', description: 'Standard court petition skeletons, writ petitions, plaints, & written statements.' },
    { id: 'documents_ibc_vault_2026-W31.zip', r2Key: 'vaults/documents_ibc_vault_2026-W31.zip', category: 'vault', name: 'CIRP Petitions & Information Memorandum Vault', price: 199, size: '2.6 MB', description: 'Section 7/9/10 CIRP applications, Information Memorandum templates, & VDR dossiers.' },
    { id: 'forms_vault_2026-W31.zip', r2Key: 'vaults/forms_vault_2026-W31.zip', category: 'vault', name: 'Statutory IBBI & MCA Prescribed Forms Vault', price: 149, size: '1.5 MB', description: 'Statutory IBBI Forms (A-F), MCA filings, Regulation 39(4) Form H, & voting ballots.' },
    { id: 'arbitration_vaults.zip', r2Key: 'vaults/arbitration_vaults.zip', category: 'vault', name: 'Commercial Arbitration & Conciliation Vault', price: 149, size: '1.1 MB', description: 'Arbitration awards, Section 9/11/34 applications, & dispute resolution precedents.' },
    { id: 'cuad_benchmark.zip', r2Key: 'vaults/cuad_benchmark.zip', category: 'vault', name: 'CUAD & MAUD Contract Risk Benchmark Vault', price: 199, size: '18.0 MB', description: 'Atticus Project CUAD 510 contracts risk benchmark & MAUD 152 dealpoints index.' }
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

