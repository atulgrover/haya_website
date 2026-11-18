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
    /^(to be competent,\s*)?(the\s*)?(user\/individual|individual|candidate|operator|practitioner|technician|worker|tenter|farmer|cultivator|student|trainee|apprentice|artisan|jeweller)\s*(on the job\s*)?(must|needs to|should)\s*(be able to|know how to|know and understand)\s*:?/i,
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
    // Sector-specific preambles (Fix 5)
    /^the student shall (be able to |demonstrate (the )?(ability to )?)?/i,
    /^the tenter should (be able to |carry out )?/i,
    /^the farmer\/cultivator (must|should) (be able to |practice )?/i,
    /^the (technician|operator|worker|weaver|fitter|mason|plumber) (must|should|shall) (be able to )?/i,
    /^(he|she|they) (must|should|shall) (be able to )?/i,
    /^(it is expected that |this (unit|nos|module) (covers|deals with|is about) )/i,
    /^(upon completion,? |after (this|the) (training|module|unit),? )(the )?(candidate|student|trainee|individual) (will|shall|should) (be able to )?/i,
    /^(carry out|perform) (the )?(following |necessary |required )?(tasks?|activities?|operations?|duties?)( to| for| as per)?:?\s*/i,
    /^(the scope of this NOS is to |this NOS (unit )?describes |this (unit|module) covers )/i,
    /^(apply|use) (the )?(knowledge|skills|understanding) (of|to|for|in) /i,
    /^participate in /i,
    /^learn (to|how to) /i,
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
    // Common verb forms and gerunds
    'define': 'Define', 'defining': 'Define', 'explain': 'Explain', 'explaining': 'Explain',
    'lay': 'Lay', 'laying': 'Lay', 'handle': 'Handle', 'handling': 'Handle',
    'perform': 'Perform', 'performing': 'Perform', 'conduct': 'Conduct', 'conducting': 'Conduct',
    'apply': 'Apply', 'applying': 'Apply', 'demonstrate': 'Demonstrate',
    // Fix 6: Expanded domain verbs
    // Textiles
    'doff': 'Doff', 'doffing': 'Doff', 'splice': 'Splice', 'splicing': 'Splice',
    'knot': 'Knot', 'knotting': 'Knot', 'weave': 'Weave', 'weaving': 'Weave',
    'spin': 'Spin', 'spinning': 'Spin', 'warp': 'Warp', 'warping': 'Warp',
    'size': 'Size', 'sizing': 'Size', 'bleach': 'Bleach', 'dye': 'Dye', 'dyeing': 'Dye',
    'loom': 'Operate Loom', 'stitch': 'Stitch', 'stitching': 'Stitch',
    // Healthcare
    'auscultate': 'Auscultate', 'palpate': 'Palpate', 'triage': 'Triage',
    'cannulate': 'Cannulate', 'catheterize': 'Catheterize', 'sterilize': 'Sterilize',
    'bandage': 'Bandage', 'suture': 'Suture', 'immobilize': 'Immobilize',
    'administer': 'Administer', 'monitor': 'Monitor', 'sanitize': 'Sanitize',
    // Construction
    'plumb': 'Plumb', 'level': 'Level', 'trowel': 'Trowel', 'screed': 'Screed',
    'plaster': 'Plaster', 'plastering': 'Plaster', 'mortar': 'Mortar',
    'scaffold': 'Scaffold', 'excavate': 'Excavate', 'compact': 'Compact',
    'shuttering': 'Shutter', 'reinforce': 'Reinforce',
    // Agriculture
    'thresh': 'Thresh', 'threshing': 'Thresh', 'winnow': 'Winnow',
    'dehusk': 'Dehusk', 'dehusking': 'Dehusk', 'sow': 'Sow', 'sowing': 'Sow',
    'prune': 'Prune', 'pruning': 'Prune', 'graft': 'Graft', 'grafting': 'Graft',
    'mulch': 'Mulch', 'mulching': 'Mulch', 'compost': 'Compost',
    // General manufacturing
    'grind': 'Grind', 'grinding': 'Grind', 'mill': 'Mill', 'milling': 'Mill',
    'drill': 'Drill', 'drilling': 'Drill', 'turn': 'Turn', 'turning': 'Turn',
    'forge': 'Forge', 'forging': 'Forge', 'cast': 'Cast', 'casting': 'Cast',
    'bend': 'Bend', 'bending': 'Bend', 'rivet': 'Rivet', 'riveting': 'Rivet',
    'polish': 'Polish', 'polishing': 'Polish', 'etch': 'Etch', 'etching': 'Etch',
    'anneal': 'Anneal', 'annealing': 'Anneal', 'temper': 'Temper', 'quench': 'Quench',
    // Gems & Jewellery
    'facet': 'Facet', 'faceting': 'Facet', 'engrave': 'Engrave', 'engraving': 'Engrave',
    'set': 'Set', 'setting': 'Set', 'file': 'File', 'filing': 'File',
    'pierce': 'Pierce', 'piercing': 'Pierce', 'emboss': 'Emboss',
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
    'define': 'परिभाषित करें', 'explain': 'व्याख्या करें', 'lay': 'बिछाएं', 'laying': 'बिछाएं',
    'handle': 'संभालें', 'perform': 'करें', 'conduct': 'आयोजित करें', 'apply': 'लागू करें',
    'mobile': 'मोबाइल', 'phone': 'फोन', 'smartphone': 'स्मार्टफोन',
    'screen': 'स्क्रीन', 'battery': 'बैटरी', 'multimeter': 'मल्टीमीटर',
    'circuit': 'सर्किट', 'pcb': 'पीसीबी', 'voltage': 'वोल्टेज', 'motor': 'मोटर',
    'paddy': 'धान', 'seed': 'बीज', 'fertilizer': 'खाद', 'pesticide': 'कीटनाशक',
    'soil': 'मिट्टी', 'healthcare': 'हेल्थकेयर', 'patient': 'मरीज',
    'textile': 'कपड़ा उद्योग', 'yarn': 'धागा', 'spindle': 'स्पिंडल',
    'automotive': 'ऑटोमोबाइल', 'engine': 'इंजन', 'brake': 'ब्रेक',
    'equipment': 'उपकरण', 'tools': 'औजार और टूल्स', 'quality': 'गुणवत्ता',
    'safety': 'सुरक्षा सावधानियां', 'procedure': 'प्रक्रिया',
    // Fix 6: Expanded Hindi translations
    'weave': 'बुनाई करें', 'spin': 'कताई करें', 'dye': 'रंगाई करें',
    'stitch': 'सिलाई करें', 'knot': 'गांठ लगाएं', 'splice': 'जोड़ना',
    'loom': 'करघा', 'bobbin': 'बॉबिन', 'warp': 'ताना बुनना',
    'plaster': 'प्लास्टर करें', 'scaffold': 'मचान लगाएं', 'excavate': 'खुदाई करें',
    'cement': 'सीमेंट', 'brick': 'ईंट', 'concrete': 'कंक्रीट',
    'thresh': 'मड़ाई करें', 'winnow': 'ओसाई करें', 'sow': 'बुवाई करें',
    'prune': 'छंटाई करें', 'graft': 'कलम बांधें', 'compost': 'खाद बनाएं',
    'grind': 'पीसना', 'drill': 'ड्रिलिंग करें', 'forge': 'फोर्जिंग करें',
    'polish': 'पॉलिश करें', 'engrave': 'नक्काशी करें', 'facet': 'पहलू काटें',
    'sterilize': 'विसंक्रमित करें', 'bandage': 'पट्टी बांधें', 'monitor': 'निगरानी करें',
    'triage': 'ट्राएज करें', 'sanitize': 'स्वच्छ करें',
    'jewellery': 'आभूषण', 'gold': 'सोना', 'silver': 'चांदी', 'gem': 'रत्न',
    'plumbing': 'प्लंबिंग', 'pipe': 'पाइप', 'fitting': 'फिटिंग',
    'wiring': 'वायरिंग', 'transformer': 'ट्रांसफार्मर', 'switchgear': 'स्विचगियर',
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
    // Fix 6: Expanded tool lists
    // Construction
    'trowel', 'spirit level', 'plumb bob', 'mason line', 'concrete mixer', 'vibrator',
    'shuttering plate', 'bar bending machine', 'theodolite', 'total station',
    // Textiles
    'handloom', 'power loom', 'jacquard machine', 'carding machine', 'draw frame',
    'speed frame', 'cone winder', 'warping machine', 'sizing machine',
    // Gems & Jewellery
    'jeweller saw', 'mandrel', 'burnisher', 'draw plate', 'rolling mill',
    'polishing machine', 'rhodium plating unit', 'ultrasonic cleaner', 'gemological loupe',
    // Plumbing & Electrical
    'pipe wrench', 'pipe cutter', 'threading die', 'flux paste', 'megger',
    'earth tester', 'tong tester', 'cable stripper', 'crimping tool',
    // Agriculture expanded
    'thresher', 'winnower', 'transplanter', 'power tiller', 'drip irrigation kit',
    'pruning shear', 'grafting knife', 'moisture meter',
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
    if (s.includes('gem') || s.includes('jewel')) return 'rolling mill, draw plate, jeweller saw, polishing machine';
    if (s.includes('construct') || s.includes('plumb')) return 'spirit level, trowel, plumb bob, concrete mixer';
    if (s.includes('power') || s.includes('electric')) return 'megger, earth tester, cable stripper, crimping tool';
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

// ── 6B. KU/GS Context Loader (Fix 7) ─────────────────────────────────────────
const _kuGsCache = new Map();

function loadKuGsContext(qpCode, nosCode) {
    const cleanCode = qpCode.replace(/\//g, '_');
    let data = _kuGsCache.get(cleanCode);
    if (data === undefined) {
        const jsonPath = path.join(JSON_DIR, `${cleanCode}.json`);
        try {
            if (fs.existsSync(jsonPath)) {
                data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            } else {
                data = null;
            }
        } catch (_) {
            data = null;
        }
        _kuGsCache.set(cleanCode, data);
    }
    if (!data) return { kuKeywords: '', gsKeywords: '' };

    const nosUnit = (data.nos_units || []).find(n => n.nos_code === nosCode);
    if (!nosUnit) return { kuKeywords: '', gsKeywords: '' };

    // Extract top domain-specific keywords from KU descriptions
    const kuTexts = (nosUnit.kus || []).slice(0, 5)
        .map(ku => ku.replace(/^KU\d+[\.:\s-]*/i, '').trim())
        .filter(t => t.length >= 10);
    const kuKeywords = kuTexts
        .flatMap(t => t.split(/\s+/).filter(w => w.length > 4 && !/^(about|their|which|these|those|shall|should|would|could|understand|knowledge|various|different|relevant|appropriate|according|following|related|including|required)$/i.test(w)))
        .slice(0, 8)
        .join(' ');

    const gsTexts = (nosUnit.gs || []).slice(0, 3)
        .map(gs => gs.replace(/^GS\d+[\.:\s-]*/i, '').trim())
        .filter(t => t.length >= 10);
    const gsKeywords = gsTexts
        .flatMap(t => t.split(/\s+/).filter(w => w.length > 4 && !/^(about|their|which|these|those|shall|should|would|could|skills|ability|various|different|relevant|appropriate)$/i.test(w)))
        .slice(0, 5)
        .join(' ');

    return { kuKeywords, gsKeywords };
}

// ── 9. Sector-Specific Natural-Language Query Templates ──────────────────────
const SECTOR_QUERY_TEMPLATES = {
    'electronics':  (intent, nos, ku) => `how to ${intent} ${nos} ${ku} electronics repair tutorial step by step`,
    'telecom':      (intent, nos, ku) => `how to ${intent} ${nos} ${ku} telecom equipment practical demo`,
    'it':           (intent, nos, ku) => `how to ${intent} ${nos} ${ku} IT practical training tutorial`,
    'automotive':   (intent, nos, ku) => `how to ${intent} ${nos} ${ku} automotive workshop practical`,
    'textile':      (intent, nos, ku) => `how to ${intent} ${nos} ${ku} textile mill practical demonstration`,
    'agriculture':  (intent, nos, ku) => `how to ${intent} ${nos} ${ku} farming field practical technique`,
    'healthcare':   (intent, nos, ku) => `how to ${intent} ${nos} ${ku} clinical practical training`,
    'construction': (intent, nos, ku) => `how to ${intent} ${nos} ${ku} construction site practical method`,
    'beauty':       (intent, nos, ku) => `how to ${intent} ${nos} ${ku} beauty salon professional tutorial`,
    'food':         (intent, nos, ku) => `how to ${intent} ${nos} ${ku} food processing practical demo`,
    'hospitality':  (intent, nos, ku) => `how to ${intent} ${nos} ${ku} hotel management training tutorial`,
    'plumbing':     (intent, nos, ku) => `how to ${intent} ${nos} ${ku} plumbing fitting installation demo`,
    'power':        (intent, nos, ku) => `how to ${intent} ${nos} ${ku} electrical wiring practical tutorial`,
    'gem':          (intent, nos, ku) => `how to ${intent} ${nos} ${ku} jewellery making goldsmith practical`,
    'jewel':        (intent, nos, ku) => `how to ${intent} ${nos} ${ku} jewellery making goldsmith practical`,
    'security':     (intent, nos, ku) => `how to ${intent} ${nos} ${ku} security safety training practical`,
    'logistics':    (intent, nos, ku) => `how to ${intent} ${nos} ${ku} warehouse logistics training demo`,
    'mining':       (intent, nos, ku) => `how to ${intent} ${nos} ${ku} mining operations safety practical`,
    'media':        (intent, nos, ku) => `how to ${intent} ${nos} ${ku} media production tutorial`,
    'green':        (intent, nos, ku) => `how to ${intent} ${nos} ${ku} solar renewable energy practical`,
    'default':      (intent, nos, ku) => `how to ${intent} ${nos} ${ku} practical training demonstration`,
};

// ── 9B. Hindi Query Sentence Templates ───────────────────────────────────────
const SECTOR_HINDI_TEMPLATES = {
    'electronics':  (verb, topic) => `${verb} ${topic} इलेक्ट्रॉनिक्स रिपेयर प्रैक्टिकल स्टेप बाय स्टेप`,
    'telecom':      (verb, topic) => `${verb} ${topic} टेलीकॉम उपकरण प्रैक्टिकल ट्रेनिंग`,
    'automotive':   (verb, topic) => `${verb} ${topic} ऑटोमोबाइल वर्कशॉप प्रैक्टिकल डेमो`,
    'textile':      (verb, topic) => `${verb} ${topic} कपड़ा मिल प्रैक्टिकल ट्रेनिंग`,
    'agriculture':  (verb, topic) => `${verb} ${topic} खेती प्रैक्टिकल तरीका सीखें`,
    'healthcare':   (verb, topic) => `${verb} ${topic} हेल्थकेयर क्लिनिकल प्रैक्टिकल`,
    'construction': (verb, topic) => `${verb} ${topic} निर्माण कार्य प्रैक्टिकल डेमो`,
    'gem':          (verb, topic) => `${verb} ${topic} आभूषण बनाना सुनार प्रैक्टिकल`,
    'jewel':        (verb, topic) => `${verb} ${topic} आभूषण बनाना सुनार प्रैक्टिकल`,
    'plumbing':     (verb, topic) => `${verb} ${topic} प्लंबिंग फिटिंग प्रैक्टिकल`,
    'power':        (verb, topic) => `${verb} ${topic} इलेक्ट्रिकल वायरिंग प्रैक्टिकल`,
    'green':        (verb, topic) => `${verb} ${topic} सोलर ऊर्जा प्रैक्टिकल ट्रेनिंग`,
    'default':      (verb, topic) => `${verb} ${topic} प्रैक्टिकल ट्रेनिंग कैसे करें वीडियो`,
};

function _selectTemplate(templates, sector) {
    const sLower = String(sector || '').toLowerCase();
    for (const [key, fn] of Object.entries(templates)) {
        if (key !== 'default' && sLower.includes(key)) return fn;
    }
    return templates['default'];
}

function buildContextualSearchQuery(sector, qpName, nosTitle, modTitle, pcIntent, kuContext) {
    const clean = s => String(s || '').replace(/[\\\"()\[\]]/g, '').replace(/\.{2,}/g, '').trim();
    const cleanNos    = clean(nosTitle).replace(/^[A-Z0-9_&\/]+:\s*/i, '').replace(/\s+\d{1,3}\s*$/, '');
    const cleanIntent = clean(pcIntent).toLowerCase();

    // Extract top 2-3 distinctive KU keywords (avoid duplicating intent words)
    const intentWords = new Set(cleanIntent.split(/\s+/));
    const kuTokens = String(kuContext || '').split(/\s+/)
        .filter(w => w.length > 3 && !intentWords.has(w.toLowerCase()))
        .slice(0, 3)
        .join(' ');

    // Select sector-specific template
    const sLower = String(sector || '').toLowerCase();
    let templateFn = SECTOR_QUERY_TEMPLATES['default'];
    for (const [key, fn] of Object.entries(SECTOR_QUERY_TEMPLATES)) {
        if (key !== 'default' && sLower.includes(key)) { templateFn = fn; break; }
    }

    let query = templateFn(cleanIntent, cleanNos, kuTokens);

    // Deduplicate consecutive repeated words
    query = query.split(/\s+/).reduce((acc, w) => {
        if (acc.length === 0 || acc[acc.length - 1].toLowerCase() !== w.toLowerCase()) acc.push(w);
        return acc;
    }, []).join(' ');

    // Trim to 95 chars
    if (query.length > 95) {
        query = query.substring(0, 95).replace(/\s+\S*$/, '').trim();
    }
    return query;
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
    const words = text.split(' ').map(w => w.replace(/[;,.:()]+$/g, '')).filter(Boolean);
    if (words.length === 0) return 'Practical Execution';

    let leadingVerb = words[0].toLowerCase().replace(/[^a-z]/g, '');
    if (ACTION_VERB_MAP[leadingVerb]) {
        words[0] = ACTION_VERB_MAP[leadingVerb];
    } else {
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }

    let result = '';
    if (words.length >= 5 && words.length <= 8) {
        result = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else {
        const importantWords = [];
        for (let i = 0; i < words.length; i++) {
            const w = words[i].replace(/[;,.:()]/g, '');
            if (!w) continue;
            if (i > 0 && /^(the|a|an|and|or|in|on|at|to|for|of|with|by|as|is|are|be|must|per|etc|such|all|any|their|its)$/i.test(w)) continue;
            importantWords.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
            if (importantWords.length >= 8) break;
        }
        result = importantWords.join(' ') || text.substring(0, 55);
    }

    return result.replace(/[.,;:!\-]+$/g, '').trim();
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

// ── 10. Hindi Search Vector (≤ 95 chars) — Template-Based Sentences ──────────
function synthesizeHindiSearchVector(englishQuery, pcIntent, sector) {
    const sLower = String(sector || '').toLowerCase();

    // Translate the leading verb
    const firstWord = pcIntent.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    const hindiVerb = VOCATIONAL_HINDI_DICT[firstWord] || pcIntent.split(' ')[0];

    // Translate key topic nouns from the intent (skip the verb)
    const topicWords = pcIntent.split(' ').slice(1, 5);
    const topicHindi = topicWords.map(w => {
        const lower = w.toLowerCase().replace(/[^a-z]/g, '');
        return VOCATIONAL_HINDI_DICT[lower] || w;
    }).join(' ');

    // Select Hindi template by sector
    const hindiTemplateFn = _selectTemplate(SECTOR_HINDI_TEMPLATES, sector);
    let fullHi = hindiTemplateFn(hindiVerb, topicHindi);

    // Deduplicate repeated Hindi tokens
    fullHi = fullHi.split(/\s+/).reduce((acc, w) => {
        if (acc.length === 0 || acc[acc.length - 1] !== w) acc.push(w);
        return acc;
    }, []).join(' ');

    if (fullHi.length > 95) fullHi = fullHi.substring(0, 95).trim();
    return fullHi;
}

// ── 10B. 3-Perspective SOP Synthesis (Employers / Plant Operations) ───────────
function synthesizeSopPerspective(pcDesc, sector, modTitle, pcIntent, toolKeywords) {
    const cleanMod = String(modTitle || 'Standard Workstation').replace(/^Module\s*\d+\s*:\s*/i, '').trim();
    const cleanIntent = String(pcIntent || 'Execute Standard Operation').trim();
    const cleanSector = String(sector || 'Manufacturing').trim();

    const sopIntent = `${cleanIntent} Standard Work Procedure`;
    const sopIntentHi = `${synthesizeHindiIntent(cleanIntent)} मानक कार्यप्रणाली`;

    const sopSearchQuery = `${cleanIntent} ${cleanMod} ${cleanSector} industrial standard operating procedure plant workflow -shorts -review -reaction`;
    const sopSearchQueryHi = `${synthesizeHindiIntent(cleanIntent)} ${cleanSector} प्लांट एसओपी कार्यप्रणाली वर्कशॉप डेमो`;

    const actionDirective = pcDesc.replace(/^PC\d+[\.:-]?\s*/i, '').trim();
    
    let tolerance = 'Perform operation strictly within nominal engineering tolerances';
    const sLower = cleanSector.toLowerCase();
    if (sLower.includes('electr') || sLower.includes('telecom')) tolerance = '350°C ± 5°C reflow temp, ESD voltage < 10V, contact resistance < 0.05 Ohm';
    else if (sLower.includes('auto') || sLower.includes('ev')) tolerance = 'Torque tolerance ±0.5 Nm, insulation resistance > 500 MOhm (1000V DC)';
    else if (sLower.includes('solar') || sLower.includes('green')) tolerance = 'Open-circuit voltage Voc ±1.5%, earth ground loop resistance < 2.0 Ohm';
    else if (sLower.includes('agri')) tolerance = 'Moisture content < 12%, seed treatment dosage ±0.2 g/kg, spacing ±2.0 cm';
    else if (sLower.includes('health')) tolerance = 'Zero microbial contamination, autoclave cycle 121°C at 15 psi for 20 min';

    let knack = 'Maintain steady hand motion and verify physical alignment prior to final fixation.';
    if (sLower.includes('electr')) knack = 'Keep hot-air nozzle perpendicular at 10mm distance to avoid thermal bridging of neighboring SMD components.';
    else if (sLower.includes('auto')) knack = 'Verify zero-energy state (LOTO) and high-voltage interlock disconnect prior to touching terminals.';
    else if (sLower.includes('solar')) knack = 'Never disconnect DC MC4 connectors under load; switch off DC isolator first.';
    else if (sLower.includes('agri')) knack = 'Ensure even slurry agitation in drum to prevent concentrated chemical burn on seed embryos.';
    else if (sLower.includes('health')) knack = 'Always perform hand hygiene before and after touching clean barrier zones.';

    return {
        sop_intent: sopIntent,
        sop_intent_hi: sopIntentHi,
        sop_search_query: sopSearchQuery.substring(0, 95).trim(),
        sop_search_query_hi: sopSearchQueryHi.substring(0, 95).trim(),
        sop_action_directive: actionDirective,
        sop_parameter_tolerance: tolerance,
        sop_critical_knack: knack
    };
}

// ── 10C. 3-Perspective DPR / Machine Synthesis (Entrepreneurs / MSMEs) ─────────
const COMMERCIAL_MACHINE_CATALOG = {
    'electronics': [
        { name: 'Lead-Free Infrared BGA Rework Station', spec: '220V 1.2kW Digital PID Control with bottom preheater', cost: 45000, power: '1.2 kW 1-Phase' },
        { name: 'Vacuum LCD OCA Laminator & Bubble Remover', spec: '220V 800W Integrated Air Compressor & Vacuum Chamber', cost: 58000, power: '0.8 kW 1-Phase' },
        { name: 'Trinocular Stereo Zoom Microscope with 4K HDMI', spec: '7X-45X Continuous Zoom with LED Ring & 4K C-Mount Sensor', cost: 28500, power: '0.1 kW 1-Phase' },
        { name: 'Universal Digital Programmer & JTAG/UFS Box', spec: 'High-speed eMMC/UFS 3.1 direct ISP flashing kit', cost: 42000, power: 'USB Powered' }
    ],
    'automotive': [
        { name: 'EV Lithium Cell Pulse Spot Welder', spec: '220V 5kW Pneumatic Pure Nickel Precision Spot Welder', cost: 38000, power: '5.0 kW 1-Phase' },
        { name: '1kHz AC Precision Internal Resistance Cell Tester', spec: 'Four-terminal Kelvin probe digital micro-ohm meter', cost: 16500, power: '0.05 kW 1-Phase' },
        { name: 'Automotive Multi-Protocol OBD-II Diagnostic Scanner', spec: 'CAN-FD / DoIP full system ECU bidirectional scanner', cost: 48000, power: '12V DC System' }
    ],
    'green-jobs': [
        { name: 'Solar PV I-V Curve Tracer & Analyzer', spec: '1000V 20A Digital Array Performance & Irradiance Analyzer', cost: 55000, power: 'Battery Operated' },
        { name: 'MC4 Solar Cable Hydraulic Crimping Rig', spec: '6-Ton Hand Hydraulic Tool with 2.5/4/6 mm2 Dies', cost: 14500, power: 'Manual Hydraulic' },
        { name: '1000V DC Solar True-RMS Clamp Multimeter', spec: 'CAT IV 600V / CAT III 1000V Solar Micro-Current Meter', cost: 16000, power: 'Battery Operated' }
    ],
    'agriculture': [
        { name: 'Continuous Slurry Seed Coating Drum Unit', spec: '220V 0.75kW Stainless Steel Rotary Seed Treater (250 kg/hr)', cost: 42000, power: '0.75 kW 1-Phase' },
        { name: 'Digital Grain & Seed Moisture Analyzer', spec: 'Capacitance-type multi-crop moisture meter with auto-temp comp', cost: 14500, power: 'Battery Operated' },
        { name: 'Precision Multi-Crop Pneumatic Seed Drill Unit', spec: 'Tractor-mounted 9-row zero-till precision seed metering unit', cost: 85000, power: 'Tractor PTO Driven' }
    ],
    'healthcare': [
        { name: 'Hospital Grade High-Pressure Steam Autoclave', spec: '220V 2.0kW 50-Liter Vertical Stainless Steel Sterilizer', cost: 48000, power: '2.0 kW 1-Phase' },
        { name: 'Multi-Parameter Digital Patient Vital Signs Monitor', spec: '12.1-inch TFT NIBP, SpO2, ECG, Temp, Pulse Monitor', cost: 38000, power: '0.1 kW 1-Phase' }
    ],
    'default': [
        { name: 'Commercial Precision Tooling & Diagnostic Workstation', spec: 'Industrial grade 220V calibrated workstation apparatus', cost: 35000, power: '1.0 kW 1-Phase' },
        { name: 'Digital Multi-Sensor Calibration & Testing Kit', spec: 'Precision electronic measuring and verification apparatus', cost: 18000, power: 'Battery Operated' }
    ]
};

function synthesizeDprPerspective(pcDesc, sector, qpName, pcIntent, toolKeywords) {
    const sLower = String(sector || '').toLowerCase();
    let catalog = COMMERCIAL_MACHINE_CATALOG['default'];
    if (sLower.includes('electr') || sLower.includes('telecom')) catalog = COMMERCIAL_MACHINE_CATALOG['electronics'];
    else if (sLower.includes('auto') || sLower.includes('ev')) catalog = COMMERCIAL_MACHINE_CATALOG['automotive'];
    else if (sLower.includes('solar') || sLower.includes('green')) catalog = COMMERCIAL_MACHINE_CATALOG['green-jobs'];
    else if (sLower.includes('agri')) catalog = COMMERCIAL_MACHINE_CATALOG['agriculture'];
    else if (sLower.includes('health')) catalog = COMMERCIAL_MACHINE_CATALOG['healthcare'];

    const pLower = (pcDesc + ' ' + toolKeywords).toLowerCase();
    let matchedMachine = catalog.find(m => pLower.includes(m.name.toLowerCase().split(' ')[0]));
    if (!matchedMachine) {
        const hash = Math.abs(pcDesc.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0));
        matchedMachine = catalog[hash % catalog.length];
    }

    const dprIntent = `${matchedMachine.name} Commercial Setup`;
    const dprIntentHi = `${matchedMachine.name} कमर्शियल मशीन सेटअप`;

    const dprSearchQuery = `${matchedMachine.name} commercial machine operation demonstration factory setup -unboxing -reaction -DIY`;
    const dprSearchQueryHi = `${matchedMachine.name} मशीन कैसे काम करती है फैक्ट्री सेटअप डेमो`;

    return {
        dpr_intent: dprIntent,
        dpr_intent_hi: dprIntentHi,
        dpr_search_query: dprSearchQuery.substring(0, 95).trim(),
        dpr_search_query_hi: dprSearchQueryHi.substring(0, 95).trim(),
        machine_name: matchedMachine.name,
        machine_spec: matchedMachine.spec,
        machine_capex_cost_inr: matchedMachine.cost,
        machine_power_kw: matchedMachine.power
    };
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
    let score = 0;
    const len = query.length;

    // Length scoring (natural-language queries are 40-90 chars)
    if (len >= 40 && len <= 90) score += 30;
    else if (len >= 30 && len <= 110) score += 20;
    else score += 10;

    // Natural language signals ("how to", complete phrases)
    if (/^how to /i.test(query)) score += 20;
    if (/practical|tutorial|demonstration|step by step|training/i.test(query)) score += 15;

    // Domain specificity (contains sector/tool words, not just generic)
    const domainWords = query.match(/\b(repair|install|calibrate|assemble|soldering|welding|irrigation|harvest|stitch|plaster|wiring|autoclave|diagnostic|hydraulic|pneumatic|textile|circuit|pcb|loom|spindle|trowel|mortar)\b/gi);
    if (domainWords && domainWords.length >= 1) score += 20;
    else score += 5;

    // Word count (8-15 words is ideal for YouTube)
    const wordCount = query.split(/\s+/).length;
    if (wordCount >= 8 && wordCount <= 15) score += 15;
    else if (wordCount >= 5) score += 10;
    else score += 5;

    return Math.min(100, Math.max(0, score));
}

function computeHindiConfidence(queryHi) {
    if (!queryHi) return 0;
    let score = 0;
    // Devanagari character density
    const devanagariChars = (queryHi.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = queryHi.replace(/\s/g, '').length;
    const devanagariRatio = totalChars > 0 ? devanagariChars / totalChars : 0;
    if (devanagariRatio >= 0.5) score += 40;
    else if (devanagariRatio >= 0.3) score += 25;
    else score += 10;

    // Hindi search signal words
    if (/प्रैक्टिकल|कैसे|सीखें|करें|वीडियो|ट्रेनिंग|डेमो|तरीका/.test(queryHi)) score += 30;

    // Word count
    const wordCount = queryHi.split(' ').length;
    score += (wordCount >= 5 && wordCount <= 12) ? 30 : 15;
    return Math.min(100, score);
}

// ── 12. Sarvam AI Cloud Refinement (Enhanced: intent + search query + Hindi) ─
async function refineIntentWithSarvam(item) {
    if (!SARVAM_API_KEY) return null;

    const pcDesc   = String(item.pc_description || '').replace(/^•\s*|^PC\d+[\.:-]?\s*/i, '').trim();
    const sector   = item.sector       || 'Vocational Skills';
    const qpName   = item.qp_name      || item.qp_code;
    const nosTitle = item.nos_title    || item.nos_code;
    const modTitle = item.module_title || 'Core Operational Module';

    // Retrieve Knowledge & Skills context from canonical JSON AST (use cache)
    const { kuKeywords, gsKeywords } = loadKuGsContext(item.qp_code, item.nos_code);

    let prompt = `You are an expert Vocational Curriculum Specialist and YouTube Search Optimizer.
Given the following practical training task, generate THREE outputs:

- Sector: "${sector}"
- Qualification Role: "${qpName}"
- Occupational Unit: "${nosTitle}"
- Module: "${modTitle}"
- Training Task: "${pcDesc}"`;

    if (kuKeywords) prompt += `\n- Knowledge Context: "${kuKeywords}"`;
    if (gsKeywords) prompt += `\n- Skills Context: "${gsKeywords}"`;

    prompt += `\n\nGenerate:
1. "pc_intent": A 5-8 word action-oriented title starting with a verb (Inspect, Verify, Assemble, etc.). No filler words.
2. "search_query": A natural-language YouTube search query (12-18 words) starting with "how to" that would find a practical training video. Include sector-specific terminology.
3. "search_query_hi": The same search query translated into natural Hindi (Devanagari script), suitable for searching Hindi YouTube tutorials.

Return strictly raw JSON: { "pc_intent": "...", "search_query": "...", "search_query_hi": "..." }`;

    try {
        const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
            body: JSON.stringify({ model: 'sarvam-105b', messages: [{ role: 'system', content: prompt }], temperature: 0.2, max_tokens: 200 })
        });

        if (res.ok) {
            const data      = await res.json();
            const rawText   = data.choices?.[0]?.message?.content?.trim() || '';
            const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
            const parsed    = JSON.parse(cleanJson);
            if (parsed && parsed.pc_intent) {
                return {
                    pc_intent:       parsed.pc_intent.trim(),
                    search_query:    (parsed.search_query || '').trim().substring(0, 95),
                    search_query_hi: (parsed.search_query_hi || '').trim().substring(0, 95),
                };
            }
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
    const intentFilter = doForce ? '' : 'AND (p.pc_intent IS NULL OR p.pc_intent_hi IS NULL OR p.sop_intent IS NULL OR p.dpr_intent IS NULL)';

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
            // Step 0: Load KU/GS context from canonical JSON (Fix 7)
            const { kuKeywords, gsKeywords } = loadKuGsContext(item.qp_code, item.nos_code);

            // Step 1: Local NLP (always)
            let intent       = synthesizeLocalIntent(item.pc_description);
            let intentConf   = computeIntentConfidence(item.pc_description, intent);
            let sarvamResult = null;

            // Step 2: Cloud refinement (mode-dependent)
            const needsCloud = (mode === 'cloud') || (mode === 'hybrid' && intentConf < 70);
            if (needsCloud && SARVAM_API_KEY) {
                sarvamResult = await refineIntentWithSarvam(item);
                if (sarvamResult && sarvamResult.pc_intent) {
                    const refinedConf = computeIntentConfidence(item.pc_description, sarvamResult.pc_intent);
                    if (refinedConf >= intentConf) { 
                        intent = sarvamResult.pc_intent; 
                        intentConf = refinedConf; 
                        sarvamCallCount++; 
                    }
                }
            }

            const intentHi    = synthesizeHindiIntent(intent);
            const kuGsContext = [kuKeywords, gsKeywords].filter(Boolean).join(' ');
            
            const queryEn     = (sarvamResult && sarvamResult.search_query)
                                ? sarvamResult.search_query
                                : buildContextualSearchQuery(item.sector, item.qp_name, item.nos_title, item.module_title, intent, kuGsContext);
            const queryConf   = computeQueryConfidence(queryEn);
            
            const queryHi     = (sarvamResult && sarvamResult.search_query_hi)
                                ? sarvamResult.search_query_hi
                                : synthesizeHindiSearchVector(queryEn, intent, item.sector);
            const queryHiConf = computeHindiConfidence(queryHi);
            const cat         = mapSectorToCategory(item.sector);
            const toolKeywords = extractToolKeywords(item.pc_description, item.sector);
            const negKeywords  = getNegativeKeywords(item.sector);
            const posSignals   = getPositiveSignals();

            // ── 3-Perspective SOP & DPR Synthesizers ─────────────────────────
            const sop = synthesizeSopPerspective(item.pc_description, item.sector, item.module_title, intent, toolKeywords);
            const dpr = synthesizeDprPerspective(item.pc_description, item.sector, item.qp_name, intent, toolKeywords);

            await pool.query(`
                UPDATE nsqf_pcs
                SET 
                    -- 🎓 1. Skill Perspective (Employees)
                    pc_intent = $1, pc_intent_hi = $2, intent_confidence = $3,
                    contextual_search_query = $4, query_confidence = $5,
                    contextual_search_query_hi = $6, query_confidence_hi = $7,
                    youtube_category_id = $8, youtube_category_name = $9,
                    tool_keywords = $10, negative_keywords = $11, positive_signals = $12,
                    min_duration_seconds = 180, max_duration_seconds = 900,

                    -- 🏭 2. SOP Perspective (Employers)
                    sop_intent = $13, sop_intent_hi = $14,
                    sop_search_query = $15, sop_search_query_hi = $16,
                    sop_action_directive = $17, sop_parameter_tolerance = $18,
                    sop_critical_knack = $19,

                    -- 💼 3. DPR / Machine Perspective (Entrepreneurs)
                    dpr_intent = $20, dpr_intent_hi = $21,
                    dpr_search_query = $22, dpr_search_query_hi = $23,
                    machine_name = $24, machine_spec = $25,
                    machine_capex_cost_inr = $26, machine_power_kw = $27
                WHERE id = $28
            `, [
                // Skill ($1-$12)
                intent, intentHi, intentConf, queryEn, queryConf, queryHi, queryHiConf,
                cat.id, cat.name, toolKeywords, negKeywords, posSignals,
                // SOP ($13-$19)
                sop.sop_intent, sop.sop_intent_hi, sop.sop_search_query, sop.sop_search_query_hi,
                sop.sop_action_directive, sop.sop_parameter_tolerance, sop.sop_critical_knack,
                // DPR ($20-$27)
                dpr.dpr_intent, dpr.dpr_intent_hi, dpr.dpr_search_query, dpr.dpr_search_query_hi,
                dpr.machine_name, dpr.machine_spec, dpr.machine_capex_cost_inr, dpr.machine_power_kw,
                // ID ($28)
                item.id
            ]);

            updatedCount++;
            totalConfidence += intentConf;
            if (intentConf >= 80) highConfCount++;
            else if (intentConf >= 70) medConfCount++;
            else lowConfCount++;

            if (isAudit && (updatedCount <= 6 || updatedCount % 40 === 0)) {
                console.log(`[${updatedCount}/${items.length}] 📌 [${item.qp_code} ${item.pc_code}]: "${item.pc_description.substring(0, 50)}..."`);
                console.log(`        🎓 Skill Intent: "${intent}" | Query: "${queryEn.substring(0, 45)}..."`);
                console.log(`        🏭 SOP Intent:   "${sop.sop_intent}" | Knack: "${sop.sop_critical_knack.substring(0, 45)}..."`);
                console.log(`        💼 DPR Machine:  "${dpr.machine_name}" (₹${dpr.machine_capex_cost_inr.toLocaleString('en-IN')}) | Query: "${dpr.dpr_search_query.substring(0, 45)}..."`);
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
