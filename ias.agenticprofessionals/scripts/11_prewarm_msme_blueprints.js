'use strict';
/**
 * HAYAGRIVA Top-Trade MSME Blueprint Pre-Warming Script
 * Pre-synthesizes high-demand trades across Agriculture, Solar, Automotive, Electronics, and Food Processing.
 */

require('dotenv').config();
const db = require('../server/db');
const { generateMsmeBlueprint } = require('../server/utils/msmeSynthesizer');

const TARGET_QPS = [
    'AGR/Q6701', // Solar Pump Technician
    'AGR/Q1106', // Repair and Maintenance Technician (Farm Machinery)
    'ASC/Q1409', // Automotive Engine Repair Technician
    'ASC/Q1407', // Automotive Paint Repair Assistant
    'AGR/Q0101', // Micro Irrigation Technician
    'AGR/Q0203'  // Sugarcane Cultivator
];

async function main() {
    console.log(`Starting MSME Blueprint Pre-Warming for ${TARGET_QPS.length} key trades...\n`);

    for (let i = 0; i < TARGET_QPS.length; i++) {
        const qpCode = TARGET_QPS[i];
        try {
            console.log(`[${i + 1}/${TARGET_QPS.length}] Pre-warming blueprint for ${qpCode}...`);
            const bp = await generateMsmeBlueprint(qpCode);
            console.log(`   ✅ Success: "${bp.business_title}" | CAPEX: ₹ ${(bp.financial_model?.total_project_cost_inr || 0).toLocaleString('en-IN')}`);
        } catch (err) {
            console.error(`   ❌ Failed for ${qpCode}:`, err.message);
        }
    }

    console.log('\nPre-warming completed! All blueprints stored permanently in PostgreSQL.');
    process.exit(0);
}

main();
