'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'HAYA_PORTAL_SUPER_SECRET_JWT_KEY_2026';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// POST /api/auth/signup (DISABLED)
router.post('/signup', async (req, res) => {
    return res.status(403).json({ error: 'New user registration is disabled. Only existing accounts can log in.' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const sub = await db.prepare('SELECT tier FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(user.id);
        const tier = sub ? sub.tier : 'starter';

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, fullName: user.full_name, firmName: user.firm_name, tier }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.prepare('SELECT id, email, full_name, firm_name, ip_registration_no, created_at FROM users WHERE id = ?').get(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const sub = await db.prepare('SELECT tier, status, expires_at FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(user.id);
        const activeLicense = await db.prepare('SELECT license_key, tier, expires_at FROM licenses WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(user.id);

        res.json({
            user,
            subscription: sub || { tier: 'starter', status: 'active' },
            activeLicense: activeLicense || null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, firmName, ipRegistrationNo } = req.body;
        if (!fullName || fullName.trim() === '') {
            return res.status(400).json({ error: 'Full name is required.' });
        }

        await db.prepare('UPDATE users SET full_name = ?, firm_name = ?, ip_registration_no = ? WHERE id = ?')
            .run(fullName.trim(), firmName ? firmName.trim() : null, ipRegistrationNo ? ipRegistrationNo.trim() : null, req.user.userId);

        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
        }

        const user = await db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid) {
            return res.status(400).json({ error: 'Incorrect current password.' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.userId);

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/auth/payment-methods
router.get('/payment-methods', authenticateToken, async (req, res) => {
    try {
        const cards = await db.prepare('SELECT id, card_holder, card_last4, card_brand, exp_month, exp_year, is_default, created_at FROM user_payment_methods WHERE user_id = ? ORDER BY id DESC').all(req.user.userId);
        res.json({ success: true, paymentMethods: cards || [] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/payment-methods
router.post('/payment-methods', authenticateToken, async (req, res) => {
    try {
        const { cardHolder, cardNumber, expMonth, expYear, isDefault } = req.body;
        if (!cardHolder || !cardNumber || !expMonth || !expYear) {
            return res.status(400).json({ error: 'Cardholder name, card number, and expiry date are required.' });
        }

        const cleanedNum = cardNumber.replace(/\s+/g, '');
        if (cleanedNum.length < 13 || !/^\d+$/.test(cleanedNum)) {
            return res.status(400).json({ error: 'Invalid card number.' });
        }

        const last4 = cleanedNum.slice(-4);
        let brand = 'Visa';
        if (cleanedNum.startsWith('5')) brand = 'Mastercard';
        else if (cleanedNum.startsWith('3')) brand = 'American Express';
        else if (cleanedNum.startsWith('6')) brand = 'Discover';
        else if (cleanedNum.startsWith('4')) brand = 'Visa';

        const result = await db.prepare(
            'INSERT INTO user_payment_methods (user_id, card_holder, card_last4, card_brand, exp_month, exp_year, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.userId, cardHolder.trim(), last4, brand, expMonth.trim(), expYear.trim(), isDefault ? 1 : 0);

        res.json({ success: true, message: 'Card added successfully.', cardId: result.lastInsertRowid });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/auth/payment-methods/:id
router.delete('/payment-methods/:id', authenticateToken, async (req, res) => {
    try {
        const cardId = req.params.id;
        await db.prepare('DELETE FROM user_payment_methods WHERE id = ? AND user_id = ?').run(cardId, req.user.userId);
        res.json({ success: true, message: 'Payment method removed.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = { router, authenticateToken };
