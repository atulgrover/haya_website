'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PASS 2: Cloud LLM Intent, Category & Guidance Generator (v3)           ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  High-Throughput Parallel Worker Pipeline using Sarvam AI (sarvam-105b)  ║
 * ║  or OpenRouter API.                                                      ║
 * ║                                                                          ║
 * ║  Sends 5-tier context + Complete 15 YouTube Category Enum list.          ║
 * ║  Synthesizes & updates nsqf_pcs in local hayadb with:                    ║
 * ║    - pc_intent                  (5-8 word English practical action)     ║
 * ║    - pc_intent_hi               (5-8 word Devanagari Hindi headline)    ║
 * ║    - contextual_search_query    (Deduplicated English YouTube vector)   ║
 * ║    - contextual_search_query_hi (Devanagari Hindi YouTube vector)       ║
 * ║    - youtube_category_id/name   (1 to 29 from complete 15-category list)║
 * ║    - tool_keywords              (Specific instruments & tools)          ║
 * ║    - negative_keywords          (Search exclusions)                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/nsqf_pass2_intent_synthesis.js --qp=NIE/ELE/Q0803
 *   node scripts/nsqf_pass2_intent_synthesis.js --limit=5
 *   node scripts/nsqf_pass2_intent_synthesis.js --all
 */

require('dotenv').config();
const db       = require('../server/db');
const aiEngine = require('../js/aiEngine');

const CONCURRENCY_WORKERS = 6;

// ── Complete 15 Official YouTube Categories Active in Region IN ─────────────
const ALL_YOUTUBE_CATEGORIES = [
    { id: 1,  name: 'Film & Animation' },
    { id: 2,  name: 'Autos & Vehicles' },
    { id: 10, name: 'Music' },
    { id: 15, name: 'Pets & Animals' },
    { id: 17, name: 'Sports' },
    { id: 19, name: 'Travel & Events' },
    { id: 20, name: 'Gaming' },
    { id: 22, name: 'People & Blogs' },
    { id: 23, name: 'Comedy' },
    { id: 24, name: 'Entertainment' },
    { id: 25, name: 'News & Politics' },
    { id: 26, name: 'Howto & Style' },
    { id: 27, name: 'Education' },
    { id: 28, name: 'Science & Technology' },
    { id: 29, name: 'Nonprofits & Activism' },
];

const CATEGORY_GUIDE_TEXT = ALL_YOUTUBE_CATEGORIES
    .map(c => `• ${c.id}: "${c.name}"`)
    .join('\n');

const CATEGORY_MAP = new Map(ALL_YOUTUBE_CATEGORIES.map(c => [c.id, c.name]));

// ── Fallback Intent Synthesis ────────────────────────────────────────────────
function fallbackSynthesizeIntent(qpName, nosTitle, modTitle, pcDesc) {
    let clean = String(pcDesc || '').replace(/^####\s*|^PC\d+[\.:-]?\s*/i, '').replace(/\s+/g, ' ').trim();
    if (!clean) return 'Practical Execution';

    const words = clean.split(' ');
    if (words.length <= 8) return clean;

    const important = words.filter(w => !/^(the|a|an|and|or|in|on|at|to|for|of|with|by|as|is|are|be|must|able|able to)$/i.test(w));
    const intent = important.slice(0, 8).join(' ');
    return intent || clean.substring(0, 55);
}

function buildContextualSearchQuery(sector, qpName, nosTitle, modTitle, pcIntent) {
    const s = String(sector || '').replace(/sector|council|skill/gi, '').trim();
    const q = String(qpName || '').trim();
    const n = String(nosTitle || '').replace(/\.\.\.*/g, '').trim();
    const i = String(pcIntent || '').trim();
    return `${s} ${q} ${n} ${i} practical tutorial demonstration`.replace(/\s+/g, ' ').trim();
}

// ── Single Criterion LLM Synthesis ───────────────────────────────────────────
async function synthesizeSinglePc(item, sarvamKey, retries = 3) {
    const pcDesc   = item.pc_description || '';
    const sector   = item.sector || 'Vocational Skills';
    const qpName   = item.qp_name || item.qp_code;
    const nosTitle = item.nos_title || item.nos_code;
    const modTitle = item.module_title || 'Core Operational Module';

    let result = null;

    if (sarvamKey) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const prompt = `You are an expert Vocational Curriculum & Video Harvester Specialist.
Given the following training context:
- Sector: "${sector}"
- Qualification Role: "${qpName}"
- Occupational Unit: "${nosTitle}"
- Module Reel: "${modTitle}"
- Performance Criteria Statement: "${pcDesc}"

Official YouTube Category Options:
${CATEGORY_GUIDE_TEXT}

Synthesize the harvesting payload.
Requirements:
1. pc_intent: Action-oriented 5 to 8 word practical skill intent in English (Action Verb + Specific Component + Tool/Context).
2. pc_intent_hi: Natural Devanagari Hindi practical headline (e.g. "स्मार्टफोन डिस्प्ले फोल्डर और स्क्रीन बदलें").
3. youtube_category_id: The single most appropriate numeric ID from the official list above (e.g. 28, 2, 26, 15, 27).
4. tool_keywords: Comma-separated physical tools, testers, or equipment used for this task.
5. negative_keywords: Exclusions (e.g. "-unboxing -review -prank -shorts").

Respond ONLY with raw JSON:
{
  "pc_intent": "5-8 Word Practical English Action",
  "pc_intent_hi": "5-8 Word Devanagari Hindi Action",
  "youtube_category_id": 28,
  "tool_keywords": "multimeter, soldering iron, rework station",
  "negative_keywords": "-unboxing -review -prank -reaction -shorts"
}`;

                const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'api-subscription-key': sarvamKey },
                    body: JSON.stringify({
                        model: 'sarvam-105b',
                        messages: [{ role: 'system', content: prompt }],
                        temperature: 0.2,
                        max_tokens: 200
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const rawText = data.choices?.[0]?.message?.content?.trim() || '';
                    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
                    const parsed = JSON.parse(cleanJson);
                    if (parsed && parsed.pc_intent) {
                        result = {
                            pcIntent: parsed.pc_intent.trim(),
                            pcIntentHi: (parsed.pc_intent_hi || parsed.pc_intent).trim(),
                            catId: parseInt(parsed.youtube_category_id) || 27,
                            catName: CATEGORY_MAP.get(parseInt(parsed.youtube_category_id)) || 'Education',
                            toolKeywords: parsed.tool_keywords || 'measuring instruments, standard tools',
                            negKeywords: parsed.negative_keywords || '-unboxing -review -prank -reaction -shorts'
                        };
                        break;
                    }
                } else if (res.status === 429) {
                    await new Promise(r => setTimeout(r, attempt * 1000));
                }
            } catch (_) {
                if (attempt === retries) break;
            }
        }
    }

    if (!result) {
        const fbIntent = fallbackSynthesizeIntent(qpName, nosTitle, modTitle, pcDesc);
        result = {
            pcIntent: fbIntent,
            pcIntentHi: fbIntent,
            catId: 27,
            catName: 'Education',
            toolKeywords: 'standard tools, safety gear',
            negKeywords: '-unboxing -review -prank -reaction -shorts'
        };
    }

    const queryEn = buildContextualSearchQuery(sector, qpName, nosTitle, modTitle, result.pcIntent);
    const queryHi = `${result.pcIntentHi} प्रैक्टिकल वीडियो कैसे करें`.trim();

    return { ...result, queryEn, queryHi };
}

// ── Main Pass 2 LLM Batch Pipeline ───────────────────────────────────────────
async function processPass2Synthesis() {
    const args      = process.argv.slice(2);
    const doAll     = args.includes('--all');
    const limitFlag = args.find(a => a.startsWith('--limit='));
    const qpFlag    = args.find(a => a.startsWith('--qp='));
    const limit     = limitFlag ? parseInt(limitFlag.split('=')[1]) : 5;
    const targetQp  = qpFlag ? qpFlag.split('=')[1].trim() : null;

    console.log('================================================================================');
    console.log('☁️ [PASS 2] CLOUD LLM INTENT & HARVESTER GUIDANCE GENERATOR (SARVAM AI)');
    console.log('   (5-Tier Context • Complete 15 YouTube Categories • Local PostgreSQL: hayadb)');
    console.log('================================================================================\n');

    let pcsToProcess = [];
    const pool = { query: db.query.bind(db) };

    if (targetQp) {
        const clean = targetQp.replace(/\//g, '_');
        const res = await pool.query(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE p.qp_code = $1 OR p.qp_code = $2
            ORDER BY p.id ASC
        `, [targetQp, clean]);
        pcsToProcess = res.rows;
    } else if (doAll) {
        const res = await pool.query(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            ORDER BY p.id ASC
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
            WHERE p.qp_code IN (SELECT qp_code FROM nsqf_qps ORDER BY id ASC LIMIT $1)
            ORDER BY p.id ASC
        `, [limit]);
        pcsToProcess = res.rows;
    }

    if (pcsToProcess.length === 0) {
        console.log('✅ All Performance Criteria (PCs) processed!');
        process.exit(0);
    }

    console.log(`Processing Cloud LLM Synthesis for ${pcsToProcess.length.toLocaleString()} PCs...\n`);

    const sarvamKey = process.env.SARVAM_API_KEY || (typeof aiEngine.getSarvamApiKey === 'function' ? aiEngine.getSarvamApiKey() : null);
    let processedCount = 0;

    for (let i = 0; i < pcsToProcess.length; i += CONCURRENCY_WORKERS) {
        const chunk = pcsToProcess.slice(i, i + CONCURRENCY_WORKERS);
        const results = await Promise.all(chunk.map(item => synthesizeSinglePc(item, sarvamKey)));

        for (let j = 0; j < chunk.length; j++) {
            const item = chunk[j];
            const r    = results[j];

            await pool.query(`
                UPDATE nsqf_pcs
                SET pc_intent                  = $1,
                    pc_intent_hi               = $2,
                    contextual_search_query    = $3,
                    contextual_search_query_hi = $4,
                    youtube_category_id        = $5,
                    youtube_category_name      = $6,
                    tool_keywords              = $7,
                    negative_keywords          = $8
                WHERE id = $9
            `, [
                r.pcIntent, r.pcIntentHi,
                r.queryEn, r.queryHi,
                r.catId, r.catName,
                r.toolKeywords, r.negKeywords,
                item.id
            ]);

            processedCount++;

            if (processedCount <= 10 || processedCount % 25 === 0 || processedCount === pcsToProcess.length) {
                console.log(`[${processedCount}/${pcsToProcess.length}] 📌 [${item.qp_code} ${item.pc_code}]: "${item.pc_description.substring(0, 50)}..."`);
                console.log(`        💡 Intent (EN): "${r.pcIntent}"`);
                console.log(`        🇮🇳 Intent (HI): "${r.pcIntentHi}"`);
                console.log(`        🏷️ Category:    ${r.catId} (${r.catName})`);
                console.log(`        🔍 Search EN:   "${r.queryEn}"`);
                console.log('--------------------------------------------------------------------------------');
            }
        }

        const distinctQps = [...new Set(chunk.map(c => c.qp_code))];
        for (const qp of distinctQps) {
            await pool.query(
                `UPDATE nsqf_qps SET pipeline_status = 'intent_synthesized' WHERE qp_code = $1`,
                [qp]
            );
        }
    }

    console.log('\n================================================================================');
    console.log(`📊 CLOUD LLM INTENT SYNTHESIS SUMMARY:`);
    console.log(`   Total PCs Synthesized:   ${processedCount.toLocaleString()}`);
    console.log(`   YouTube Categories:      Full 15-Category List Enabled (1-29)`);
    console.log(`   Database Status:         pipeline_status = 'intent_synthesized' in hayadb`);
    console.log('================================================================================\n');

    process.exit(0);
}

processPass2Synthesis().catch(e => {
    console.error('\n❌ Fatal error in Pass 2 Cloud LLM:', e.message);
    console.error(e.stack);
    process.exit(1);
});
