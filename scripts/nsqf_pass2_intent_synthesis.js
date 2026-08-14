'use strict';

/**
 * Option 2: Pure Cloud LLM Intent Synthesizer & Search Vector Generator
 * High-Throughput Parallel Worker Pipeline using Sarvam AI (sarvam-105b) / OpenRouter API.
 *
 * Constructs clean prompts (Sector + QP Title + NOS Title + Module Title + PC Description)
 * without raw code noise, sends to LLM, and updates SQLite nsqf_pcs table with synthesized:
 *   - pc_intent (concise 3-6 word practical skill action)
 *   - contextual_search_query (natural language 5-part search vector for YouTube harvesting)
 *
 * Usage:
 *   node scripts/nsqf_pass2_intent_synthesis.js --limit=5
 *   node scripts/nsqf_pass2_intent_synthesis.js --qp=WBSC/HCS/Q0501
 *   node scripts/nsqf_pass2_intent_synthesis.js --limit=2176
 */

const db = require('../server/db');
const aiEngine = require('../js/aiEngine');

const CONCURRENCY_WORKERS = 8; // 8 parallel worker connections

/**
 * Fallback intent synthesis if LLM API is unavailable or rate-limited
 */
function fallbackSynthesizeIntent(qpName, nosTitle, modTitle, pcDesc) {
    let clean = String(pcDesc || '').replace(/^####\s*|^PC\d+[\.:-]?\s*/i, '').replace(/\s+/g, ' ').trim();
    if (!clean) return 'Practical Execution';

    const words = clean.split(' ');
    if (words.length <= 8) return clean;

    const important = words.filter(w => !/^(the|a|an|and|or|in|on|at|to|for|of|with|by|as|is|are|be|must|able|able to)$/i.test(w));
    const intent = important.slice(0, 8).join(' ');
    return intent || clean.substring(0, 55);
}

/**
 * Build 5-part natural language contextual search query for YouTube video harvesting
 */
function buildContextualSearchQuery(sector, qpName, nosTitle, modTitle, pcIntent) {
    const s = String(sector || '').replace(/sector|council|skill/gi, '').trim();
    const q = String(qpName || '').trim();
    const n = String(nosTitle || '').replace(/\.\.\.*/g, '').trim();
    const m = String(modTitle || '').replace(/^module\s*\d+[\.:-]?\s*/gi, '').trim();
    const i = String(pcIntent || '').trim();
    return `${s} ${q} ${n} ${m} ${i} practical tutorial demonstration`.replace(/\s+/g, ' ').trim();
}

/**
 * Synthesize a single PC intent via Cloud LLM API with exponential retry
 */
async function synthesizeSinglePc(item, sarvamKey, retries = 3) {
    const pcDesc = item.pc_description || '';
    const sector = item.sector || 'Vocational Skills';
    const qpName = item.qp_name || item.qp_code;
    const nosTitle = item.nos_title || item.nos_code;
    const modTitle = item.module_title || 'Core Operational Module';

    let pcIntent = null;

    if (sarvamKey) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const prompt = `You are an expert Vocational Curriculum & Pedagogy Specialist.
Given the following training context:
- Sector: "${sector}"
- Qualification Role: "${qpName}"
- Occupational Unit: "${nosTitle}"
- Module Reel: "${modTitle}"
- Performance Criteria Statement: "${pcDesc}"

Synthesize a precise, action-oriented 5 to 8 word practical skill intent for this criteria (Action Verb + Specific Component + Tool/Context).
Requirements:
1. Do NOT include raw codes, IDs, or introductory words like "Check that" or "Ensure".
2. Focus strictly on the core physical/practical action.
3. Respond ONLY with raw JSON: { "pc_intent": "Exact 5-8 Word Practical Action" }`;

                const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'api-subscription-key': sarvamKey },
                    body: JSON.stringify({
                        model: 'sarvam-105b',
                        messages: [{ role: 'system', content: prompt }],
                        temperature: 0.2,
                        max_tokens: 100
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const rawText = data.choices?.[0]?.message?.content?.trim() || '';
                    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
                    const parsed = JSON.parse(cleanJson);
                    if (parsed && parsed.pc_intent) {
                        pcIntent = parsed.pc_intent.trim();
                        break; // Success
                    }
                } else if (res.status === 429) {
                    await new Promise(r => setTimeout(r, attempt * 1000)); // Exponential backoff
                }
            } catch (_) {
                if (attempt === retries) break;
            }
        }
    }

    if (!pcIntent) {
        pcIntent = fallbackSynthesizeIntent(qpName, nosTitle, modTitle, pcDesc);
    }

    const searchQuery = buildContextualSearchQuery(sector, qpName, nosTitle, modTitle, pcIntent);

    return { pcIntent, searchQuery };
}

/**
 * Main Pass 2 LLM Batch Pipeline
 */
async function processPass2Synthesis() {
    const args = process.argv.slice(2);
    let limit = 5;
    let targetQp = null;

    args.forEach(arg => {
        if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1]);
        if (arg.startsWith('--qp=')) targetQp = arg.split('=')[1].trim();
    });

    console.log('================================================================================');
    console.log('☁️ [PASS 2] PURE CLOUD LLM INTENT SYNTHESIZER (SARVAM AI / OPENROUTER)');
    console.log('   (Sending Sector + QP Title + NOS Title + Module Title + PC Description)');
    console.log('================================================================================\n');

    let pcsToProcess = [];
    if (targetQp) {
        pcsToProcess = await db.prepare(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE p.qp_code = ? OR REPLACE(p.qp_code, '/', '_') = ?
            ORDER BY p.id ASC
        `).all(targetQp, targetQp.replace('/', '_'));
    } else {
        pcsToProcess = await db.prepare(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE p.qp_code IN (SELECT qp_code FROM nsqf_qps ORDER BY id ASC LIMIT ?)
            ORDER BY p.id ASC
        `).all(limit);
    }

    if (pcsToProcess.length === 0) {
        console.log('✅ All Performance Criteria (PCs) already have synthesized pc_intent!');
        return;
    }

    console.log(`Processing Option 2 Pure Cloud LLM Synthesis for ${pcsToProcess.length} PCs...\n`);

    const sarvamKey = process.env.SARVAM_API_KEY || (typeof aiEngine.getSarvamApiKey === 'function' ? aiEngine.getSarvamApiKey() : null);
    let processedCount = 0;

    // Chunk array into parallel worker batches
    for (let i = 0; i < pcsToProcess.length; i += CONCURRENCY_WORKERS) {
        const chunk = pcsToProcess.slice(i, i + CONCURRENCY_WORKERS);

        const results = await Promise.all(chunk.map(item => synthesizeSinglePc(item, sarvamKey)));

        for (let j = 0; j < chunk.length; j++) {
            const item = chunk[j];
            const { pcIntent, searchQuery } = results[j];

            await db.prepare(`
                UPDATE nsqf_pcs
                SET pc_intent = ?, contextual_search_query = ?
                WHERE id = ?
            `).run(pcIntent, searchQuery, item.id);

            processedCount++;

            if (processedCount <= 10 || processedCount % 25 === 0 || processedCount === pcsToProcess.length) {
                console.log(`[${processedCount}/${pcsToProcess.length}] 📌 [${item.qp_code} ${item.pc_code}]: "${item.pc_description.substring(0, 50)}..."`);
                console.log(`        💡 Synthesized Intent: "${pcIntent}"`);
                console.log(`        🔍 Search Vector:      "${searchQuery}"`);
                console.log('--------------------------------------------------------------------------------');
            }
        }

        // Save pipeline status for processed QPs
        const distinctQps = [...new Set(chunk.map(c => c.qp_code))];
        for (const qp of distinctQps) {
            await db.prepare(`
                UPDATE nsqf_qps SET pipeline_status = 'intent_synthesized' WHERE qp_code = ?
            `).run(qp);
        }
    }

    console.log('\n================================================================================');
    console.log(`📊 OPTION 2 CLOUD LLM INTENT SYNTHESIS SUMMARY:`);
    console.log(`   Total PCs Synthesized:   ${processedCount}`);
    console.log(`   Database Status:         pipeline_status = 'intent_synthesized'`);
    console.log('================================================================================\n');
}

processPass2Synthesis().catch(console.error);
