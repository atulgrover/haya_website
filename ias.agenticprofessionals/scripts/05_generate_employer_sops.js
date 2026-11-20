'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MODULE-TO-SOP SYNTHESIZER (ISO 9001:2015 Industrial Plant Standard)     ║
 * ║  Transforms nsqf_modules + nsqf_pcs + KU/GS into plant workstation SOPs  ║
 * ║                                                                          ║
 * ║  Usage:                                                                  ║
 * ║    node scripts/nsqf_sop_synthesizer.js --qp=ELE/Q0803                   ║
 * ║    node scripts/nsqf_sop_synthesizer.js --sample                         ║
 * ║    node scripts/nsqf_sop_synthesizer.js --all                            ║
 * ║    node scripts/nsqf_sop_synthesizer.js --audit                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../server/db');

const NSQF_JSON_DIR   = path.join(__dirname, '..', 'data', 'json', 'nsqf');
const JSON_DIR        = fs.existsSync(NSQF_JSON_DIR) ? NSQF_JSON_DIR : path.join(__dirname, '..', 'data', 'json');
const SOP_JSON_DIR    = path.join(__dirname, '..', 'data', 'json', 'sop');
const CHECKPOINT_PATH = path.join(__dirname, '..', 'data', '.sop_checkpoint.json');
const SARVAM_API_KEY  = process.env.SARVAM_API_KEY || '';

// Ensure output directories exist
if (!fs.existsSync(SOP_JSON_DIR)) {
    fs.mkdirSync(SOP_JSON_DIR, { recursive: true });
}

// ── Sector PPE & Hazard Templates ─────────────────────────────────────────────
const SECTOR_SAFETY_DEFAULTS = {
    'electronics': {
        hazard_level: 'Medium (Thermal & Electrostatic Discharge)',
        ppe: ['ESD Grounded Wrist Strap (<1M Ohm)', 'Antiglare Safety Goggles', 'Heat-Resistant Silicone Mat (300°C Rated)'],
        warnings: ['CAUTION: High thermal hazard during hot-air reflow. Do not touch heating nozzles.', 'MANDATORY: Activate bench fume extractor before soldering to eliminate rosin fumes.']
    },
    'automotive': {
        hazard_level: 'High (Mechanical, High-Voltage & Hydraulic)',
        ppe: ['1000V Insulated High-Voltage Gloves (Class 0)', 'Steel-Toe Safety Boots (EN ISO 20345)', 'Impact-Resistant Safety Face Shield'],
        warnings: ['DANGER: Verify Lockout/Tagout (LOTO) and zero-energy state before disassembly.', 'MANDATORY: Ensure hydraulic pressure is bled to zero before hose disconnection.']
    },
    'green-jobs': {
        hazard_level: 'High (DC Arc Flash & Fall from Height)',
        ppe: ['Full-Body Safety Harness with Shock-Absorbing Lanyard', '1000V DC Rated Insulated Gloves', 'UV-Protective Safety Helmet (EN 397)'],
        warnings: ['DANGER: Solar PV strings remain energized under sunlight. Never disconnect MC4 under load.', 'MANDATORY: Verify earth grounding resistance is <2.0 Ohms before inverter power-up.']
    },
    'agriculture': {
        hazard_level: 'Medium (Biological, Chemical & Rotating Machinery)',
        ppe: ['Nitrile Chemical-Resistant Gloves', 'N95 Particulate / Pesticide Respirator Mask', 'Slip-Resistant Heavy-Duty Rubber Boots'],
        warnings: ['CAUTION: Verify emergency machine stop cord is functional before starting seed intake.', 'MANDATORY: Strictly follow bio-fungicide dosing limits per manufacturer safety data sheet (SDS).']
    },
    'healthcare': {
        hazard_level: 'High (Biohazard & Pathogen Exposure)',
        ppe: ['Sterile Surgical Nitrile Gloves', 'Fluid-Resistant Isolation Gown', 'N95 Medical Respirator & Full Face Shield'],
        warnings: ['BIOHAZARD: Follow standard universal precautions for all bodily fluid contact.', 'MANDATORY: Ensure autoclave sterilization indicator strip changes color before instrument pack release.']
    },
    'default': {
        hazard_level: 'Medium (Industrial Standard)',
        ppe: ['Standard Industrial Safety Goggles', 'Puncture-Resistant Work Gloves', 'Steel-Toe Protective Footwear'],
        warnings: ['MANDATORY: Verify pre-operation machine safety guard interlocks are engaged.', 'CAUTION: Keep workstation clean and free from oil spills or tripping hazards.']
    }
};

function getSectorSafety(sectorName) {
    const s = String(sectorName || '').toLowerCase();
    if (s.includes('electr') || s.includes('telecom')) return SECTOR_SAFETY_DEFAULTS['electronics'];
    if (s.includes('auto') || s.includes('ev') || s.includes('motor')) return SECTOR_SAFETY_DEFAULTS['automotive'];
    if (s.includes('solar') || s.includes('green') || s.includes('renew')) return SECTOR_SAFETY_DEFAULTS['green-jobs'];
    if (s.includes('agri') || s.includes('food') || s.includes('farm')) return SECTOR_SAFETY_DEFAULTS['agriculture'];
    if (s.includes('health') || s.includes('medic') || s.includes('pharma')) return SECTOR_SAFETY_DEFAULTS['healthcare'];
    return SECTOR_SAFETY_DEFAULTS['default'];
}

// ── Video Guidance Generator for Workstation-Level SOP Demos ─────────────────
function buildSopVideoGuidance(cleanModTitle, qpRow, nosRow, equipment) {
    const sector = String(qpRow.sector || 'Industrial').trim();
    const qpName = String(qpRow.qp_name || '').trim();
    const nosTitle = nosRow ? String(nosRow.nos_title || '').trim() : '';

    // Extract tool keywords from prerequisite equipment names
    const equipToolKeywords = equipment
        .map(e => String(e.name || '').toLowerCase().replace(/workstation apparatus for /i, '').trim())
        .filter(t => t.length > 3)
        .join(', ');

    // Sector-aware negative keywords to reject non-procedural content
    const sectorNeg = {
        'electronics': '-unboxing -review -shorts -gaming -reaction -haul -ASMR',
        'automotive':  '-unboxing -review -shorts -racing -drift -vlog -reaction',
        'green-jobs':  '-unboxing -review -shorts -reaction -vlog -DIY-home',
        'agriculture': '-unboxing -review -shorts -reaction -vlog -cooking -recipe',
        'healthcare':  '-unboxing -review -shorts -reaction -vlog -ASMR -mukbang',
        'default':     '-unboxing -review -shorts -gaming -reaction -vlog -prank'
    };
    const sLower = String(sector).toLowerCase();
    let negKey = 'default';
    if (sLower.includes('electr') || sLower.includes('telecom')) negKey = 'electronics';
    else if (sLower.includes('auto') || sLower.includes('ev')) negKey = 'automotive';
    else if (sLower.includes('solar') || sLower.includes('green')) negKey = 'green-jobs';
    else if (sLower.includes('agri') || sLower.includes('food')) negKey = 'agriculture';
    else if (sLower.includes('health') || sLower.includes('medic')) negKey = 'healthcare';

    return {
        search_query: `${cleanModTitle} ${sector} standard operating procedure workshop demonstration`.substring(0, 95).trim(),
        search_query_hi: `${cleanModTitle} ${sector} SOP कार्यशाला प्रदर्शन हिंदी`.substring(0, 95).trim(),
        intent: `Complete workstation SOP walkthrough for ${cleanModTitle}`,
        tool_keywords: equipToolKeywords || cleanModTitle.toLowerCase(),
        positive_signals: 'SOP, procedure, walkthrough, safety, workshop, station setup, demonstration, standard, compliance, training',
        negative_keywords: sectorNeg[negKey],
        min_duration_seconds: 180,
        max_duration_seconds: 1200
    };
}

// ── Deterministic Heuristic SOP Generator (Offline/Fast) ─────────────────────
function generateHeuristicSop(moduleRow, pcs, qpRow, nosRow, jsonAst) {
    const sectorSafety = getSectorSafety(qpRow.sector);
    const cleanModTitle = moduleRow.module_title.replace(/^Module\s*\d+\s*:\s*/i, '').trim();

    // Build Execution Steps from PCs
    const steps = pcs.map((pc, idx) => {
        const desc = pc.pc_description.replace(/^•\s*|^PC\d+[\.:-]?\s*/i, '').trim();
        const actionVerb = pc.pc_intent ? pc.pc_intent.split(' ')[0] : 'Execute';
        
        return {
            step_number: idx + 1,
            step_title: pc.pc_intent || `Step ${idx + 1}: ${desc.substring(0, 45)}...`,
            derived_from_pc: String(pc.pc_code || '').replace(/\.+$/, ''),
            imperative_action_directive: desc,
            parameter_tolerance: idx === 0 
                ? 'Verify 100% calibration / visual log adherence' 
                : 'Perform operation within nominal engineering tolerances',
            critical_safety_note: idx === 0 
                ? sectorSafety.warnings[0] 
                : 'Maintain standard PPE during execution.'
        };
    });

    // Prerequisite Equipment from GS or default
    const equipment = [
        { name: `Workstation Apparatus for ${cleanModTitle}`, specification: 'Calibrated industrial grade tooling', calibration_status: 'Valid within 90 days' },
        { name: 'Standard Inspection & Measurement Kit', specification: 'Precision digital meter / gauge', calibration_status: 'Pre-shift zero-checked' }
    ];

    // Build video guidance for workstation-level demo harvesting
    const videoGuidance = buildSopVideoGuidance(cleanModTitle, qpRow, nosRow, equipment);

    const sopJson = {
        doc_id: `SOP-${moduleRow.qp_code.replace(/\//g, '-')}-M${moduleRow.sequence_order || 1}`,
        sop_title: `Standard Operating Procedure: ${cleanModTitle}`,
        module_title: moduleRow.module_title,
        nos_code: moduleRow.nos_code,
        nos_title: nosRow ? nosRow.nos_title : 'Core Competency Unit',
        qp_code: moduleRow.qp_code,
        qp_name: qpRow.qp_name || moduleRow.qp_code,
        sector: qpRow.sector || 'General Industry',
        nsqf_level: qpRow.nsqf_level || '4',
        workstation_number: `WS-0${moduleRow.sequence_order || 1}`,
        
        purpose_and_scope: `Define standard operational parameters, safety controls, and quality checklists for ${cleanModTitle} in compliance with NCVET NSQF Level ${qpRow.nsqf_level || '4'} standards.`,
        
        safety_and_ppe: {
            hazard_level: sectorSafety.hazard_level,
            mandatory_ppe: sectorSafety.ppe,
            hazard_warnings: sectorSafety.warnings
        },

        prerequisite_equipment: equipment,

        sequential_execution_steps: steps,

        quality_acceptance_criteria: [
            '100% compliance with step checklist parameters with zero safety protocol violations.',
            'Visual & functional pass confirmation recorded in manufacturing execution register.'
        ],

        troubleshooting_and_exception_handling: [
            'If component or parameter drifts beyond tolerance, immediately halt operation and flag supervisor.',
            'Log non-conformance ID and quarantine affected workpiece to containment station.'
        ],

        iso_compliance: {
            standard: 'ISO 9001:2015 Clause 8.5.1 (Controlled Production Conditions)',
            audit_frequency_days: 90
        },

        // ── Video Harvesting Guidance & Result Slots ──────────────────────────
        video_guidance: videoGuidance,
        video: {
            video_id: null, video_title: null, video_url: null,
            thumbnail_url: null, duration_seconds: null, audit_score: null
        },
        video_hi: {
            video_id: null, video_title: null, video_url: null,
            thumbnail_url: null, duration_seconds: null, audit_score: null
        },

        generated_by: 'HAYAGRIVA Industrial SOP Engine',
        generated_at: new Date().toISOString()
    };

    return sopJson;
}

const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

// ── Stage 2: Targeted Narrative LLM Enrichment ─────────────────────────────────
async function enrichSopNarrativeWithLLM(baseSop, moduleRow, pcs, qpRow, nosRow) {
    const cleanModTitle = moduleRow.module_title.replace(/^Module\s*\d+\s*:\s*/i, '').trim();

    // Default High-Quality Rule-Based Narratives (Stage 1 Default)
    let execScope = `Standard Operating Procedure WS-0${moduleRow.sequence_order || 1} establishes controlled industrial execution parameters for ${cleanModTitle} under ISO 9001:2015 Clause 8.5.1. The workstation enforces a target cycle time of ${baseSop.cycle_time_seconds || 240} seconds within a plant takt time of ${baseSop.takt_time_seconds || 300} seconds, balancing shopfloor takt cadence and preventing downstream line starvation.`;
    
    let engPrinciples = `Execution parameters are governed by industrial tolerances and safety thresholds specific to the ${qpRow.sector || 'manufacturing'} domain. Standardized work sequences prevent process drift, material fatigue, and thermal/mechanical deformation. Verification gates ensure all measured values conform strictly within nominal limits prior to release to the subsequent workstation.`;
    
    let rootCauseAdvisory = `If parameter deviation or defect occurs, immediately halt workstation operations, tag the non-conforming workpiece, and transfer it to the designated Red-Box quarantine station. Perform a 5-Why root cause audit on tool zeroing, operator technique, and incoming component lots before resetting the workstation interlocks.`;

    // If Cloud LLM is available, enrich with deep trade-specific narrative
    if (OPENROUTER_API_KEY || GEMINI_API_KEY || SARVAM_API_KEY) {
        try {
            const prompt = `You are a Senior ISO 9001:2015 Industrial Plant Process Engineer and TWI Master Trainer.
Here is the verified workstation skeleton for:
- Sector: "${qpRow.sector}"
- Qualification Role: "${qpRow.qp_name}" (${qpRow.qp_code})
- Workstation Station: "${cleanModTitle}"
- Hazard Rating: "${baseSop.safety_and_ppe?.hazard_level || 'Medium'}"
- Tools Used: ${baseSop.prerequisite_equipment?.map(e => e.name).join(', ')}

Synthesize 3 rich, technical narrative sections in raw JSON format:
{
  "executive_workstation_scope": "2 paragraphs explaining line integration, takt/cycle cadence, and operator ergonomics.",
  "engineering_principles_and_science": "2 paragraphs explaining the physical, metallurgical, chemical, or electrical principles governing this workstation.",
  "root_cause_troubleshooting_advisory": "1-2 paragraphs detailing actionable containment and 5-Why root cause resolution for common shopfloor defects."
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
                        'X-Title': 'HAYAGRIVA SOP Narrative Engine'
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
                if (parsed.executive_workstation_scope) execScope = parsed.executive_workstation_scope;
                if (parsed.engineering_principles_and_science) engPrinciples = parsed.engineering_principles_and_science;
                if (parsed.root_cause_troubleshooting_advisory) rootCauseAdvisory = parsed.root_cause_troubleshooting_advisory;
                baseSop.narrative_enriched_by = OPENROUTER_API_KEY ? 'DeepSeek V3 (via OpenRouter)' : 'Sarvam AI (sarvam-105b)';
            }
        } catch (_) {
            // Graceful fallback to deterministic narrative
        }
    }

    baseSop.executive_workstation_scope = execScope;
    baseSop.engineering_principles_and_science = engPrinciples;
    baseSop.troubleshooting_and_exception_handling = [
        rootCauseAdvisory,
        'Log non-conformance ID and quarantine affected workpiece to containment station.',
        'If 2 consecutive units drift beyond upper tolerance limits, trigger immediate line stop.'
    ];

    return baseSop;
}

// ── Synthesize a Single Module (2-Stage Hybrid Execution) ───────────────────────
async function processModule(moduleRow, qpRow, nosRow, force = false) {
    if (!force && moduleRow.sop_procedure_json) {
        return { status: 'skipped', id: moduleRow.id };
    }

    // Get PCs belonging to this module
    const pcs = await db.prepare(`
        SELECT * FROM nsqf_pcs 
        WHERE module_id = ? OR (qp_code = ? AND nos_code = ?)
        ORDER BY sequence_order ASC, id ASC
    `).all(moduleRow.id, moduleRow.qp_code, moduleRow.nos_code);

    if (!pcs || pcs.length === 0) {
        return { status: 'no_pcs', id: moduleRow.id };
    }

    // Load JSON AST if available for extra context
    let jsonAst = null;
    const cleanCode = moduleRow.qp_code.replace(/\//g, '_');
    const jsonPath = path.join(JSON_DIR, `${cleanCode}.json`);
    if (fs.existsSync(jsonPath)) {
        try { jsonAst = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch {}
    }

    // ── STAGE 1: Build Mathematical & Structural Concrete Foundation ─────────────
    let sop = generateHeuristicSop(moduleRow, pcs, qpRow, nosRow, jsonAst);

    // ── STAGE 2: Targeted Narrative Enrichment via LLM / Rule Intelligence ───────
    sop = await enrichSopNarrativeWithLLM(sop, moduleRow, pcs, qpRow, nosRow);

    // Persist to PostgreSQL
    await db.prepare(`
        UPDATE nsqf_modules 
        SET sop_procedure_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(JSON.stringify(sop), moduleRow.id);

    return { status: 'success', id: moduleRow.id, title: sop.sop_title, sop };
}

// ── Main Runner ───────────────────────────────────────────────────────────────
async function runSopSynthesizer() {
    const args = process.argv.slice(2);
    const qpArg = args.find(a => a.startsWith('--qp='));
    const isSample = args.includes('--sample');
    const isAudit = args.includes('--audit');
    const force = args.includes('--force');

    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║  HAYAGRIVA INDUSTRIAL SOP SYNTHESIZER (ISO 9001:2015 Standard)            ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

    if (isAudit) {
        const total = await db.prepare('SELECT COUNT(*) as c FROM nsqf_modules').get();
        const done = await db.prepare('SELECT COUNT(*) as c FROM nsqf_modules WHERE sop_procedure_json IS NOT NULL').get();
        console.log(`📊 Audit Summary:`);
        console.log(`   Total Modules: ${total.c}`);
        console.log(`   SOPs Generated: ${done.c} (${((done.c / (total.c || 1)) * 100).toFixed(1)}%)`);
        process.exit(0);
    }

    let targetQps = [];

    if (qpArg) {
        const code = qpArg.split('=')[1].trim();
        targetQps = [code];
    } else if (isSample) {
        // Featured Showcases across key economic pillars
        targetQps = [
            'NIE/ELE/Q0803', // Electronics: Smartphone Assembly & Service
            'SGJ/Q0101',     // Green Energy: Solar PV Installer
            'ASC/Q1424',     // Automotive: EV 2W/3W Service Technician
            'AGR/Q0101',     // Agriculture: Seed Processing Technician
            'HSS/Q5101',     // Healthcare: General Duty Assistant
            'BEC/ELE/Q0101'  // Electronics: Mobile Phone Hardware Repair Technician
        ];
        console.log(`🌟 Synthesizing Sample Showcases for ${targetQps.length} Key QPs...`);
    } else {
        const allQps = await db.prepare('SELECT DISTINCT qp_code FROM nsqf_modules').all();
        targetQps = allQps.map(q => q.qp_code);
        console.log(`🚀 Starting Full Synthesis across ${targetQps.length} Qualification Packs...`);
    }

    let totalProcessed = 0;
    let totalSuccess = 0;

    for (const qpCode of targetQps) {
        const cleanCode = qpCode.replace(/\//g, '_');
        const rawQpCode = qpCode.replace(/_/g, '/');
        const qpRow = await db.prepare('SELECT * FROM nsqf_qps WHERE qp_code = ? OR qp_code = ?').get(rawQpCode, cleanCode) || { qp_code: rawQpCode, qp_name: cleanCode };
        let modules = await db.prepare('SELECT * FROM nsqf_modules WHERE qp_code = ? OR qp_code = ? ORDER BY sequence_order ASC').all(rawQpCode, cleanCode);

        // Fallback: If nsqf_modules table is empty for this QP, read directly from data/json/nsqf/${cleanCode}.json
        let jsonAst = null;
        const jsonPath = path.join(JSON_DIR, `${cleanCode}.json`);
        if (fs.existsSync(jsonPath)) {
            try { jsonAst = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch {}
        }

        if (modules.length === 0 && jsonAst && jsonAst.nos_units) {
            modules = [];
            for (const nos of jsonAst.nos_units) {
                for (const mod of (nos.modules || [])) {
                    modules.push({
                        id: `${nos.nos_code}_M${mod.sequence_order || 1}`,
                        qp_code: rawQpCode,
                        nos_code: nos.nos_code,
                        module_title: mod.module_title,
                        sequence_order: mod.sequence_order || 1,
                        _pcs: mod.pcs || []
                    });
                }
            }
        }

        console.log(`\n📦 Processing QP: ${qpCode} (${modules.length} modules)`);
        const qpSopModules = [];

        for (const mod of modules) {
            const nosRow = await db.prepare('SELECT * FROM nsqf_nos WHERE qp_code = ? AND nos_code = ?').get(rawQpCode, mod.nos_code);
            let result;
            if (mod._pcs && mod._pcs.length > 0) {
                const dummyPcs = mod._pcs.map((p, idx) => ({
                    id: idx + 1,
                    pc_code: p.pc_code,
                    pc_description: p.pc_description,
                    pc_intent: p.pc_description.substring(0, 45),
                    sequence_order: p.sequence_order || idx + 1
                }));
                const sop = generateHeuristicSop(mod, dummyPcs, qpRow, nosRow, jsonAst);
                result = { status: 'success', title: sop.sop_title, sop };
            } else {
                result = await processModule(mod, qpRow, nosRow, force);
            }
            totalProcessed++;

            if (result.status === 'success') {
                totalSuccess++;
                console.log(`   ✅ [Mod ${mod.id}] ${result.title}`);
                if (result.sop) qpSopModules.push(result.sop);
            } else if (result.status === 'skipped') {
                console.log(`   ⏩ [Mod ${mod.id}] Already synthesized (skipped)`);
                if (mod.sop_procedure_json) {
                    const parsed = typeof mod.sop_procedure_json === 'string' ? JSON.parse(mod.sop_procedure_json) : mod.sop_procedure_json;
                    qpSopModules.push(parsed);
                }
            } else {
                console.log(`   ⚠️ [Mod ${mod.id}] Skipped (no child PCs found)`);
            }
        }

        // 💾 Save Master QP SOP File to disk: data/json/sop/${cleanCode}.json
        if (qpSopModules.length > 0) {
            const cleanCode = qpCode.replace(/\//g, '_');
            const sopFilePath = path.join(SOP_JSON_DIR, `${cleanCode}.json`);
            const qpMasterSop = {
                qp_code: qpCode,
                qp_name: qpRow.qp_name || qpCode,
                sector: qpRow.sector || 'General Industry',
                nsqf_level: qpRow.nsqf_level || '4',
                total_workstations: qpSopModules.length,
                workstations: qpSopModules,
                generated_at: new Date().toISOString(),
                generated_by: 'HAYAGRIVA Industrial SOP Engine'
            };
            fs.writeFileSync(sopFilePath, JSON.stringify(qpMasterSop, null, 2), 'utf-8');
            console.log(`   💾 [File Saved] ${sopFilePath}`);
        }
    }

    console.log(`\n🎉 Synthesis Complete! Processed: ${totalProcessed} | Generated: ${totalSuccess}`);
    process.exit(0);
}

runSopSynthesizer().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
