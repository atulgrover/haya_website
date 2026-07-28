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
        const { email, password, fullName, firmName, ipRegistrationNo } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
        if (existing) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = db.prepare(`
            INSERT INTO users (email, password_hash, full_name, firm_name, ip_registration_no)
            VALUES (?, ?, ?, ?, ?)
        `).run(email.toLowerCase(), passwordHash, fullName, firmName || null, ipRegistrationNo || null);

        // Auto-create starter subscription
        db.prepare(`
            INSERT INTO subscriptions (user_id, tier, status)
            VALUES (?, 'starter', 'active')
        `).run(result.lastInsertRowid);

        const token = jwt.sign({ userId: result.lastInsertRowid, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { id: result.lastInsertRowid, email: email.toLowerCase(), fullName, tier: 'starter' }
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

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const sub = db.prepare('SELECT tier FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(user.id);
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
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, email, full_name, firm_name, ip_registration_no, created_at FROM users WHERE id = ?').get(req.user.userId);
        if (!user) return res.status(444).json({ error: 'User not found' });

        const sub = db.prepare('SELECT tier, status, expires_at FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(user.id);
        const activeLicense = db.prepare('SELECT license_key, tier, expires_at FROM licenses WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(user.id);

        res.json({
            user,
            subscription: sub || { tier: 'starter', status: 'active' },
            activeLicense: activeLicense || null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = { router, authenticateToken };
