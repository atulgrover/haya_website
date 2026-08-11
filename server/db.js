'use strict';

const Database = require('better-sqlite3');
const path = require('path');

let db;

const isTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

if (isTurso) {
    console.log(`[Haya Portal DB] Connecting to Turso Cloud SQLite: ${process.env.TURSO_DATABASE_URL}`);
    const { createClient } = require('@libsql/client');
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    db = {
        prepare: (sql) => ({
            run: async (...args) => {
                const res = await client.execute({ sql, args });
                return { lastInsertRowid: res.lastInsertRowid ? Number(res.lastInsertRowid) : 0, changes: res.rowsAffected };
            },
            get: async (...args) => {
                const res = await client.execute({ sql, args });
                return res.rows[0] || null;
            },
            all: async (...args) => {
                const res = await client.execute({ sql, args });
                return res.rows;
            }
        }),
        exec: async (sql) => {
            return await client.executeMultiple(sql);
        }
    };
} else {
    const dbPath = path.join(__dirname, 'portal_database.db');
    const localDb = new Database(dbPath);
    localDb.pragma('journal_mode = WAL');
    console.log(`[Haya Portal DB] Local SQLite database initialized at ${dbPath}`);

    db = {
        prepare: (sql) => ({
            run: (...args) => localDb.prepare(sql).run(...args),
            get: (...args) => localDb.prepare(sql).get(...args),
            all: (...args) => localDb.prepare(sql).all(...args)
        }),
        exec: (sql) => localDb.exec(sql)
    };
}

// Function to initialize tables asynchronously
async function initSchema() {
    try {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                firm_name TEXT,
                ip_registration_no TEXT,
                role TEXT DEFAULT 'student',
                company_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS custom_skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company_id TEXT,
                employee_email_id TEXT NOT NULL,
                schema_json TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS skill_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                employee_email_id TEXT NOT NULL,
                skill_id TEXT NOT NULL,
                completed_pcs TEXT DEFAULT '[]',
                score INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tier TEXT DEFAULT 'starter',
                status TEXT DEFAULT 'active',
                expires_at DATETIME,
                payment_provider TEXT,
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

            CREATE TABLE IF NOT EXISTS user_purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                asset_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                currency TEXT DEFAULT 'INR',
                transaction_id TEXT,
                purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS user_payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                card_holder TEXT NOT NULL,
                card_last4 TEXT NOT NULL,
                card_brand TEXT DEFAULT 'Visa',
                exp_month TEXT NOT NULL,
                exp_year TEXT NOT NULL,
                is_default INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS report_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                report_type TEXT NOT NULL,
                title TEXT NOT NULL,
                company_name TEXT,
                notes TEXT,
                status TEXT DEFAULT 'in_processing',
                file_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS nsqf_qps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                s_no TEXT,
                sector TEXT,
                sub_sector TEXT,
                occupation TEXT,
                qp_name TEXT,
                qp_code TEXT,
                version TEXT,
                awarding_body TEXT,
                last_reviewed_on TEXT,
                next_review_date TEXT,
                nsqc_approval_date TEXT,
                nsqf_level TEXT,
                common_norms_category TEXT,
                economic_category TEXT,
                deactivation_date TEXT,
                technical_type TEXT,
                sector_type TEXT,
                nqr_code TEXT,
                qp_type TEXT,
                theory_duration TEXT,
                practical_duration TEXT,
                ojt_mandatory_duration TEXT,
                ojt_recommended_duration TEXT,
                total_qp_hours TEXT,
                min_education_exp TEXT,
                min_job_entry_age TEXT,
                curriculum_pdf_url TEXT
            );
        `);

        // Migration safety: Ensure legacy users table has role, company_id, firm_name, ip_registration_no columns
        try { await db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';`); } catch (e) {}
        try { await db.exec(`ALTER TABLE users ADD COLUMN company_id TEXT;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE users ADD COLUMN firm_name TEXT;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE users ADD COLUMN ip_registration_no TEXT;`); } catch (e) {}

        // Migration safety: Ensure nsqf_qps table has curriculum_pdf_url and populate direct NSDC S3 PDF links
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN curriculum_pdf_url TEXT;`); } catch (e) {}
        try {
            await db.exec(`
                UPDATE nsqf_qps 
                SET curriculum_pdf_url = 'https://s3.ap-south-1.amazonaws.com/nsdcproddocuments/qpPdf/' 
                    || REPLACE(qp_code, '/', '_') 
                    || '_v' || CASE WHEN version LIKE 'v%' THEN SUBSTR(version, 2) ELSE COALESCE(NULLIF(version, ''), '1.0') END || '.pdf';
            `);
        } catch (e) {}



        console.log('[Haya Portal DB] Database tables verified & initialized successfully.');



        // Auto-seed NSQF database if nsqf_qps table is empty
        await seedNSQFFromJSON();
    } catch (err) {
        console.error('[Haya Portal DB] Initialization error:', err.message);
    }
}

async function seedNSQFFromJSON() {
    try {
        const countRow = await db.prepare(`SELECT COUNT(*) as count FROM nsqf_qps`).get();
        if (countRow && countRow.count === 0) {
            const fs = require('fs');
            const seedPath = path.join(__dirname, 'nsqf_seed.json');
            if (fs.existsSync(seedPath)) {
                console.log('[Haya Portal DB] Seeding 2,176 NCVET NSQF Job Roles from nsqf_seed.json...');
                const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
                for (const r of seedData) {
                    await db.prepare(`
                        INSERT INTO nsqf_qps (
                            s_no, sector, sub_sector, occupation, qp_name, qp_code, version,
                            awarding_body, last_reviewed_on, next_review_date, nsqc_approval_date,
                            nsqf_level, common_norms_category, economic_category, deactivation_date,
                            technical_type, sector_type, nqr_code, qp_type, theory_duration,
                            practical_duration, ojt_mandatory_duration, ojt_recommended_duration,
                            total_qp_hours, min_education_exp, min_job_entry_age
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        r.s_no, r.sector, r.sub_sector, r.occupation, r.qp_name, r.qp_code, r.version,
                        r.awarding_body, r.last_reviewed_on, r.next_review_date, r.nsqc_approval_date,
                        r.nsqf_level, r.common_norms_category, r.economic_category, r.deactivation_date,
                        r.technical_type, r.sector_type, r.nqr_code, r.qp_type, r.theory_duration,
                        r.practical_duration, r.ojt_mandatory_duration, r.ojt_recommended_duration,
                        r.total_qp_hours, r.min_education_exp, r.min_job_entry_age
                    );
                }
                console.log(`[Haya Portal DB] Successfully seeded ${seedData.length} NSQF Job Roles.`);
            }
        }
    } catch (e) {
        console.error('[Haya Portal DB] Error seeding NSQF DB:', e.message);
    }
}

initSchema();

module.exports = db;
