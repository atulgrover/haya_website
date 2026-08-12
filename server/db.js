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

        // Migration safety: Ensure custom_skills table has tag and description indexing columns
        try { await db.exec(`ALTER TABLE custom_skills ADD COLUMN tag TEXT DEFAULT 'General';`); } catch (e) {}
        try { await db.exec(`ALTER TABLE custom_skills ADD COLUMN description TEXT;`); } catch (e) {}

        // Migration safety: Ensure nsqf_qps table has pipeline tracking columns
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN curriculum_pdf_url TEXT;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN markdown_path TEXT;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN total_nos INTEGER DEFAULT 0;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN total_pcs INTEGER DEFAULT 0;`); } catch (e) {}
        try { await db.exec(`ALTER TABLE nsqf_qps ADD COLUMN pipeline_status TEXT DEFAULT 'pending_pdf';`); } catch (e) {}
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
                    contextual_search_query TEXT,
                    video_id TEXT,
                    video_title TEXT,
                    video_url TEXT,
                    thumbnail_url TEXT,
                    audit_score INTEGER DEFAULT 90,
                    sequence_order INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(qp_code, nos_code, pc_code)
                );
            `);
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
        const fs = require('fs');
        const aasPath = '/Users/atulgrover/.gemini/antigravity-ide/brain/63c4db05-0fe5-419b-a156-462feb454b3a/scratch/PARSED_NOS_SCHEMA_AAS_Q0103.json';
        const amhPath = '/Users/atulgrover/.gemini/antigravity-ide/brain/63c4db05-0fe5-419b-a156-462feb454b3a/scratch/PARSED_NOS_SCHEMA_AMH_Q0103.json';

        for (const p of [aasPath, amhPath]) {
            if (fs.existsSync(p)) {
                const schemaObj = JSON.parse(fs.readFileSync(p, 'utf8'));
                await db.prepare(`
                    INSERT OR REPLACE INTO nsqf_curricula (qp_code, qp_name, version, sector, total_pcs, schema_json)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    schemaObj.qp_code,
                    schemaObj.qp_name,
                    schemaObj.version,
                    schemaObj.sector,
                    schemaObj.total_pcs || 32,
                    JSON.stringify(schemaObj)
                );

                // Clean previous module/pc records for fresh seed alignment
                await db.prepare(`DELETE FROM nsqf_nos WHERE qp_code = ?`).run(schemaObj.qp_code);
                await db.prepare(`DELETE FROM nsqf_modules WHERE qp_code = ?`).run(schemaObj.qp_code);
                await db.prepare(`DELETE FROM nsqf_pcs WHERE qp_code = ?`).run(schemaObj.qp_code);

                // Populate relational nsqf_nos, nsqf_modules, and nsqf_pcs tables
                if (Array.isArray(schemaObj.nos_modules)) {
                    let nosOrder = 1;
                    let modOrder = 1;
                    let pcOrder = 1;
                    const moduleMap = new Map();

                    for (const mod of schemaObj.nos_modules) {
                        const nosCode = mod.nos_code || 'NOS';
                        const nosTitle = mod.nos_title || mod.module_title || 'NOS Module';
                        const modTitle = mod.module_title || nosTitle;

                        // Insert NOS if unique
                        await db.prepare(`
                            INSERT OR IGNORE INTO nsqf_nos (qp_code, nos_code, nos_title, sequence_order)
                            VALUES (?, ?, ?, ?)
                        `).run(schemaObj.qp_code, nosCode, nosTitle, nosOrder++);

                        // Insert Module if unique (1 Module = 1 Reel)
                        let modId = moduleMap.get(`${nosCode}:${modTitle}`);
                        if (!modId) {
                            const modInfo = await db.prepare(`
                                INSERT INTO nsqf_modules (qp_code, nos_code, module_title, sequence_order)
                                VALUES (?, ?, ?, ?)
                            `).run(schemaObj.qp_code, nosCode, modTitle, modOrder++);
                            modId = modInfo.lastInsertRowid;
                            moduleMap.set(`${nosCode}:${modTitle}`, modId);
                        }

                        if (Array.isArray(mod.pcs)) {
                            for (const pc of mod.pcs) {
                                const vId = pc.video_id || mod.video_id || 'x9PQgbB4y6M';
                                const vTitle = pc.video_title || `${schemaObj.qp_name} Demonstration ${pc.pc_id}`;
                                const vUrl = `https://www.youtube.com/watch?v=${vId}`;
                                const pcIntent = pc.pc_intent || pc.pc_desc || pc.title || pc.pc_id;
                                const pcDesc = pc.pc_desc || pcIntent;
                                const contextQuery = `${schemaObj.qp_name} ${nosTitle} ${modTitle} ${pcIntent} ${pcDesc}`;

                                // Legacy table sync
                                await db.prepare(`
                                    INSERT OR REPLACE INTO nsqf_videos 
                                    (qp_code, nos_code, nos_title, module_title, pc_id, pc_intent, pc_desc, video_id, video_title, video_url, audit_score)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `).run(
                                    schemaObj.qp_code, nosCode, nosTitle, modTitle, pc.pc_id, pcIntent, pcDesc, vId, vTitle, vUrl, 90
                                );

                                // Restructured nsqf_pcs table sync (1 PC = 1 Video inside Module Reel)
                                await db.prepare(`
                                    INSERT OR REPLACE INTO nsqf_pcs 
                                    (qp_code, nos_code, module_id, pc_code, pc_description, pc_intent, contextual_search_query, video_id, video_title, video_url, audit_score, sequence_order)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `).run(
                                    schemaObj.qp_code, nosCode, modId, pc.pc_id, pcDesc, pcIntent, contextQuery, vId, vTitle, vUrl, 90, pcOrder++
                                );
                            }
                        }
                    }
                }

                // Purge empty 0-PC modules from nsqf_modules
                await db.prepare(`
                    DELETE FROM nsqf_modules 
                    WHERE qp_code = ? AND id NOT IN (
                        SELECT DISTINCT module_id FROM nsqf_pcs WHERE qp_code = ? AND module_id IS NOT NULL
                    )
                `).run(schemaObj.qp_code, schemaObj.qp_code);

                // Sync master nsqf_qps table and legacy nsqf_curricula table counts
                const actualNosCount = (await db.prepare(`SELECT COUNT(*) as c FROM nsqf_nos WHERE qp_code = ?`).get(schemaObj.qp_code)).c;
                const actualModCount = (await db.prepare(`SELECT COUNT(*) as c FROM nsqf_modules WHERE qp_code = ?`).get(schemaObj.qp_code)).c;
                const actualPcCount = (await db.prepare(`SELECT COUNT(*) as c FROM nsqf_pcs WHERE qp_code = ?`).get(schemaObj.qp_code)).c;

                await db.prepare(`
                    UPDATE nsqf_qps 
                    SET total_nos = ?, total_pcs = ?, pipeline_status = 'video_harvested'
                    WHERE qp_code = ?
                `).run(actualNosCount, actualPcCount, schemaObj.qp_code);

                await db.prepare(`
                    UPDATE nsqf_curricula 
                    SET total_pcs = ?
                    WHERE qp_code = ?
                `).run(actualPcCount, schemaObj.qp_code);
            }
        }
        console.log('[Haya Portal DB] Updated sample NSQF Curricula & PC Video records for AAS/Q0103 and AMH/Q0103.');
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
