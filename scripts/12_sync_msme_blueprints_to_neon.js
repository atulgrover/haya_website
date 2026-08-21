'use strict';
/**
 * HAYAGRIVA — Sync MSME Business Blueprints & HIL Curations to Production Neon
 */

require('dotenv').config();
const { Pool } = require('pg');

async function syncToNeon() {
    if (!process.env.NEON_DATABASE_URL) {
        console.error('❌ NEON_DATABASE_URL is not set in .env');
        process.exit(1);
    }

    console.log('🔗 Connecting to Local PostgreSQL and Cloud Neon PostgreSQL...');
    const local = new Pool({ connectionString: process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:hayapass@localhost:5432/hayadb' });
    const neon = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

    try {
        // 1. Create msme_business_blueprints & hil_video_curations on Neon
        console.log('📦 Ensuring tables exist on Neon...');
        await neon.query(`
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
        `);
        console.log('✅ Tables created/verified on Neon.');

        // 2. Fetch local blueprints
        const localRes = await local.query('SELECT * FROM msme_business_blueprints ORDER BY id ASC');
        console.log(`📥 Found ${localRes.rows.length} local blueprints to sync to Neon.`);

        for (const row of localRes.rows) {
            await neon.query(`
                INSERT INTO msme_business_blueprints
                    (qp_code, business_title, tagline, executive_summary, target_customers, revenue_streams,
                     machinery_bom, financial_model, launch_playbook, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (qp_code) DO UPDATE SET
                    business_title = EXCLUDED.business_title,
                    tagline = EXCLUDED.tagline,
                    executive_summary = EXCLUDED.executive_summary,
                    target_customers = EXCLUDED.target_customers,
                    revenue_streams = EXCLUDED.revenue_streams,
                    machinery_bom = EXCLUDED.machinery_bom,
                    financial_model = EXCLUDED.financial_model,
                    launch_playbook = EXCLUDED.launch_playbook,
                    updated_at = EXCLUDED.updated_at
            `, [
                row.qp_code,
                row.business_title,
                row.tagline,
                row.executive_summary,
                JSON.stringify(row.target_customers || []),
                JSON.stringify(row.revenue_streams || []),
                JSON.stringify(row.machinery_bom || []),
                JSON.stringify(row.financial_model || {}),
                JSON.stringify(row.launch_playbook || []),
                row.created_at,
                row.updated_at
            ]);
            console.log(`   ✅ Synced: ${row.qp_code} (${row.business_title})`);
        }

        // Verify count on Neon
        const neonCountRes = await neon.query('SELECT COUNT(*) FROM msme_business_blueprints');
        console.log(`\n🎉 Success! Neon now has ${neonCountRes.rows[0].count} MSME blueprints.`);

    } catch (err) {
        console.error('❌ Sync error:', err);
    } finally {
        await local.end();
        await neon.end();
    }
}

syncToNeon();
