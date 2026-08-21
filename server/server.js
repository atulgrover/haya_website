'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const { router: authRouter } = require('./routes/auth');
const licenseRouter = require('./routes/license');
const downloadsRouter = require('./routes/downloads');
const paymentsRouter = require('./routes/payments');
const wikiRouter = require('./routes/wiki');
const reportsRouter = require('./routes/reports');
const ipieRouter = require('./routes/ipie');
const skillpediaRouter  = require('./routes/skillpedia');
const searchVideoRouter = require('./routes/searchVideo');
const aiExplainerRouter = require('./routes/aiExplainer');
const curatorRouter = require('./routes/curator');
const { ensureKeyPair } = require('./utils/license-signer');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure Ed25519 Key Pair exists on startup
ensureKeyPair();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend portal files
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/license', licenseRouter);
app.use('/api/downloads', downloadsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/wiki', wikiRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ipie', ipieRouter);
app.use('/api/skillpedia',    skillpediaRouter);
app.use('/api/search-video', searchVideoRouter);
app.use('/api/ai', aiExplainerRouter);
app.use('/api/curator', curatorRouter);

// Legal & Policy Direct Route Endpoints (https://hayagriva.app/privacy & https://hayagriva.app/terms)
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
    res.json({ status: 'ok', service: 'Haya Portal Server', timestamp: new Date().toISOString() });
});

// Self-Ping Keep-Alive (Prevents Render free tier auto-sleep)
if (process.env.RENDER_EXTERNAL_URL) {
    const PING_INTERVAL = 10 * 60 * 1000; // Ping every 10 mins (Render sleeps after 15 mins)
    setInterval(() => {
        const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
        fetch(pingUrl)
            .then(res => console.log(`[Keep-Alive Ping] Sent to ${pingUrl} -> HTTP ${res.status}`))
            .catch(err => console.warn(`[Keep-Alive Ping Warning] ${err.message}`));
    }, PING_INTERVAL);
}
const { auditQpVideos } = require('./services/reelCuratorAgent');
async function startBackgroundReelCuratorWorker() {
    try {
        const randomQps = await db.prepare(`
            SELECT qp_code FROM nsqf_qps 
            ORDER BY RANDOM() 
            LIMIT 3
        `).all();

        if (Array.isArray(randomQps) && randomQps.length > 0) {
            console.log(`🤖 [ReelCurator Worker] Running background AI audit for ${randomQps.length} QPs...`);
            for (const qp of randomQps) {
                await auditQpVideos(qp.qp_code, 70);
            }
        }
    } catch (err) {
        console.warn('[ReelCurator Worker Warning]:', err.message);
    }
}

// Run background ReelCurator Worker every 15 minutes
setInterval(startBackgroundReelCuratorWorker, 15 * 60 * 1000);
setTimeout(startBackgroundReelCuratorWorker, 15 * 1000); // Initial run 15s after startup

app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 HAYA PORTAL Server running at http://localhost:${PORT}`);
    console.log(`=======================================================`);
});
