'use strict';

/**
 * Sarvam AI Hindi Search Vector Generator
 * Converts English YouTube Search Vectors (contextual_search_query) into natural Devanagari Hindi Search Vectors
 * (contextual_search_query_hi) using Sarvam AI (sarvam-105b).
 *
 * Equipped with Safeguard 1 Deduplication Caching so only unique search vectors are sent to Sarvam AI.
 *
 * Usage:
 *   node scripts/nsqf_hindi_vector_generator.js --audit        (Run 5-QP sample audit matrix)
 *   node scripts/nsqf_hindi_vector_generator.js --limit=2176   (Full catalog batch run)
 */

const db = require('../server/db');
const aiEngine = require('../js/aiEngine');

const CONCURRENCY_WORKERS = 8;

/**
 * Common vocational terms Hindi dictionary for high-speed local translation fallback
 */
const VOCATIONAL_HINDI_DICT = {
    'inspect': 'जांच करें',
    'verify': 'सत्यापन करें',
    'assemble': 'असेंबल करें',
    'calibrate': 'कैलिब्रेट करें',
    'install': 'इंस्टॉल करें',
    'operate': 'ऑपरेट करें',
    'repair': 'मरम्मत करें',
    'clean': 'सफाई करें',
    'measure': 'माप लें',
    'prepare': 'तैयार करें',
    'log': 'दर्ज करें',
    'report': 'रिपोर्ट करें',
    'identify': 'पहचान करें',
    'test': 'टेस्ट करें',
    'execute': 'निष्पादित करें',
    'broadcast': 'प्रसारण करें',
    'dispatch': 'डिस्पैच करें',
    'maintain': 'रखरखाव करें',
    'sewing': 'सिलाई',
    'machine': 'मशीन',
    'cargo': 'कार्गो',
    'earthing': 'अर्थिंग',
    'wiring': 'वायरिंग',
    'house': 'हाउस',
    'vehicle': 'वाहन',
    'airside': 'एयरसाइड',
    'pack': 'पैक',
    'tech': 'टेक'
};

/**
 * Generate natural Devanagari Hindi Search Vector via Sarvam AI API
 */
async function generateHindiVectorSarvam(englishQuery, sarvamKey) {
    if (sarvamKey) {
        try {
            const prompt = `You are an expert Indian Vocational Trainer.
Convert the following English YouTube search query into a high-converting natural Devanagari Hindi YouTube search query:
- English Query: "${englishQuery}"

Requirements:
1. Translate into natural Devanagari Hindi as titled by Indian ITI instructors on YouTube (e.g. "पाइप अर्थिंग लगाने का सही तरीका हिंदी वीडियो").
2. End with high-CTR Hindi video suffixes like "हिंदी वीडियो डेमो" or "कैसे करें प्रैक्टिकल".
3. Return strictly raw JSON: { "hindi_vector": "Devanagari Hindi Search Vector" }`;

            const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'api-subscription-key': sarvamKey },
                body: JSON.stringify({
                    model: 'sarvam-105b',
                    messages: [{ role: 'system', content: prompt }],
                    temperature: 0.2,
                    max_tokens: 80
                })
            });

            if (res.ok) {
                const data = await res.json();
                const rawText = data.choices?.[0]?.message?.content?.trim() || '';
                const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
                const parsed = JSON.parse(cleanJson);
                if (parsed && parsed.hindi_vector) {
                    return parsed.hindi_vector.trim();
                }
            }
        } catch (_) {}
    }

    // High-speed Hindi dictionary fallback
    let words = englishQuery.replace(/practical demonstration tutorial/gi, '').split(' ');
    let translatedWords = words.map(w => VOCATIONAL_HINDI_DICT[w.toLowerCase()] || w);
    return `${translatedWords.join(' ')} हिंदी वीडियो प्रैक्टिकल डेमो`.replace(/\s+/g, ' ').trim();
}

/**
 * Compute Hindi Search Vector Confidence (0-100%)
 */
function computeHindiQueryConfidence(hindiVector) {
    if (!hindiVector) return 0;

    let score = 0;
    // 1. Devanagari Character Check (+40%)
    if (/[\u0900-\u097F]/.test(hindiVector)) {
        score += 40;
    } else {
        score += 15;
    }

    // 2. Hindi Tutorial Suffix (+30%)
    if (/हिंदी|प्रैक्टिकल|डेमो|तरीका|कैसे/i.test(hindiVector)) {
        score += 30;
    }

    // 3. Word Length (+30%)
    const wordCount = hindiVector.split(' ').length;
    if (wordCount >= 4 && wordCount <= 10) {
        score += 30;
    } else {
        score += 15;
    }

    return Math.min(100, Math.max(0, score));
}

/**
 * Main Execution
 */
async function runHindiVectorGenerator() {
    const args = process.argv.slice(2);
    const isAudit = args.includes('--audit');
    let limit = 2176;

    console.log('================================================================================');
    console.log('🇮🇳 SARVAM AI HINDI SEARCH VECTOR GENERATOR');
    console.log('   (Generating Devanagari Hindi Search Vectors via Sarvam AI sarvam-105b)');
    console.log('================================================================================\n');

    let pcsToProcess = [];
    if (isAudit) {
        pcsToProcess = await db.prepare(`
            SELECT p.id, p.qp_code, p.pc_code, p.pc_description, p.pc_intent, p.contextual_search_query, q.qp_name
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            WHERE p.qp_code IN ('AMH/Q0103', 'AAS/Q0103', 'WBSC/HCS/Q0501', 'ELE/Q4701', 'WBSC/CON/Q0501')
            ORDER BY p.id ASC
        `).all();
    } else {
        pcsToProcess = await db.prepare(`
            SELECT p.id, p.qp_code, p.pc_code, p.pc_description, p.pc_intent, p.contextual_search_query, q.qp_name
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            WHERE p.contextual_search_query_hi IS NULL OR p.query_confidence_hi < 80
            ORDER BY p.id ASC
            LIMIT ?
        `).all(limit * 100);
    }

    console.log(`Generating Hindi Search Vectors for ${pcsToProcess.length.toLocaleString()} Performance Criteria...\n`);

    const sarvamKey = process.env.SARVAM_API_KEY || (typeof aiEngine.getSarvamApiKey === 'function' ? aiEngine.getSarvamApiKey() : null);
    const startTime = Date.now();
    let updatedCount = 0;
    let totalConfidence = 0;

    // Deduplication Map to avoid redundant LLM calls for identical queries
    const vectorCache = new Map();

    for (let i = 0; i < pcsToProcess.length; i += CONCURRENCY_WORKERS) {
        const chunk = pcsToProcess.slice(i, i + CONCURRENCY_WORKERS);
        const results = await Promise.all(chunk.map(async (item) => {
            const engQuery = item.contextual_search_query;
            if (vectorCache.has(engQuery)) {
                return vectorCache.get(engQuery);
            }
            const hindiVec = await generateHindiVectorSarvam(engQuery, sarvamKey);
            const conf = computeHindiQueryConfidence(hindiVec);
            const res = { hindiVec, conf };
            vectorCache.set(engQuery, res);
            return res;
        }));

        for (let j = 0; j < chunk.length; j++) {
            const item = chunk[j];
            const { hindiVec, conf } = results[j];

            await db.prepare(`
                UPDATE nsqf_pcs
                SET contextual_search_query_hi = ?, query_confidence_hi = ?
                WHERE id = ?
            `).run(hindiVec, conf, item.id);

            updatedCount++;
            totalConfidence += conf;

            if (isAudit && (i + j < 8 || (i + j + 1) % 40 === 0)) {
                console.log(`[${i + j + 1}/${pcsToProcess.length}] 📌 [${item.qp_code} ${item.pc_code}]:`);
                console.log(`        🇬🇧 English Vector: "${item.contextual_search_query}"`);
                console.log(`        🇮🇳 Hindi Vector:   "${hindiVec}" (Confidence: ${conf}%)`);
                console.log('--------------------------------------------------------------------------------');
            }
        }
    }

    const elapsedMs = Date.now() - startTime;
    const avgConf = updatedCount > 0 ? (totalConfidence / updatedCount).toFixed(1) : 0;

    console.log('\n================================================================================');
    console.log(`📊 SARVAM AI HINDI VECTOR GENERATION SUMMARY:`);
    console.log(`   Total Hindi Vectors Generated: ${updatedCount.toLocaleString()}`);
    console.log(`   Average Hindi Vector Score:    ${avgConf}%`);
    console.log(`   Unique Vectors Translated:     ${vectorCache.size.toLocaleString()}`);
    console.log(`   Execution Time:                ${(elapsedMs / 1000).toFixed(2)} seconds`);
    console.log('================================================================================\n');
}

runHindiVectorGenerator().catch(console.error);
