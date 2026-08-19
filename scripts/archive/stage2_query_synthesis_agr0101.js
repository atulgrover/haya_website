'use strict';

/**
 * 🌾 STAGE 2: Sarvam AI Contextual Query Synthesizer for AGR/Q0101 (Paddy Cultivator)
 *
 * Takes un-truncated Stage 1 context (Role, NOS, Module, Full PC Description)
 * and uses Sarvam AI (sarvam-105b-conversations) with OpenRouter fallback to generate:
 * 1. pc_intent (4-6 word clean action intent)
 * 2. contextual_search_query (English visual demonstration search query)
 * 3. contextual_search_query_hi (Hindi localized search query)
 *
 * Saves to: data/stage2_agr0101_queries.json
 * NO YOUTUBE CALLS ARE MADE IN THIS STAGE.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const STAGE1_INPUT_PATH = path.join(__dirname, '../data/stage1_agr0101_extracted.json');
const STAGE2_OUTPUT_PATH = path.join(__dirname, '../data/stage2_agr0101_queries.json');

const SARVAM_API_KEY = (process.env.SARVAM_API_KEY || '').trim();
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();

async function callLLM(prompt) {
    if (SARVAM_API_KEY) {
        try {
            const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': SARVAM_API_KEY
                },
                body: JSON.stringify({
                    model: 'sarvam-105b-conversations',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert vocational curriculum specialist for India NSQF. Return strictly valid JSON.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.2,
                    max_tokens: 500
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content?.trim();
                if (text) return text;
            }
        } catch (e) {
            // silent fallback
        }
    }

    // Fallback: OpenRouter
    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    { role: 'system', content: 'You are an expert vocational curriculum specialist. Return JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 500
            })
        });

        if (res.ok) {
            const data = await res.json();
            return data.choices?.[0]?.message?.content?.trim();
        }
    } catch (e) {
        console.error('[AI] OpenRouter error:', e.message);
    }
    return null;
}

async function synthesizeQueries() {
    console.log(`================================================================================`);
    console.log(`🌾 STAGE 2: SARVAM AI CONTEXTUAL QUERY SYNTHESIS FOR AGR/Q0101`);
    console.log(`   Model: Sarvam AI (sarvam-105b-conversations)`);
    console.log(`================================================================================\n`);

    if (!fs.existsSync(STAGE1_INPUT_PATH)) {
        console.error(`❌ Missing Stage 1 input at ${STAGE1_INPUT_PATH}. Please run Stage 1 first.`);
        process.exit(1);
    }

    const stage1Data = JSON.parse(fs.readFileSync(STAGE1_INPUT_PATH, 'utf8'));
    const criteria = stage1Data.criteria;
    console.log(`📦 Loaded ${criteria.length} criteria from Stage 1 extraction.\n`);

    const synthesizedList = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < criteria.length; i += BATCH_SIZE) {
        const chunk = criteria.slice(i, i + BATCH_SIZE);
        const promises = chunk.map(async (c, idx) => {
            const itemNum = i + idx + 1;
            const prompt = `You are designing visual video search queries for an NSQF Vocational Skill criterion.

Context:
- Sector: Agriculture (Paddy Farming)
- Job Role: Paddy Cultivator
- National Occupational Standard: [${c.nos_code}] ${c.nos_title}
- Module / Element: ${c.element_name}
- Criterion Text: "${c.pc_description}"

Generate a JSON object with:
1. "clean_intent": A 4-6 word imperative action intent starting with a strong action verb (e.g. "Select pest-resistant paddy seed varieties").
2. "search_query_en": A 5-8 word practical YouTube search query designed to find clear hands-on video tutorials / demonstrations (e.g. "Paddy seed variety selection for high yield tutorial").
3. "search_query_hi": A natural Hindi YouTube search query (e.g. "धान की उन्नत किस्मों का चयन कैसे करें").

Output ONLY JSON format:
{
  "clean_intent": "...",
  "search_query_en": "...",
  "search_query_hi": "..."
}`;

            let result = null;
            try {
                const rawReply = await callLLM(prompt);
                const jsonMatch = rawReply?.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    result = JSON.parse(jsonMatch[0]);
                }
            } catch (err) {
                // heuristic fallback
            }

            if (!result || !result.clean_intent) {
                result = {
                    clean_intent: c.pc_description.slice(0, 45),
                    search_query_en: `Paddy farming ${c.element_name} ${c.pc_description.slice(0, 30)} demonstration`,
                    search_query_hi: `धान की खेती ${c.element_name}`
                };
            }

            process.stdout.write(`   ✨ [${itemNum}/${criteria.length}] Synthesized: ${c.nos_code} ${c.pc_code} -> "${result.clean_intent}"\n`);

            return {
                qp_code: c.qp_code,
                nos_code: c.nos_code,
                nos_title: c.nos_title,
                element_name: c.element_name,
                pc_code: c.pc_code,
                full_description: c.pc_description,
                clean_intent: result.clean_intent.replace(/"/g, ''),
                search_query_en: result.search_query_en.replace(/"/g, ''),
                search_query_hi: result.search_query_hi.replace(/"/g, '')
            };
        });

        const batchResults = await Promise.all(promises);
        synthesizedList.push(...batchResults);
        await new Promise(r => setTimeout(r, 200)); // smooth pacing
    }

    // Save Output Staging JSON
    fs.writeFileSync(STAGE2_OUTPUT_PATH, JSON.stringify({
        qp_code: 'AGR/Q0101',
        qp_name: 'Paddy Cultivator',
        total_synthesized: synthesizedList.length,
        items: synthesizedList
    }, null, 2));

    console.log(`\n================================================================================`);
    console.log(`🎉 STAGE 2 COMPLETE! Successfully synthesized ${synthesizedList.length} search queries.`);
    console.log(`💾 Saved Staging File: ${STAGE2_OUTPUT_PATH}`);
    console.log(`================================================================================\n`);

    // Group by NOS and print HIL Inspection Table
    const nosSet = [...new Set(synthesizedList.map(s => s.nos_code))];
    for (const nosCode of nosSet) {
        const group = synthesizedList.filter(s => s.nos_code === nosCode);
        console.log(`\n📌 NOS: [${nosCode}] - ${group[0].nos_title} (${group.length} Criteria)`);
        console.table(group.map(g => ({
            'PC': g.pc_code,
            'Module': g.element_name,
            'Clean Action Intent': g.clean_intent,
            'English YouTube Query': g.search_query_en,
            'Hindi YouTube Query': g.search_query_hi
        })));
    }
}

synthesizeQueries();
