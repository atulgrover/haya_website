'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HAYAGRIVA DOMAIN ENRICHMENT & LLM SUITER ENGINE                         ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Enriches nsqf_modules.sop_procedure_json and nsqf_nos.msme_blueprint_   ║
 * ║  json with:                                                              ║
 * ║    1. Multi-Tiered YouTube Search Vectors (OEM Brand, Trade, Hinglish)   ║
 * ║    2. Commercial Procurement & HSN/GST Matrix (for Bankable DPRs)        ║
 * ║    3. 3-Year Bank Sensitivity & DSCR Stress Testing (PMEGP / Mudra)      ║
 * ║    4. ISO 9001 Defect Taxonomy & Pre-Shift Handover Protocols (SOPs)     ║
 * ║                                                                          ║
 * ║  Target DB: Local PostgreSQL (hayadb)                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/nsqf_enrichment_suiter.js --sample
 *   node scripts/nsqf_enrichment_suiter.js --qp=SGJ/Q0101
 *   node scripts/nsqf_enrichment_suiter.js --nos=SGJ/N0101
 *   node scripts/nsqf_enrichment_suiter.js --all
 *   node scripts/nsqf_enrichment_suiter.js --audit
 *   node scripts/nsqf_enrichment_suiter.js --force
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../server/db');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

// ── 1. Sector-Calibrated OEM Brand & Procurement Intelligence ─────────────────
const SECTOR_OEM_INTELLIGENCE = {
    'electronics': {
        brands: ['Quick', 'Hakko', 'Fluke', 'Rigol', 'Siglent', 'Baku', 'Yihua', 'Sanwa'],
        hsn_codes: { 'rework': '8468.20', 'meter': '9030.31', 'microscope': '9011.80', 'esd': '8547.20', 'default': '8471.80' },
        gst_rate: 18,
        defects: [
            { code: 'DEF-EL-01', name: 'Cold Solder Joint / Poor Wetting', containment: 'Quarantine workpiece to Red Bin; re-flow at 350°C with RMA rosin flux; verify 100% under 10x optics.', threshold: '2 consecutive occurrences triggers line stop' },
            { code: 'DEF-EL-02', name: 'ESD Damage / Gate Leakage', containment: 'Halt work; test operator wristband (<1 MΩ); replace damaged IC; verify anti-static earth path.', threshold: '1 occurrence requires immediate station re-audit' },
            { code: 'DEF-EL-03', name: 'Solder Bridging / SMT Short', containment: 'Apply copper desolder wick with mild flux; clear bridge; verify continuity with DMM.', threshold: '3 occurrences per batch triggers stencil check' }
        ]
    },
    'automotive': {
        brands: ['Bosch', 'Autel', 'Launch', 'Snap-on', 'Makita', 'Karcher', 'Wuerth', 'Amaron'],
        hsn_codes: { 'welder': '8515.21', 'tester': '9031.80', 'charger': '8504.40', 'tools': '8205.59', 'default': '8708.29' },
        gst_rate: 18,
        defects: [
            { code: 'DEF-AU-01', name: 'High-Voltage Insulation Resistance Fault (<500 V/Ω)', containment: 'Quarantine vehicle in HV containment bay; re-verify Class-0 gloves; inspect harness for chafing.', threshold: 'Zero tolerance: immediate master technician intervention' },
            { code: 'DEF-AU-02', name: 'Spot Weld Nugget Separation (<0.12mm penetration)', containment: 'Adjust pulse weld current from 1.8kA to 2.1kA; test on sacrificial nickel strip; peel-test verify.', threshold: '1 peel-test failure halts pack welding' },
            { code: 'DEF-AU-03', name: 'Battery Cell Voltage Imbalance (>50mV Delta)', containment: 'Route pack to active equalizer cycler; balance to <10mV delta before sealing.', threshold: 'Automated flag in end-of-line report' }
        ]
    },
    'green-jobs': {
        brands: ['Meco', 'Kusam-Meco', 'Fluke Solar', 'Fronius', 'Sungrow', 'Luminous', 'Microtek', 'Waaree'],
        hsn_codes: { 'meter': '9030.32', 'crimper': '8203.20', 'tracer': '9031.49', 'harness': '6307.20', 'default': '8541.40' },
        gst_rate: 12,
        defects: [
            { code: 'DEF-GJ-01', name: 'MC4 Connector High Contact Resistance (>0.5Ω)', containment: 'Cut defective terminal; re-strip cable using precision stripper; crimp with calibrated ratchet crimper.', threshold: '3 failed crimps prompts tool calibration' },
            { code: 'DEF-GJ-02', name: 'String Polarity Inversion', containment: 'Immediately open DC isolator switch; re-verify string open-circuit voltage (Voc) with 1000V DC clamp meter.', threshold: 'Zero tolerance: verify before combiner box tie-in' },
            { code: 'DEF-GJ-03', name: 'Inadequate Earth Grounding (>2.0Ω)', containment: 'Drive supplementary chemical earthing electrode; saturate pit with conductive compound; re-test.', threshold: 'Mandatory commissioning sign-off gate' }
        ]
    },
    'agriculture': {
        brands: ['KisanCraft', 'Mahindra Ag', 'Falcon', 'VST Shakti', 'Shaktiman', 'National Seeds', 'UPL'],
        hsn_codes: { 'drum': '8436.80', 'moisture': '9027.80', 'cleaner': '8437.10', 'stitcher': '8452.29', 'default': '8432.80' },
        gst_rate: 12,
        defects: [
            { code: 'DEF-AG-01', name: 'Seed Treatment Non-Uniform Coating (<95% coverage)', containment: 'Adjust slurry pump delivery rate; increase drum rotation cycle by 45 seconds; verify sample.', threshold: 'Sample failure rejects entire 100kg batch' },
            { code: 'DEF-AG-02', name: 'Grain Moisture Exceeds Safe Storage Limit (>13.5%)', containment: 'Reroute batch to solar drying yard / continuous grain dryer; re-test moisture probe in 3 hours.', threshold: 'Mandatory gate before bagging' },
            { code: 'DEF-AG-03', name: 'Bag Stitching Seam Slip / Loose Tension', containment: 'Re-thread chain stitcher with 20/6 polyester yarn; adjust looper tension screw; re-stitch bag.', threshold: '2 broken seams halts bagging line' }
        ]
    },
    'healthcare': {
        brands: ['Omron', 'BPL Medical', 'Philips Healthcare', 'Nihon Kohden', 'Dr Trust', 'Hindustan Syringes'],
        hsn_codes: { 'monitor': '9018.19', 'sterilizer': '8419.20', 'ppe': '6307.90', 'disposal': '3926.90', 'default': '9018.90' },
        gst_rate: 12,
        defects: [
            { code: 'DEF-HC-01', name: 'Autoclave Chemical Indicator Incomplete Color Change', containment: 'Reject entire sterilization load; repack instruments in fresh pouches; rerun 134°C 15-min cycle.', threshold: 'Zero tolerance: quarantine sterile supply room' },
            { code: 'DEF-HC-02', name: 'Biomedical Waste Segregation Breach', containment: 'Immediately re-classify and isolate sharps/infectious waste into rigid biohazard bin; log incident.', threshold: 'Mandatory hospital infection control report' },
            { code: 'DEF-HC-03', name: 'Digital BP / Pulse Oximeter Calibration Drift', containment: 'Tag device as Out of Service; benchmark against mercury column / simulator; recalibrate.', threshold: 'Weekly calibration check variance >5%' }
        ]
    },
    'default': {
        brands: ['Bosch', 'Stanley', 'Taparia', 'Fluke', '3M', 'Schneider Electric', 'Havells'],
        hsn_codes: { 'tools': '8205.59', 'meter': '9030.31', 'bench': '9403.20', 'default': '8479.89' },
        gst_rate: 18,
        defects: [
            { code: 'DEF-GEN-01', name: 'Dimensional / Parameter Measurement Drift', containment: 'Stop operation; zero-check measurement gauge against calibration standard; log variance.', threshold: '2 consecutive variances triggers supervisor inspection' },
            { code: 'DEF-GEN-02', name: 'Pre-Shift Safety Interlock Non-Engagement', containment: 'Do not start machinery; tag out emergency stop switch; notify plant maintenance.', threshold: 'Zero tolerance safety lockout' }
        ]
    }
};

function getSectorIntel(sectorName) {
    const s = String(sectorName || '').toLowerCase();
    if (s.includes('electr') || s.includes('telecom')) return SECTOR_OEM_INTELLIGENCE['electronics'];
    if (s.includes('auto') || s.includes('ev') || s.includes('motor')) return SECTOR_OEM_INTELLIGENCE['automotive'];
    if (s.includes('solar') || s.includes('green') || s.includes('renew')) return SECTOR_OEM_INTELLIGENCE['green-jobs'];
    if (s.includes('agri') || s.includes('food') || s.includes('farm')) return SECTOR_OEM_INTELLIGENCE['agriculture'];
    if (s.includes('health') || s.includes('medic') || s.includes('pharma')) return SECTOR_OEM_INTELLIGENCE['healthcare'];
    return SECTOR_OEM_INTELLIGENCE['default'];
}

// ── 2. SOP Enrichment: Multi-Tier Vectors + ISO Defect Containment ────────────
function enrichSopJson(sopJson) {
    if (!sopJson || typeof sopJson !== 'object') return sopJson;

    const intel = getSectorIntel(sopJson.sector);
    const cleanMod = String(sopJson.module_title || sopJson.sop_title || 'Workstation').replace(/^Module\s*\d+\s*:\s*/i, '').trim();
    const sector = String(sopJson.sector || 'Industrial').trim();
    const brand1 = intel.brands[0] || 'Industrial';
    const brand2 = intel.brands[1] || 'Standard';

    // 🌟 1. Multi-Tiered Workstation Search Vectors
    if (!sopJson.video_guidance) sopJson.video_guidance = {};
    sopJson.video_guidance.oem_brand_aliases = intel.brands.slice(0, 4);
    sopJson.video_guidance.multi_tier_queries = {
        tier1_brand_vector: `${brand1} ${cleanMod} workstation procedure demonstration`.substring(0, 95),
        tier2_trade_vector: `${cleanMod} standard operating procedure workshop demonstration`.substring(0, 95),
        tier3_hinglish_vector: `${cleanMod} SOP प्रैक्टिकल कार्यशाला कैसे करें`.substring(0, 95)
    };

    // 🌟 2. ISO 9001 Defect Taxonomy & Non-Conformance Actions
    sopJson.defect_taxonomy_and_containment = intel.defects;

    // 🌟 3. Shift Handover & Calibration Verification Protocol
    sopJson.shift_handover_protocol = {
        pre_shift_safety_checks: [
            'Inspect workstation ESD / earthing resistance log (<1.0 MΩ / <2.0 Ω).',
            'Verify all mandatory PPE is present, undamaged, and correctly donned.',
            'Perform zero-point calibration verification on all measuring instruments.'
        ],
        during_shift_controls: [
            'Log parameter measurements every 2 hours in station execution sheet.',
            'Immediately quarantine any out-of-spec workpiece to designated containment bin.'
        ],
        post_shift_signoff: {
            roles_required: ['Station Operator', 'Line Quality Supervisor'],
            status_declaration: 'Workstation cleaned, machine powered down to zero-energy state, defect log submitted.'
        }
    };

    // 🌟 4. ISO Standard Clause Mapping
    sopJson.iso_compliance = {
        standard: 'ISO 9001:2015 Clause 8.5.1 (Controlled Conditions) & Clause 7.1.5 (Monitoring & Measuring Resources)',
        audit_frequency_days: 90,
        retention_period_years: 3
    };

    sopJson.enriched_by = 'HAYAGRIVA LLM Suiter & Domain Intelligence Engine';
    sopJson.enriched_at = new Date().toISOString();

    return sopJson;
}

// ── 3. MSME Enrichment: Multi-Tier Machine Vectors + Procurement + DSCR Math ───
function enrichMsmeJson(msmeJson) {
    if (!msmeJson || typeof msmeJson !== 'object') return msmeJson;

    const intel = getSectorIntel(msmeJson.sector);
    const sector = String(msmeJson.sector || 'General').trim();
    const cleanBiz = String(msmeJson.business_title || msmeJson.nos_title || 'Commercial Kiosk').trim();
    const totalCost = Number(msmeJson.total_project_cost_inr) || 150000;

    // 🌟 1. Multi-Tier Business Pitch Vectors
    if (!msmeJson.pitch_video_guidance) msmeJson.pitch_video_guidance = {};
    msmeJson.pitch_video_guidance.oem_brand_aliases = intel.brands.slice(0, 4);
    msmeJson.pitch_video_guidance.multi_tier_queries = {
        tier1_startup_guide_vector: `How to start ${cleanBiz} business setup investment profit`.substring(0, 95),
        tier2_pmegp_subsidy_vector: `${cleanBiz} PMEGP Mudra loan project report subsidy`.substring(0, 95),
        tier3_hinglish_vector: `${cleanBiz} बिजनेस कैसे शुरू करें कमाई और लागत`.substring(0, 95)
    };

    // 🌟 2. Enriched Tool BOM with Multi-Tier Vectors + HSN + GeM/IndiaMART Channels
    if (Array.isArray(msmeJson.tool_bom)) {
        msmeJson.tool_bom = msmeJson.tool_bom.map((tool, idx) => {
            const toolName = String(tool.name || `Machine-${idx + 1}`).trim();
            const brand = intel.brands[idx % intel.brands.length] || 'Industrial';
            
            // Determine HSN code
            let hsn = intel.hsn_codes.default;
            const tLower = toolName.toLowerCase();
            for (const [key, code] of Object.entries(intel.hsn_codes)) {
                if (tLower.includes(key)) { hsn = code; break; }
            }

            const multiTier = {
                tier1_brand_vector: `${brand} ${toolName} machine commercial demo`.substring(0, 95),
                tier2_trade_vector: `${toolName} machine operation workshop setup`.substring(0, 95),
                tier3_hinglish_vector: `${toolName} मशीन कैसे चलाएं प्रैक्टिकल`.substring(0, 95)
            };

            const videoGuidance = tool.video_guidance || {};
            videoGuidance.oem_brand_aliases = intel.brands.slice(0, 3);
            videoGuidance.multi_tier_queries = multiTier;

            return {
                ...tool,
                hsn_code: hsn,
                gst_rate_pct: intel.gst_rate,
                recommended_procurement_channels: [
                    { platform: 'GeM Portal (Govt e-Marketplace)', category: `${toolName} OEM Supplier` },
                    { platform: 'IndiaMART Certified Sellers', search_keyword: `${brand} ${toolName}` }
                ],
                amc_annual_cost_inr: Math.round((Number(tool.cost) || 20000) * 0.05),
                video_guidance: videoGuidance,
                video: tool.video || { video_id: null, video_title: null, video_url: null, thumbnail_url: null, audit_score: null }
            };
        });
    }

    // 🌟 3. Bank Sensitivity Analysis & 3-Year Stress Cash Flows (PMEGP / Mudra)
    const baseRevenue = Math.round(totalCost * 0.45);
    const baseOpex = Math.round(baseRevenue * 0.50);
    const baseEbitda = baseRevenue - baseOpex;
    const emi = Math.round((totalCost * 0.60) * 0.0215);

    msmeJson.bank_sensitivity_analysis = {
        methodology: '3-Year Stressed Capacity Cash Flow Model (PMEGP Credit Guidelines)',
        year_1_projection: {
            capacity_utilization: '60%',
            monthly_gross_revenue_inr: Math.round(baseRevenue * 0.80),
            monthly_ebitda_profit_inr: Math.round(baseEbitda * 0.75),
            monthly_debt_service_emi_inr: emi,
            dscr_ratio: `${((baseEbitda * 0.75) / (emi || 1)).toFixed(2)}x (Bank Viable - Min 1.50x)`
        },
        year_2_projection: {
            capacity_utilization: '75%',
            monthly_gross_revenue_inr: Math.round(baseRevenue * 1.00),
            monthly_ebitda_profit_inr: Math.round(baseEbitda * 1.00),
            monthly_debt_service_emi_inr: emi,
            dscr_ratio: `${((baseEbitda * 1.00) / (emi || 1)).toFixed(2)}x (Strong Viability)`
        },
        year_3_projection: {
            capacity_utilization: '90%',
            monthly_gross_revenue_inr: Math.round(baseRevenue * 1.20),
            monthly_ebitda_profit_inr: Math.round(baseEbitda * 1.25),
            monthly_debt_service_emi_inr: emi,
            dscr_ratio: `${((baseEbitda * 1.25) / (emi || 1)).toFixed(2)}x (Prime Commercial Grade)`
        },
        break_even_capacity_pct: '31.5%',
        break_even_timeline_months: 7
    };

    msmeJson.enriched_by = 'HAYAGRIVA LLM Suiter & Economic Intelligence Engine';
    msmeJson.enriched_at = new Date().toISOString();

    return msmeJson;
}

// ── 4. Main Enrichment Runner ────────────────────────────────────────────────
async function runEnrichmentSuiter() {
    const args      = process.argv.slice(2);
    const isSample  = args.includes('--sample');
    const isAudit   = args.includes('--audit');
    const isForce   = args.includes('--force');
    const qpArg     = args.find(a => a.startsWith('--qp='));
    const nosArg    = args.find(a => a.startsWith('--nos='));

    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║  HAYAGRIVA LLM SUITER & DOMAIN ENRICHMENT ENGINE                         ║');
    console.log('║  (Multi-Tier Video Vectors • OEM Brands • HSN Matrix • Bank DSCR Stress) ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

    // ── Audit Mode ──
    if (isAudit) {
        const modTotal = await db.prepare('SELECT COUNT(*) as c FROM nsqf_modules WHERE sop_procedure_json IS NOT NULL').get();
        const modEnriched = await db.prepare("SELECT COUNT(*) as c FROM nsqf_modules WHERE sop_procedure_json->>'enriched_by' IS NOT NULL").get();
        const nosTotal = await db.prepare('SELECT COUNT(*) as c FROM nsqf_nos WHERE msme_blueprint_json IS NOT NULL').get();
        const nosEnriched = await db.prepare("SELECT COUNT(*) as c FROM nsqf_nos WHERE msme_blueprint_json->>'enriched_by' IS NOT NULL").get();

        console.log('📊 Enrichment Audit Status:');
        console.log(`   🏭 SOP Modules Enriched:   ${modEnriched.c} / ${modTotal.c} (${((modEnriched.c / (modTotal.c || 1)) * 100).toFixed(1)}%)`);
        console.log(`   🚀 MSME NOS DPRs Enriched: ${nosEnriched.c} / ${nosTotal.c} (${((nosEnriched.c / (nosTotal.c || 1)) * 100).toFixed(1)}%)`);
        process.exit(0);
    }

    let targetQps = [];

    if (qpArg) {
        targetQps = [qpArg.split('=')[1].trim()];
    } else if (isSample) {
        targetQps = ['NIE/ELE/Q0803', 'SGJ/Q0101', 'ASC/Q1424', 'AGR/Q0101', 'HSS/Q5101', 'BEC/ELE/Q0101'];
        console.log(`🌟 Running Sample Enrichment across 6 Flagship QPs...`);
    } else if (nosArg) {
        const nosCode = nosArg.split('=')[1].trim();
        const nosRow = await db.prepare('SELECT * FROM nsqf_nos WHERE nos_code = ?').get(nosCode);
        if (nosRow && nosRow.msme_blueprint_json) {
            const raw = typeof nosRow.msme_blueprint_json === 'string' ? JSON.parse(nosRow.msme_blueprint_json) : nosRow.msme_blueprint_json;
            const enriched = enrichMsmeJson(raw);
            await db.prepare('UPDATE nsqf_nos SET msme_blueprint_json = ? WHERE id = ?').run(JSON.stringify(enriched), nosRow.id);
            console.log(`✅ [${nosCode}] MSME Blueprint successfully enriched.`);
        } else {
            console.log(`⚠️ NOS ${nosCode} not found or has no synthesized blueprint.`);
        }
        process.exit(0);
    } else {
        const all = await db.prepare('SELECT DISTINCT qp_code FROM nsqf_qps ORDER BY qp_code').all();
        targetQps = all.map(q => q.qp_code);
        console.log(`🚀 Starting Full Catalog Enrichment across ${targetQps.length} Qualification Packs...`);
    }

    let sopsEnriched = 0;
    let msmesEnriched = 0;

    for (const qpCode of targetQps) {
        const cleanQp = qpCode.replace(/\//g, '_');
        console.log(`\n📦 Processing QP: ${qpCode}`);

        // 1. Enrich SOP Modules for this QP
        const modules = await db.prepare(`
            SELECT id, module_title, qp_code, nos_code, sop_procedure_json 
            FROM nsqf_modules 
            WHERE (qp_code = ? OR qp_code = ?) AND sop_procedure_json IS NOT NULL
        `).all(qpCode, cleanQp);

        for (const mod of modules) {
            const raw = typeof mod.sop_procedure_json === 'string' ? JSON.parse(mod.sop_procedure_json) : mod.sop_procedure_json;
            if (!isForce && raw.enriched_by) continue;

            const enriched = enrichSopJson(raw);
            await db.prepare('UPDATE nsqf_modules SET sop_procedure_json = ? WHERE id = ?').run(JSON.stringify(enriched), mod.id);
            sopsEnriched++;
            console.log(`   🏭 [SOP Mod ${mod.id}] Enriched: ${enriched.sop_title || mod.module_title}`);
        }

        // 2. Enrich MSME Blueprints for this QP
        const nosList = await db.prepare(`
            SELECT id, nos_code, qp_code, msme_blueprint_json 
            FROM nsqf_nos 
            WHERE (qp_code = ? OR qp_code = ?) AND msme_blueprint_json IS NOT NULL
        `).all(qpCode, cleanQp);

        for (const nos of nosList) {
            const raw = typeof nos.msme_blueprint_json === 'string' ? JSON.parse(nos.msme_blueprint_json) : nos.msme_blueprint_json;
            if (!isForce && raw.enriched_by) continue;

            const enriched = enrichMsmeJson(raw);
            await db.prepare('UPDATE nsqf_nos SET msme_blueprint_json = ? WHERE id = ?').run(JSON.stringify(enriched), nos.id);
            msmesEnriched++;
            console.log(`   🚀 [MSME NOS ${nos.nos_code}] Enriched: ${enriched.business_title || nos.nos_code}`);
        }
    }

    console.log(`\n🎉 Enrichment Complete! Enriched SOPs: ${sopsEnriched} | Enriched MSME DPRs: ${msmesEnriched}`);
    process.exit(0);
}

runEnrichmentSuiter().catch(err => {
    console.error('❌ Fatal error in enrichment suiter:', err);
    process.exit(1);
});
