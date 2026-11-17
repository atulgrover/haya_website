'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');

const wikiRouter = require('./routes/wiki');
const ipieRouter = require('./routes/ipie');
const skillpediaRouter = require('./routes/skillpedia');
const searchVideoRouter = require('./routes/searchVideo');
const aiExplainerRouter = require('./routes/aiExplainer');
const curatorRouter = require('./routes/curator');
const patentsRouter = require('./routes/patents');
const personalitiesRouter = require('./routes/personalities');
const agentSkillsRouter = require('./routes/agentSkills');

const app = express();
const PORT = process.env.PORT || 8080;
const GARUDA_AUTH_URL = process.env.GARUDA_AUTH_URL || 'http://localhost:3300/auth/login?app=varaha';

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend portal files
app.use(express.static(path.join(__dirname, '..')));

// Sovereign Skilling & Content APIs
app.use('/api/wiki', wikiRouter);
app.use('/api/ipie', ipieRouter);
app.use('/api/skillpedia', skillpediaRouter);
app.use('/api/search-video', searchVideoRouter);
app.use('/api/ai', aiExplainerRouter);
app.use('/api/curator', curatorRouter);
app.use('/api/patents', patentsRouter);
app.use('/api/personalities', personalitiesRouter);
app.use('/api/skillpedia', agentSkillsRouter);

// Delegated Auth & Dashboard redirects (Migrated to Garuda)
app.get(['/dashboard', '/dashboard.html'], (req, res) => {
    res.redirect(GARUDA_AUTH_URL);
});

app.get(['/login', '/login.html', '/signup', '/signup.html'], (req, res) => {
    res.redirect(GARUDA_AUTH_URL);
});

// Clean Track Routes (Single-word aliases for all federated tracks)
app.get(['/employees', '/employees.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../employees_nsqf.html'));
});

app.get(['/employers', '/employers.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../employers_sop.html'));
});

app.get(['/entrepreneurs', '/entrepreneurs.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../entrepreneurs_msme.html'));
});

app.get(['/reports', '/reports.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../personalities_vedic.html'));
});

// Direct Route Endpoints
app.get('/personalities', (req, res) => {
    res.sendFile(path.join(__dirname, '../personalities.html'));
});

app.get('/compendium', (req, res) => {
    res.sendFile(path.join(__dirname, '../compendium.html'));
});

app.get('/HPTI_Compendium', (req, res) => {
    res.redirect('/compendium');
});

// Legal & Policy Direct Route Endpoints
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '../privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../terms.html'));
});

// Legacy reel.html redirect to structured NSQF employee portal
app.get('/reel.html', (req, res) => {
    const qp = req.query.qp;
    if (qp) {
        return res.redirect(`/employees_nsqf.html?qp=${encodeURIComponent(qp)}`);
    }
    res.redirect('/employees_nsqf.html');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'VARAHA Sovereign Skilling Portal',
        role: 'VOCATIONAL_LEARNING',
        garudaAuthUrl: GARUDA_AUTH_URL,
        timestamp: new Date().toISOString()
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🐗 VARAHA Sovereign Skilling Portal running at http://localhost:${PORT}`);
        console.log(`=======================================================`);
    });
}

module.exports = app;
