'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PASS 2 UNIFIED: Intent, Category & Harvester Guidance Engine           ║
 * ║  Consolidates: nsqf_local_intent_extractor.js                           ║
 * ║             + nsqf_pass2_intent_synthesis.js                            ║
 * ║             + nsqf_targeted_llm_refiner.js                              ║
 * ║                                                                          ║
 * ║  Modes:                                                                  ║
 * ║    --mode=hybrid  (DEFAULT) — local NLP for all, Sarvam AI for <70%    ║
 * ║    --mode=local              — NLP heuristics only (free, fast)         ║
 * ║    --mode=cloud              — Sarvam AI for all PCs                    ║
 * ║                                                                          ║
 * ║  Usage:                                                                  ║
 * ║    node scripts/nsqf_pass2_unified.js --qp=NIE/ELE/Q0803               ║
 * ║    node scripts/nsqf_pass2_unified.js --all                             ║
 * ║    node scripts/nsqf_pass2_unified.js --all --mode=hybrid  (default)   ║
 * ║    node scripts/nsqf_pass2_unified.js --all --mode=local               ║
 * ║    node scripts/nsqf_pass2_unified.js --all --mode=cloud               ║
 * ║    node scripts/nsqf_pass2_unified.js --all --resume                   ║
 * ║    node scripts/nsqf_pass2_unified.js --all --force                    ║
 * ║    node scripts/nsqf_pass2_unified.js --audit                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../server/db');

const NSQF_JSON_DIR   = path.join(__dirname, '..', 'data', 'json', 'nsqf');
const JSON_DIR        = fs.existsSync(NSQF_JSON_DIR) ? NSQF_JSON_DIR : path.join(__dirname, '..', 'data', 'json');
const CHECKPOINT_PATH = path.join(__dirname, '..', 'data', '.pass2_checkpoint.json');
const SARVAM_API_KEY  = process.env.SARVAM_API_KEY || '';

// ── 1. Boilerplate Patterns to Strip ──────────────────────────────────────────
const BOILERPLATE_PATTERNS = [
    /^(to be competent,\s*)?(the\s*)?(user\/individual|individual|candidate|operator|practitioner|technician|worker|tenter)\s*(on the job\s*)?(must|needs to|should)\s*(be able to|know how to|know and understand)\s*:?/i,
    /^check that (the )?/i,
    /^ensure that (the )?/i,
    /^ensure (the )?/i,
    /^make sure that (the )?/i,
    /^make sure (the )?/i,
    /^follow (the )?instructions (to|on|for) /i,
    /^follow (the )?sop (to|on|for) /i,
    /^follow standard (operating )?procedure[s]? (to|for) /i,
    /^assist in /i,
    /^ability to /i,
    /^understand (and apply )?/i,
    /^demonstrate (the )?/i,
];

// ── 2. Action Verb Standardization Map ───────────────────────────────────────
const ACTION_VERB_MAP = {
    'inspect': 'Inspect', 'check': 'Inspect', 'verify': 'Verify', 'examine': 'Inspect',
    'assemble': 'Assemble', 'disassemble': 'Disassemble', 'dismantle': 'Disassemble',
    'calibrate': 'Calibrate', 'prepare': 'Prepare', 'measure': 'Measure',
    'install': 'Install', 'operate': 'Operate', 'maintain': 'Maintain',
    'maintenance': 'Maintain', 'repair': 'Repair', 'service': 'Service',
    'replace': 'Replace', 'substitute': 'Replace', 'clean': 'Clean',
    'record': 'Log', 'document': 'Log', 'log': 'Log', 'report': 'Report',
    'identify': 'Identify', 'recognize': 'Identify', 'test': 'Test',
    'diagnose': 'Diagnose', 'troubleshoot': 'Troubleshoot', 'execute': 'Execute',
    'solder': 'Solder', 'soldering': 'Solder', 'desolder': 'Desolder',
    'weld': 'Weld', 'welding': 'Weld', 'cut': 'Cut', 'cutting': 'Cut',
    'align': 'Align', 'adjust': 'Adjust', 'configure': 'Configure',
    'flash': 'Flash', 'unlock': 'Unlock', 'cultivate': 'Cultivate',
    'transplant': 'Transplant', 'irrigate': 'Irrigate', 'harvest': 'Harvest',
    'treat': 'Treat', 'piece': 'Piece', 'creel': 'Creel', 'carryout': 'Carryout',
};

// ── 3. Vocational English → Hindi Dictionary ──────────────────────────────────
const VOCATIONAL_HINDI_DICT = {
    'inspect': 'जांच करें', 'check': 'चेक करें', 'verify': 'सत्यापन करें',
    'assemble': 'असेंबल करें', 'disassemble': 'खोलें और अलग करें',
    'calibrate': 'कैलिब्रेशन करें', 'install': 'इंस्टॉल करें', 'operate': 'ऑपरेट करें',
    'maintain': 'रखरखाव करें', 'repair': 'रिपेयरिंग करें', 'service': 'सर्विसिंग करें',
    'replace': 'बदलें', 'clean': 'सफाई करें', 'measure': 'माप लें',
    'prepare': 'तैयार करें', 'log': 'दर्ज करें', 'report': 'रिपोर्ट करें',
    'identify': 'पहचान करें', 'test': 'टेस्टिंग करें', 'diagnose': 'फॉल्ट ढूंढें',
    'troubleshoot': 'समस्या ठीक करें', 'execute': 'निष्पादित करें',
    'solder': 'सोल्डरिंग करें', 'desolder': 'डी-सोल्डरिंग करें',
    'weld': 'वेल्डिंग करें', 'flash': 'सॉफ्टवेयर फ्लैश करें', 'unlock': 'अनलॉक करें',
    'cultivate': 'खेती करें', 'transplant': 'रोपाई करें', 'irrigate': 'सिंचाई करें',
    'harvest': 'कटाई करें', 'piecing': 'धागा जोड़ना', 'creeling': 'क्रीलिंग करना',
    'mobile': 'मोबाइल', 'phone': 'फोन', 'smartphone': 'स्मार्टफोन',
    'screen': 'स्क्रीन', 'battery': 'बैटरी', 'multimeter': 'मल्टीमीटर',
    'circuit': 'सर्किट', 'pcb': 'पीसीबी', 'voltage': 'वोल्टेज', 'motor': 'मोटर',
    'paddy': 'धान', 'seed': 'बीज', 'fertilizer': 'खाद', 'pesticide': 'कीटनाशक',
    'soil': 'मिट्टी', 'healthcare': 'हेल्थकेयर', 'patient': 'मरीज',
    'textile': 'कपड़ा उद्योग', 'yarn': 'धागा', 'spindle': 'स्पिंडल',
    'automotive': 'ऑटोमोबाइल', 'engine': 'इंजन', 'brake': 'ब्रेक',
    'equipment': 'उपकरण', 'tools': 'औजार और टूल्स', 'quality': 'गुणवत्ता',
    'safety': 'सुरक्षा सावधानियां', 'procedure': 'प्रक्रिया',
};

// ── 4. Sector → YouTube Category Mapping ─────────────────────────────────────
const SECTOR_YOUTUBE_CATEGORY = {
    'electronics': { id: 28, name: 'Science & Technology' },
    'telecom':     { id: 28, name: 'Science & Technology' },
    'it-ites':     { id: 28, name: 'Science & Technology' },
    'it':          { id: 28, name: 'Science & Technology' },
    'instrumentation': { id: 28, name: 'Science & Technology' },
    'life sciences': { id: 28, name: 'Science & Technology' },
    'hydrocarbon': { id: 28, name: 'Science & Technology' },
    'automotive':  { id: 2,  name: 'Autos & Vehicles' },
    'aerospace':   { id: 2,  name: 'Autos & Vehicles' },
    'aviation':    { id: 2,  name: 'Autos & Vehicles' },
    'textile':     { id: 26, name: 'Howto & Style' },
    'apparel':     { id: 26, name: 'Howto & Style' },
    'beauty':      { id: 26, name: 'Howto & Style' },
    'food':        { id: 26, name: 'Howto & Style' },
    'handicrafts': { id: 26, name: 'Howto & Style' },
    'gems':        { id: 26, name: 'Howto & Style' },
    'leather':     { id: 26, name: 'Howto & Style' },
    'agriculture': { id: 15, name: 'Pets & Animals' },
    'animal':      { id: 15, name: 'Pets & Animals' },
    'dairy':       { id: 15, name: 'Pets & Animals' },
    'fisheries':   { id: 15, name: 'Pets & Animals' },
    'media':       { id: 1,  name: 'Film & Animation' },
    'animation':   { id: 1,  name: 'Film & Animation' },
    'gaming':      { id: 20, name: 'Gaming' },
    'tourism':     { id: 19, name: 'Travel & Events' },
    'hospitality': { id: 19, name: 'Travel & Events' },
    'sports':      { id: 17, name: 'Sports' },
    'fitness':     { id: 17, name: 'Sports' },
    'healthcare':  { id: 27, name: 'Education' },
    'construction':{ id: 27, name: 'Education' },
    'power':       { id: 27, name: 'Education' },
    'capital goods':{ id: 27, name: 'Education' },
    'plumbing':    { id: 27, name: 'Education' },
    'green jobs':  { id: 27, name: 'Education' },
    'mining':      { id: 27, name: 'Education' },
    'security':    { id: 27, name: 'Education' },
    'retail':      { id: 27, name: 'Education' },
    'bfsi':        { id: 27, name: 'Education' },
    'logistics':   { id: 27, name: 'Education' },
};

function mapSectorToCategory(sector) {
    const s = String(sector || '').toLowerCase();
    for (const [k, v] of Object.entries(SECTOR_YOUTUBE_CATEGORY)) {
        if (s.includes(k)) return v;
    }
    return { id: 27, name: 'Education' };
}

// ── 5. Tool Recognition ───────────────────────────────────────────────────────
const KNOWN_TOOLS = [
    'multimeter', 'digital multimeter', 'oscilloscope', 'dc power supply', 'smd rework station',
    'hot air gun', 'soldering iron', 'solder wire', 'desoldering pump', 'flux', 'esd mat',
    'anti-static wrist strap', 'tweezers', 'opening pick', 'suction cup', 'b-7000 glue',
    'screw driver', 'magnifier lamp', 'pcb cleaner', 'microscope',
    'knapsack sprayer', 'seed drill', 'rotavator', 'soil testing kit', 'ph meter', 'seed tray',
    'ring frame', 'roving bobbin', 'traveller', 'spindle', 'splicer', 'yarn tension meter',
    'torque wrench', 'diagnostic scanner', 'feeler gauge', 'hydraulic lift',
    'dial indicator', 'vernier caliper', 'micrometer', 'bearing puller', 'welding torch',
    'sphygmomanometer', 'stethoscope', 'pulse oximeter', 'thermometer', 'glucometer',
    'ppe kit', 'autoclave', 'disinfectant',
];

function extractToolKeywords(text, sector) {
    const lower = text.toLowerCase();
    const found = KNOWN_TOOLS.filter(tool => lower.includes(tool));
    if (found.length > 0) return found.slice(0, 5).join(', ');
    const s = String(sector || '').toLowerCase();
    if (s.includes('electronic') || s.includes('telecom')) return 'digital multimeter, soldering iron, smd rework';
    if (s.includes('agri')) return 'sprayer, soil testing kit, seed equipment';
    if (s.includes('auto')) return 'torque wrench, diagnostic scanner, multimeter';
    if (s.includes('textile')) return 'ring frame, roving bobbin, spindle';
    if (s.includes('health')) return 'stethoscope, thermometer, ppe kit';
    return 'measuring instruments, standard tools, safety gear';
}

// ── 6. Negative Keywords & Positive Signals ───────────────────────────────────
function getNegativeKeywords(sector) {
    const s = String(sector || '').toLowerCase();
    let specific = '';
    if (s.includes('agri')) specific = ' -protest -politics -msp -news';
    else if (s.includes('auto')) specific = ' -race -crash -stunt -review';
    else if (s.includes('health')) specific = ' -movie -scene -comedy -fake';
    else if (s.includes('electronic')) specific = ' -leak -rumor -drop_test';
    return `-unboxing -review -prank -reaction -gameplay -shorts -teaser${specific}`;
}

function getPositiveSignals() {
    return 'step by step, how to, practical demonstration, live repair, proper method, hands on tutorial, स्टेप बाय स्टेप, प्रैक्टिकल डेमो, सही तरीका';
}

// ── 7. Local NLP Intent Synthesizer ──────────────────────────────────────────
function synthesizeLocalIntent(pcDesc) {
    let text = String(pcDesc || '')
        .replace(/^####\s*|^[-*]?\s*PC\d+[\.:-]?\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) return 'Practical Execution';

    for (const pattern of BOILERPLATE_PATTERNS) {
        text = text.replace(pattern, '').trim();
    }

    text = text.charAt(0).toUpperCase() + text.slice(1);
    const words = text.split(' ');

    let leadingVerb = words[0].toLowerCase().replace(/[^a-z]/g, '');
    if (ACTION_VERB_MAP[leadingVerb]) {
        words[0] = ACTION_VERB_MAP[leadingVerb];
    } else {
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }

    if (words.length >= 5 && words.length <= 8) {
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    const importantWords = [];
    for (let i = 0; i < words.length; i++) {
        const w = words[i].replace(/[;,.:()]/g, '');
        if (!w) continue;
        if (i > 0 && /^(the|a|an|and|or|in|on|at|to|for|of|with|by|as|is|are|be|must|per|etc|such|all|any|their|its)$/i.test(w)) continue;
        importantWords.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        if (importantWords.length >= 8) break;
    }

    return importantWords.join(' ') || text.substring(0, 55);
}

// ── 8. Hindi Intent Headline ──────────────────────────────────────────────────
function synthesizeHindiIntent(pcIntent) {
    const tokens = pcIntent.split(/\s+/);
    const translated = tokens.map(t => {
        const lower = t.toLowerCase().replace(/[^a-z]/g, '');
        return VOCATIONAL_HINDI_DICT[lower] || t;
    });
    return translated.join(' ').trim();
}

// ── 9. English Search Vector (≤ 95 chars) ────────────────────────────────────
function buildContextualSearchQuery(sector, qpName, nosTitle, modTitle, pcIntent) {
    const clean = s => String(s || '').replace(/[\\\"()\[\]]/g, '').trim();
    const cleanSector = clean(sector).replace(/sector|council|skill|india/gi, '');
    const cleanQp     = clean(qpName);
    const cleanNos    = clean(nosTitle).replace(/^[A-Z0-9_\/]+:\s*/i, '').replace(/\s+\d{1,3}$/, '').replace(/\.\.\.*/g, '');
    const cleanIntent = clean(pcIntent);

    const seenWords  = new Set();
    const queryParts = [];

    const addTokens = (str) => {
        for (const t of str.split(/\s+/).filter(t => t.length > 1)) {
            const lower = t.toLowerCase();
            if (!seenWords.has(lower) && !/^(and|or|of|in|on|to|for|the|a|an|is|are|with|by|as)$/i.test(lower)) {
                seenWords.add(lower);
                queryParts.push(t);
            }
        }
    };

    addTokens(cleanSector); addTokens(cleanQp); addTokens(cleanNos); addTokens(cleanIntent);

    let full = `${queryParts.slice(0, 8).join(' ')} practical tutorial`.trim();
    if (full.length > 95) full = full.substring(0, 95).trim();
    return full;
}

// ── 10. Hindi Search Vector (≤ 95 chars) ─────────────────────────────────────
function synthesizeHindiSearchVector(englishQuery, pcIntent) {
    const textToTranslate = `${pcIntent} ${englishQuery}`.toLowerCase().replace(/[\\\"()\[\]]/g, '');
    const words = textToTranslate.split(/[\s,.:()/-]+/).filter(w => w.length > 2);

    const seenHindi = new Set();
    const translatedParts = [];
    for (const w of words) {
        if (VOCATIONAL_HINDI_DICT[w] && !seenHindi.has(VOCATIONAL_HINDI_DICT[w])) {
            seenHindi.add(VOCATIONAL_HINDI_DICT[w]);
            translatedParts.push(VOCATIONAL_HINDI_DICT[w]);
        }
    }

    let fullHi = translatedParts.length >= 2
        ? `${translatedParts.slice(0, 7).join(' ')} प्रैक्टिकल वीडियो कैसे करें`
        : `${pcIntent.split(' ').slice(0, 6).map(w => VOCATIONAL_HINDI_DICT[w.toLowerCase().replace(/[^a-z]/g, '')] || w).join(' ')} प्रैक्टिकल सीखें वीडियो`;

    if (fullHi.length > 95) fullHi = fullHi.substring(0, 95).trim();
    return fullHi;
}

// ── 11. Confidence Scoring ────────────────────────────────────────────────────
function computeIntentConfidence(rawDesc, intent) {
    if (!intent || intent === 'Practical Execution') return 40;

    let score = 0;
    const firstWord = intent.split(' ')[0].toLowerCase();

    const strongVerbs = ['inspect', 'verify', 'assemble', 'disassemble', 'calibrate', 'install',
        'operate', 'repair', 'service', 'replace', 'clean', 'measure', 'prepare', 'log', 'report',
        'identify', 'test', 'diagnose', 'troubleshoot', 'solder', 'weld', 'cut', 'cultivate',
        'irrigate', 'harvest', 'flash', 'configure', 'align'];
    const mediumVerbs = ['use', 'set', 'make', 'apply', 'handle', 'piece', 'creel', 'check'];

    if (strongVerbs.includes(firstWord)) score += 30;
    else if (mediumVerbs.includes(firstWord)) score += 20;
    else score += 10;

    const wordCount = intent.split(' ').length;
    if (wordCount >= 5 && wordCount <= 8) score += 25;
    else if (wordCount === 4 || wordCount === 9) score += 15;
    else score += 5;

    const hasBoilerplate = /check that|ensure that|follow instructions|ability to|assist in|user\/individual|to be competent/i.test(intent);
    if (!hasBoilerplate) score += 25;

    const rawTokens    = new Set(String(rawDesc || '').toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const intentTokens = intent.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const matches      = intentTokens.filter(t => rawTokens.has(t));
    if (matches.length >= 2) score += 20;
    else if (matches.length === 1) score += 10;
    else score += 5;

    return Math.min(100, Math.max(0, score));
}

function computeQueryConfidence(query) {
    if (!query) return 0;
    const len = query.length;
    if (len >= 30 && len <= 110) return 95;
    if (len > 110 && len <= 140) return 80;
    return 60;
}

function computeHindiConfidence(queryHi) {
    if (!queryHi) return 0;
    let score = 0;
    if (/[\u0900-\u097F]/.test(queryHi)) score += 40;
    if (/प्रैक्टिकल|कैसे|सीखें|करें|वीडियो/.test(queryHi)) score += 30;
    const wordCount = queryHi.split(' ').length;
    score += (wordCount >= 4 && wordCount <= 12) ? 30 : 15;
    return Math.min(100, score);
}

// ── 12. Sarvam AI Cloud Refinement ───────────────────────────────────────────
async function refineIntentWithSarvam(item) {
    if (!SARVAM_API_KEY) return null;

    const pcDesc   = String(item.pc_description || '').replace(/^•\s*|^PC\d+[\.:-]?\s*/i, '').trim();
    const sector   = item.sector       || 'Vocational Skills';
    const qpName   = item.qp_name      || item.qp_code;
    const nosTitle = item.nos_title    || item.nos_code;
    const modTitle = item.module_title || 'Core Operational Module';

    // Retrieve Knowledge & Skills context from canonical JSON AST if available
    let kuContext = '';
    let gsContext = '';
    const cleanCode = item.qp_code.replace(/\//g, '_');
    const jsonPath  = path.join(JSON_DIR, `${cleanCode}.json`);
    if (fs.existsSync(jsonPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            const nosUnit = (data.nos_units || []).find(n => n.nos_code === item.nos_code);
            if (nosUnit) {
                if (nosUnit.kus && nosUnit.kus.length > 0) {
                    kuContext = nosUnit.kus.slice(0, 4).join('; ');
                }
                if (nosUnit.gs && nosUnit.gs.length > 0) {
                    gsContext = nosUnit.gs.slice(0, 3).join('; ');
                }
            }
        } catch (_) {}
    }

    let prompt = `You are an expert Vocational Curriculum Specialist.
Refine the following practical training task into an action-oriented 5 to 8 word title:
- Sector: "${sector}"
- Qualification Role: "${qpName}"
- Occupational Unit: "${nosTitle}"
- Module Reel: "${modTitle}"
- Training Task Description: "${pcDesc}"`;

    if (kuContext) prompt += `\n- Associated Knowledge Topics: "${kuContext}"`;
    if (gsContext) prompt += `\n- Applicable Vocational Skills: "${gsContext}"`;

    prompt += `\n\nRequirements:
1. Begin with an action verb (e.g. Inspect, Verify, Assemble, Calibrate, Execute, Repair).
2. Do NOT include bullet points, raw codes, or filler words like "check that" or "ensure that".
3. Return strictly raw JSON: { "pc_intent": "Exact 5-8 Word Refined Action" }`;

    try {
        const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
            body: JSON.stringify({ model: 'sarvam-105b', messages: [{ role: 'system', content: prompt }], temperature: 0.2, max_tokens: 80 })
        });

        if (res.ok) {
            const data      = await res.json();
            const rawText   = data.choices?.[0]?.message?.content?.trim() || '';
            const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
            const parsed    = JSON.parse(cleanJson);
            if (parsed && parsed.pc_intent) return parsed.pc_intent.trim();
        }
    } catch (_) {}

    return null;
}

// ── 13. Checkpoint Helpers ────────────────────────────────────────────────────
function loadCheckpoint() {
    try { if (fs.existsSync(CHECKPOINT_PATH)) return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8')); } catch {}
    return null;
}
function saveCheckpoint(qpCode, processedCount) {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({ last_qp: qpCode, processed_count: processedCount, timestamp: new Date().toISOString() }), 'utf-8');
}
function clearCheckpoint() { try { fs.unlinkSync(CHECKPOINT_PATH); } catch {} }

// ── 14. Main Execution ────────────────────────────────────────────────────────
async function runPass2Unified() {
    const args      = process.argv.slice(2);
    const isAudit   = args.includes('--audit');
    const doAll     = args.includes('--all');
    const doResume  = args.includes('--resume');
    const doForce   = args.includes('--force');
    const limitFlag = args.find(a => a.startsWith('--limit='));
    const qpFlag    = args.find(a => a.startsWith('--qp='));
    const modeFlag  = args.find(a => a.startsWith('--mode='));

    const limit    = limitFlag ? parseInt(limitFlag.split('=')[1]) : 5;
    const targetQp = qpFlag    ? qpFlag.split('=')[1].trim()       : null;
    const mode     = modeFlag  ? modeFlag.split('=')[1].trim()     : 'hybrid'; // DEFAULT: hybrid

    console.log('================================================================================');
    console.log('⚡ [PASS 2 UNIFIED] INTENT, CATEGORY & HARVESTER GUIDANCE ENGINE');
    console.log(`   Mode: ${mode.toUpperCase()} | Sarvam AI: ${SARVAM_API_KEY ? '✅ Available' : '❌ No Key (falling back to local)'}`);
    console.log('   (Dual EN/HI Intent · Dual Search Vectors · YouTube Category · Tool Signals)');
    console.log('================================================================================\n');

    const pool = { query: db.query.bind(db) };
    const intentFilter = doForce ? '' : 'AND (p.pc_intent IS NULL OR p.pc_intent_hi IS NULL OR p.negative_keywords IS NULL)';

    const baseSelect = `
        SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description, p.intent_confidence,
               q.sector, q.qp_name, n.nos_title, m.module_title
        FROM nsqf_pcs p
        JOIN nsqf_qps q ON p.qp_code = q.qp_code
        LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
        LEFT JOIN nsqf_modules m ON p.module_id = m.id`;

    let pcsToProcess = [];

    if (targetQp) {
        const clean = targetQp.replace(/\//g, '_');
        const res = await pool.query(`${baseSelect} WHERE (p.qp_code = $1 OR p.qp_code = $2) ${intentFilter} ORDER BY p.qp_code, p.sequence_order`, [targetQp, clean]);
        pcsToProcess = res.rows;
    } else if (isAudit) {
        const res = await pool.query(`${baseSelect} WHERE p.qp_code IN ('NIE/ELE/Q0803', 'AGR/Q0101', 'HSS/Q8602', 'TSC/Q0201', 'AAS/Q0103') ORDER BY p.qp_code, p.sequence_order`);
        pcsToProcess = res.rows;
    } else if (doAll) {
        const res = await pool.query(`${baseSelect} WHERE 1=1 ${intentFilter} ORDER BY p.qp_code, p.sequence_order`);
        pcsToProcess = res.rows;
    } else {
        const res = await pool.query(`${baseSelect} WHERE p.qp_code IN (SELECT qp_code FROM nsqf_qps ORDER BY id ASC LIMIT $1) ${intentFilter} ORDER BY p.qp_code, p.sequence_order`, [limit]);
        pcsToProcess = res.rows;
    }

    if (pcsToProcess.length === 0) {
        console.log('✅  All criteria already have full intents & harvester guidance! (Use --force to recompute)');
        process.exit(0);
    }

    let startIdx = 0;
    if (doResume && !targetQp && !isAudit) {
        const cp = loadCheckpoint();
        if (cp && cp.last_qp) {
            const idx = pcsToProcess.findIndex(p => p.qp_code === cp.last_qp);
            if (idx >= 0) { startIdx = idx; console.log(`⏩  Resuming from QP ${cp.last_qp} (skipping ${startIdx} criteria)...\n`); }
        }
    }

    const items = pcsToProcess.slice(startIdx);
    console.log(`Processing ${items.length.toLocaleString()} Performance Criteria across ${new Set(items.map(i => i.qp_code)).size} QP(s)...\n`);

    const startTime = Date.now();
    let updatedCount = 0, totalConfidence = 0, sarvamCallCount = 0;
    let highConfCount = 0, medConfCount = 0, lowConfCount = 0;

    for (let i = 0; i < items.length; i += 100) {
        const chunk = items.slice(i, i + 100);

        for (const item of chunk) {
            // Step 1: Local NLP (always)
            let intent     = synthesizeLocalIntent(item.pc_description);
            let intentConf = computeIntentConfidence(item.pc_description, intent);

            // Step 2: Cloud refinement (mode-dependent)
            const needsCloud = (mode === 'cloud') || (mode === 'hybrid' && intentConf < 70);
            if (needsCloud && SARVAM_API_KEY) {
                const refined = await refineIntentWithSarvam(item);
                if (refined) {
                    const refinedConf = computeIntentConfidence(item.pc_description, refined);
                    if (refinedConf >= intentConf) { intent = refined; intentConf = refinedConf; sarvamCallCount++; }
                }
            }

            const intentHi    = synthesizeHindiIntent(intent);
            const queryEn     = buildContextualSearchQuery(item.sector, item.qp_name, item.nos_title, item.module_title, intent);
            const queryConf   = computeQueryConfidence(queryEn);
            const queryHi     = synthesizeHindiSearchVector(queryEn, intent);
            const queryHiConf = computeHindiConfidence(queryHi);
            const cat         = mapSectorToCategory(item.sector);
            const toolKeywords = extractToolKeywords(item.pc_description, item.sector);
            const negKeywords  = getNegativeKeywords(item.sector);
            const posSignals   = getPositiveSignals();

            await pool.query(`
                UPDATE nsqf_pcs
                SET pc_intent = $1, pc_intent_hi = $2, intent_confidence = $3,
                    contextual_search_query = $4, query_confidence = $5,
                    contextual_search_query_hi = $6, query_confidence_hi = $7,
                    youtube_category_id = $8, youtube_category_name = $9,
                    tool_keywords = $10, negative_keywords = $11, positive_signals = $12,
                    min_duration_seconds = 180, max_duration_seconds = 900
                WHERE id = $13
            `, [intent, intentHi, intentConf, queryEn, queryConf, queryHi, queryHiConf,
                cat.id, cat.name, toolKeywords, negKeywords, posSignals, item.id]);

            updatedCount++;
            totalConfidence += intentConf;
            if (intentConf >= 80) highConfCount++;
            else if (intentConf >= 70) medConfCount++;
            else lowConfCount++;

            if (isAudit && (updatedCount <= 6 || updatedCount % 40 === 0)) {
                console.log(`[${updatedCount}/${items.length}] 📌 [${item.qp_code} ${item.pc_code}]: "${item.pc_description.substring(0, 55)}..."`);
                console.log(`        💡 Intent (EN): "${intent}" (${intentConf}%)`);
                console.log(`        🇮🇳 Intent (HI): "${intentHi}"`);
                console.log(`        🏷️  Category:    ${cat.id} (${cat.name})`);
                console.log(`        🔧 Tools:       "${toolKeywords}"`);
                console.log(`        🔍 Search EN:   "${queryEn}"`);
                console.log('--------------------------------------------------------------------------------');
            }
        }

        const lastItem = chunk[chunk.length - 1];
        saveCheckpoint(lastItem.qp_code, updatedCount);
        if (!isAudit && (updatedCount % 500 === 0 || i + 100 >= items.length)) {
            const pct = ((updatedCount / items.length) * 100).toFixed(1);
            console.log(`[${updatedCount.toLocaleString()}/${items.length.toLocaleString()}] (${pct}%) ⚡ Latest QP: ${lastItem.qp_code}${sarvamCallCount > 0 ? `  🧠 Sarvam: ${sarvamCallCount}` : ''}`);
        }
    }

    // Update master QP status
    const distinctQps = [...new Set(items.map(c => c.qp_code))];
    for (const qp of distinctQps) {
        await pool.query(`UPDATE nsqf_qps SET pipeline_status = 'intent_synthesized' WHERE qp_code = $1`, [qp]);
    }

    clearCheckpoint();
    const elapsedMs = Date.now() - startTime;
    const avgConf   = updatedCount > 0 ? (totalConfidence / updatedCount).toFixed(1) : 0;

    console.log('\n================================================================================');
    console.log(`📊 PASS 2 UNIFIED SUMMARY:`);
    console.log(`   Mode:                    ${mode.toUpperCase()}`);
    console.log(`   Total PCs Processed:     ${updatedCount.toLocaleString()}`);
    console.log(`   Average Intent Score:    ${avgConf}%`);
    console.log(`   High Quality (>= 80%):  ${highConfCount.toLocaleString()} (${((highConfCount / updatedCount) * 100).toFixed(1)}%)`);
    console.log(`   Medium Quality (70-79%): ${medConfCount.toLocaleString()} (${((medConfCount / updatedCount) * 100).toFixed(1)}%)`);
    console.log(`   Low Quality (< 70%):    ${lowConfCount.toLocaleString()} (${((lowConfCount / updatedCount) * 100).toFixed(1)}%)`);
    if (mode !== 'local') console.log(`   Sarvam AI Cloud Calls:  ${sarvamCallCount.toLocaleString()} (${((sarvamCallCount / updatedCount) * 100).toFixed(1)}% of PCs)`);
    console.log(`   Execution Time:          ${(elapsedMs / 1000).toFixed(2)} seconds`);
    console.log(`   Throughput:              ${Math.round(updatedCount / (elapsedMs / 1000)).toLocaleString()} PCs/sec`);
    console.log(`   Database Status:         pipeline_status = 'intent_synthesized' in hayadb`);
    console.log('================================================================================\n');

    process.exit(0);
}

runPass2Unified().catch(e => {
    console.error('\n❌ Fatal error in Pass 2 Unified:', e.message);
    console.error(e.stack);
    process.exit(1);
});
