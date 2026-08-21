'use strict';
/**
 * Test Script: Synthesize a Sample MSME Business Blueprint using Sarvam AI LLM
 */

require('dotenv').config();
const db = require('../server/db');

async function synthesizeMsmeBlueprint(qpCode) {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
        throw new Error('SARVAM_API_KEY is not defined in .env');
    }

    // 1. Fetch QP and NOS details from local PostgreSQL
    const qpRes = await db.query(
        `SELECT qp_code, qp_name, sector, sub_sector, occupation, nsqf_level 
         FROM nsqf_qps WHERE qp_code = $1`,
        [qpCode]
    );

    if (qpRes.rows.length === 0) {
        throw new Error(`QP ${qpCode} not found in database`);
    }
    const qp = qpRes.rows[0];

    const nosRes = await db.query(
        `SELECT nos_code, nos_title FROM nsqf_nos WHERE qp_code = $1 ORDER BY sequence_order ASC`,
        [qpCode]
    );
    const nosList = nosRes.rows.map(n => `- ${n.nos_code}: ${n.nos_title}`).join('\n');

    console.log(`\n======================================================`);
    console.log(`Synthesizing MSME Business Blueprint for: [${qp.qp_code}] ${qp.qp_name}`);
    console.log(`Sector: ${qp.sector} | Level: ${qp.nsqf_level}`);
    console.log(`======================================================\n`);

    // 2. Build Structured Prompt
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
1. Business Venture Name: A professional, realistic commercial enterprise title (NOT a job role).
2. Executive Summary: 100-150 words on market opportunity, customer demand in tier-2/3 Indian cities, and value proposition.
3. Target Customers: Specific customer segments (B2B, B2C, Commercial).
4. Revenue Streams: 3 specific, practical revenue models with realistic pricing/margins in Indian Rupees (INR).
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
        throw new Error(`Sarvam API HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const rawContent = data.choices && data.choices[0]?.message?.content;
    
    // Parse JSON
    let parsed;
    try {
        const cleaned = rawContent
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
        parsed = JSON.parse(cleaned);
    } catch (e) {
        console.warn('JSON parsing notice, raw content:', rawContent);
        parsed = { raw: rawContent };
    }

    console.log(JSON.stringify(parsed, null, 2));
    return parsed;
}

async function run() {
    try {
        await synthesizeMsmeBlueprint('AGR/Q6701'); // Solar Pump Technician
        process.exit(0);
    } catch (err) {
        console.error('Error running sample:', err);
        process.exit(1);
    }
}

run();
