'use strict';

const express = require('express');
const db = require('../db');
const { generateLicenseKey } = require('../utils/license-signer');
const { authenticateToken } = require('./auth');

const router = express.Router();

// POST /api/license/issue - Issue or re-issue license token for active user
router.post('/issue', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
        const sub = await db.prepare('SELECT tier FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);

        const tier = sub ? sub.tier : 'starter';

        // 1 Year validity from now
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const expiresAtStr = expiryDate.toISOString().split('T')[0];

        const payload = {
            sub: user.email,
            tier: tier,
            allowedDomains: ['legal', 'finance'],
            expiresAt: expiresAtStr,
            gracePeriodDays: 30
        };

        const licenseKey = generateLicenseKey(payload);

        // Save to licenses table
        await db.prepare(`
            INSERT INTO licenses (user_id, tier, license_key, expires_at)
            VALUES (?, ?, ?, ?)
        `).run(userId, tier, licenseKey, expiresAtStr);

        res.json({
            success: true,
            tier,
            licenseKey,
            expiresAt: expiresAtStr,
            licensedTo: user.email
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
