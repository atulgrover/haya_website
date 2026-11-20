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

const NSQF_JSON_DIR   = path.join(__dirname, '..', 'data', 'json', 'nsqf');
const JSON_DIR        = fs.existsSync(NSQF_JSON_DIR) ? NSQF_JSON_DIR : path.join(__dirname, '..', 'data', 'json');
const MSME_JSON_DIR   = path.join(__dirname, '..', 'data', 'json', 'msme');
const SARVAM_API_KEY  = process.env.SARVAM_API_KEY || '';

// Ensure output directories exist
if (!fs.existsSync(MSME_JSON_DIR)) {
    fs.mkdirSync(MSME_JSON_DIR, { recursive: true });
}

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

const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

// ── Stage 2: Targeted Narrative LLM Enrichment ─────────────────────────────────
async function enrichMsmeNarrativeWithLLM(baseBlueprint, nosRow, qpRow, pcs) {
    const nosTitle = String(nosRow.nos_title || '').trim();
    const sector = String(qpRow.sector || 'General Industry').trim();

    // Default High-Quality Rule-Based Narratives (Stage 1 Default)
    let execSummary = `This Bankable Detailed Project Report (DPR) establishes a commercial turnkey enterprise for ${baseBlueprint.business_title}. Structured under the Ministry of MSME / Prime Minister Employment Generation Programme (PMEGP) and Mudra (Kishor) credit guidelines, the total capital investment is ₹${(baseBlueprint.total_project_cost_inr || 150000).toLocaleString('en-IN')}, supported by a 35% Government Margin Money Subsidy (₹${(baseBlueprint.financial_dpr?.govt_subsidy_inr || 52500).toLocaleString('en-IN')}) and a 60% Bank Term Loan. The enterprise achieves financial viability with a projected Year-1 Net EBITDA of ₹${(baseBlueprint.financial_dpr?.monthly_net_profit_ebitda * 12 || 240000).toLocaleString('en-IN')} and a robust Debt Service Coverage Ratio (DSCR) of ${baseBlueprint.financial_dpr?.dscr_ratio || '1.65x'}.`;
    
    let marketAnalysis = `Market demand is propelled by rapid formalization and localized industrial growth across Tier-2 and Tier-3 commercial hubs in India. The enterprise serves a diverse clientele including ${(baseBlueprint.target_clientele || ['local enterprises', 'commercial contractors']).join(', ')}. Key competitive advantages include certified NSQF technical competency, rapid turnaround times, and lower overhead costs compared to large centralized service providers.`;
    
    let riskAdvisory = `Key operational risks involve cash flow delays on institutional credit sales and initial equipment calibration stabilization. Mitigate by enforcing a strict 50% advance policy on customized orders, maintaining a 30-day working capital buffer (₹${(baseBlueprint.working_capital_margin_inr || 30000).toLocaleString('en-IN')}), and adhering strictly to preventive maintenance schedules on all core BOM machinery.`;

    // If Cloud LLM is available, enrich with deep trade-specific narrative
    if (OPENROUTER_API_KEY || SARVAM_API_KEY) {
        try {
            const prompt = `You are a Senior MSME Project Appraisal Specialist and SIDBI / PMEGP Bank Loan Evaluator.
Here is the verified financial and technical skeleton for a new Indian MSME venture:
- Trade Title: "${baseBlueprint.business_title}"
- Sector: "${sector}"
- Total Project Cost: ₹${baseBlueprint.total_project_cost_inr} (Promoter: ₹${baseBlueprint.financial_dpr?.promoter_contribution_inr}, Subsidy: ₹${baseBlueprint.financial_dpr?.govt_subsidy_inr}, Bank Loan: ₹${baseBlueprint.financial_dpr?.bank_term_loan_inr})
- 5-Year DSCR: ${baseBlueprint.financial_dpr?.dscr_ratio}
- Core Machinery BOM: ${baseBlueprint.tool_bom?.map(t => `${t.name} (₹${t.cost})`).join(', ')}
- Target Clientele: ${baseBlueprint.target_clientele?.join(', ')}

Synthesize 3 rich, authoritative narrative chapters in raw JSON format:
{
  "executive_summary": "2 paragraphs presenting a compelling investment thesis for bank credit appraisal.",
  "market_demand_analysis": "2 paragraphs analyzing Indian market trends, B2B demand drivers, and competitive advantage.",
  "risk_mitigation_and_cash_flow_advisory": "1-2 paragraphs detailing practical advice on managing working capital, credit cycles, and machinery maintenance."
}`;

            let res = null;
            if (OPENROUTER_API_KEY) {
                res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    signal: AbortSignal.timeout(12000),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'https://hayagriva.app',
                        'X-Title': 'HAYAGRIVA MSME Narrative Engine'
                    },
                    body: JSON.stringify({
                        model: 'deepseek/deepseek-chat',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.2,
                        response_format: { type: 'json_object' }
                    })
                });
            } else if (SARVAM_API_KEY) {
                res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                    method: 'POST',
                    signal: AbortSignal.timeout(8000),
                    headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
                    body: JSON.stringify({
                        model: 'sarvam-105b',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.2,
                        max_tokens: 1000
                    })
                });
            }

            if (res && res.ok) {
                const data = await res.json();
                const content = data.choices?.[0]?.message?.content?.trim() || '';
                const cleanJson = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
                const parsed = JSON.parse(cleanJson);
                if (parsed.executive_summary) execSummary = parsed.executive_summary;
                if (parsed.market_demand_analysis) marketAnalysis = parsed.market_demand_analysis;
                if (parsed.risk_mitigation_and_cash_flow_advisory) riskAdvisory = parsed.risk_mitigation_and_cash_flow_advisory;
                baseBlueprint.narrative_enriched_by = OPENROUTER_API_KEY ? 'DeepSeek V3 (via OpenRouter)' : 'Sarvam AI (sarvam-105b)';
            }
        } catch (_) {
            // Graceful fallback to deterministic narrative
        }
    }

    baseBlueprint.executive_summary = execSummary;
    baseBlueprint.market_demand_analysis = marketAnalysis;
    baseBlueprint.risk_mitigation_and_cash_flow_advisory = riskAdvisory;

    return baseBlueprint;
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
    let spaceSqft = 200;
    let powerReq = '3 kW Single Phase';
    let targetClients = [];

    if (isGeneric) {
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
            spaceSqft = 150;
            targetClients = ['SME manufacturing units', 'Fabrication shops', 'Chemical & polymer processing plants'];
        } else {
            businessTitle = `Industrial Workforce Skill Assessment & Onboarding Agency (${nosRow.nos_code})`;
            tools = [
                { name: 'Digital Operator Assessment Tablets', spec: '10-inch rugged Android tablets for vernacular testing', qty: 3, cost: 36000 },
                { name: 'Vocational Skill Simulation & Hand-Eye Dexterity Rig', spec: 'Standard industrial dexterity testing apparatus', qty: 1, cost: 22000 },
                { name: 'Portable Projector & Mobile Audio Training PA System', spec: 'Wireless micro-projector + battery PA speaker', qty: 1, cost: 18500 }
            ];
            baseCapex = 76500;
            spaceSqft = 150;
            targetClients = ['Industrial estate factories', 'Contract staffing agencies', 'Apprentice training centers'];
        }
    } else {
        modelType = 'Turnkey_Service_Kiosk';
        
        // Deep trade-specific customization
        if (nosTitle.toLowerCase().includes('hardware') || nosTitle.toLowerCase().includes('screen') || nosTitle.toLowerCase().includes('display')) {
            businessTitle = `Commercial Smartphone Display & Hardware Micro-Soldering Lab (${nosRow.nos_code})`;
            tools = [
                { name: 'Lead-Free Infrared BGA Rework Station', spec: 'PID microprocessor temperature control, 1200W', qty: 1, cost: 45000 },
                { name: 'Trinocular Stereo Inspection Microscope', spec: '7X-45X continuous optical zoom with HD HDMI camera', qty: 1, cost: 28500 },
                { name: 'Vacuum LCD OCA Laminator & Bubble Remover Autoclave', spec: 'Built-in vacuum pump and air compressor (10-inch LCD)', qty: 1, cost: 58000 },
                { name: 'Programmable Precision DC Power Supply', spec: '30V 5A ultra-low ripple with USB current graphing', qty: 2, cost: 15000 },
                { name: 'Anti-Static ESD Workbench & Grounding Matrix', spec: 'Heat-resistant antistatic mat, grounding monitor', qty: 1, cost: 16500 }
            ];
            baseCapex = 163000;
            spaceSqft = 200;
            powerReq = '3 kW Single Phase';
            targetClients = ['Direct smartphone consumers', 'Retail multi-brand mobile outlets', 'Corporate enterprise gadget fleets'];
        } else if (nosTitle.toLowerCase().includes('software') || nosTitle.toLowerCase().includes('flashing') || nosTitle.toLowerCase().includes('rom')) {
            businessTitle = `Smartphone OS Recovery, Data Forensics & Firmware Lab (${nosRow.nos_code})`;
            tools = [
                { name: 'Dedicated Multi-Platform Flashing & Forensics Workstation', spec: 'High-speed NVMe 32GB RAM workstation with multi-port USB 3.2 HUB', qty: 1, cost: 68000 },
                { name: 'Universal JTAG / eMMC / UFS Programmer Box Kit', spec: 'Hardware box with ISP adapter sockets (UFS 2.1/3.1)', qty: 1, cost: 42000 },
                { name: 'Licensed Multi-Brand Firmware & Boot Repair Tool Subscriptions', spec: 'Commercial multi-brand service tool dongles', qty: 1, cost: 28000 },
                { name: 'Zero-Trace Secure Data Sanitization & Backup NAS Drive', spec: '4-Bay RAID NAS with offline backup drives', qty: 1, cost: 35000 }
            ];
            baseCapex = 173000;
            spaceSqft = 150;
            powerReq = '2 kW Single Phase';
            targetClients = ['B2B gadget repair shops', 'Corporate IT departments', 'Insurance claim verification agencies'];
        } else if (sector.includes('solar') || sector.includes('green') || sector.includes('renew')) {
            businessTitle = `Rooftop Solar PV Installation, Commissioning & AMC Kiosk (${nosRow.nos_code})`;
            tools = [
                { name: '1000V DC Solar Multimeter & Insulation Resistance Tester', spec: 'CAT IV 600V / CAT III 1000V rated solar clamp meter', qty: 1, cost: 22000 },
                { name: 'Hydraulic MC4 Terminal Crimping & Cable Strip Kit', spec: 'Ratchet hydraulic crimper (2.5 - 10 mm²)', qty: 2, cost: 12500 },
                { name: 'Solar PV Module I-V Curve Tracer & Irradiance Sensor', spec: 'Handheld digital curve analyzer with reference cell', qty: 1, cost: 55000 },
                { name: 'Full-Body Fall Arrest Safety Harness & Lifeline Kit', spec: 'EN 361 certified dual shock-absorbing lanyard', qty: 2, cost: 11000 },
                { name: 'Rotary Rooftop Module Cleaning Roller Kit', spec: 'Telescopic motorized water-fed rotary brush (6m reach)', qty: 1, cost: 38000 }
            ];
            baseCapex = 138500;
            spaceSqft = 250;
            powerReq = '3 kW Single Phase';
            targetClients = ['Residential rooftop solar clients', 'Commercial factory warehouses', 'Agricultural solar water pump farms'];
        } else if (sector.includes('auto') || sector.includes('ev') || sector.includes('motor')) {
            businessTitle = `EV 2W/3W Lithium-Ion Battery & Powertrain Diagnostic Center (${nosRow.nos_code})`;
            tools = [
                { name: 'Pneumatic Pure Nickel Pulse Spot Welder', spec: '0.15mm weld penetration with dual-pulse foot trigger', qty: 1, cost: 38000 },
                { name: '1kHz AC Precision Internal Resistance (IR) Cell Tester', spec: '0.01 milli-ohm resolution 4-wire Kelvin clamp', qty: 1, cost: 16500 },
                { name: 'Automated 16S-24S Battery Charge-Discharge Equalizer', spec: 'Multi-channel balancing cycler with PC data logger', qty: 1, cost: 48000 },
                { name: '1000V Class-0 Insulated Tooling & Safety Fire Box', spec: 'VDE certified wrenches, screwdrivers, Class-D fire kit', qty: 1, cost: 24000 },
                { name: 'Multi-Brand BLDC Motor & Controller Diagnostic Rig', spec: 'Dynamic throttle, hall sensor & phase tester', qty: 1, cost: 32000 }
            ];
            baseCapex = 158500;
            spaceSqft = 300;
            powerReq = '5 kW Three Phase';
            targetClients = ['E-rickshaw fleet operators', 'Last-mile EV delivery companies (Zomato/Swiggy)', 'EV spare part dealers'];
        } else if (sector.includes('agri') || sector.includes('food')) {
            businessTitle = `Turnkey Precision Seed Processing & Bio-Treatment Enterprise (${nosRow.nos_code})`;
            tools = [
                { name: 'Continuous Slurry Seed Coating & Bio-Treatment Drum', spec: 'Motorized stainless steel drum (150 kg/hr capacity)', qty: 1, cost: 42000 },
                { name: 'Digital Grain Moisture Tester Probe', spec: 'Microprocessor moisture analyzer with multi-crop calibration', qty: 1, cost: 14500 },
                { name: 'Oscillating 3-Tier Seed Screening & Cleaner Unit', spec: 'Interchangeable sieves for paddy, pulses, and oilseeds', qty: 1, cost: 52000 },
                { name: 'Heavy-Duty Portable Bag Closer & Stitcher Machine', spec: 'Single-thread chain stitch bag sewer (1100 rpm)', qty: 2, cost: 16000 }
            ];
            baseCapex = 124500;
            spaceSqft = 350;
            powerReq = '3 kW Single Phase';
            targetClients = ['Local farming cooperatives', 'FPO seed growers', 'Agri-input retail dealers'];
        } else {
            businessTitle = `Turnkey ${cleanTitle} Service Station (${nosRow.nos_code})`;
            tools = [
                { name: `Commercial Precision Station for ${cleanTitle}`, spec: 'Industrial-grade calibrated tooling rig', qty: 1, cost: 45000 },
                { name: 'Digital Inspection & Safety Meter Apparatus', spec: 'Precision calibrated test kit', qty: 1, cost: 18500 },
                { name: 'Heavy-Duty Utility Workbench & Storage Cabinet', spec: 'Reinforced industrial steel frame with lockable drawers', qty: 1, cost: 22000 }
            ];
            baseCapex = 85500;
            spaceSqft = 200;
            powerReq = '3 kW Single Phase';
            targetClients = ['Local businesses', 'Commercial contractors', 'Walk-in clients'];
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
async function processNos(nosRow, qpRow, jsonAst, force = false) {
    if (!force && nosRow.msme_blueprint_json) {
        return { status: 'skipped', nos_code: nosRow.nos_code };
    }

    const pcs = nosRow._pcs || await db.prepare(`SELECT * FROM nsqf_pcs WHERE qp_code = ? AND nos_code = ? ORDER BY sequence_order ASC, id ASC`).all(nosRow.qp_code, nosRow.nos_code);
    
    // ── STAGE 1: Build Mathematical & Financial Concrete Foundation ─────────────
    let blueprint = generateHeuristicMsmeBlueprint(nosRow, qpRow, pcs);

    // ── STAGE 2: Targeted Narrative Enrichment via LLM / Rule Intelligence ───────
    blueprint = await enrichMsmeNarrativeWithLLM(blueprint, nosRow, qpRow, pcs);

    if (nosRow.id) {
        try {
            await db.prepare(`
                UPDATE nsqf_nos 
                SET business_model_type = ?, msme_blueprint_json = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(blueprint.business_model_type, JSON.stringify(blueprint), nosRow.id);
        } catch {}
    }

    return { status: 'success', nos_code: nosRow.nos_code, title: blueprint.business_title, capex: blueprint.total_project_cost_inr || 150000, blueprint };
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

    let targetQps = [];

    if (qpArg) {
        targetQps = [qpArg.split('=')[1].trim()];
    } else if (nosArg) {
        const code = nosArg.split('=')[1].trim();
        const nosRow = await db.prepare('SELECT * FROM nsqf_nos WHERE nos_code = ?').get(code);
        if (nosRow) targetQps = [nosRow.qp_code];
    } else if (isSample) {
        targetQps = ['NIE/ELE/Q0803', 'SGJ/Q0101', 'ASC/Q1424', 'AGR/Q0101', 'HSS/Q5101', 'BEC/ELE/Q0101'];
        console.log(`🌟 Synthesizing Sample MSME Blueprints for ${targetQps.length} key QPs...`);
    } else {
        const allQps = await db.prepare('SELECT DISTINCT qp_code FROM nsqf_nos').all();
        targetQps = allQps.map(q => q.qp_code);
        console.log(`🚀 Starting Full Synthesis across ${targetQps.length} QPs...`);
    }

    let totalProcessed = 0;
    let totalSuccess = 0;

    for (const qpCode of targetQps) {
        const cleanCode = qpCode.replace(/\//g, '_');
        const rawQpCode = qpCode.replace(/_/g, '/');
        const qpRow = await db.prepare('SELECT * FROM nsqf_qps WHERE qp_code = ? OR qp_code = ?').get(rawQpCode, cleanCode) || { qp_code: rawQpCode, qp_name: cleanCode };
        
        let nosUnits = await db.prepare('SELECT * FROM nsqf_nos WHERE qp_code = ? OR qp_code = ?').all(rawQpCode, cleanCode);

        // Fallback: load directly from data/json/nsqf/${cleanCode}.json if DB empty
        let jsonAst = null;
        const jsonPath = path.join(JSON_DIR, `${cleanCode}.json`);
        if (fs.existsSync(jsonPath)) {
            try { jsonAst = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch {}
        }

        if (nosUnits.length === 0 && jsonAst && jsonAst.nos_units) {
            nosUnits = jsonAst.nos_units.map((nos, idx) => ({
                id: idx + 1,
                qp_code: rawQpCode,
                nos_code: nos.nos_code,
                nos_title: nos.nos_title,
                _pcs: (nos.modules || []).flatMap(m => m.pcs || [])
            }));
        }

        console.log(`\n📦 Processing QP: ${qpCode} (${nosUnits.length} NOS units)`);
        const qpBlueprints = [];

        for (const nos of nosUnits) {
            const result = await processNos(nos, qpRow, jsonAst, force);
            totalProcessed++;

            if (result.status === 'success') {
                totalSuccess++;
                console.log(`   ✅ [${nos.nos_code}] ${result.title} (Capex: ₹${(result.capex || 0).toLocaleString('en-IN')})`);
                if (result.blueprint) qpBlueprints.push(result.blueprint);
            } else if (result.status === 'skipped') {
                console.log(`   ⏩ [${nos.nos_code}] Already synthesized (skipped)`);
                if (nos.msme_blueprint_json) {
                    const parsed = typeof nos.msme_blueprint_json === 'string' ? JSON.parse(nos.msme_blueprint_json) : nos.msme_blueprint_json;
                    qpBlueprints.push(parsed);
                }
            }
        }

        // 💾 Save Master QP MSME File to disk: data/json/msme/${cleanCode}.json
        if (qpBlueprints.length > 0) {
            const cleanCode = qpCode.replace(/\//g, '_');
            const msmeFilePath = path.join(MSME_JSON_DIR, `${cleanCode}.json`);
            const qpMasterMsme = {
                qp_code: qpCode,
                qp_name: qpRow.qp_name || qpCode,
                sector: qpRow.sector || 'General',
                nsqf_level: qpRow.nsqf_level || '4',
                total_blueprints: qpBlueprints.length,
                blueprints: qpBlueprints,
                generated_at: new Date().toISOString(),
                generated_by: 'HAYAGRIVA MSME Economic Intelligence Engine'
            };
            fs.writeFileSync(msmeFilePath, JSON.stringify(qpMasterMsme, null, 2), 'utf-8');
            console.log(`   💾 [File Saved] ${msmeFilePath}`);
        }
    }

    console.log(`\n🎉 MSME Synthesis Complete! Processed: ${totalProcessed} | Generated: ${totalSuccess}`);
    process.exit(0);
}

runMsmeSynthesizer().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
