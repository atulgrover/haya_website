'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  NOS-TO-MSME BLUEPRINT & BANKABLE DPR SYNTHESIZER                        ║
 * ║  Transforms nsqf_nos + nsqf_pcs into Turnkey Business Blueprints,        ║
 * ║  Tool BOMs, and PMEGP/Mudra Bankable Detailed Project Reports (DPR).     ║
 * ║                                                                          ║
 * ║  Usage:                                                                  ║
 * ║    node scripts/nsqf_msme_synthesizer.js --nos=ELE/N0803                 ║
 * ║    node scripts/nsqf_msme_synthesizer.js --qp=SGJ/Q0101                  ║
 * ║    node scripts/nsqf_msme_synthesizer.js --sample                        ║
 * ║    node scripts/nsqf_msme_synthesizer.js --all                           ║
 * ║    node scripts/nsqf_msme_synthesizer.js --audit                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../server/db');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

// ── Video Guidance Generators for MSME Machinery & Business Pitch Videos ─────

/**
 * Builds video harvesting guidance for a single machine/tool in the BOM.
 * The harvester will use this to find commercial operation demos on YouTube.
 */
function buildMachineVideoGuidance(machineName, machineSpec, sector) {
    const cleanName = String(machineName || '').trim();
    const cleanSpec = String(machineSpec || '').trim();
    const sectorStr = String(sector || 'industrial').trim();

    // Extract key spec tokens for tool_keywords
    const specTokens = cleanSpec.toLowerCase()
        .split(/[,;()\[\]]+/)
        .map(t => t.trim())
        .filter(t => t.length > 3)
        .slice(0, 4)
        .join(', ');

    return {
        search_query: `${cleanName} machine commercial operation demonstration setup`.substring(0, 95).trim(),
        search_query_hi: `${cleanName} मशीन काम करने का तरीका डेमो`.substring(0, 95).trim(),
        intent: `${cleanName} commercial operation demonstration`,
        tool_keywords: `${cleanName.toLowerCase()}, ${specTokens}`.substring(0, 120),
        positive_signals: 'machine, demo, operation, working, commercial, factory, industrial, setup, how to use',
        negative_keywords: '-unboxing -review -shorts -DIY -homemade -reaction -vlog -prank',
        min_duration_seconds: 120,
        max_duration_seconds: 600
    };
}

/**
 * Builds video harvesting guidance for the overall business pitch video.
 * Targets "how to start X business" style videos with cost/profit/subsidy info.
 */
function buildPitchVideoGuidance(businessTitle, sector) {
    const cleanBiz = String(businessTitle || '').trim();
    const sectorStr = String(sector || 'industrial').trim();

    return {
        search_query: `How to start ${cleanBiz} business investment profit PMEGP`.substring(0, 95).trim(),
        search_query_hi: `${cleanBiz} बिजनेस कैसे शुरू करें लागत मुनाफा PMEGP`.substring(0, 95).trim(),
        intent: `Business startup guide for ${cleanBiz}`,
        tool_keywords: cleanBiz.toLowerCase(),
        positive_signals: 'business idea, startup, investment, profit, PMEGP, Mudra, subsidy, cost, income, margin, project report',
        negative_keywords: '-scam -MLM -shorts -reaction -vlog -prank -crypto -forex',
        min_duration_seconds: 240,
        max_duration_seconds: 1500
    };
}

// ── Deterministic Heuristic Tool BOM & DPR Generator ──────────────────────────
function generateHeuristicMsmeBlueprint(nosRow, qpRow, pcs) {
    const nosTitle = String(nosRow.nos_title || '').trim();
    const sector = String(qpRow.sector || 'General').toLowerCase();
    const cleanTitle = nosTitle.replace(/^Perform\s*|^Carry out\s*|^Manage\s*|^Assist in\s*/i, '').trim();

    // Check if this is a Generic / Non-Technical NOS
    const isGeneric = /employability|safety|health|environment|soft skills|teamwork|communication/i.test(nosTitle);

    let businessTitle = '';
    let modelType = '';
    let tools = [];
    let baseCapex = 0;
    let spaceSqft = 150;
    let powerReq = '2 kW Single Phase';
    let targetClients = [];

    if (isGeneric) {
        // Model B: B2B Agency / Safety / Manpower Service
        modelType = 'B2B_Agency_Service';
        if (/safety|health|hazard/i.test(nosTitle)) {
            businessTitle = `Turnkey Industrial Safety & PPE Supply Agency (${nosRow.nos_code})`;
            tools = [
                { name: 'Industrial Sound Level & Lux Meter Kit', spec: 'Digital calibrated meter with data logging', qty: 1, cost: 14500 },
                { name: 'Lockout/Tagout (LOTO) Master Kit & Station Rack', spec: 'OSHA standard hasps, safety padlocks, valve lockouts', qty: 2, cost: 18000 },
                { name: 'Gas & Air Quality Multi-Detector', spec: '4-gas hazardous vapor detector (LEL, O2, H2S, CO)', qty: 1, cost: 26000 },
                { name: 'Mobile PPE Sample & Safety Signage Demonstration Kiosk', spec: 'Modular aluminum display rack', qty: 1, cost: 12500 }
            ];
            baseCapex = 71000;
            spaceSqft = 100;
            targetClients = ['SME manufacturing units', 'Fabrication shops', 'Chemical & polymer processing plants'];
        } else {
            businessTitle = `Industrial Workforce Skill Assessment & Onboarding Agency (${nosRow.nos_code})`;
            tools = [
                { name: 'Digital Operator Assessment Tablets', spec: '10-inch rugged Android tablets for vernacular testing', qty: 3, cost: 36000 },
                { name: 'Vocational Skill Simulation & Hand-Eye Dexterity Rig', spec: 'Standard industrial dexterity testing apparatus', qty: 1, cost: 22000 },
                { name: 'Portable Projector & Mobile Audio Training PA System', spec: 'Wireless micro-projector + battery PA speaker', qty: 1, cost: 18500 }
            ];
            baseCapex = 76500;
            spaceSqft = 120;
            targetClients = ['Industrial estate factories', 'Contract staffing agencies', 'Apprentice training centers'];
        }
    } else {
        // Model A: Turnkey Production / Service Kiosk
        modelType = 'Turnkey_Service_Kiosk';
        
        if (sector.includes('electr') || sector.includes('telecom')) {
            businessTitle = `Turnkey ${cleanTitle} Service Station`;
            tools = [
                { name: 'Lead-Free Infrared BGA Rework Station', spec: 'PID microprocessor temperature control, 1200W', qty: 1, cost: 45000 },
                { name: 'Trinocular Stereo Inspection Microscope', spec: '7X-45X continuous optical zoom with HD HDMI camera', qty: 1, cost: 28500 },
                { name: 'Programmable Precision DC Power Supply', spec: '30V 5A ultra-low ripple with USB current graphing', qty: 2, cost: 15000 },
                { name: 'Anti-Static ESD Workbench & Grounding Matrix', spec: 'Heat-resistant antistatic mat, grounding monitor', qty: 1, cost: 16500 }
            ];
            baseCapex = 105000;
            spaceSqft = 150;
            powerReq = '3 kW Single Phase';
            targetClients = ['Local gadget owners', 'Retail electronics shops', 'Corporate device fleets'];
        } else if (sector.includes('solar') || sector.includes('green') || sector.includes('renew')) {
            businessTitle = `Turnkey ${cleanTitle} Installation & AMC Kiosk`;
            tools = [
                { name: '1000V DC Solar Multimeter & Insulation Resistance Tester', spec: 'CAT IV 600V / CAT III 1000V rated solar clamp meter', qty: 1, cost: 22000 },
                { name: 'Hydraulic MC4 Terminal Crimping & Cable Strip Kit', spec: 'Ratchet hydraulic crimper (2.5 - 10 mm²)', qty: 2, cost: 12500 },
                { name: 'Solar PV Module I-V Curve Tracer & Irradiance Sensor', spec: 'Handheld digital curve analyzer with reference cell', qty: 1, cost: 55000 },
                { name: 'Full-Body Fall Arrest Safety Harness & Lifeline Kit', spec: 'EN 361 certified dual shock-absorbing lanyard', qty: 2, cost: 11000 }
            ];
            baseCapex = 100500;
            spaceSqft = 180;
            powerReq = '2 kW Single Phase';
            targetClients = ['Residential rooftop owners', 'Commercial warehouses', 'Agricultural solar pump farmers'];
        } else if (sector.includes('auto') || sector.includes('ev') || sector.includes('motor')) {
            businessTitle = `Commercial ${cleanTitle} Diagnostic & Repair Center`;
            tools = [
                { name: 'Pneumatic Pure Nickel Pulse Spot Welder', spec: '0.15mm weld penetration with dual-pulse foot trigger', qty: 1, cost: 38000 },
                { name: '1kHz AC Precision Internal Resistance (IR) Cell Tester', spec: '0.01 milli-ohm resolution 4-wire Kelvin clamp', qty: 1, cost: 16500 },
                { name: 'Automated 16S-24S Battery Charge-Discharge Equalizer', spec: 'Multi-channel balancing cycler with PC data logger', qty: 1, cost: 48000 },
                { name: '1000V Class-0 Insulated Tooling & Safety Fire Box', spec: 'VDE certified wrenches, screwdrivers, Class-D fire kit', qty: 1, cost: 24000 }
            ];
            baseCapex = 126500;
            spaceSqft = 220;
            powerReq = '5 kW Three Phase';
            targetClients = ['E-rickshaw fleet operators', 'EV 2W delivery drivers', 'Auto-part retailers'];
        } else if (sector.includes('agri') || sector.includes('food')) {
            businessTitle = `Custom ${cleanTitle} Processing & Treatment Kiosk`;
            tools = [
                { name: 'Continuous Slurry Seed Coating & Bio-Treatment Drum', spec: 'Motorized stainless steel drum (150 kg/hr capacity)', qty: 1, cost: 42000 },
                { name: 'Digital Grain Moisture Tester Probe', spec: 'Microprocessor moisture analyzer with multi-crop calibration', qty: 1, cost: 14500 },
                { name: 'Oscillating 3-Tier Seed Screening & Cleaner Unit', spec: 'Interchangeable sieves for paddy, pulses, and oilseeds', qty: 1, cost: 52000 },
                { name: 'Heavy-Duty Portable Bag Closer & Stitcher Machine', spec: 'Single-thread chain stitch bag sewer (1100 rpm)', qty: 2, cost: 16000 }
            ];
            baseCapex = 124500;
            spaceSqft = 250;
            powerReq = '3 kW Single Phase';
            targetClients = ['Local farming cooperatives', 'FPO seed growers', 'Agri-input retail dealers'];
        } else {
            // General Trade Service
            businessTitle = `Turnkey ${cleanTitle} Commercial Service Kiosk`;
            tools = [
                { name: `Core Precision Workstation Apparatus for ${cleanTitle}`, spec: 'Industrial duty calibrated machinery', qty: 1, cost: 45000 },
                { name: 'Standard Calibration, Inspection & Measurement Kit', spec: 'Digital measurement gauges and testing apparatus', qty: 1, cost: 25000 },
                { name: 'Heavy-Duty Industrial Workbench & Power Distribution Unit', spec: 'Steel frame bench with surge-protected power rail', qty: 1, cost: 18000 }
            ];
            baseCapex = 88000;
            spaceSqft = 150;
            powerReq = '3 kW Single Phase';
            targetClients = ['Local enterprises', 'B2B commercial clients', 'Retail walk-in customers'];
        }
    }

    // Attach video guidance to each tool in the BOM
    const toolBomWithVideo = tools.map(tool => ({
        ...tool,
        video_guidance: buildMachineVideoGuidance(tool.name, tool.spec, qpRow.sector),
        video: {
            video_id: null, video_title: null, video_url: null,
            thumbnail_url: null, duration_seconds: null, audit_score: null
        }
    }));

    // Financial DPR Projections (Bank-Ready Math)
    const electrificationSetup = 25000;
    const workingCapitalMargin = 30000;
    const totalProjectCost = baseCapex + electrificationSetup + workingCapitalMargin;

    const promoterPct = 5; // Special category / PMEGP micro-unit
    const promoterInr = Math.round(totalProjectCost * (promoterPct / 100));
    const subsidyPct = 35; // Rural PMEGP subsidy
    const subsidyInr = Math.round(totalProjectCost * (subsidyPct / 100));
    const bankLoanInr = totalProjectCost - promoterInr - subsidyInr;

    // Monthly Cash Flow Projections
    const monthlyGrossRevenue = Math.round(totalProjectCost * 0.45);
    const monthlyRawMaterialCost = Math.round(monthlyGrossRevenue * 0.28);
    const monthlyRentUtilityStaff = Math.round(monthlyGrossRevenue * 0.22);
    const monthlyOperatingExpenses = monthlyRawMaterialCost + monthlyRentUtilityStaff;
    const monthlyNetProfitEbitda = monthlyGrossRevenue - monthlyOperatingExpenses;
    
    // Monthly Debt Service (5-Year Term Loan @ 10.5% p.a.)
    const monthlyEmi = Math.round(bankLoanInr * 0.0215);
    const dscrRatio = (monthlyNetProfitEbitda / (monthlyEmi || 1)).toFixed(2);
    const paybackMonths = ((totalProjectCost - subsidyInr) / (monthlyNetProfitEbitda || 1)).toFixed(1);

    // Day-1 Operational Playbook
    const playbook = [
        { phase: "Day 1-3: Site Selection & Licensing", action: `Secure ${spaceSqft} sq. ft. workspace with ${powerReq} connection. Register Udyam MSME (free online) and apply for PMEGP/Mudra bank clearance.` },
        { phase: "Day 4-7: Machinery Procurement & Tool Setup", action: `Procure the ${tools.length} itemized machines from certified tool OEMs. Complete grounding, calibration verification, and test runs.` },
        { phase: "Day 8-10: Pricing & Digital Launch", action: "Establish standardized job-card pricing matrix. Set up Google Business profile and WhatsApp Business product catalog." },
        { phase: "Day 11-14: Client Onboarding & First Delivery", action: `Target the identified client segment (${targetClients[0]}). Offer 20% inaugural discount on first 25 work orders.` }
    ];

    let investmentBracket = 'Under ₹1 Lakh';
    if (totalProjectCost > 100000 && totalProjectCost <= 300000) investmentBracket = '₹1 Lakh - ₹3 Lakhs';
    else if (totalProjectCost > 300000) investmentBracket = '₹3 Lakhs - ₹10 Lakhs';

    return {
        nos_code: nosRow.nos_code,
        nos_title: nosRow.nos_title,
        qp_code: nosRow.qp_code,
        qp_name: qpRow.qp_name || nosRow.qp_code,
        sector: qpRow.sector || 'General',
        nsqf_level: qpRow.nsqf_level || '4',
        
        business_title: businessTitle,
        business_model_type: modelType,
        investment_bracket: investmentBracket,
        space_footprint_sqft: spaceSqft,
        power_requirement: powerReq,
        target_clientele: targetClients,
        
        tool_bom: toolBomWithVideo,
        total_machinery_capex_inr: baseCapex,
        electrification_fixture_cost_inr: electrificationSetup,
        working_capital_margin_inr: workingCapitalMargin,
        total_project_cost_inr: totalProjectCost,

        financial_dpr: {
            scheme: 'PMEGP (Prime Minister Employment Generation Programme) / Mudra (Kishor)',
            total_project_cost: totalProjectCost,
            promoter_contribution_pct: promoterPct,
            promoter_contribution_inr: promoterInr,
            govt_subsidy_pct: subsidyPct,
            govt_subsidy_inr: subsidyInr,
            bank_term_loan_inr: bankLoanInr,
            monthly_projected_revenue: monthlyGrossRevenue,
            monthly_operating_expenses: monthlyOperatingExpenses,
            monthly_net_profit_ebitda: monthlyNetProfitEbitda,
            monthly_loan_emi: monthlyEmi,
            dscr_ratio: `${dscrRatio}x (Bank Viable - Min 1.50x)`,
            break_even_pct: '28.5%',
            payback_period_months: Number(paybackMonths)
        },

        day1_playbook: playbook,

        // ── Video Harvesting Guidance & Result Slots ──────────────────────────
        pitch_video_guidance: buildPitchVideoGuidance(businessTitle, qpRow.sector),
        pitch_video: {
            video_id: null, video_title: null, video_url: null,
            thumbnail_url: null, duration_seconds: null, audit_score: null
        },
        pitch_video_hi: {
            video_id: null, video_title: null, video_url: null,
            thumbnail_url: null, duration_seconds: null, audit_score: null
        },

        generated_by: 'HAYAGRIVA MSME Economic Intelligence Engine',
        generated_at: new Date().toISOString()
    };
}

// ── Synthesize Single NOS ─────────────────────────────────────────────────────
async function processNos(nosRow, qpRow, force = false) {
    if (!force && nosRow.msme_blueprint_json) {
        return { status: 'skipped', nos_code: nosRow.nos_code };
    }

    const pcs = await db.prepare(`SELECT * FROM nsqf_pcs WHERE qp_code = ? AND nos_code = ? ORDER BY sequence_order ASC, id ASC`).all(nosRow.qp_code, nosRow.nos_code);
    
    const blueprint = generateHeuristicMsmeBlueprint(nosRow, qpRow, pcs);

    await db.prepare(`
        UPDATE nsqf_nos
        SET business_model_type = ?, msme_blueprint_json = ?
        WHERE id = ?
    `).run(blueprint.business_model_type, JSON.stringify(blueprint), nosRow.id);

    return { status: 'success', nos_code: nosRow.nos_code, title: blueprint.business_title, capex: blueprint.total_project_cost_inr };
}

// ── Main Runner ───────────────────────────────────────────────────────────────
async function runMsmeSynthesizer() {
    const args = process.argv.slice(2);
    const nosArg = args.find(a => a.startsWith('--nos='));
    const qpArg = args.find(a => a.startsWith('--qp='));
    const isSample = args.includes('--sample');
    const isAudit = args.includes('--audit');
    const force = args.includes('--force');

    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║  HAYAGRIVA MSME BLUEPRINT & BANKABLE DPR SYNTHESIZER                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

    if (isAudit) {
        const total = await db.prepare('SELECT COUNT(*) as c FROM nsqf_nos').get();
        const done = await db.prepare('SELECT COUNT(*) as c FROM nsqf_nos WHERE msme_blueprint_json IS NOT NULL').get();
        console.log(`📊 Audit Summary:`);
        console.log(`   Total NOS Units: ${total.c}`);
        console.log(`   MSME Blueprints Generated: ${done.c} (${((done.c / (total.c || 1)) * 100).toFixed(1)}%)`);
        process.exit(0);
    }

    let targetNosList = [];

    if (nosArg) {
        const code = nosArg.split('=')[1].trim();
        targetNosList = await db.prepare('SELECT * FROM nsqf_nos WHERE nos_code = ?').all(code);
    } else if (qpArg) {
        const qpCode = qpArg.split('=')[1].trim();
        targetNosList = await db.prepare('SELECT * FROM nsqf_nos WHERE qp_code = ? OR REPLACE(qp_code, \'/\', \'_\') = ?').all(qpCode, qpCode.replace(/\//g, '_'));
    } else if (isSample) {
        // Featured Showcases across key economic pillars
        const sampleQps = ['NIE/ELE/Q0803', 'SGJ/Q0101', 'ASC/Q1424', 'AGR/Q0101', 'HSS/Q5101', 'BEC/ELE/Q0101'];
        targetNosList = await db.prepare(`SELECT * FROM nsqf_nos WHERE qp_code IN (${sampleQps.map(q => `'${q}'`).join(',')})`).all();
        console.log(`🌟 Synthesizing Sample MSME Blueprints for ${targetNosList.length} NOS units across 6 key QPs...`);
    } else {
        targetNosList = await db.prepare('SELECT * FROM nsqf_nos').all();
        console.log(`🚀 Starting Full Synthesis across ${targetNosList.length} NOS units...`);
    }

    let totalProcessed = 0;
    let totalSuccess = 0;

    for (const nos of targetNosList) {
        const qpRow = await db.prepare('SELECT * FROM nsqf_qps WHERE qp_code = ?').get(nos.qp_code) || { qp_code: nos.qp_code };
        const result = await processNos(nos, qpRow, force);
        totalProcessed++;

        if (result.status === 'success') {
            totalSuccess++;
            console.log(`   ✅ [${nos.nos_code}] ${result.title} (Capex: ₹${result.capex.toLocaleString('en-IN')})`);
        } else if (result.status === 'skipped') {
            console.log(`   ⏩ [${nos.nos_code}] Already synthesized (skipped)`);
        }
    }

    console.log(`\n🎉 MSME Synthesis Complete! Processed: ${totalProcessed} | Generated: ${totalSuccess}`);
    process.exit(0);
}

runMsmeSynthesizer().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
