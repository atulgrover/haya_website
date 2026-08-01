'use strict';

const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { generateLicenseKey } = require('../utils/license-signer');
const { authenticateToken } = require('./auth');

const router = express.Router();

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
    if (!secret || !signature) return true;
    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(orderId + '|' + paymentId)
        .digest('hex');
    return generatedSignature === signature;
}

// POST /api/payments/create-order (Subscription Tiers)
router.post('/create-order', authenticateToken, async (req, res) => {
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
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TKPNXAjeiDn6AB',
            planTier
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/payments/verify (Subscription Tiers)
router.post('/verify', authenticateToken, async (req, res) => {
    try {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, planTier } = req.body;
        const userId = req.user.userId;

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (secret && razorpaySignature && razorpayOrderId) {
            const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, secret);
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid Razorpay payment signature.' });
            }
        }

        // Upgrade subscription
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const expiresAtStr = expiryDate.toISOString().split('T')[0];

        await db.prepare(`
            INSERT INTO subscriptions (user_id, tier, status, expires_at, payment_provider, transaction_id)
            VALUES (?, ?, 'active', ?, 'razorpay', ?)
        `).run(userId, planTier, expiresAtStr, razorpayPaymentId || razorpayOrderId);

        // Fetch purchased assets to include in license key
        const user = await db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
        const purchases = await db.prepare('SELECT asset_id FROM user_purchases WHERE user_id = ?').all(userId);
        const purchasedAssets = purchases ? purchases.map(p => p.asset_id) : [];

        const payload = {
            sub: user.email,
            tier: planTier,
            allowedDomains: ['legal', 'finance'],
            purchasedAssets: purchasedAssets,
            expiresAt: expiresAtStr,
            gracePeriodDays: 30
        };

        const licenseKey = generateLicenseKey(payload);

        await db.prepare(`
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

// POST /api/payments/create-component-order (Individual ₹1 Component Purchase)
router.post('/create-component-order', authenticateToken, async (req, res) => {
    try {
        const { assetId } = req.body;
        if (!assetId) {
            return res.status(400).json({ error: 'Asset ID is required.' });
        }

        const orderId = 'ord_' + Math.random().toString(36).substring(2, 11);
        const amount = 100; // ₹1 in paise

        res.json({
            success: true,
            orderId,
            amount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TKPNXAjeiDn6AB',
            assetId
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/payments/verify-component-payment (Verify ₹1 Purchase & Unlock Download + License Key)
router.post('/verify-component-payment', authenticateToken, async (req, res) => {
    try {
        const { assetId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
        const userId = req.user.userId;

        if (!assetId) return res.status(400).json({ error: 'Asset ID is required.' });

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (secret && razorpaySignature && razorpayOrderId) {
            const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, secret);
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid Razorpay payment signature.' });
            }
        }

        const txnId = razorpayPaymentId || razorpayOrderId || ('pay_sim_' + Date.now());

        // Record purchase
        await db.prepare(`
            INSERT INTO user_purchases (user_id, asset_id, amount, currency, transaction_id)
            VALUES (?, ?, 100, 'INR', ?)
        `).run(userId, assetId, txnId);

        // Fetch user data & purchased assets for master license regeneration
        const user = await db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
        const sub = await db.prepare('SELECT tier FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
        const purchases = await db.prepare('SELECT asset_id FROM user_purchases WHERE user_id = ?').all(userId);
        const purchasedAssets = purchases ? purchases.map(p => p.asset_id) : [];

        const tier = sub ? sub.tier : 'starter';

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const expiresAtStr = expiryDate.toISOString().split('T')[0];

        const payload = {
            sub: user.email,
            tier: tier,
            allowedDomains: ['legal', 'finance'],
            purchasedAssets: purchasedAssets,
            expiresAt: expiresAtStr,
            gracePeriodDays: 30
        };

        const licenseKey = generateLicenseKey(payload);

        await db.prepare(`
            INSERT INTO licenses (user_id, tier, license_key, expires_at)
            VALUES (?, ?, ?, ?)
        `).run(userId, tier, licenseKey, expiresAtStr);

        res.json({
            success: true,
            message: `Payment successful! Unlocked ${assetId} for ₹1.`,
            assetId,
            licenseKey,
            purchasedAssets
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

