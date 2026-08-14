'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PASS 2: Unified Intent, Category & Harvester Guidance Engine (v3)       ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Generates the complete 7-parameter harvesting & learning payload        ║
 * ║  for NSQF Performance Criteria (nsqf_pcs) in local hayadb:               ║
 * ║                                                                          ║
 * ║  1. pc_intent                 (5-8 word English practical action)       ║
 * ║  2. pc_intent_hi              (5-8 word Devanagari Hindi action headline)║
 * ║  3. contextual_search_query   (Deduplicated English YouTube vector)     ║
 * ║  4. contextual_search_query_hi(Devanagari Hindi YouTube search vector)  ║
 * ║  5. youtube_category_id/name  (28 Science, 27 Education, 2 Autos, etc.) ║
 * ║  6. tool_keywords             (Physical tools, testers, and components) ║
 * ║  7. negative_keywords         (Exclusions: -unboxing -review -prank)    ║
 * ║  8. positive_signals          (Hands-on markers: step by step, demo)    ║
 * ║  9. min/max duration bounds   (180s - 900s / 3-15 min window)           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/nsqf_local_intent_extractor.js --qp=NIE/ELE/Q0803
 *   node scripts/nsqf_local_intent_extractor.js --limit=10
 *   node scripts/nsqf_local_intent_extractor.js --all
 *   node scripts/nsqf_local_intent_extractor.js --all --resume
 *   node scripts/nsqf_local_intent_extractor.js --audit
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../server/db');

const CHECKPOINT_PATH = path.join(__dirname, '..', 'data', '.pass2_checkpoint.json');

// ── 1. Introductory Boilerplate Phrases to Strip ─────────────────────────────
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

// ── 2. Action Verbs Standardization Map ──────────────────────────────────────
const ACTION_VERB_MAP = {
    'inspect': 'Inspect',
    'check': 'Inspect',
    'verify': 'Verify',
    'examine': 'Inspect',
    'assemble': 'Assemble',
    'disassemble': 'Disassemble',
    'dismantle': 'Disassemble',
    'calibrate': 'Calibrate',
    'prepare': 'Prepare',
    'measure': 'Measure',
    'install': 'Install',
    'operate': 'Operate',
    'maintain': 'Maintain',
    'maintenance': 'Maintain',
    'repair': 'Repair',
    'service': 'Service',
    'replace': 'Replace',
    'substitute': 'Replace',
    'clean': 'Clean',
    'record': 'Log',
    'document': 'Log',
    'log': 'Log',
    'report': 'Report',
    'identify': 'Identify',
    'recognize': 'Identify',
    'test': 'Test',
    'diagnose': 'Diagnose',
    'troubleshoot': 'Troubleshoot',
    'execute': 'Execute',
    'solder': 'Solder',
    'soldering': 'Solder',
    'desolder': 'Desolder',
    'weld': 'Weld',
    'welding': 'Weld',
    'cut': 'Cut',
    'cutting': 'Cut',
    'align': 'Align',
    'adjust': 'Adjust',
    'configure': 'Configure',
    'flash': 'Flash',
    'unlock': 'Unlock',
    'cultivate': 'Cultivate',
    'transplant': 'Transplant',
    'irrigate': 'Irrigate',
    'harvest': 'Harvest',
    'treat': 'Treat',
    'piece': 'Piece',
    'creel': 'Creel',
    'carryout': 'Carryout',
};

// ── 3. Vocational English → Hindi Translation Dictionary ────────────────────
const VOCATIONAL_HINDI_DICT = {
    // Actions
    'inspect': 'जांच करें',
    'check': 'चेक करें',
    'verify': 'सत्यापन करें',
    'assemble': 'असेंबल करें',
    'disassemble': 'खोलें और अलग करें',
    'calibrate': 'कैलिब्रेशन करें',
    'install': 'इंस्टॉल करें',
    'operate': 'ऑपरेट करें',
    'maintain': 'रखरखाव करें',
    'repair': 'रिपेयरिंग करें',
    'service': 'सर्विसिंग करें',
    'replace': 'बदलें',
    'clean': 'सफाई करें',
    'measure': 'माप लें',
    'prepare': 'तैयार करें',
    'log': 'दर्ज करें',
    'report': 'रिपोर्ट करें',
    'identify': 'पहचान करें',
    'test': 'टेस्टिंग करें',
    'diagnose': 'फॉल्ट ढूंढें',
    'troubleshoot': 'समस्या ठीक करें',
    'execute': 'निष्पादित करें',
    'solder': 'सोल्डरिंग करें',
    'desolder': 'डी-सोल्डरिंग करें',
    'weld': 'वेल्डिंग करें',
    'flash': 'सॉफ्टवेयर फ्लैश करें',
    'unlock': 'अनलॉक करें',
    'cultivate': 'खेती करें',
    'transplant': 'रोपाई करें',
    'irrigate': 'सिंचाई करें',
    'harvest': 'कटाई करें',
    'piecing': 'धागा जोड़ना',
    'creeling': 'क्रीलिंग करना',

    // Electronics & Tech
    'mobile': 'मोबाइल',
    'phone': 'फोन',
    'smartphone': 'स्मार्टफोन',
    'screen': 'स्क्रीन',
    'display': 'डिस्प्ले फोल्डर',
    'touch': 'टच स्क्रीन',
    'battery': 'बैटरी',
    'charging': 'चार्जिंग जैक',
    'connector': 'कनेक्टर',
    'multimeter': 'मल्टीमीटर',
    'circuit': 'सर्किट',
    'pcb': 'पीसीबी',
    'voltage': 'वोल्टेज',
    'current': 'करंट',
    'resistor': 'रेसिस्टर',
    'capacitor': 'कैपेसिटर',
    'transistor': 'ट्रांजिस्टर',
    'smd': 'एसएमडी कंपोनेंट',
    'firmware': 'फर्मवेयर',
    'software': 'सॉफ्टवेयर',
    'rom': 'स्टॉक रोम',
    'camera': 'कैमरा',
    'speaker': 'स्पीकर',
    'mic': 'माइक',
    'ringer': 'रिंगर',
    'wiring': 'वायरिंग',
    'earthing': 'अर्थिंग',
    'motor': 'मोटर',

    // Agriculture & Environment
    'paddy': 'धान',
    'rice': 'चावल',
    'seed': 'बीज',
    'fertilizer': 'खाद',
    'pesticide': 'कीटनाशक',
    'fungicide': 'फफूंदनाशी',
    'nutrient': 'पोषक तत्व',
    'soil': 'मिट्टी',
    'weed': 'खरपतवार',
    'nursery': 'नर्सरी',

    // Healthcare
    'healthcare': 'हेल्थकेयर',
    'hospital': 'अस्पताल',
    'patient': 'मरीज',
    'sanitization': 'स्वच्छता और सैनिटाइजेशन',
    'infection': 'संक्रमण नियंत्रण',
    'hygiene': 'व्यक्तिगत स्वच्छता',

    // Textile
    'textile': 'कपड़ा उद्योग',
    'yarn': 'धागा',
    'spinning': 'कताई',
    'bobbin': 'बॉबिन',
    'spindle': 'स्पिंडल',
    'ring': 'रिंग फ्रेम',
    'tenter': 'टेंटर',

    // Automotive & Mechanical
    'hydraulic': 'हाइड्रोलिक',
    'pneumatic': 'न्यूमेटिक',
    'automotive': 'ऑटोमोबाइल',
    'engine': 'इंजन',
    'brake': 'ब्रेक',
    'plc': 'पीएलसी कंट्रोलर',
    'cnc': 'सीएनसी मशीन',
    'cad': 'सीएडी 3डी',
    'robotics': 'रोबोटिक्स',

    // Pedagogical & Technical Descriptors
    'describe': 'विवरण समझें',
    'functions': 'कार्य और उपयोग',
    'function': 'कार्य',
    'components': 'पुर्जे और कंपोनेंट',
    'component': 'कंपोनेंट',
    'parameters': 'पैरामीटर',
    'safety': 'सुरक्षा सावधानियां',
    'guidelines': 'दिशानिर्देश',
    'procedure': 'प्रक्रिया',
    'handling': 'संभालना',
    'diagram': 'डायग्राम और नक्शा',
    'diagrams': 'डायग्राम',
    'schematics': 'सर्किट डायग्राम',
    'schematic': 'सर्किट डायग्राम',
    'testing': 'टेस्टिंग और जांच',
    'quality': 'गुणवत्ता',
    'management': 'प्रबंधन',
    'equipment': 'उपकरण',
    'tools': 'औजार और टूल्स',
    'interpret': 'समझें और पढ़ें',
    'utilize': 'उपयोग करें',
    'precautions': 'सावधानियां',
};

// ── 4. Sector to Complete YouTube Category Mapping (All 15 Categories) ─────
const SECTOR_YOUTUBE_CATEGORY = {
    // 28: Science & Technology
    'electronics':     { id: 28, name: 'Science & Technology' },
    'telecom':         { id: 28, name: 'Science & Technology' },
    'it-ites':         { id: 28, name: 'Science & Technology' },
    'it':              { id: 28, name: 'Science & Technology' },
    'instrumentation': { id: 28, name: 'Science & Technology' },
    'life sciences':   { id: 28, name: 'Science & Technology' },
    'hydrocarbon':     { id: 28, name: 'Science & Technology' },

    // 2: Autos & Vehicles
    'automotive':      { id: 2,  name: 'Autos & Vehicles' },
    'aerospace':       { id: 2,  name: 'Autos & Vehicles' },
    'aviation':        { id: 2,  name: 'Autos & Vehicles' },

    // 26: Howto & Style
    'textile':         { id: 26, name: 'Howto & Style' },
    'apparel':         { id: 26, name: 'Howto & Style' },
    'beauty':          { id: 26, name: 'Howto & Style' },
    'food':            { id: 26, name: 'Howto & Style' },
    'handicrafts':     { id: 26, name: 'Howto & Style' },
    'gems':            { id: 26, name: 'Howto & Style' },
    'leather':         { id: 26, name: 'Howto & Style' },

    // 15: Pets & Animals (Agriculture / Livestock / Farming)
    'agriculture':     { id: 15, name: 'Pets & Animals' },
    'animal':          { id: 15, name: 'Pets & Animals' },
    'dairy':           { id: 15, name: 'Pets & Animals' },
    'fisheries':       { id: 15, name: 'Pets & Animals' },

    // 1: Film & Animation
    'media':           { id: 1,  name: 'Film & Animation' },
    'animation':       { id: 1,  name: 'Film & Animation' },

    // 20: Gaming
    'gaming':          { id: 20, name: 'Gaming' },

    // 19: Travel & Events
    'tourism':         { id: 19, name: 'Travel & Events' },
    'hospitality':     { id: 19, name: 'Travel & Events' },

    // 17: Sports
    'sports':          { id: 17, name: 'Sports' },
    'fitness':         { id: 17, name: 'Sports' },

    // 27: Education (General Technical & Vocational)
    'healthcare':      { id: 27, name: 'Education' },
    'construction':    { id: 27, name: 'Education' },
    'power':           { id: 27, name: 'Education' },
    'iron and steel':  { id: 27, name: 'Education' },
    'capital goods':   { id: 27, name: 'Education' },
    'plumbing':        { id: 27, name: 'Education' },
    'green jobs':      { id: 27, name: 'Education' },
    'mining':          { id: 27, name: 'Education' },
    'chemical':        { id: 27, name: 'Education' },
    'security':        { id: 27, name: 'Education' },
    'retail':          { id: 27, name: 'Education' },
    'bfsi':            { id: 27, name: 'Education' },
    'logistics':       { id: 27, name: 'Education' },
};

function mapSectorToCategory(sector) {
    const s = String(sector || '').toLowerCase();
    for (const [k, v] of Object.entries(SECTOR_YOUTUBE_CATEGORY)) {
        if (s.includes(k)) return v;
    }
    return { id: 27, name: 'Education' };
}

// ── 5. Domain Physical Tool Recognition ──────────────────────────────────────
const KNOWN_TOOLS = [
    // Electronics
    'multimeter', 'digital multimeter', 'oscilloscope', 'dc power supply', 'smd rework station',
    'hot air gun', 'soldering iron', 'solder wire', 'desoldering pump', 'flux', 'esd mat',
    'anti-static wrist strap', 'tweezers', 'opening pick', 'suction cup', 'b-7000 glue',
    'screw driver', 'magnifier lamp', 'pcb cleaner', 'microscope',
    // Agriculture
    'knapsack sprayer', 'seed drill', 'rotavator', 'soil testing kit', 'ph meter',
    'fungicide', 'pesticide', 'seed tray', 'tillage plow', 'drip irrigation line',
    // Textile
    'ring frame', 'roving bobbin', 'traveller', 'spindle', 'splicer', 'yarn tension meter',
    // Automotive & Mech
    'torque wrench', 'diagnostic scanner', 'feeler gauge', 'hydraulic lift', 'spark plug gap tool',
    'dial indicator', 'vernier caliper', 'micrometer', 'bearing puller', 'welding torch',
    // Healthcare
    'sphygmomanometer', 'stethoscope', 'pulse oximeter', 'thermometer', 'glucometer',
    'ppe kit', 'autoclave', 'disinfectant'
];

function extractToolKeywords(text, sector) {
    const lower = text.toLowerCase();
    const found = KNOWN_TOOLS.filter(tool => lower.includes(tool));
    if (found.length > 0) return found.slice(0, 5).join(', ');

    // Fallback sector default instruments
    const s = String(sector || '').toLowerCase();
    if (s.includes('electronic') || s.includes('telecom')) return 'digital multimeter, soldering iron, smd rework';
    if (s.includes('agri')) return 'sprayer, soil testing kit, seed equipment';
    if (s.includes('auto')) return 'torque wrench, diagnostic scanner, multimeter';
    if (s.includes('textile')) return 'ring frame, roving bobbin, spindle';
    if (s.includes('health')) return 'stethoscope, thermometer, ppe kit';
    return 'measuring instruments, standard tools, safety gear';
}

// ── 6. Negative Keywords & Positive Signals Assembly ─────────────────────────
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

// ── 7. Core Intent Synthesizer (NLP) ──────────────────────────────────────────
function synthesizeLocalIntent(pcDesc) {
    let text = String(pcDesc || '')
        .replace(/^####\s*|^[-*]?\s*PC\d+[\.:-]?\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) return 'Practical Execution';

    // 1. Strip introductory boilerplate
    for (const pattern of BOILERPLATE_PATTERNS) {
        text = text.replace(pattern, '').trim();
    }

    // Capitalize first character
    text = text.charAt(0).toUpperCase() + text.slice(1);

    // 2. Tokenize
    const words = text.split(' ');

    // Standardize leading action verb
    let leadingVerb = words[0].toLowerCase().replace(/[^a-z]/g, '');
    if (ACTION_VERB_MAP[leadingVerb]) {
        words[0] = ACTION_VERB_MAP[leadingVerb];
    } else {
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }

    // If description is already concise (5-8 words), return title-cased
    if (words.length >= 5 && words.length <= 8) {
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // 3. Filter out filler stop words
    const importantWords = [];
    for (let i = 0; i < words.length; i++) {
        const w = words[i].replace(/[;,.:()]/g, '');
        if (!w) continue;
        if (i > 0 && /^(the|a|an|and|or|in|on|at|to|for|of|with|by|as|is|are|be|must|per|etc|such|all|any|their|its)$/i.test(w)) {
            continue;
        }
        importantWords.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        if (importantWords.length >= 8) break; // 5-8 salient words target
    }

    const intent = importantWords.join(' ');
    return intent || text.substring(0, 55);
}

// ── 8. Devanagari Hindi Intent Headline (For Student UI) ─────────────────────
function synthesizeHindiIntent(pcIntent) {
    const tokens = pcIntent.split(/\s+/);
    const translated = tokens.map(t => {
        const lower = t.toLowerCase().replace(/[^a-z]/g, '');
        return VOCATIONAL_HINDI_DICT[lower] || t;
    });

    return translated.join(' ').trim();
}

// ── 9. Deduplicated Contextual English Search Vector ─────────────────────────
function buildContextualSearchQuery(sector, qpName, nosTitle, modTitle, pcIntent) {
    const cleanSector = String(sector || '')
        .replace(/sector|council|skill|india/gi, '')
        .trim();

    const cleanQp = String(qpName || '')
        .replace(/assistant|technician|operator/gi, (m) => m)
        .trim();

    const cleanNos = String(nosTitle || '')
        .replace(/^[A-Z0-9_\/]+:\s*/i, '')
        .replace(/\s+\d{1,3}$/, '')
        .replace(/\.\.\.*/g, '')
        .trim();

    const seenWords = new Set();
    const queryParts = [];

    const addTokens = (str) => {
        const tokens = str.split(/\s+/).filter(t => t.length > 1);
        for (const t of tokens) {
            const lower = t.toLowerCase();
            if (!seenWords.has(lower) && !/^(and|or|of|in|on|to|for|the|a|an|is|are)$/i.test(lower)) {
                seenWords.add(lower);
                queryParts.push(t);
            }
        }
    };

    addTokens(cleanSector);
    addTokens(cleanQp);
    addTokens(cleanNos);
    addTokens(pcIntent);

    const finalTokens = queryParts.slice(0, 12);
    return `${finalTokens.join(' ')} practical tutorial demonstration`.trim();
}

// ── 10. Devanagari Hindi Search Vector (For YouTube Harvester) ───────────────
function synthesizeHindiSearchVector(englishQuery, pcIntent) {
    const textToTranslate = `${pcIntent} ${englishQuery}`.toLowerCase();
    const words = textToTranslate.split(/[\s,.:()/-]+/).filter(w => w.length > 2);

    const seenHindi = new Set();
    const translatedParts = [];

    for (const w of words) {
        if (VOCATIONAL_HINDI_DICT[w] && !seenHindi.has(VOCATIONAL_HINDI_DICT[w])) {
            seenHindi.add(VOCATIONAL_HINDI_DICT[w]);
            translatedParts.push(VOCATIONAL_HINDI_DICT[w]);
        }
    }

    if (translatedParts.length >= 2) {
        return `${translatedParts.slice(0, 10).join(' ')} प्रैक्टिकल वीडियो कैसे करें`.trim();
    }

    const intentTokens = pcIntent.split(' ').map(w => VOCATIONAL_HINDI_DICT[w.toLowerCase()] || w);
    return `${intentTokens.join(' ')} प्रैक्टिकल सीखें हिंदी वीडियो`.trim();
}

// ── 11. Confidence Scoring ───────────────────────────────────────────────────
function computeIntentConfidence(rawDesc, intent) {
    if (!intent || intent === 'Practical Execution') return 40;

    let score = 0;

    // Factor 1: Leading Action Verb Strength (+30 Points)
    const firstWord = intent.split(' ')[0].toLowerCase();
    if (['inspect', 'verify', 'assemble', 'disassemble', 'calibrate', 'install', 'operate', 'repair', 'service', 'replace', 'clean', 'measure', 'prepare', 'log', 'report', 'identify', 'test', 'diagnose', 'troubleshoot', 'solder', 'weld', 'cut', 'cultivate', 'irrigate', 'harvest'].includes(firstWord)) {
        score += 30;
    } else if (['use', 'set', 'make', 'apply', 'handle', 'piece', 'creel'].includes(firstWord)) {
        score += 20;
    } else {
        score += 10;
    }

    // Factor 2: Length & Conciseness (+25 Points) - Target: 5 to 8 words
    const wordCount = intent.split(' ').length;
    if (wordCount >= 5 && wordCount <= 8) {
        score += 25;
    } else if (wordCount === 4 || wordCount === 9) {
        score += 15;
    } else {
        score += 5;
    }

    // Factor 3: Boilerplate Purity (+25 Points)
    const hasBoilerplate = /check that|ensure that|follow instructions|ability to|assist in|user\/individual|to be competent/i.test(intent);
    if (!hasBoilerplate) {
        score += 25;
    }

    // Factor 4: Domain Noun Preservation (+20 Points)
    const rawTokens = new Set(String(rawDesc || '').toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const intentTokens = intent.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const matches = intentTokens.filter(t => rawTokens.has(t));
    if (matches.length >= 2) {
        score += 20;
    } else if (matches.length === 1) {
        score += 10;
    } else {
        score += 5;
    }

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
    if (/हिंदी|प्रैक्टिकल|कैसे|सीखें|करें|वीडियो/i.test(queryHi)) score += 30;
    const wordCount = queryHi.split(' ').length;
    if (wordCount >= 4 && wordCount <= 12) score += 30;
    else score += 15;
    return Math.min(100, score);
}

// ── 12. Checkpoint Helpers ───────────────────────────────────────────────────
function loadCheckpoint() {
    try {
        if (fs.existsSync(CHECKPOINT_PATH)) {
            return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8'));
        }
    } catch {}
    return null;
}

function saveCheckpoint(qpCode, processedCount) {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({
        last_qp: qpCode,
        processed_count: processedCount,
        timestamp: new Date().toISOString()
    }), 'utf-8');
}

function clearCheckpoint() {
    try { fs.unlinkSync(CHECKPOINT_PATH); } catch {}
}

// ── 13. Main Batch Execution ─────────────────────────────────────────────────
async function runPass2GuidanceEngine() {
    const args      = process.argv.slice(2);
    const isAudit   = args.includes('--audit');
    const doAll     = args.includes('--all');
    const doResume  = args.includes('--resume');
    const doForce   = args.includes('--force');
    const limitFlag = args.find(a => a.startsWith('--limit='));
    const qpFlag    = args.find(a => a.startsWith('--qp='));
    const limit     = limitFlag ? parseInt(limitFlag.split('=')[1]) : 5;
    const targetQp  = qpFlag ? qpFlag.split('=')[1].trim() : null;

    console.log('================================================================================');
    console.log('⚡ [PASS 2] UNIFIED INTENT, CATEGORY & HARVESTER GUIDANCE ENGINE (v3)');
    console.log('   (Dual EN/HI Intent • Dual Search Vectors • YouTube Category & Tool Signals)');
    console.log('================================================================================\n');

    let pcsToProcess = [];
    const pool = { query: db.query.bind(db) };

    const intentFilter = doForce ? '' : 'AND (p.pc_intent IS NULL OR p.pc_intent_hi IS NULL OR p.negative_keywords IS NULL)';

    if (targetQp) {
        const clean = targetQp.replace(/\//g, '_');
        const res = await pool.query(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE (p.qp_code = $1 OR p.qp_code = $2) ${intentFilter}
            ORDER BY p.qp_code, p.sequence_order
        `, [targetQp, clean]);
        pcsToProcess = res.rows;

    } else if (isAudit) {
        const res = await pool.query(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE p.qp_code IN ('NIE/ELE/Q0803', 'AGR/Q0101', 'HSS/Q8602', 'TSC/Q0201', 'AAS/Q0103')
            ORDER BY p.qp_code, p.sequence_order
        `);
        pcsToProcess = res.rows;

    } else if (doAll) {
        const res = await pool.query(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE 1=1 ${intentFilter}
            ORDER BY p.qp_code, p.sequence_order
        `);
        pcsToProcess = res.rows;

    } else {
        const res = await pool.query(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE p.qp_code IN (
                SELECT qp_code FROM nsqf_qps ORDER BY id ASC LIMIT $1
            ) ${intentFilter}
            ORDER BY p.qp_code, p.sequence_order
        `, [limit]);
        pcsToProcess = res.rows;
    }

    if (pcsToProcess.length === 0) {
        console.log('✅  All criteria already have full intents, categories & harvester guidance! (Use --force to recompute)');
        process.exit(0);
    }

    let startIdx = 0;
    if (doResume && !targetQp && !isAudit) {
        const cp = loadCheckpoint();
        if (cp && cp.last_qp) {
            const idx = pcsToProcess.findIndex(p => p.qp_code === cp.last_qp);
            if (idx >= 0) {
                startIdx = idx;
                console.log(`⏩  Resuming from QP ${cp.last_qp} (skipping ${startIdx} criteria)...\n`);
            }
        }
    }

    const items = pcsToProcess.slice(startIdx);
    console.log(`Processing ${items.length.toLocaleString()} Performance Criteria across ${new Set(items.map(i => i.qp_code)).size} QP(s)...\n`);

    const startTime = Date.now();
    let updatedCount = 0;
    let totalConfidence = 0;
    let highConfCount = 0;
    let medConfCount = 0;
    let lowConfCount = 0;

    const BATCH_SIZE = 100;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);

        for (const item of chunk) {
            const intent        = synthesizeLocalIntent(item.pc_description);
            const intentHi      = synthesizeHindiIntent(intent);
            const intentConf    = computeIntentConfidence(item.pc_description, intent);
            const queryEn       = buildContextualSearchQuery(item.sector, item.qp_name, item.nos_title, item.module_title, intent);
            const queryConf     = computeQueryConfidence(queryEn);
            const queryHi       = synthesizeHindiSearchVector(queryEn, intent);
            const queryHiConf   = computeHindiConfidence(queryHi);
            const cat           = mapSectorToCategory(item.sector);
            const toolKeywords  = extractToolKeywords(item.pc_description, item.sector);
            const negKeywords   = getNegativeKeywords(item.sector);
            const posSignals    = getPositiveSignals();

            await pool.query(`
                UPDATE nsqf_pcs
                SET pc_intent                  = $1,
                    pc_intent_hi               = $2,
                    intent_confidence          = $3,
                    contextual_search_query    = $4,
                    query_confidence           = $5,
                    contextual_search_query_hi = $6,
                    query_confidence_hi        = $7,
                    youtube_category_id        = $8,
                    youtube_category_name      = $9,
                    tool_keywords              = $10,
                    negative_keywords          = $11,
                    positive_signals           = $12,
                    min_duration_seconds       = 180,
                    max_duration_seconds       = 900
                WHERE id = $13
            `, [
                intent, intentHi, intentConf,
                queryEn, queryConf, queryHi, queryHiConf,
                cat.id, cat.name,
                toolKeywords, negKeywords, posSignals,
                item.id
            ]);

            updatedCount++;
            totalConfidence += intentConf;

            if (intentConf >= 80) highConfCount++;
            else if (intentConf >= 70) medConfCount++;
            else lowConfCount++;

            if (isAudit && (updatedCount <= 6 || updatedCount % 40 === 0)) {
                console.log(`[${updatedCount}/${items.length}] 📌 [${item.qp_code} ${item.pc_code}]: "${item.pc_description.substring(0, 55)}..."`);
                console.log(`        💡 Intent (EN): "${intent}" (${intentConf}%)`);
                console.log(`        🇮🇳 Intent (HI): "${intentHi}"`);
                console.log(`        🏷️ Category:    ${cat.id} (${cat.name})`);
                console.log(`        🔧 Tools:       "${toolKeywords}"`);
                console.log(`        🔍 Search EN:   "${queryEn}"`);
                console.log(`        🔍 Search HI:   "${queryHi}"`);
                console.log('--------------------------------------------------------------------------------');
            }
        }

        const lastItem = chunk[chunk.length - 1];
        saveCheckpoint(lastItem.qp_code, updatedCount);

        if (!isAudit && (updatedCount % 500 === 0 || i + BATCH_SIZE >= items.length)) {
            const pct = ((updatedCount / items.length) * 100).toFixed(1);
            console.log(`[${updatedCount.toLocaleString()}/${items.length.toLocaleString()}] (${pct}%) ⚡ Latest QP: ${lastItem.qp_code}`);
        }
    }

    // ── Update master nsqf_qps status ─────────────────────────────────────────
    const distinctQps = [...new Set(items.map(c => c.qp_code))];
    for (const qp of distinctQps) {
        await pool.query(
            `UPDATE nsqf_qps SET pipeline_status = 'intent_synthesized' WHERE qp_code = $1`,
            [qp]
        );
    }

    clearCheckpoint();
    const elapsedMs = Date.now() - startTime;
    const avgConfidence = updatedCount > 0 ? (totalConfidence / updatedCount).toFixed(1) : 0;

    console.log('\n================================================================================');
    console.log(`📊 PASS 2 HARVESTER GUIDANCE SUMMARY:`);
    console.log(`   Total PCs Processed:     ${updatedCount.toLocaleString()}`);
    console.log(`   Average Intent Score:    ${avgConfidence}%`);
    console.log(`   High Quality (>= 80%):   ${highConfCount.toLocaleString()} (${((highConfCount / updatedCount) * 100).toFixed(1)}%)`);
    console.log(`   Execution Time:          ${(elapsedMs / 1000).toFixed(2)} seconds`);
    console.log(`   Throughput Speed:        ${Math.round(updatedCount / (elapsedMs / 1000)).toLocaleString()} PCs / sec`);
    console.log(`   Dual EN/HI Intent:       100% Generated (pc_intent + pc_intent_hi)`);
    console.log(`   YouTube Categories:      100% Mapped (Science, Autos, Education, Howto)`);
    console.log(`   Tool Signals & Filters:  100% Attached (tool_keywords, negative_keywords)`);
    console.log(`   Database Status:         pipeline_status = 'intent_synthesized' in hayadb`);
    console.log('================================================================================\n');

    process.exit(0);
}

runPass2GuidanceEngine().catch(e => {
    console.error('\n❌ Fatal error in Pass 2 Guidance Engine:', e.message);
    console.error(e.stack);
    process.exit(1);
});
