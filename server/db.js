'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'portal_database.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize Database Schemas
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        firm_name TEXT,
        ip_registration_no TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tier TEXT DEFAULT 'starter', -- 'starter' | 'professional' | 'enterprise'
        status TEXT DEFAULT 'active', -- 'active' | 'cancelled' | 'expired'
        expires_at DATETIME,
        payment_provider TEXT, -- 'razorpay' | 'stripe' | 'manual'
        transaction_id TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tier TEXT NOT NULL,
        license_key TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS download_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        asset_id TEXT NOT NULL,
        ip_address TEXT,
        downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);

console.log(`[Haya Portal DB] SQLite database initialized at ${dbPath}`);

module.exports = db;
