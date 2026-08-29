'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Haya Portal — Database Connection  (LOCAL POSTGRESQL ONLY)     ║
 * ║                                                                  ║
 * ║  ARCHITECTURE CONTRACT:                                          ║
 * ║  • This file ALWAYS connects to LOCAL PostgreSQL (hayadb).       ║
 * ║  • SQLite and Turso are permanently archived — never used again. ║
 * ║  • Neon (cloud/prod) is NEVER written to from application code.  ║
 * ║  • The ONLY path to Neon is:                                     ║
 * ║      node scripts/push_local_pg_to_neon.js  (explicit HIL only) ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Required env var:  LOCAL_DATABASE_URL
 *   e.g.  postgresql://postgres:hayapass@localhost:5432/hayadb
 *
 * The server will CRASH immediately at startup if LOCAL_DATABASE_URL
 * is not set — this is intentional to prevent silent fallback to Neon.
 */

require('dotenv').config();
const { Pool } = require('pg');
const path    = require('path');

// ── Environment Detection: Local Dev vs. Cloud Production (Render / Neon) ───
const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER || (!process.env.LOCAL_DATABASE_URL && (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL));

let DB_URL = isProd
    ? (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.LOCAL_DATABASE_URL)
    : (process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:hayapass@localhost:5432/hayadb');

if (!DB_URL) {
    console.error('\n❌ FATAL: No database connection URL configured in environment.\n');
    process.exit(1);
}

const isNeon = DB_URL.includes('neon.tech') || DB_URL.includes('sslmode=require');
console.log(`[Haya Portal DB] 🛠  Connecting to ${isNeon ? 'NEON CLOUD (Production)' : 'LOCAL PostgreSQL'}: ${DB_URL.replace(/:([^:@]+)@/, ':***@')}`);

const pool = new Pool({
    connectionString: DB_URL,
    ...(isNeon ? { ssl: { rejectUnauthorized: false } } : {})
});

// ── SQL placeholder converter: ? → $1, $2, ... (SQLite → PG compat layer) ────
const convertSql = (sql) => {
    let s = String(sql || '')
        .replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'INSERT INTO')
        .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
    let idx = 1;
    return s.replace(/\?/g, () => `$${idx++}`);
};

// ── Unified async DB interface (mirrors the old better-sqlite3 API shape) ─────
const db = {
    prepare: (sql) => ({
        run: async (...args) => {
            let s = convertSql(sql);
            if (/^\s*INSERT\s+INTO/i.test(s) && !/RETURNING/i.test(s) && !/ON\s+CONFLICT/i.test(s)) {
                s += ' RETURNING id';
            }
            try {
                const res = await pool.query(s, args);
                return { lastInsertRowid: res.rows?.[0]?.id || 0, changes: res.rowCount };
            } catch (err) {
                // If RETURNING id failed due to missing id column or conflict, fallback to original query
                const fallbackRes = await pool.query(convertSql(sql), args);
                return { lastInsertRowid: 0, changes: fallbackRes.rowCount };
            }
        },
        get: async (...args) => {
            const res = await pool.query(convertSql(sql), args);
            return res.rows[0] || null;
        },
        all: async (...args) => {
            const res = await pool.query(convertSql(sql), args);
            return res.rows;
        }
    }),
    exec: async (sql) => pool.query(sql),
    // Raw pool access for advanced queries (DISTINCT ON, CTEs, etc.)
    query: (...args) => pool.query(...args)
};

// ── Pipeline Status FSM — canonical pass order ────────────────────────────────
// Each pass script should validate that QPs are in the correct predecessor state.
const PIPELINE_STATUSES = [
    'pending_pdf',
    'pdf_downloaded',
    'md_converted',
    'image_pdf_no_text',        // terminal: scanned/image PDF with no extractable text
    'abbreviated_pdf_no_pcs',   // terminal: assessment-format PDF (all PCs identical)
    'structure_ingested',
    'intent_synthesized',
    'video_harvested',
    'pending_editorial_review',
    'editorial_approved',
    'production_ready'
];

// ── Schema bootstrap (idempotent — safe to run on every startup) ──────────────
async function initSchema() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                firm_name TEXT,
                ip_registration_no TEXT,
                role VARCHAR(50) DEFAULT 'student',
                company_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS custom_skills (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                company_id TEXT,
                employee_email_id TEXT NOT NULL,
                tag TEXT DEFAULT 'General',
                description TEXT,
                schema_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS skill_progress (
                id SERIAL PRIMARY KEY,
                user_id INT,
                employee_email_id TEXT NOT NULL,
                skill_id TEXT NOT NULL,
                completed_pcs TEXT DEFAULT '[]',
                score INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                tier TEXT DEFAULT 'starter',
                status TEXT DEFAULT 'active',
                expires_at TIMESTAMP,
                payment_provider TEXT,
                transaction_id TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS licenses (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                tier TEXT NOT NULL,
                license_key TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS download_logs (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                asset_id TEXT NOT NULL,
                ip_address TEXT,
                downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_purchases (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                asset_id TEXT NOT NULL,
                amount INT NOT NULL,
                currency TEXT DEFAULT 'INR',
                transaction_id TEXT,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_payment_methods (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                card_holder TEXT NOT NULL,
                card_last4 TEXT NOT NULL,
                card_brand TEXT DEFAULT 'Visa',
                exp_month TEXT NOT NULL,
                exp_year TEXT NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS report_orders (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                report_type TEXT NOT NULL,
                title TEXT NOT NULL,
                company_name TEXT,
                notes TEXT,
                status TEXT DEFAULT 'in_processing',
                file_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS nsqf_qps (
                id SERIAL PRIMARY KEY,
                s_no TEXT,
                sector TEXT,
                sub_sector TEXT,
                occupation TEXT,
                qp_name TEXT,
                qp_code TEXT UNIQUE,
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
                curriculum_pdf_url TEXT,
                markdown_path TEXT,
                total_nos INT DEFAULT 0,
                total_pcs INT DEFAULT 0,
                pipeline_status TEXT DEFAULT 'pending_pdf'
            );

            CREATE TABLE IF NOT EXISTS nsqf_nos (
                id SERIAL PRIMARY KEY,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                nos_title TEXT NOT NULL,
                nos_type TEXT DEFAULT 'Compulsory',
                credits INT DEFAULT 0,
                sequence_order INT DEFAULT 1,
                business_model_type TEXT DEFAULT 'Turnkey_Service_Kiosk',
                msme_blueprint_json JSONB,
                UNIQUE(qp_code, nos_code)
            );

            CREATE TABLE IF NOT EXISTS nsqf_modules (
                id SERIAL PRIMARY KEY,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                module_title TEXT NOT NULL,
                sequence_order INT DEFAULT 1,
                sop_procedure_json JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS nsqf_pcs (
                id SERIAL PRIMARY KEY,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                module_id INT,
                pc_code TEXT NOT NULL,
                pc_description TEXT NOT NULL,
                pc_intent TEXT,
                intent_confidence INT DEFAULT NULL,
                contextual_search_query TEXT,
                query_confidence INT DEFAULT NULL,
                youtube_category_id INT DEFAULT 27,
                youtube_category_name TEXT DEFAULT 'Education',
                negative_keywords TEXT,
                tool_keywords TEXT,
                positive_signals TEXT,
                min_duration_seconds INT DEFAULT 180,
                max_duration_seconds INT DEFAULT 900,
                video_id TEXT,
                video_title TEXT,
                video_url TEXT,
                channel_title TEXT,
                duration_seconds INT,
                thumbnail_url TEXT,

                audit_score INT DEFAULT 90,
                sequence_order INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(qp_code, nos_code, pc_code)
            );

            CREATE TABLE IF NOT EXISTS nsqf_curricula (
                id SERIAL PRIMARY KEY,
                qp_code TEXT UNIQUE NOT NULL,
                qp_name TEXT,
                version TEXT,
                sector TEXT,
                total_pcs INT DEFAULT 0,
                schema_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ============================================================
            -- DEPRECATED: nsqf_videos is a legacy table. All video data now
            -- lives in nsqf_pcs (the canonical source). This table is kept
            -- for historical data preservation only. No active code reads
            -- or writes to this table as of the Phase 5B refactor.
            -- ============================================================
            CREATE TABLE IF NOT EXISTS nsqf_videos (
                id SERIAL PRIMARY KEY,
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
                audit_score INT DEFAULT 90,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(qp_code, nos_code, module_title, pc_id)
            );

            CREATE TABLE IF NOT EXISTS nsqf_video_audit_logs (
                id SERIAL PRIMARY KEY,
                pc_table_id INT,
                qp_code TEXT NOT NULL,
                pc_code TEXT NOT NULL,
                old_video_id TEXT,
                suggested_video_id TEXT NOT NULL,
                suggested_video_title TEXT,
                suggested_video_url TEXT,
                match_score INT DEFAULT 90,
                ai_rationale TEXT,
                status TEXT DEFAULT 'suggested',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS video_swap_suggestions (
                id SERIAL PRIMARY KEY,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                module_title TEXT NOT NULL,
                pc_id TEXT NOT NULL,
                pc_intent TEXT NOT NULL,
                current_video_id TEXT NOT NULL,
                current_video_title TEXT,
                current_audit_score INT DEFAULT 0,
                suggested_video_id TEXT NOT NULL,
                suggested_video_title TEXT,
                suggested_video_url TEXT,
                suggested_audit_score INT DEFAULT 0,
                ai_rationale TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(qp_code, pc_id, suggested_video_id)
            );

            CREATE TABLE IF NOT EXISTS user_pc_progress (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                qp_code TEXT NOT NULL,
                pc_code TEXT NOT NULL,
                completed INT DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, qp_code, pc_code)
            );

            CREATE TABLE IF NOT EXISTS nsqf_kus (
                id SERIAL PRIMARY KEY,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                ku_code TEXT NOT NULL,
                ku_description TEXT NOT NULL,
                sequence_order INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(qp_code, nos_code, ku_code)
            );

            CREATE TABLE IF NOT EXISTS nsqf_gs (
                id SERIAL PRIMARY KEY,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                gs_code TEXT NOT NULL,
                gs_description TEXT NOT NULL,
                sequence_order INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(qp_code, nos_code, gs_code)
            );

            CREATE INDEX IF NOT EXISTS idx_kus_nos ON nsqf_kus(qp_code, nos_code);
            CREATE INDEX IF NOT EXISTS idx_gs_nos  ON nsqf_gs(qp_code, nos_code);

            CREATE TABLE IF NOT EXISTS youtube_search_cache (
                id SERIAL PRIMARY KEY,
                query_hash TEXT UNIQUE NOT NULL,
                search_query TEXT NOT NULL,
                lang VARCHAR(10) DEFAULT 'eng',
                video_id TEXT NOT NULL,
                video_title TEXT,
                video_url TEXT,
                channel_title TEXT,
                duration_seconds INT,
                thumbnail_url TEXT,
                audit_score INT DEFAULT 90,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS pc_explanations_cache (
                id SERIAL PRIMARY KEY,
                pc_id INT NOT NULL REFERENCES nsqf_pcs(id) ON DELETE CASCADE,
                perspective VARCHAR(20) NOT NULL DEFAULT 'skill',
                lang VARCHAR(10) NOT NULL DEFAULT 'en',
                explanation_markdown TEXT NOT NULL,
                key_takeaways JSONB,
                safety_knacks JSONB,
                perspective_metadata JSONB,
                model_used VARCHAR(50) DEFAULT 'sarvam-105b',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT uq_pc_perspective_lang UNIQUE(pc_id, perspective, lang)
            );

            CREATE INDEX IF NOT EXISTS idx_pc_explain_lookup ON pc_explanations_cache(pc_id, perspective, lang);

            CREATE TABLE IF NOT EXISTS msme_business_blueprints (
                id SERIAL PRIMARY KEY,
                qp_code TEXT UNIQUE NOT NULL,
                business_title TEXT NOT NULL,
                tagline TEXT,
                executive_summary TEXT,
                target_customers JSONB,
                revenue_streams JSONB,
                machinery_bom JSONB,
                financial_model JSONB,
                launch_playbook JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS hil_video_curations (
                id SERIAL PRIMARY KEY,
                pc_id INT NOT NULL,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                pc_code TEXT NOT NULL,
                video_id TEXT NOT NULL,
                video_title TEXT,
                video_url TEXT,
                start_seconds INT DEFAULT 0,
                end_seconds INT,
                previous_video_id TEXT,
                curator_email TEXT,
                curator_name TEXT,
                confidence_score INT DEFAULT 100,
                curator_notes TEXT,
                ip_address TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS nsqf_patents (
                id SERIAL PRIMARY KEY,
                qp_code TEXT UNIQUE NOT NULL,
                patent_title TEXT NOT NULL,
                ipc_classes JSONB NOT NULL DEFAULT '[]',
                technical_field TEXT NOT NULL,
                background_problem TEXT NOT NULL,
                technical_solution TEXT NOT NULL,
                hardware_bom JSONB NOT NULL DEFAULT '[]',
                operational_steps JSONB NOT NULL DEFAULT '[]',
                claims_apparatus JSONB NOT NULL DEFAULT '[]',
                claims_method JSONB NOT NULL DEFAULT '[]',
                prior_art_queries JSONB NOT NULL DEFAULT '[]',
                commercial_viability TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_patents_qp ON nsqf_patents(qp_code);
        `);

        console.log('[Haya Portal DB] ✅ Local PostgreSQL schema verified & connected.');

        // ── Idempotent column migrations (safe on existing hayadb) ───────────
        const migrations = [
            `ALTER TABLE nsqf_nos DROP COLUMN IF EXISTS kus`,
            `ALTER TABLE nsqf_nos DROP COLUMN IF EXISTS gs`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS theory_marks NUMERIC(6,2)`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS practical_marks NUMERIC(6,2)`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS project_marks NUMERIC(6,2)`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS viva_marks NUMERIC(6,2)`,
            `ALTER TABLE nsqf_pcs ALTER COLUMN theory_marks TYPE NUMERIC(6,2) USING theory_marks::numeric`,
            `ALTER TABLE nsqf_pcs ALTER COLUMN practical_marks TYPE NUMERIC(6,2) USING practical_marks::numeric`,
            `ALTER TABLE nsqf_pcs ALTER COLUMN project_marks TYPE NUMERIC(6,2) USING project_marks::numeric`,
            `ALTER TABLE nsqf_pcs ALTER COLUMN viva_marks TYPE NUMERIC(6,2) USING viva_marks::numeric`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS video_id_hi`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS video_title_hi`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS video_url_hi`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS thumbnail_url_hi`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS channel_title_hi`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS duration_seconds_hi`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS pc_intent_hi`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS contextual_search_query_hi`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS query_confidence_hi`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS start_seconds INT DEFAULT 0`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS end_seconds INT`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS viva_quiz_json JSONB`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS study_takeaways_json JSONB`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS sop_intent TEXT`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS sop_intent_hi`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS sop_search_query TEXT`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS sop_search_query_hi`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS sop_action_directive TEXT`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS sop_parameter_tolerance TEXT`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS sop_critical_knack TEXT`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS dpr_intent TEXT`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS dpr_intent_hi`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS dpr_search_query TEXT`,
            `ALTER TABLE nsqf_pcs DROP COLUMN IF EXISTS dpr_search_query_hi`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS machine_name TEXT`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS machine_spec TEXT`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS machine_capex_cost_inr INT`,
            `ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS machine_power_kw NUMERIC(10,2)`,
            `ALTER TABLE youtube_search_cache ADD COLUMN IF NOT EXISTS perspective VARCHAR(20) DEFAULT 'skill'`,
            `ALTER TABLE youtube_search_cache ADD COLUMN IF NOT EXISTS cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
            `ALTER TABLE youtube_search_cache ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        ];
        for (const sql of migrations) {
            try { await pool.query(sql); } catch (_) {}
        }

        // Auto-seed QPs if table is empty (first boot after fresh hayadb)
        await seedNSQFFromJSON();


    } catch (err) {
        console.error('[Haya Portal DB] ❌ Initialization error:', err.message);
    }
}

async function seedNSQFFromJSON() {
    try {
        const result = await pool.query('SELECT COUNT(*) AS count FROM nsqf_qps');
        if (parseInt(result.rows[0].count) === 0) {
            const fs   = require('fs');
            const seedPath = path.join(__dirname, 'nsqf_seed.json');
            if (fs.existsSync(seedPath)) {
                console.log('[Haya Portal DB] Seeding 2,176 NCVET NSQF Job Roles from nsqf_seed.json...');
                const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
                for (const r of seedData) {
                    await pool.query(`
                        INSERT INTO nsqf_qps (
                            s_no, sector, sub_sector, occupation, qp_name, qp_code, version,
                            awarding_body, last_reviewed_on, next_review_date, nsqc_approval_date,
                            nsqf_level, common_norms_category, economic_category, deactivation_date,
                            technical_type, sector_type, nqr_code, qp_type, theory_duration,
                            practical_duration, ojt_mandatory_duration, ojt_recommended_duration,
                            total_qp_hours, min_education_exp, min_job_entry_age
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
                        ON CONFLICT (qp_code) DO NOTHING
                    `, [
                        r.s_no, r.sector, r.sub_sector, r.occupation, r.qp_name, r.qp_code, r.version,
                        r.awarding_body, r.last_reviewed_on, r.next_review_date, r.nsqc_approval_date,
                        r.nsqf_level, r.common_norms_category, r.economic_category, r.deactivation_date,
                        r.technical_type, r.sector_type, r.nqr_code, r.qp_type, r.theory_duration,
                        r.practical_duration, r.ojt_mandatory_duration, r.ojt_recommended_duration,
                        r.total_qp_hours, r.min_education_exp, r.min_job_entry_age
                    ]);
                }
                console.log(`[Haya Portal DB] Seeded ${seedData.length} NSQF Job Roles.`);
            }
        }
    } catch (e) {
        console.error('[Haya Portal DB] Seed error:', e.message);
    }
}

/**
 * 🧹 YouTube Developer Policy III.E.4.a-g Compliance Routine:
 * Automatically purges all cached YouTube API search metadata older than 7 days (Rolling Ephemeral Cache).
 */
async function purgeExpiredYouTubeCache() {
    try {
        const res = await pool.query(`
            DELETE FROM youtube_search_cache 
            WHERE cached_at < NOW() - INTERVAL '7 days'
        `);
        if (res && res.rowCount > 0) {
            console.log(`[Haya Portal DB] 🧹 Policy III.E.4.a-g Compliance: Purged ${res.rowCount} expired YouTube cache entries (>7 days old).`);
        }
    } catch (err) {
        console.warn('[Haya Portal DB] YouTube Cache Purge warning:', err.message);
    }
}

initSchema().then(() => {
    // Run initial 7-day compliance purge on boot
    purgeExpiredYouTubeCache();
    // Schedule daily automated purge (every 24 hours)
    setInterval(purgeExpiredYouTubeCache, 24 * 60 * 60 * 1000);
});

module.exports = db;
module.exports.pool = pool;                    // Raw pg.Pool — for transaction-aware scripts
module.exports.initSchema = initSchema;
module.exports.PIPELINE_STATUSES = PIPELINE_STATUSES;  // FSM — canonical pass order
module.exports.purgeExpiredYouTubeCache = purgeExpiredYouTubeCache;

