'use strict';

/**
 * 🌾 Pilot AI Quality Video Harvester for AGR/Q0101 (Paddy Cultivator)
 * 
 * Powered by:
 * - Primary LLM: Sarvam AI (sarvam-105b-conversations)
 * - Fallback LLM: OpenRouter (meta-llama/llama-3.3-70b-instruct)
 * - Search: YouTube Data API v3 / youtube-sr failover
 * - Full Hierarchy: data/md/AGR_Q0101.md un-truncated criteria + tools
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { searchYouTubeVideos } = require('../server/utils/videoHarvester');

const SARVAM_API_KEY = (process.env.SARVAM_API_KEY || '').trim();
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();

const urlObj = new URL(process.env.NEON_DATABASE_URL);
const pool = new Pool({
    user: decodeURIComponent(urlObj.username),
    password: decodeURIComponent(urlObj.password),
    host: '52.76.108.241',
    port: 5432,
    database: urlObj.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: urlObj.hostname }
});

// Helper: Call LLM with Sarvam -> OpenRouter fallback
async function callLLM(prompt, jsonMode = true) {
    // 1. Try Sarvam AI
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
                            content: 'You are an expert vocational training & video retrieval specialist for the National Skills Qualification Framework (NSQF). Always output strictly valid JSON when requested.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.2,
                    max_tokens: 600
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content?.trim();
                if (text) return text;
            }
        } catch (e) {
            console.warn('[AI] Sarvam fallback triggered:', e.message);
        }
    }

    // 2. Fallback: OpenRouter
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
                    { role: 'system', content: 'You are an expert vocational training specialist. Return JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 600
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

// Parse un-truncated PCs and Element headings from Markdown
function parseMarkdownPCs(mdPath) {
    if (!fs.existsSync(mdPath)) return {};
    const content = fs.readFileSync(mdPath, 'utf8');
    const lines = content.split('\n');
    const pcMap = {};
    let currentElement = 'Practical Execution';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('### Page') || line.startsWith('|') || line.startsWith('---')) continue;

        if (line && !line.startsWith('PC') && !line.startsWith('To be competent') && !line.startsWith('#') && line.length < 50 && !line.includes(':')) {
            currentElement = line;
        }

        const match = line.match(/^(PC\d+[\.\:]?)\s+(.*)/i);
        if (match) {
            const code = match[1].replace(':', '.');
            let desc = match[2];
            // Lookahead for wrapped lines
            let j = i + 1;
            while (j < lines.length && lines[j].trim() && !lines[j].trim().match(/^(PC\d+|###|\||---)/i) && !lines[j].includes('To be competent')) {
                desc += ' ' + lines[j].trim();
                j++;
            }
            pcMap[code] = {
                element: currentElement,
                fullDescription: desc.replace(/\s+/g, ' ').trim()
            };
        }
    }
    return pcMap;
}

async function runPilot() {
    console.log(`================================================================================`);
    console.log(`🌾 STARTING AI-POWERED VIDEO HARVEST PILOT FOR AGR/Q0101 (Paddy Cultivator)`);
    console.log(`   LLM: Sarvam AI (sarvam-105b-conversations) with OpenRouter Fallback`);
    console.log(`================================================================================\n`);

    const mdPath = path.join(__dirname, '../data/md/AGR_Q0101.md');
    const mdPcs = parseMarkdownPCs(mdPath);
    console.log(`📄 Loaded ${Object.keys(mdPcs).length} un-truncated criteria from AGR_Q0101.md\n`);

    const client = await pool.connect();
    try {
        // Fetch first 12 sample PCs covering different stages (Seed selection, treatment, sowing, safety)
        const pcRes = await client.query(`
            SELECT id, qp_code, nos_code, pc_code, pc_description, pc_intent, video_id, video_title 
            FROM nsqf_pcs 
            WHERE qp_code = 'AGR/Q0101' 
            ORDER BY id ASC 
            LIMIT 12
        `);

        const pcs = pcRes.rows;
        const auditResults = [];

        for (let idx = 0; idx < pcs.length; idx++) {
            const pc = pcs[idx];
            const cleanCode = pc.pc_code.endsWith('.') ? pc.pc_code : pc.pc_code + '.';
            const mdInfo = mdPcs[cleanCode] || mdPcs[pc.pc_code] || { element: 'Paddy Cultivation', fullDescription: pc.pc_description };
            const fullDesc = mdInfo.fullDescription || pc.pc_description;
            const element = mdInfo.element || 'Practical Execution';

            console.log(`--------------------------------------------------------------------------------`);
            console.log(`[${idx + 1}/${pcs.length}] ${pc.pc_code} (NOS: ${pc.nos_code} | Module: ${element})`);
            console.log(`   📝 Full Text: "${fullDesc}"`);
            console.log(`   ⚠️ Old Video: [${pc.video_id}] "${pc.video_title}"`);

            // Step 1: Synthesize High-Precision Search Queries using Sarvam AI
            const prompt = `Given the vocational context:
- Sector: Agriculture (Paddy Cultivation)
- Role: Paddy Cultivator
- NOS Unit: ${pc.nos_code}
- Module/Element: ${element}
- Performance Criterion: "${fullDesc}"

Generate a JSON object with:
1. "clean_intent": A 4-6 word imperative action intent (e.g. "Treat paddy seeds with chemical fungicide").
2. "search_query_en": A 5-8 word YouTube search query optimized for finding a practical visual demonstration tutorial (e.g. "Paddy seed treatment with fungicide demonstration").
3. "search_query_hi": A natural Hindi YouTube search query (e.g. "धान के बीज का उपचार कैसे करें").

Output ONLY JSON format:
{
  "clean_intent": "...",
  "search_query_en": "...",
  "search_query_hi": "..."
}`;

            let aiSynthesis = null;
            try {
                const rawReply = await callLLM(prompt);
                const jsonMatch = rawReply?.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiSynthesis = JSON.parse(jsonMatch[0]);
                }
            } catch (err) {
                console.warn(`   ⚠️ AI parsing error:`, err.message);
            }

            if (!aiSynthesis) {
                aiSynthesis = {
                    clean_intent: fullDesc.slice(0, 40),
                    search_query_en: `Paddy farming ${fullDesc.slice(0, 30)} practical demonstration`,
                    search_query_hi: `धान की खेती ${fullDesc.slice(0, 25)}`
                };
            }

            console.log(`   ✨ Synthesized Intent: "${aiSynthesis.clean_intent}"`);
            console.log(`   🔍 New Search Query (EN): "${aiSynthesis.search_query_en}"`);
            console.log(`   🔍 New Search Query (HI): "${aiSynthesis.search_query_hi}"`);

            // Step 2: Search YouTube for Candidates
            const candidates = await searchYouTubeVideos(aiSynthesis.search_query_en, 4);

            // Step 3: AI Quality Scoring Gatekeeper
            let bestVideo = null;
            let bestScore = 0;
            let bestRationale = '';

            if (candidates.length > 0) {
                const scorePrompt = `You are evaluating YouTube video search results for an NSQF vocational skill.
Target Skill Criterion: "${fullDesc}"
Target Action: "${aiSynthesis.clean_intent}"

Candidate Videos:
${candidates.map((c, i) => `${i + 1}. Title: "${c.video_title}" (ID: ${c.video_id})`).join('\n')}

Select the single best video that demonstrates this practical vocational skill.
Score the best video on a scale of 0 to 100 on how directly it teaches the target criterion.

Output ONLY JSON format:
{
  "selected_index": 1,
  "match_score": 95,
  "rationale": "Directly demonstrates..."
}`;

                try {
                    const scoreReply = await callLLM(scorePrompt);
                    const scoreJsonMatch = scoreReply?.match(/\{[\s\S]*\}/);
                    if (scoreJsonMatch) {
                        const scoreData = JSON.parse(scoreJsonMatch[0]);
                        const selIdx = (scoreData.selected_index || 1) - 1;
                        if (candidates[selIdx]) {
                            bestVideo = candidates[selIdx];
                            bestScore = scoreData.match_score || 85;
                            bestRationale = scoreData.rationale || 'Selected by AI';
                        }
                    }
                } catch (e) {
                    bestVideo = candidates[0];
                    bestScore = 80;
                    bestRationale = 'Top search result';
                }
            }

            if (!bestVideo && candidates[0]) {
                bestVideo = candidates[0];
                bestScore = 75;
            }

            console.log(`   🎯 Selected Video: [${bestVideo?.video_id}] "${bestVideo?.video_title}"`);
            console.log(`   🏆 AI Quality Score: ${bestScore}/100 (${bestRationale})`);

            auditResults.push({
                pcCode: pc.pc_code,
                fullDesc: fullDesc.length > 60 ? fullDesc.slice(0, 57) + '...' : fullDesc,
                synthesizedQuery: aiSynthesis.search_query_en,
                oldVideoTitle: pc.video_title?.length > 45 ? pc.video_title.slice(0, 42) + '...' : pc.video_title,
                newVideoTitle: bestVideo?.video_title?.length > 45 ? bestVideo.video_title.slice(0, 42) + '...' : bestVideo?.video_title,
                newVideoId: bestVideo?.video_id,
                score: bestScore
            });

            // Brief pacing delay between queries
            await new Promise(r => setTimeout(r, 400));
        }

        console.log(`\n================================================================================`);
        console.log(`📊 PILOT RUN SUMMARY: BEFORE vs AFTER COMPARISON TABLE`);
        console.log(`================================================================================\n`);
        console.table(auditResults.map(r => ({
            'PC Code': r.pcCode,
            'Skill Criterion': r.fullDesc,
            'Old Video (Mismatched)': r.oldVideoTitle,
            'New AI-Selected Video': r.newVideoTitle,
            'Score': `${r.score}%`
        })));

    } catch (err) {
        console.error('❌ Pilot execution error:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

runPilot();
