'use strict';

const Database = require('better-sqlite3');
const path = require('path');

let db;

const isPostgres = !process.env.USE_LOCAL_SQLITE && !!process.env.DATABASE_URL;
const isTurso = !isPostgres && !process.env.USE_LOCAL_SQLITE && !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

if (isPostgres) {
    console.log(`[Haya Portal DB] Connecting to PostgreSQL (Neon Cloud DB)...`);
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const convertSql = (sql) => {
        let idx = 1;
        return sql.replace(/\?/g, () => `$${idx++}`);
    };

    db = {
        prepare: (sql) => ({
            run: async (...args) => {
                const pgSql = convertSql(sql);
                const res = await pool.query(pgSql, args);
                return { lastInsertRowid: res.rows[0]?.id || 0, changes: res.rowCount };
            },
            get: async (...args) => {
                const pgSql = convertSql(sql);
                const res = await pool.query(pgSql, args);
                return res.rows[0] || null;
            },
            all: async (...args) => {
                const pgSql = convertSql(sql);
                const res = await pool.query(pgSql, args);
                return res.rows;
            }
        }),
        exec: async (sql) => {
            return await pool.query(sql);
        }
    };
} else if (isTurso) {
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
        if (isPostgres) {
            console.log('[Haya Portal DB] PostgreSQL database schema verified & connected.');
            return;
        }

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

        // Migration safety: Ensure custom_skills table has tag and description indexing columns
        try { await db.exec(`ALTER TABLE custom_skills ADD COLUMN tag TEXT DEFAULT 'General';`); } catch (e) {}
        try { await db.exec(`ALTER TABLE custom_skills ADD COLUMN description TEXT;`); } catch (e) {}

        // Migration safety: Ensure nsqf_qps table has pipeline tracking columns & deduplication
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN curriculum_pdf_url TEXT;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN markdown_path TEXT;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN total_nos INTEGER DEFAULT 0;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN total_pcs INTEGER DEFAULT 0;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN pipeline_status TEXT DEFAULT 'pending_pdf';`); } catch (e) {}
        try {
            await db.exec(`
                DELETE FROM nsqf_qps 
                WHERE id NOT IN (
                    SELECT MAX(id) 
                    FROM nsqf_qps 
                    GROUP BY qp_code
                );
                CREATE UNIQUE INDEX IF NOT EXISTS idx_nsqf_qps_unique_qp_code ON nsqf_qps(qp_code);
            `);
        } catch (e) {}
        try {
            await db.exec(`
                UPDATE nsqf_qps 
                SET curriculum_pdf_url = 'https://s3.ap-south-1.amazonaws.com/nsdcproddocuments/qpPdf/' 
                    || REPLACE(qp_code, '/', '_') 
                    || '_v' || CASE WHEN version LIKE 'v%' THEN SUBSTR(version, 2) ELSE COALESCE(NULLIF(version, ''), '1.0') END || '.pdf';
            `);
        } catch (e) {}

        // Create 5-Table NSQF Pipeline Schema
        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS nsqf_nos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    qp_code TEXT NOT NULL,
                    nos_code TEXT NOT NULL,
                    nos_title TEXT NOT NULL,
                    nos_type TEXT DEFAULT 'Compulsory',
                    credits INTEGER DEFAULT 0,
                    sequence_order INTEGER DEFAULT 1,
                    UNIQUE(qp_code, nos_code)
                );
            `);
        } catch (e) {}

        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS nsqf_modules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    qp_code TEXT NOT NULL,
                    nos_code TEXT NOT NULL,
                    module_title TEXT NOT NULL,
                    sequence_order INTEGER DEFAULT 1
                );
            `);
        } catch (e) {}

        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS nsqf_pcs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    qp_code TEXT NOT NULL,
                    nos_code TEXT NOT NULL,
                    module_id INTEGER,
                    pc_code TEXT NOT NULL,
                    pc_description TEXT NOT NULL,
                    pc_intent TEXT,
                    intent_confidence INTEGER DEFAULT NULL,
                    contextual_search_query TEXT,
                    query_confidence INTEGER DEFAULT NULL,
                    contextual_search_query_hi TEXT,
                    query_confidence_hi INTEGER DEFAULT NULL,
                    video_id TEXT,
                    video_title TEXT,
                    video_url TEXT,
                    video_id_hi TEXT,
                    video_title_hi TEXT,
                    video_url_hi TEXT,
                    thumbnail_url TEXT,
                    audit_score INTEGER DEFAULT 90,
                    sequence_order INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(qp_code, nos_code, pc_code)
                );
            `);
            try { await db.exec(`ALTER TABLE nsqf_pcs ADD COLUMN intent_confidence INTEGER DEFAULT NULL;`); } catch (_) {}
            try { await db.exec(`ALTER TABLE nsqf_pcs ADD COLUMN query_confidence INTEGER DEFAULT NULL;`); } catch (_) {}
            try { await db.exec(`ALTER TABLE nsqf_pcs ADD COLUMN contextual_search_query_hi TEXT;`); } catch (_) {}
            try { await db.exec(`ALTER TABLE nsqf_pcs ADD COLUMN query_confidence_hi INTEGER DEFAULT NULL;`); } catch (_) {}
            try { await db.exec(`ALTER TABLE nsqf_pcs ADD COLUMN video_id_hi TEXT;`); } catch (_) {}
            try { await db.exec(`ALTER TABLE nsqf_pcs ADD COLUMN video_title_hi TEXT;`); } catch (_) {}
            try { await db.exec(`ALTER TABLE nsqf_pcs ADD COLUMN video_url_hi TEXT;`); } catch (_) {}
            try { await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_nsqf_pcs_unique ON nsqf_pcs(qp_code, nos_code, pc_code);`); } catch (_) {}
        } catch (e) {}

        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS nsqf_video_audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pc_table_id INTEGER,
                    qp_code TEXT NOT NULL,
                    pc_code TEXT NOT NULL,
                    old_video_id TEXT,
                    suggested_video_id TEXT NOT NULL,
                    suggested_video_title TEXT,
                    suggested_video_url TEXT,
                    match_score INTEGER DEFAULT 90,
                    ai_rationale TEXT,
                    status TEXT DEFAULT 'suggested',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (e) {}

        // Create legacy nsqf_curricula table for backward compatibility
        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS nsqf_curricula (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    qp_code TEXT UNIQUE NOT NULL,
                    qp_name TEXT,
                    version TEXT,
                    sector TEXT,
                    total_pcs INTEGER DEFAULT 0,
                    schema_json TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (e) {}

        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS nsqf_videos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    qp_code TEXT NOT NULL,
                    nos_code TEXT NOT NULL,
                    nos_title TEXT,
                    module_title TEXT NOT NULL,
                    pc_id TEXT NOT NULL,
                    pc_intent TEXT NOT NULL,
                    pc_desc TEXT,
                    video_id TEXT NOT NULL,
                    video_title TEXT,
                    video_url TEXT,
                    audit_score INTEGER DEFAULT 90,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(qp_code, nos_code, module_title, pc_id)
                );
            `);
        } catch (e) {}

        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS video_swap_suggestions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    qp_code TEXT NOT NULL,
                    nos_code TEXT NOT NULL,
                    module_title TEXT NOT NULL,
                    pc_id TEXT NOT NULL,
                    pc_intent TEXT NOT NULL,
                    current_video_id TEXT NOT NULL,
                    current_video_title TEXT,
                    current_audit_score INTEGER DEFAULT 0,
                    suggested_video_id TEXT NOT NULL,
                    suggested_video_title TEXT,
                    suggested_video_url TEXT,
                    suggested_audit_score INTEGER DEFAULT 0,
                    ai_rationale TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(qp_code, pc_id, suggested_video_id)
                );

                CREATE TABLE IF NOT EXISTS user_pc_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER DEFAULT 0,
                    qp_code TEXT NOT NULL,
                    pc_code TEXT NOT NULL,
                    completed INTEGER DEFAULT 1,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, qp_code, pc_code)
                );

                CREATE TABLE IF NOT EXISTS youtube_search_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_hash TEXT UNIQUE NOT NULL,
                    search_query TEXT NOT NULL,
                    video_id TEXT NOT NULL,
                    video_title TEXT,
                    video_url TEXT,
                    thumbnail_url TEXT,
                    duration_sec INTEGER DEFAULT 300,
                    audit_score INTEGER DEFAULT 90,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (e) {}

        console.log('[Haya Portal DB] Database tables verified & initialized successfully.');

        // Auto-seed NSQF database if nsqf_qps table is empty
        await seedNSQFFromJSON();
        await seedNsqfCurriculaIfEmpty();
        await syncNsqfQpCounts();
    } catch (err) {
        console.error('[Haya Portal DB] Initialization error:', err.message);
    }
}

async function syncNsqfQpCounts() {
    try {
        const qpList = ['AMH/Q0103', 'AAS/Q0103'];
        for (const qp of qpList) {
            const nosCount = (await db.prepare(`SELECT COUNT(*) as c FROM nsqf_nos WHERE qp_code = ?`).get(qp)).c;
            const pcCount = (await db.prepare(`SELECT COUNT(*) as c FROM nsqf_pcs WHERE qp_code = ?`).get(qp)).c;

            if (nosCount > 0 || pcCount > 0) {
                await db.prepare(`
                    UPDATE nsqf_qps 
                    SET total_nos = ?, total_pcs = ?, pipeline_status = 'video_harvested'
                    WHERE qp_code = ?
                `).run(nosCount, pcCount, qp);

                await db.prepare(`
                    UPDATE nsqf_curricula 
                    SET total_pcs = ?
                    WHERE qp_code = ?
                `).run(pcCount, qp);
            }
        }
    } catch (e) {
        console.warn('[Haya Portal DB] Sync counts warning:', e.message);
    }
}

async function seedNsqfCurriculaIfEmpty() {
    try {
        const existingCount = await db.prepare(`SELECT COUNT(*) as c FROM nsqf_pcs`).get().c;
        if (existingCount > 100) {
            // Real PDF extraction data is already present; sync total_nos and total_pcs counts dynamically
            await db.prepare(`
                UPDATE nsqf_qps
                SET total_nos = (SELECT COUNT(*) FROM nsqf_nos WHERE nsqf_nos.qp_code = nsqf_qps.qp_code),
                    total_pcs = (SELECT COUNT(*) FROM nsqf_pcs WHERE nsqf_pcs.qp_code = nsqf_qps.qp_code)
                WHERE qp_code IN (SELECT qp_code FROM nsqf_pcs);
            `).run();
            return;
        }
    } catch (e) {
        console.warn('[Haya Portal DB] nsqf_curricula seed warning:', e.message);
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
