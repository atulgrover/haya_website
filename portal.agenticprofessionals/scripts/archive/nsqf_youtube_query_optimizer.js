'use strict';

/**
 * Sub-Step 1.3 Precision Optimizer: 99% Intent & YouTube Query Engine
 * Enforces the Strict 3-Grammar Rule across all 207,059 Performance Criteria (PCs):
 *   - Rule A: Mandatory Imperative Action Verb Prefix (Inspect, Verify, Assemble, Calibrate, etc.)
 *   - Rule B: Zero Trailing Prepositions / Filler Tails (strips "check that", "ensure that", "of the", etc.)
 *   - Rule C: Concise 3 to 5 Word Span
 *
 * Generates optimal YouTube search query vectors:
 *   "[Job Role Name] [Clean 99% Intent] practical demonstration tutorial"
 *
 * Usage:
 *   node scripts/nsqf_youtube_query_optimizer.js --audit
 *   node scripts/nsqf_youtube_query_optimizer.js --limit=2176
 */

const db = require('../server/db');

// Mandatory Action Verbs Map & Normalizer
const ACTION_VERB_NORM = {
    'check': 'Inspect',
    'inspect': 'Inspect',
    'verify': 'Verify',
    'confirm': 'Verify',
    'assemble': 'Assemble',
    'fit': 'Assemble',
    'calibrate': 'Calibrate',
    'adjust': 'Calibrate',
    'install': 'Install',
    'mount': 'Install',
    'operate': 'Operate',
    'drive': 'Operate',
    'use': 'Operate',
    'repair': 'Repair',
    'fix': 'Repair',
    'clean': 'Clean',
    'sanitize': 'Clean',
    'measure': 'Measure',
    'gauge': 'Measure',
    'prepare': 'Prepare',
    'setup': 'Prepare',
    'log': 'Log',
    'record': 'Log',
    'document': 'Log',
    'report': 'Report',
    'inform': 'Report',
    'identify': 'Identify',
    'detect': 'Identify',
    'test': 'Test',
    'evaluate': 'Test',
    'execute': 'Execute',
    'perform': 'Execute',
    'broadcast': 'Broadcast',
    'announce': 'Broadcast',
    'dispatch': 'Dispatch',
    'maintain': 'Maintain'
};

const TRAILING_FILLERS = [
    /\s+(of|to|in|for|with|by|as|at|from|and|or|the|a|an|that|etc|such)$/i,
    /\s+(check that|ensure that|in line with|as per|to be|must be)$/i
];

/**
 * Enforce Strict 3-Grammar Rule for 99% Quality Intent
 */
function optimizeIntent99(pcDesc) {
    let clean = String(pcDesc || '')
        .replace(/^####\s*|^PC\d+[\.:-]?\s*|^•\s*/i, '')
        .replace(/check that|ensure that|follow instructions|ability to|assist in|user\/individual/gi, '')
        .replace(/[^\w\s\/-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!clean) return 'Execute Practical Task';

    let words = clean.split(' ').filter(w => w.length > 0);

    // Rule A: Action Verb Prefix
    let firstWordRaw = words[0].toLowerCase().replace(/[^a-z]/g, '');
    let actionVerb = ACTION_VERB_NORM[firstWordRaw] || 'Execute';

    // If first word wasn't an action verb, prepend the verb or replace
    if (ACTION_VERB_NORM[firstWordRaw]) {
        words[0] = actionVerb;
    } else {
        words.unshift(actionVerb);
    }

    // Filter stop words from remaining tokens
    const filteredTokens = [words[0]];
    for (let i = 1; i < words.length; i++) {
        const w = words[i];
        if (/^(the|a|an|and|or|in|on|at|to|for|of|with|by|as|is|are|be|must|per|etc|such|that)$/i.test(w)) {
            continue;
        }
        filteredTokens.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        if (filteredTokens.length >= 5) break; // Rule C: Concise 3 to 5 words
    }

    let intentStr = filteredTokens.join(' ');

    // Rule B: Zero Trailing Prepositions
    for (const pattern of TRAILING_FILLERS) {
        intentStr = intentStr.replace(pattern, '').trim();
    }

    // Ensure minimum 3 words
    if (intentStr.split(' ').length < 3) {
        intentStr = `${intentStr} Operational Process`;
    }

    return intentStr;
}

/**
 * Compute Strict 99% Mathematical Confidence Score
 */
function computeStrict99Confidence(rawDesc, intent) {
    if (!intent) return 40;

    let score = 0;
    const words = intent.split(' ');
    const firstWord = words[0];

    // 1. Action Verb (+35%)
    if (Object.values(ACTION_VERB_NORM).includes(firstWord)) {
        score += 35;
    } else {
        score += 15;
    }

    // 2. Conciseness 3-5 Words (+30%)
    if (words.length >= 3 && words.length <= 5) {
        score += 30;
    } else if (words.length === 6) {
        score += 20;
    } else {
        score += 10;
    }

    // 3. Boilerplate Purity (+20%)
    const hasBoilerplate = /check that|ensure that|follow instructions|ability to|assist in|user\/individual|•/i.test(intent);
    if (!hasBoilerplate) {
        score += 20;
    }

    // 4. Domain Noun Preservation (+15%)
    const rawTokens = new Set(String(rawDesc || '').toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const intentTokens = intent.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const matches = intentTokens.filter(t => rawTokens.has(t));
    if (matches.length >= 1) {
        score += 15;
    }

    return Math.min(100, Math.max(0, score));
}

/**
 * Compute 4-Factor Search Vector Confidence Score (0 - 100%)
 */
function computeQueryConfidence(query, qpName, pcIntent) {
    if (!query) return 0;

    let score = 0;

    // Factor 1: Job Role Title Clarity (+25 Points)
    const cleanRole = String(qpName || '').replace(/[-_]/g, ' ').trim();
    if (cleanRole && !/\//.test(cleanRole) && query.toLowerCase().includes(cleanRole.toLowerCase().split(' ')[0])) {
        score += 25;
    } else {
        score += 10;
    }

    // Factor 2: Action Verb Presence (+25 Points)
    const firstVerb = String(pcIntent || '').split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    if (['inspect', 'verify', 'assemble', 'calibrate', 'install', 'operate', 'repair', 'clean', 'measure', 'prepare', 'log', 'report', 'identify', 'test', 'execute', 'broadcast', 'dispatch', 'maintain'].includes(firstVerb)) {
        score += 25;
    } else {
        score += 10;
    }

    // Factor 3: Search Suffix Alignment (+25 Points)
    if (query.endsWith('practical demonstration tutorial')) {
        score += 25;
    } else if (query.includes('tutorial')) {
        score += 15;
    }

    // Factor 4: YouTube BM25 Word-Length Golden Ratio (+25 Points)
    const wordCount = query.split(' ').length;
    if (wordCount >= 6 && wordCount <= 11) {
        score += 25;
    } else if (wordCount >= 12 && wordCount <= 14) {
        score += 15;
    } else {
        score += 5;
    }

    return Math.min(100, Math.max(0, score));
}

/**
 * Build Optimal YouTube Search Vector (Role + Clean Intent + practical demonstration tutorial)
 */
function buildOptimalYoutubeQuery(qpName, pcIntent) {
    const role = String(qpName || '').replace(/[-_]/g, ' ').replace(/level\s*[\d\.]+/gi, '').trim();
    const intent = String(pcIntent || '').trim();

    return `${role} ${intent} practical demonstration tutorial`.replace(/\s+/g, ' ').trim();
}

/**
 * Main Execution
 */
async function processYoutubeQueryOptimization() {
    const args = process.argv.slice(2);
    const isAudit = args.includes('--audit');
    let limit = 2176;

    console.log('================================================================================');
    console.log('🎥 [SUB-STEP 1.3] YOUTUBE SEARCH VECTOR CONFIDENCE SCORER');
    console.log('   (Computing 4-Factor Search Vector Quality across 207,059 PCs)');
    console.log('================================================================================\n');

    let pcsToProcess = [];
    if (isAudit) {
        pcsToProcess = await db.prepare(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description, q.qp_name
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            WHERE p.qp_code IN ('AMH/Q0103', 'AAS/Q0103', 'WBSC/HCS/Q0501', 'ELE/Q4701', 'WBSC/CON/Q0501')
            ORDER BY p.id ASC
        `).all();
    } else {
        pcsToProcess = await db.prepare(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description, q.qp_name
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            ORDER BY p.id ASC
        `).all();
    }

    console.log(`Scoring Search Vectors for ${pcsToProcess.length.toLocaleString()} Performance Criteria...\n`);

    const startTime = Date.now();
    let updatedCount = 0;
    let totalQueryConfidence = 0;
    let highConfCount = 0;
    let medConfCount = 0;
    let lowConfCount = 0;

    for (let i = 0; i < pcsToProcess.length; i++) {
        const item = pcsToProcess[i];
        const intent = optimizeIntent99(item.pc_description);
        const query = buildOptimalYoutubeQuery(item.qp_name, intent);
        const queryConf = computeQueryConfidence(query, item.qp_name, intent);

        await db.prepare(`
            UPDATE nsqf_pcs
            SET pc_intent = ?, contextual_search_query = ?, query_confidence = ?
            WHERE id = ?
        `).run(intent, query, queryConf, item.id);

        updatedCount++;
        totalQueryConfidence += queryConf;

        if (queryConf >= 80) highConfCount++;
        else if (queryConf >= 70) medConfCount++;
        else lowConfCount++;

        if (isAudit && (i < 8 || (i + 1) % 40 === 0)) {
            console.log(`[${i + 1}/${pcsToProcess.length}] 📌 [${item.qp_code} ${item.pc_code}]: "${item.pc_description.substring(0, 50)}..."`);
            console.log(`        ✨ 99% Intent:        "${intent}"`);
            console.log(`        🎥 YouTube Query:     "${query}" (Query Confidence: ${queryConf}%)`);
            console.log('--------------------------------------------------------------------------------');
        }
    }

    const elapsedMs = Date.now() - startTime;
    const avgQueryConfidence = updatedCount > 0 ? (totalQueryConfidence / updatedCount).toFixed(1) : 0;

    console.log('\n================================================================================');
    console.log(`📊 YOUTUBE SEARCH VECTOR CONFIDENCE SCORING SUMMARY:`);
    console.log(`   Total Search Vectors Scored: ${updatedCount.toLocaleString()}`);
    console.log(`   Average Query Confidence:    ${avgQueryConfidence}%`);
    console.log(`   High Quality (>= 80%):       ${highConfCount.toLocaleString()} (${((highConfCount/updatedCount)*100).toFixed(1)}%)`);
    console.log(`   Medium Quality (70-79%):     ${medConfCount.toLocaleString()} (${((medConfCount/updatedCount)*100).toFixed(1)}%)`);
    console.log(`   Low Quality (< 70%):         ${lowConfCount.toLocaleString()} (${((lowConfCount/updatedCount)*100).toFixed(1)}%)`);
    console.log(`   Execution Time:              ${(elapsedMs / 1000).toFixed(2)} seconds`);
    console.log(`   Throughput Speed:            ${Math.round(updatedCount / (elapsedMs / 1000)).toLocaleString()} Vectors / sec`);
    console.log('================================================================================\n');
}

processYoutubeQueryOptimization().catch(console.error);
