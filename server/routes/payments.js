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

async function createRazorpayOrder(amount, currency = 'INR') {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
        try {
            const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
            const res = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    currency: currency,
                    receipt: 'rcpt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
                })
            });
            const data = await res.json();
            if (data && data.id) {
                return data.id;
            }
            console.warn('[Razorpay API Warning]: Order creation API response:', data);
        } catch (err) {
            console.error('[Razorpay API Error]:', err.message);
        }
    }
    return 'order_' + Math.random().toString(36).substring(2, 11);
}

// POST /api/payments/create-order (Subscription Tiers)
router.post('/create-order', authenticateToken, async (req, res) => {
    try {
        const { planTier } = req.body; // 'professional' | 'enterprise'
        if (!['professional', 'enterprise'].includes(planTier)) {
            return res.status(400).json({ error: 'Invalid plan tier.' });
        }

        const prices = { professional: 499900, enterprise: 1499900 }; // in paise (INR)
        const orderId = await createRazorpayOrder(prices[planTier]);

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

// ASSET PRICING MAP (in INR)
const ASSET_PRICES = {
    'legalparam-2.9b.gguf': 499,
    'financeparam-2.9b.gguf': 499,
    'legal_agents.vlt': 399,
    'finance_agents.vlt': 399,
    'coding_agents.vlt': 399,
    'laws_vault.zip': 199,
    'cases_vault.zip': 299,
    'documents_vault.zip': 199,
    'forms_vault.zip': 199
};

// POST /api/payments/create-component-order (Dynamic A La Carte Purchase)
router.post('/create-component-order', authenticateToken, async (req, res) => {
    try {
        const { assetId } = req.body;
        if (!assetId) {
            return res.status(400).json({ error: 'Asset ID is required.' });
        }

        const itemPriceInr = ASSET_PRICES[assetId] || 199;
        const amountPaise = itemPriceInr * 100; // in paise
        const orderId = await createRazorpayOrder(amountPaise);

        res.json({
            success: true,
            orderId,
            amount: amountPaise,
            priceInr: itemPriceInr,
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
        const itemPriceInr = ASSET_PRICES[assetId] || 199;
        const amountPaise = itemPriceInr * 100;

        // Record purchase
        await db.prepare(`
            INSERT INTO user_purchases (user_id, asset_id, amount, currency, transaction_id)
            VALUES (?, ?, ?, 'INR', ?)
        `).run(userId, assetId, amountPaise, txnId);

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

// GET /api/payments/history (Fetch combined user transaction history)
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch subscription payments
        const subs = await db.prepare(`
            SELECT id, tier, status, payment_provider, transaction_id, updated_at AS created_at
            FROM subscriptions
            WHERE user_id = ?
            ORDER BY id DESC
        `).all(userId);

        // Fetch component / asset purchases
        const purchases = await db.prepare(`
            SELECT id, asset_id, amount, currency, transaction_id, purchased_at AS created_at
            FROM user_purchases
            WHERE user_id = ?
            ORDER BY id DESC
        `).all(userId);

        const subPrices = { professional: 4999, enterprise: 14999 };

        const history = [];

        if (subs && subs.length > 0) {
            subs.forEach(s => {
                const tierName = (s.tier || 'starter').toUpperCase();
                history.push({
                    id: 'sub_' + s.id,
                    item: `Subscription Upgrade (${tierName} Tier)`,
                    amount: subPrices[s.tier] || 0,
                    currency: 'INR',
                    provider: s.payment_provider || 'Razorpay',
                    transactionId: s.transaction_id || 'N/A',
                    status: s.status === 'active' ? 'Success' : s.status,
                    date: s.created_at
                });
            });
        }

        if (purchases && purchases.length > 0) {
            purchases.forEach(p => {
                history.push({
                    id: 'pur_' + p.id,
                    item: `Asset Unlock (${p.asset_id})`,
                    amount: Math.round(p.amount / 100),
                    currency: p.currency || 'INR',
                    provider: 'Razorpay',
                    transactionId: p.transaction_id || 'N/A',
                    status: 'Success',
                    date: p.created_at
                });
            });
        }

        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            history
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;


