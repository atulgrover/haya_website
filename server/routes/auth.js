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

module.exports = { router, authenticateToken };
