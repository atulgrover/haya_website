'use strict';

/**
 * Pass 2 Script: Asynchronous LLM Intent Synthesis
 * Queries SQLite nsqf_pcs rows WHERE pc_intent IS NULL, constructs clean human-readable prompts
 * (Sector + QP Name + NOS Title + Module Title + PC Description), calls Sarvam AI / OpenRouter API
 * to synthesize pc_intent (3-6 word practical action) & contextual_search_query, and updates nsqf_pcs.
 *
 * Usage:
 *   node scripts/nsqf_pass2_intent_synthesis.js --qp=WBSC/HCS/Q0501
 *   node scripts/nsqf_pass2_intent_synthesis.js --limit=5
 *   node scripts/nsqf_pass2_intent_synthesis.js --limit=2176
 */

const db = require('../server/db');
const aiEngine = require('../js/aiEngine');

/**
 * Fallback intent synthesis if LLM API is unavailable
 */
function fallbackSynthesizeIntent(qpName, nosTitle, modTitle, pcDesc) {
    let clean = String(pcDesc || '').replace(/^####\s*|^PC\d+[\.:-]?\s*/i, '').replace(/\s+/g, ' ').trim();
    if (!clean) return 'Practical Execution';

    const words = clean.split(' ');
    if (words.length <= 8) return clean;

    const important = words.filter(w => !/^(the|a|an|and|or|in|on|at|to|for|of|with|by|as|is|are|be|must|able|able to)$/i.test(w));
    const intent = important.slice(0, 6).join(' ');
    return intent || clean.substring(0, 40);
}

/**
 * Build 5-part contextual search query
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
 * Main Pass 2 LLM Intent Synthesizer
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
    console.log('🧠 [PASS 2] ASYNCHRONOUS LLM INTENT SYNTHESIS');
    console.log('   (Sending clean context without code noise ➔ Synthesizing pc_intent & search query)');
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
            LIMIT ?
        `).all(targetQp, targetQp.replace('/', '_'), limit * 200);
    } else {
        pcsToProcess = await db.prepare(`
            SELECT p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description,
                   q.sector, q.qp_name, n.nos_title, m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.nos_code = n.nos_code AND p.qp_code = n.qp_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE p.pc_intent IS NULL OR p.pc_intent = p.pc_code
            ORDER BY p.id ASC
            LIMIT ?
        `).all(limit * 50);
    }

    if (pcsToProcess.length === 0) {
        console.log('✅ All Performance Criteria (PCs) already have synthesized pc_intent!');
        return;
    }

    console.log(`Processing Pass 2 LLM Intent Synthesis for ${pcsToProcess.length} PCs...\n`);

    let synthesizedCount = 0;
    const sarvamKey = process.env.SARVAM_API_KEY || (typeof aiEngine.getSarvamApiKey === 'function' ? aiEngine.getSarvamApiKey() : null);

    for (let i = 0; i < pcsToProcess.length; i++) {
        const item = pcsToProcess[i];
        const pcDesc = item.pc_description || '';
        const sector = item.sector || 'Vocational Training';
        const qpName = item.qp_name || item.qp_code;
        const nosTitle = item.nos_title || item.nos_code;
        const modTitle = item.module_title || 'Core Operational Module';

        let pcIntent = fallbackSynthesizeIntent(qpName, nosTitle, modTitle, pcDesc);

        // Sarvam AI LLM Call if available
        if (sarvamKey) {
            try {
                const prompt = `You are an expert Vocational Curriculum Specialist.
Given the following training context:
- Sector: "${sector}"
- Qualification Pack: "${qpName}"
- Occupational Unit: "${nosTitle}"
- Module Reel: "${modTitle}"
- Performance Criteria Description: "${pcDesc}"

Synthesize a precise, action-oriented 3 to 6 word practical skill intent for this criteria.
Respond ONLY with raw JSON:
{ "pc_intent": "Exact 3-6 Word Practical Action" }`;

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
                    }
                }
            } catch (_) {
                // Fallback used seamlessly if API rate limits or errors
            }
        }

        const searchQuery = buildContextualSearchQuery(sector, qpName, nosTitle, modTitle, pcIntent);

        // Update SQLite database row
        await db.prepare(`
            UPDATE nsqf_pcs
            SET pc_intent = ?, contextual_search_query = ?
            WHERE id = ?
        `).run(pcIntent, searchQuery, item.id);

        synthesizedCount++;

        if (i < 5 || (i + 1) % 25 === 0 || i === pcsToProcess.length - 1) {
            console.log(`[${i + 1}/${pcsToProcess.length}] 📌 [${item.qp_code} ${item.pc_code}]: "${pcDesc.substring(0, 60)}..."`);
            console.log(`        💡 Synthesized Intent: "${pcIntent}"`);
            console.log(`        🔍 Search Vector:      "${searchQuery}"`);
            console.log('--------------------------------------------------------------------------------');
        }
    }

    // Update nsqf_qps pipeline status
    if (targetQp) {
        await db.prepare(`
            UPDATE nsqf_qps SET pipeline_status = 'intent_synthesized' WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?
        `).run(targetQp, targetQp.replace('/', '_'));
    }

    console.log('\n================================================================================');
    console.log(`📊 PASS 2 LLM INTENT SYNTHESIS SUMMARY:`);
    console.log(`   Total PCs Synthesized:   ${synthesizedCount}`);
    console.log(`   SQLite Table Updated:    nsqf_pcs (pc_intent, contextual_search_query)`);
    console.log('================================================================================\n');
}

processPass2Synthesis().catch(console.error);
