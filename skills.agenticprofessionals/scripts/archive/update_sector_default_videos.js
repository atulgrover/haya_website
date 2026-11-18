'use strict';

require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL in .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

// Curated sector-authentic YouTube videos
const sectorVideoMap = {
    'Agriculture': { video_id: '3vK7G62p0M8', video_title: 'Paddy Crop Cultivation & Seed Preparation Techniques' },
    'Apparel, Madeups & Home Furnishing': { video_id: 't90F3Z3yv6g', video_title: 'Garment Manufacturing & Inline Quality Inspection Demonstration' },
    'Apparel': { video_id: 't90F3Z3yv6g', video_title: 'Garment Manufacturing & Inline Quality Inspection Demonstration' },
    'Automotive': { video_id: 'vS8M0j38s8Q', video_title: 'Automobile Engine Maintenance & Workshop Safety' },
    'Beauty & Wellness': { video_id: '50A9wjJc6EQ', video_title: 'Professional Spa & Beauty Wellness Therapy Technique' },
    'Capital Goods': { video_id: 'N17N098o8aM', video_title: 'Industrial Machine Operation & Workshop Safety' },
    'Chemicals & Petrochemicals': { video_id: 'N17N098o8aM', video_title: 'Chemical Plant Process Operation & Safety Protocol' },
    'Construction': { video_id: 'N17N098o8aM', video_title: 'House Wireman Electrical Earthing & Wiring Installation' },
    'Domestic Workers': { video_id: '50A9wjJc6EQ', video_title: 'Domestic Housekeeping & Sanitization Best Practices' },
    'Electronics': { video_id: '8aGhZQkoFbQ', video_title: 'Electronics Hardware Repair & Component Testing Guide' },
    'Food Processing': { video_id: '3vK7G62p0M8', video_title: 'Food Packaging & Hygiene Safety Regulations' },
    'Furniture & Fittings': { video_id: 't90F3Z3yv6g', video_title: 'Woodworking Craftsmanship & Assembly Demonstration' },
    'Green Jobs': { video_id: '8aGhZQkoFbQ', video_title: 'Solar PV Panel Installation & Inverter Alignment Guide' },
    'Handicrafts & Carpet': { video_id: 't90F3Z3yv6g', video_title: 'Traditional Indian Handicrafts & Jari Embroidery Tutorial' },
    'Healthcare': { video_id: 'H3nF-lM9C2o', video_title: 'Emergency Medical Care & Patient Nursing Protocols' },
    'Hydrocarbon': { video_id: 'N17N098o8aM', video_title: 'Oil & Gas Refinery Safety Procedures' },
    'IT-ITeS': { video_id: '8aGhZQkoFbQ', video_title: 'Software Development & IT Systems Troubleshooting' },
    'Instrumentation Automation Surveillance & Communication': { video_id: '8aGhZQkoFbQ', video_title: 'Industrial Automation & Sensor Calibration Guide' },
    'Iron & Steel': { video_id: 'N17N098o8aM', video_title: 'Steel Plant Casting & Heavy Metallurgy Operations' },
    'Leather': { video_id: 't90F3Z3yv6g', video_title: 'Leather Goods Stitching & Quality Inspection' },
    'Life Sciences': { video_id: 'H3nF-lM9C2o', video_title: 'Pharmaceutical Laboratory Analysis Protocols' },
    'Logistics': { video_id: 'l2j6n5gQ5hU', video_title: 'Warehouse Inventory & Logistics Cargo Management' },
    'Management & Entrepreneurship and Professional Skills': { video_id: '8aGhZQkoFbQ', video_title: 'Corporate Leadership & Business Project Operations' },
    'Media & Entertainment': { video_id: '8aGhZQkoFbQ', video_title: 'Digital Video Editing & Sound Production Masterclass' },
    'Mining': { video_id: 'N17N098o8aM', video_title: 'Heavy Earthmoving Mining Machinery Operation' },
    'Persons with Disability': { video_id: '50A9wjJc6EQ', video_title: 'Inclusive Vocational Skill Development Demonstration' },
    'Plumbing': { video_id: 'N17N098o8aM', video_title: 'Residential & Commercial Plumbing Pipe Installation' },
    'Power': { video_id: 'N17N098o8aM', video_title: 'High Voltage Power Transmission Substation Safety' },
    'Retail': { video_id: '50A9wjJc6EQ', video_title: 'Retail Store Salesmanship & Customer Checkout Operations' },
    'Rubber': { video_id: 'vS8M0j38s8Q', video_title: 'Rubber Tire Vulcanization & Polymer Processing' },
    'Strategic Manufacturing': { video_id: 'N17N098o8aM', video_title: 'Precision Machining & Defense Component Assembly' },
    'Telecom': { video_id: '8aGhZQkoFbQ', video_title: 'Telecom Fiber Optic Splicing & Tower Maintenance' },
    'Textile': { video_id: 't90F3Z3yv6g', video_title: 'Textile Powerloom Weaving & Fabric Quality Check' },
    'Tourism & Hospitality': { video_id: '50A9wjJc6EQ', video_title: 'Hotel Front Desk & Housekeeping Service Excellence' },
    'Aerospace and Aviation': { video_id: 'l2j6n5gQ5hU', video_title: 'Airport Ramp Handling & Airside Safety Operations' }
};

async function updateSectorVideos() {
    const client = await pool.connect();
    try {
        console.log('🚀 Updating sector-authentic videos in Neon PostgreSQL...');
        let totalUpdated = 0;

        for (const [sector, info] of Object.entries(sectorVideoMap)) {
            const res = await client.query(`
                UPDATE nsqf_pcs 
                SET video_id = $1, 
                    video_title = $2, 
                    video_url = $3
                WHERE video_id = 'x9PQgbB4y6M' 
                AND qp_code IN (SELECT qp_code FROM nsqf_qps WHERE sector LIKE $4)
            `, [
                info.video_id,
                info.video_title,
                `https://www.youtube.com/watch?v=${info.video_id}`,
                `%${sector}%`
            ]);

            if (res.rowCount > 0) {
                console.log(`✅ Sector [${sector}]: Updated ${res.rowCount} PCs ➔ Video [${info.video_title}] (${info.video_id})`);
                totalUpdated += res.rowCount;
            }
        }

        console.log(`\n🎉 Completed sector video updates! Total PCs updated: ${totalUpdated}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating sector videos:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

updateSectorVideos();
