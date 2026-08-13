'use strict';

require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ ERROR: Missing DATABASE_URL in .env file!');
    process.exit(1);
}

console.log('🚀 Connecting to Neon PostgreSQL...');
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

const localDbPath = path.join(__dirname, '..', 'server', 'portal_database.db');
console.log(`📂 Opening local SQLite database at: ${localDbPath}`);
const localDb = new Database(localDbPath);

async function initPostgresSchema() {
    console.log('🔨 Creating PostgreSQL Schema...');
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                firm_name TEXT,
                ip_registration_no TEXT,
                role TEXT DEFAULT 'student',
                company_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS custom_skills (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                company_id TEXT,
                employee_email_id TEXT NOT NULL,
                schema_json TEXT NOT NULL,
                tag TEXT DEFAULT 'General',
                description TEXT,
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
                license_key VARCHAR(255) UNIQUE NOT NULL,
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
                is_default INT DEFAULT 0,
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
                qp_code VARCHAR(255) UNIQUE,
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
                UNIQUE(qp_code, nos_code)
            );

            CREATE TABLE IF NOT EXISTS nsqf_modules (
                id SERIAL PRIMARY KEY,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                module_title TEXT NOT NULL,
                sequence_order INT DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS nsqf_pcs (
                id SERIAL PRIMARY KEY,
                qp_code TEXT NOT NULL,
                nos_code TEXT NOT NULL,
                module_id INT,
                pc_code TEXT NOT NULL,
                pc_description TEXT NOT NULL,
                pc_intent TEXT,
                intent_confidence INT,
                contextual_search_query TEXT,
                query_confidence INT,
                contextual_search_query_hi TEXT,
                query_confidence_hi INT,
                video_id TEXT,
                video_title TEXT,
                video_url TEXT,
                video_id_hi TEXT,
                video_title_hi TEXT,
                video_url_hi TEXT,
                thumbnail_url TEXT,
                audit_score INT DEFAULT 90,
                sequence_order INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(qp_code, nos_code, pc_code)
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

            CREATE TABLE IF NOT EXISTS nsqf_curricula (
                id SERIAL PRIMARY KEY,
                qp_code VARCHAR(255) UNIQUE NOT NULL,
                qp_name TEXT,
                version TEXT,
                sector TEXT,
                total_pcs INT DEFAULT 0,
                schema_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

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
                user_id INT DEFAULT 0,
                qp_code TEXT NOT NULL,
                pc_code TEXT NOT NULL,
                completed INT DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, qp_code, pc_code)
            );

            CREATE TABLE IF NOT EXISTS youtube_search_cache (
                id SERIAL PRIMARY KEY,
                query_hash VARCHAR(255) UNIQUE NOT NULL,
                search_query TEXT NOT NULL,
                video_id TEXT NOT NULL,
                video_title TEXT,
                video_url TEXT,
                thumbnail_url TEXT,
                duration_sec INT DEFAULT 300,
                audit_score INT DEFAULT 90,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ PostgreSQL Schema initialized successfully.');
    } finally {
        client.release();
    }
}

async function migrateTableData(tableName, batchSize = 1000) {
    console.log(`\n⏳ Migrating table [${tableName}]...`);
    const checkTable = localDb.prepare(`SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
    if (!checkTable || checkTable.c === 0) {
        console.log(`⚠️ Table [${tableName}] does not exist in local SQLite. Skipping.`);
        return;
    }

    const rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`📊 Local rows in [${tableName}]: ${rows.length}`);
    if (rows.length === 0) return;

    const columns = Object.keys(rows[0]);
    // Exclude auto-incrementing id from explicit column inserts if needed, or include id to match exact row IDs
    const colsSql = columns.map(c => `"${c}"`).join(', ');

    let migrated = 0;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);

            // Construct multi-row parameterized query
            let paramIndex = 1;
            const valueClauses = [];
            const values = [];

            for (const row of batch) {
                const rowParams = [];
                for (const col of columns) {
                    rowParams.push(`$${paramIndex++}`);
                    values.push(row[col]);
                }
                valueClauses.push(`(${rowParams.join(', ')})`);
            }

            const sql = `INSERT INTO "${tableName}" (${colsSql}) VALUES ${valueClauses.join(', ')} ON CONFLICT DO NOTHING`;
            await client.query(sql, values);

            migrated += batch.length;
            process.stdout.write(`\r   Synced ${migrated} / ${rows.length} rows...`);
        }
        await client.query('COMMIT');
        // Reset serial sequence after explicit ID inserts
        try {
            await client.query(`SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE(MAX(id), 1)) FROM "${tableName}"`);
        } catch (_) {}
        console.log(`\n✅ Successfully migrated [${tableName}] (${migrated} rows).`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`\n❌ Error migrating table [${tableName}]:`, err.message);
    } finally {
        client.release();
    }
}

async function runFullMigration() {
    try {
        await initPostgresSchema();

        const tables = [
            'users',
            'custom_skills',
            'skill_progress',
            'subscriptions',
            'licenses',
            'download_logs',
            'user_purchases',
            'user_payment_methods',
            'report_orders',
            'nsqf_qps',
            'nsqf_nos',
            'nsqf_modules',
            'nsqf_pcs',
            'nsqf_video_audit_logs',
            'nsqf_curricula',
            'nsqf_videos',
            'video_swap_suggestions',
            'user_pc_progress',
            'youtube_search_cache'
        ];

        for (const tbl of tables) {
            await migrateTableData(tbl);
        }

        console.log('\n🎉 ALL DATA MIGRATED TO NEON POSTGRESQL CLOUD SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runFullMigration();
