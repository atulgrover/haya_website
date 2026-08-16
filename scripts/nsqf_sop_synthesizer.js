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
            derived_from_pc: pc.pc_code,
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

// ── Sarvam AI Cloud SOP Synthesis ────────────────────────────────────────────
async function synthesizeSopWithSarvam(moduleRow, pcs, qpRow, nosRow, jsonAst) {
    if (!SARVAM_API_KEY) return null;

    const cleanModTitle = moduleRow.module_title.replace(/^Module\s*\d+\s*:\s*/i, '').trim();
    const pcListText = pcs.map((p, i) => `${p.pc_code}: ${p.pc_description}`).join('\n');

    let kuContext = '';
    let gsContext = '';
    if (jsonAst && jsonAst.nos_units) {
        const nosUnit = jsonAst.nos_units.find(n => n.nos_code === moduleRow.nos_code);
        if (nosUnit) {
            if (nosUnit.kus) kuContext = nosUnit.kus.slice(0, 5).join('; ');
            if (nosUnit.gs) gsContext = nosUnit.gs.slice(0, 4).join('; ');
        }
    }

    const systemPrompt = `You are a Senior ISO 9001:2015 Industrial Plant Process Engineer and Safety Auditor.
Transform the provided government vocational competency module into an audit-grade, shopfloor Standard Operating Procedure (SOP).

Sector: "${qpRow.sector}"
Qualification Role: "${qpRow.qp_name}" (${qpRow.qp_code})
Occupational Unit: "${nosRow ? nosRow.nos_title : moduleRow.nos_code}" (${moduleRow.nos_code})
Workstation Module: "${cleanModTitle}"
Knowledge Context (KU): "${kuContext || 'Standard industrial safety and technical procedures'}"
Skills Context (GS): "${gsContext || 'Standard tooling and measurement apparatus'}"

Ordered Action Criteria (PCs):
${pcListText}

Return strictly a valid raw JSON object matching this exact schema:
{
  "doc_id": "SOP-${moduleRow.qp_code.replace(/\//g, '-')}-M${moduleRow.sequence_order || 1}",
  "sop_title": "Standard Operating Procedure: [Clean Professional Title]",
  "workstation_number": "WS-0${moduleRow.sequence_order || 1}",
  "purpose_and_scope": "Brief 1-2 sentence purpose of this workstation...",
  "safety_and_ppe": {
    "hazard_level": "Low / Medium / High",
    "mandatory_ppe": ["list", "of", "required", "gear"],
    "hazard_warnings": ["Specific warning 1", "Specific warning 2"]
  },
  "prerequisite_equipment": [
    { "name": "Equipment 1", "specification": "Technical spec", "calibration_requirement": "Calibration check" }
  ],
  "sequential_execution_steps": [
    {
      "step_number": 1,
      "step_title": "Action title",
      "derived_from_pc": "PC1",
      "imperative_action_directive": "Clear shopfloor directive...",
      "parameter_tolerance": "Specific limit, temperature, pressure, measurement tolerance...",
      "critical_safety_note": "Safety checkpoint..."
    }
  ],
  "quality_acceptance_criteria": ["Acceptance rule 1", "Acceptance rule 2"],
  "troubleshooting_and_exception_handling": ["Drift rule 1", "Escalation rule 2"],
  "iso_compliance": {
    "standard": "ISO 9001:2015 Clause 8.5.1",
    "audit_frequency_days": 90
  },
  "video_guidance": {
    "search_query": "[Module title] [Sector] standard operating procedure workshop demonstration",
    "search_query_hi": "[Module title] [Sector] SOP कार्यशाला प्रदर्शन हिंदी",
    "intent": "Complete workstation SOP walkthrough for [Module Title]",
    "tool_keywords": "key equipment names from prerequisite_equipment",
    "positive_signals": "SOP, procedure, walkthrough, safety, workshop, station setup",
    "negative_keywords": "-unboxing -review -shorts -gaming -reaction",
    "min_duration_seconds": 180,
    "max_duration_seconds": 1200
  }
}`;

    try {
        const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY
            },
            body: JSON.stringify({
                model: 'sarvam-105b',
                messages: [{ role: 'system', content: systemPrompt }],
                temperature: 0.2,
                max_tokens: 1200
            })
        });

        if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content?.trim() || '';
            const cleanJson = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
            const parsed = JSON.parse(cleanJson);
            if (parsed && parsed.sop_title && parsed.sequential_execution_steps) {
                parsed.generated_by = 'Sarvam AI (sarvam-105b)';
                parsed.generated_at = new Date().toISOString();

                // Ensure video guidance and empty result slots exist even for LLM output
                if (!parsed.video_guidance) {
                    const cleanMod = moduleRow.module_title.replace(/^Module\s*\d+\s*:\s*/i, '').trim();
                    const eqNames = (parsed.prerequisite_equipment || []).map(e => String(e.name || ''));
                    parsed.video_guidance = buildSopVideoGuidance(cleanMod, qpRow, nosRow, eqNames.map(n => ({ name: n })));
                }
                if (!parsed.video) {
                    parsed.video = { video_id: null, video_title: null, video_url: null, thumbnail_url: null, duration_seconds: null, audit_score: null };
                }
                if (!parsed.video_hi) {
                    parsed.video_hi = { video_id: null, video_title: null, video_url: null, thumbnail_url: null, duration_seconds: null, audit_score: null };
                }
                return parsed;
            }
        }
    } catch (e) {
        // Fall back to heuristic
    }

    return null;
}

// ── Synthesize a Single Module ────────────────────────────────────────────────
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

    // Try Sarvam AI first, fallback to Heuristic
    let sop = await synthesizeSopWithSarvam(moduleRow, pcs, qpRow, nosRow, jsonAst);
    if (!sop) {
        sop = generateHeuristicSop(moduleRow, pcs, qpRow, nosRow, jsonAst);
    }

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
        const qpRow = await db.prepare('SELECT * FROM nsqf_qps WHERE qp_code = ?').get(qpCode) || { qp_code: qpCode };
        const modules = await db.prepare('SELECT * FROM nsqf_modules WHERE qp_code = ? ORDER BY sequence_order ASC').all(qpCode);

        console.log(`\n📦 Processing QP: ${qpCode} (${modules.length} modules)`);
        const qpSopModules = [];

        for (const mod of modules) {
            const nosRow = await db.prepare('SELECT * FROM nsqf_nos WHERE qp_code = ? AND nos_code = ?').get(qpCode, mod.nos_code);
            const result = await processModule(mod, qpRow, nosRow, force);
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
