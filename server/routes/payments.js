'use strict';

const express = require('express');
const db = require('../db');
const { generateLicenseKey } = require('../utils/license-signer');
const { authenticateToken } = require('./auth');

const router = express.Router();

// POST /api/payments/create-order
router.post('/create-order', authenticateToken, (req, res) => {
    try {
        const { planTier } = req.body; // 'professional' | 'enterprise'
        if (!['professional', 'enterprise'].includes(planTier)) {
            return res.status(400).json({ error: 'Invalid plan tier.' });
        }

        const prices = { professional: 499900, enterprise: 1499900 }; // in paise (INR)
        const orderId = 'order_' + Math.random().toString(36).substring(2, 11);

        res.json({
            success: true,
            orderId,
            amount: prices[planTier],
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_HayaPortalDummyKey123',
            planTier
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/payments/verify
router.post('/verify', authenticateToken, (req, res) => {
    try {
        const { razorpayPaymentId, razorpayOrderId, planTier } = req.body;
        const userId = req.user.userId;

        // Upgrade subscription
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const expiresAtStr = expiryDate.toISOString().split('T')[0];

        db.prepare(`
            INSERT INTO subscriptions (user_id, tier, status, expires_at, payment_provider, transaction_id)
            VALUES (?, ?, 'active', ?, 'razorpay', ?)
        `).run(userId, planTier, expiresAtStr, razorpayPaymentId || razorpayOrderId);

        // Issue new Ed25519 License Key automatically
        const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
        const payload = {
            sub: user.email,
            tier: planTier,
            allowedDomains: ['legal', 'finance'],
            expiresAt: expiresAtStr,
            gracePeriodDays: 30
        };

        const licenseKey = generateLicenseKey(payload);

        db.prepare(`
            INSERT INTO licenses (user_id, tier, license_key, expires_at)
            VALUES (?, ?, ?, ?)
        `).run(userId, planTier, licenseKey, expiresAtStr);

        res.json({
            success: true,
            message: `Payment successful! Upgraded to ${planTier.toUpperCase()} tier.`,
            tier: planTier,
            licenseKey,
            expiresAt: expiresAtStr
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
