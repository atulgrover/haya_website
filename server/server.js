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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Haya Portal Server', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 HAYA PORTAL Server running at http://localhost:${PORT}`);
    console.log(`=======================================================`);
});
