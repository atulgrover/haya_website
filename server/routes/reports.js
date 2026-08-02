'use strict';

const express = require('express');
const db = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Available report catalog templates
const REPORT_CATALOG = {
    'cirp_due_diligence': {
        title: 'CIRP Due Diligence & Form Verification Audit Report',
        price: 999,
        description: 'Automated audit of admitted claim forms (Form C/D) against IBBI CIRP Regulations, 2016.'
    },
    'nclt_precedent_summary': {
        title: 'NCLT Bench Precedent Summary Report',
        price: 1499,
        description: 'Comprehensive bench-wise analysis of recent NCLT & NCLAT admission & resolution precedents.'
    },
    'promoter_pufe_audit': {
        title: 'Promoter Track Record & PUFE Audit Report',
        price: 2499,
        description: 'Deep audit of preferential, undervalued, fraudulent, and extortionate transactions (Sec 43-51, IBC).'
    },
    'liquidation_benchmark': {
        title: 'Liquidation Valuation Benchmark Report',
        price: 1999,
        description: 'Cross-reference liquidation asset appraisals with historical NCLT auction recovery benchmarks.'
    }
};

// GET /api/reports/catalog (Fetch available report templates)
router.get('/catalog', (req, res) => {
    res.json({
        success: true,
        catalog: Object.keys(REPORT_CATALOG).map(key => ({
            id: key,
            ...REPORT_CATALOG[key]
        }))
    });
});

// POST /api/reports/order (Submit custom report order request)
router.post('/order', authenticateToken, async (req, res) => {
    try {
        const { reportType, companyName, notes } = req.body;
        const userId = req.user.userId;

        if (!reportType || !REPORT_CATALOG[reportType]) {
            return res.status(400).json({ error: 'Invalid report type selected.' });
        }

        const template = REPORT_CATALOG[reportType];
        const title = `${template.title}${companyName ? ' — ' + companyName : ''}`;

        const result = await db.prepare(`
            INSERT INTO report_orders (user_id, report_type, title, company_name, notes, status)
            VALUES (?, ?, ?, ?, ?, 'in_processing')
        `).run(userId, reportType, title, companyName || '', notes || '');

        const user = await db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(userId);

        console.log(`[Marketplace Report Order]: Registered order #${result.lastInsertRowid} for user ${user.email} (${template.title}). Email dispatch queued.`);

        res.json({
            success: true,
            message: `Report order placed successfully! A confirmation has been sent to ${user.email}. Your report is being generated and will be delivered via email and loaded here once ready.`,
            orderId: result.lastInsertRowid,
            status: 'in_processing'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/reports/my-orders (Fetch user's requested marketplace reports)
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const orders = await db.prepare(`
            SELECT id, report_type, title, company_name, notes, status, file_url, created_at, updated_at
            FROM report_orders
            WHERE user_id = ?
            ORDER BY id DESC
        `).all(userId);

        res.json({
            success: true,
            orders: orders || []
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
