'use strict';
/**
 * HAYAGRIVA MSME Business Blueprint Synthesizer (Sarvam AI LLM Engine)
 * Transforms Government NSQF Qualifications into Bankable Turnkey MSME Business Profiles.
 */

const db = require('../db');

/**
 * Synthesize a comprehensive MSME Business Blueprint for a Qualification Pack
 * @param {string} qpCode e.g. "AGR/Q6701"
 * @returns {Promise<Object>} Synthesized blueprint object
 */
async function generateMsmeBlueprint(qpCode) {
    if (!qpCode) throw new Error('Missing qpCode parameter');

    const cleanQp = String(qpCode).trim().replace(/_/g, '/');

    // 1. Check PostgreSQL write-through cache first
    try {
        const cachedRes = await db.query(
            `SELECT * FROM msme_business_blueprints WHERE qp_code = $1 OR REPLACE(qp_code, '/', '_') = $2`,
            [cleanQp, cleanQp.replace(/\//g, '_')]
        );
        if (cachedRes.rows && cachedRes.rows.length > 0) {
            const row = cachedRes.rows[0];
            return {
                business_title: row.business_title,
                tagline: row.tagline,
                executive_summary: row.executive_summary,
                target_customers: row.target_customers,
                revenue_streams: row.revenue_streams,
                machinery_bom: row.machinery_bom,
                financial_model: row.financial_model,
                launch_playbook: row.launch_playbook,
                is_cached: true
            };
        }
    } catch (err) {
        console.warn('[MSME Synthesizer] Cache lookup notice:', err.message);
    }

    // 2. Fetch QP and NOS details from database
    const qpRes = await db.query(
        `SELECT qp_code, qp_name, sector, sub_sector, occupation, nsqf_level 
         FROM nsqf_qps WHERE qp_code = $1 OR REPLACE(qp_code, '/', '_') = $2 LIMIT 1`,
        [cleanQp, cleanQp.replace(/\//g, '_')]
    );

    if (!qpRes.rows || qpRes.rows.length === 0) {
        throw new Error(`Qualification pack ${cleanQp} not found in database`);
    }
    const qp = qpRes.rows[0];

    const nosRes = await db.query(
        `SELECT nos_code, nos_title FROM nsqf_nos WHERE qp_code = $1 ORDER BY sequence_order ASC`,
        [qp.qp_code]
    );
    const nosList = (nosRes.rows || []).map(n => `- ${n.nos_code}: ${n.nos_title}`).join('\n');

    // 3. Call Sarvam AI LLM
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
        throw new Error('SARVAM_API_KEY is not configured in environment');
    }

    const prompt = `You are a Senior MSME Business Consultant, Industrial Project Engineer, and Chartered Project Finance Specialist in India.

Convert the following Government NSQF Vocational Qualification into a viable, bankable, commercial Small Business Venture Blueprint in India eligible for PMEGP (Prime Minister Employment Generation Programme) or Mudra Bank Loans.

### Qualification Details:
- Trade Code: ${qp.qp_code}
- Official Name: ${qp.qp_name}
- Industry Sector: ${qp.sector}
- Sub-Sector: ${qp.sub_sector || 'General'}
- Workstation Standards (NOS):
${nosList}

### Requirements:
1. Business Venture Name: A high-status, prestigious commercial company/brand name (e.g. 'AeroLink Ground Logistics Pvt. Ltd.', 'AgriSun SolarTech Solutions', 'PrecisionSpark CNC Machining Works').
   CRITICAL MANDATE: NEVER include employee job-role words like Executive, Agent, Assistant, Operator, Technician, Handler, Helper, Worker, Attendant, or Mechanic in the company name.
2. Executive Summary: 100-150 words on market opportunity, customer demand in tier-2/3 Indian cities, and value proposition.
3. Target Customers: Specific customer segments (B2C, B2B, Commercial).
4. Revenue Streams: 3 to 4 specific, practical revenue models with realistic pricing/margins in Indian Rupees (INR).
5. Machinery & Tooling Bill of Materials (BOM): 4 to 6 real commercial machines/apparatus with realistic Indian market prices (INR), power rating (kW), and key specification.
6. Financial Model:
   - Total Machinery CAPEX (INR)
   - Working Capital Requirement (INR)
   - Total Project Outlay (INR)
   - Promoter Contribution (10%) (INR)
   - Bank Term Loan / CC (90%) (INR)
   - Govt PMEGP Subsidy Margin (35% for rural / 25% for urban)
   - Estimated Monthly Revenue (INR)
   - Estimated Monthly Operational Expenses (INR)
   - Estimated Net Monthly Profit (INR)
   - ROI Payback Period (Months)
7. Day-1 Turnkey Launch Playbook: 4 actionable milestone phases (Week 1, Week 2, Week 3, Week 4).

Respond ONLY with a single, valid, parseable JSON object without markdown fences, code blocks, or preamble.

JSON Schema:
{
  "business_title": "string",
  "tagline": "string",
  "executive_summary": "string",
  "target_customers": ["string", "string", "string"],
  "revenue_streams": [
    { "stream_name": "string", "description": "string", "unit_economics": "string" },
    { "stream_name": "string", "description": "string", "unit_economics": "string" },
    { "stream_name": "string", "description": "string", "unit_economics": "string" }
  ],
  "machinery_bom": [
    { "machine_name": "string", "specification": "string", "power_kw": 0.5, "estimated_cost_inr": 25000 },
    { "machine_name": "string", "specification": "string", "power_kw": 1.2, "estimated_cost_inr": 45000 }
  ],
  "financial_model": {
    "total_capex_inr": 250000,
    "working_capital_inr": 150000,
    "total_project_cost_inr": 400000,
    "promoter_equity_10_pct_inr": 40000,
    "bank_loan_90_pct_inr": 360000,
    "pmegp_subsidy_pct": 35,
    "pmegp_subsidy_amount_inr": 140000,
    "estimated_monthly_revenue_inr": 120000,
    "estimated_monthly_opex_inr": 45000,
    "net_monthly_profit_inr": 75000,
    "roi_payback_months": 8
  },
  "launch_playbook": [
    { "phase": "Week 1: Statutory & Banking", "actions": ["string", "string"] },
    { "phase": "Week 2: Workshop & Machinery Setup", "actions": ["string", "string"] },
    { "phase": "Week 3: Supply Chain & Spare Inventory", "actions": ["string", "string"] },
    { "phase": "Week 4: Commercial Go-Live & Client Acquisition", "actions": ["string", "string"] }
  ]
}`;

    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': apiKey.trim()
        },
        body: JSON.stringify({
            model: 'sarvam-105b-conversations',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 2500
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Sarvam API error HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const rawContent = data.choices && data.choices[0]?.message?.content;
    if (!rawContent) {
        throw new Error('Empty response from Sarvam AI');
    }

    let parsed;
    try {
        let cleaned = rawContent
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        // Strip trailing anomalies like ]"} or "}\n
        cleaned = cleaned.replace(/\]\s*"\s*\}/g, ']}').replace(/\}\s*"\s*$/g, '}');

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        parsed = JSON.parse(cleaned);
        if (parsed.business_title) {
            parsed.business_title = cleanCommercialTitle(parsed.business_title, qp.qp_name, qp.sector);
        }
    } catch (e) {
        console.error('[MSME Synthesizer] JSON parse error:', e.message, 'Raw:', rawContent);
        throw new Error('Failed to parse structured JSON blueprint from AI');
    }

    // 4. Save to PostgreSQL msme_business_blueprints table (Permanent Write-Through Cache)
    try {
        const finalTitle = parsed.business_title || cleanCommercialTitle('', qp.qp_name, qp.sector);
        await db.query(`
            INSERT INTO msme_business_blueprints
                (qp_code, business_title, tagline, executive_summary, target_customers, revenue_streams,
                 machinery_bom, financial_model, launch_playbook, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (qp_code) DO UPDATE SET
                business_title = EXCLUDED.business_title,
                tagline = EXCLUDED.tagline,
                executive_summary = EXCLUDED.executive_summary,
                target_customers = EXCLUDED.target_customers,
                revenue_streams = EXCLUDED.revenue_streams,
                machinery_bom = EXCLUDED.machinery_bom,
                financial_model = EXCLUDED.financial_model,
                launch_playbook = EXCLUDED.launch_playbook,
                updated_at = CURRENT_TIMESTAMP
        `, [
            qp.qp_code,
            finalTitle,
            parsed.tagline || 'Commercial MSME Business Blueprint',
            parsed.executive_summary || '',
            JSON.stringify(parsed.target_customers || []),
            JSON.stringify(parsed.revenue_streams || []),
            JSON.stringify(parsed.machinery_bom || []),
            JSON.stringify(parsed.financial_model || {}),
            JSON.stringify(parsed.launch_playbook || [])
        ]);
        console.log(`[MSME Synthesizer] ✅ Permanently cached blueprint for ${qp.qp_code} in PostgreSQL.`);
    } catch (dbErr) {
        console.warn('[MSME Synthesizer] Database cache write warning:', dbErr.message);
    }

    return parsed;
}

/**
 * Strips employee job-role suffixes and redundant sector prefixes to produce a strict 2-to-4 word commercial brand title
 */
function cleanCommercialTitle(rawTitle, qpName, sector) {
    let title = (rawTitle || '').replace(/^Turnkey\s+/i, '').replace(/\s+Enterprise$/i, '').replace(/\s+Pvt\.?\s*Ltd\.?/i, '').trim();

    const employeeRegex = /\b(executive|assistant|agent|operator|technician|handler|helper|worker|attendant|mechanic|officer|specialist|planner|inspector|supervisor|auditor|coordinator|controller|setter|fitter|welder|electrician|driver|stitcher|finisher|cutter|packer|loader|maker|trainee|apprentice|consultant|advisor|instructor)\b/gi;
    const redundantPrefixRegex = /^(airline|aerospace|aircraft|aviation|automotive|auto|agricultural|agriculture|handloom|textile|commercial|turnkey|general|standard|basic|advanced|senior|junior|lead)\s+/gi;

    const rawCleaned = title.replace(redundantPrefixRegex, '').trim();
    if (rawCleaned && !employeeRegex.test(rawCleaned)) {
        const w = rawCleaned.split(/\s+/);
        if (w.length >= 2 && w.length <= 4) {
            return rawCleaned;
        }
    }

    const textToAnalyze = `${qpName || ''} ${title || ''} ${sector || ''}`.toLowerCase();

    // High-status domain-anchored 2-to-4 word brand generator
    if (textToAnalyze.includes('baggage') || textToAnalyze.includes('luggage')) {
        return 'Transit Baggage Logistics';
    }
    if (textToAnalyze.includes('cargo') || textToAnalyze.includes('freight')) {
        return 'AeroLink Cargo Express';
    }
    if (textToAnalyze.includes('customer service') || textToAnalyze.includes('passenger') || textToAnalyze.includes('hospitality')) {
        return 'Passenger Concierge Services';
    }
    if (textToAnalyze.includes('reservation') || textToAnalyze.includes('ticketing') || textToAnalyze.includes('booking')) {
        return 'Flight Ticketing Desk';
    }
    if (textToAnalyze.includes('security') || textToAnalyze.includes('screening') || textToAnalyze.includes('guard')) {
        return 'Airside Security Services';
    }
    if (textToAnalyze.includes('flight dispatch') || textToAnalyze.includes('dispatcher')) {
        return 'Flight Dispatch Control';
    }
    if (textToAnalyze.includes('solar') || textToAnalyze.includes('pv') || textToAnalyze.includes('solar pump')) {
        return 'AgriSun Solar Grids';
    }
    if (textToAnalyze.includes('paddy') || textToAnalyze.includes('rice') || textToAnalyze.includes('grain')) {
        return 'GreenGrain Paddy Milling';
    }
    if (textToAnalyze.includes('sugarcane') || textToAnalyze.includes('cane') || textToAnalyze.includes('sugar')) {
        return 'CaneCraft Sugar Works';
    }
    if (textToAnalyze.includes('farm machinery') || textToAnalyze.includes('tractor') || textToAnalyze.includes('harvester')) {
        return 'AgriMech Farm Fleet';
    }
    if (textToAnalyze.includes('nursery') || textToAnalyze.includes('garden') || textToAnalyze.includes('landscap') || textToAnalyze.includes('gardener')) {
        return 'GreenScape Nursery Studio';
    }
    if (textToAnalyze.includes('dairy') || textToAnalyze.includes('milk') || textToAnalyze.includes('cheese')) {
        return 'PureDairy Milk Processing';
    }
    if (textToAnalyze.includes('paint') || textToAnalyze.includes('detail') || textToAnalyze.includes('coating')) {
        return 'Apex Auto Detailing';
    }
    if (textToAnalyze.includes('electrician') || textToAnalyze.includes('four wheeler') || textToAnalyze.includes('two wheeler') || textToAnalyze.includes('ev ')) {
        return 'VoltAuto Diagnostic Works';
    }
    if (textToAnalyze.includes('driver') || textToAnalyze.includes('transport') || textToAnalyze.includes('commercial vehicle') || textToAnalyze.includes('fleet')) {
        return 'FleetHaul Transport Services';
    }
    if (textToAnalyze.includes('engine') || textToAnalyze.includes('auto service') || textToAnalyze.includes('mechanic') || textToAnalyze.includes('vehicle service')) {
        return 'Bharat EngineCare Studio';
    }
    if (textToAnalyze.includes('cnc') || textToAnalyze.includes('edm') || textToAnalyze.includes('machinist') || textToAnalyze.includes('lathe') || textToAnalyze.includes('milling')) {
        return 'PrecisionSpark CNC Works';
    }
    if (textToAnalyze.includes('weld') || textToAnalyze.includes('fabricat') || textToAnalyze.includes('arc')) {
        return 'Titan Arc Fabrication';
    }
    if (textToAnalyze.includes('tool') || textToAnalyze.includes('die') || textToAnalyze.includes('mould')) {
        return 'Matrix Tool & Die';
    }
    if (textToAnalyze.includes('sew') || textToAnalyze.includes('stitch') || textToAnalyze.includes('tailor') || textToAnalyze.includes('garment')) {
        return 'Bespoke Garment Studio';
    }
    if (textToAnalyze.includes('fashion') || textToAnalyze.includes('designer') || textToAnalyze.includes('apparel design')) {
        return 'Aura Fashion Studio';
    }
    if (textToAnalyze.includes('general duty') || textToAnalyze.includes('home health') || textToAnalyze.includes('nursing') || textToAnalyze.includes('patient care')) {
        return 'CareFirst Home Healthcare';
    }
    if (textToAnalyze.includes('phlebotom') || textToAnalyze.includes('blood') || textToAnalyze.includes('lab') || textToAnalyze.includes('diagnost')) {
        return 'Pulse Diagnostics Hub';
    }

    // Generic concise 2-4 word fallback
    let base = (qpName || title || 'Commercial')
        .replace(redundantPrefixRegex, '')
        .replace(employeeRegex, '')
        .replace(/[–—\-\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const words = base.split(/\s+/).filter(w => w.length > 2).slice(0, 2);
    const prefix = words.length > 0 ? words.join(' ') : 'Commercial';
    const s = (sector || '').toLowerCase();

    let fallbackTitle = '';
    if (s.includes('agri') || s.includes('food')) {
        fallbackTitle = `${prefix} AgriTech Works`;
    } else if (s.includes('auto')) {
        fallbackTitle = `${prefix} Auto Studio`;
    } else if (s.includes('capital') || s.includes('metal')) {
        fallbackTitle = `${prefix} Precision Works`;
    } else if (s.includes('apparel') || s.includes('textile')) {
        fallbackTitle = `${prefix} Apparel Studio`;
    } else {
        fallbackTitle = `${prefix} Commercial Hub`;
    }

    return fallbackTitle.split(/\s+/).slice(0, 4).join(' ');
}

module.exports = {
    generateMsmeBlueprint,
    cleanCommercialTitle
};
