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

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName, firmName, ipRegistrationNo, role, companyId } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Full name, email, and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const userRole = role && ['student', 'employee', 'employer', 'professional', 'admin'].includes(role) ? role : 'student';
        const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
        if (existing) {
            return res.status(400).json({ error: 'An account with this email address already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const result = await db.prepare(`
            INSERT INTO users (email, password_hash, full_name, firm_name, ip_registration_no, role, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(normalizedEmail, password_hash, fullName.trim(), firmName ? firmName.trim() : null, ipRegistrationNo ? ipRegistrationNo.trim() : null, userRole, companyId ? companyId.trim() : null);

        const userId = result.lastInsertRowid;

        // Create default starter subscription
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const expiresAtStr = expiresAt.toISOString();

        await db.prepare(`
            INSERT INTO subscriptions (user_id, tier, status, expires_at, payment_provider)
            VALUES (?, 'starter', 'active', ?, 'free_registration')
        `).run(userId, expiresAtStr);

        // Generate default master license key
        const randomHex = require('crypto').randomBytes(12).toString('hex').toUpperCase();
        const licenseKey = `HAYA-STARTER-${randomHex.slice(0,4)}-${randomHex.slice(4,8)}-${randomHex.slice(8,12)}`;

        await db.prepare(`
            INSERT INTO licenses (user_id, tier, license_key, expires_at)
            VALUES (?, 'starter', ?, ?)
        `).run(userId, licenseKey, expiresAtStr);

        const token = jwt.sign({ userId, email: normalizedEmail, role: userRole, companyId }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { id: userId, email: normalizedEmail, fullName: fullName.trim(), role: userRole, companyId, tier: 'starter' }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
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
        const userRole = user.role || 'student';

        const token = jwt.sign({ userId: user.id, email: user.email, role: userRole, companyId: user.company_id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                firmName: user.firm_name,
                role: userRole,
                companyId: user.company_id,
                tier
            }
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
