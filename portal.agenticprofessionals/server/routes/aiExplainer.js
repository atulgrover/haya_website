'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HAYAGRIVA 250-WORD MULTILINGUAL AI EXPLAINER ENGINE                     ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Generates & caches deep-dive 200–300 word pedagogical & operational     ║
 * ║  masterclass explanations across 10 Indic languages and 3 Perspectives   ║
 * ║  (🎓 Skill, 🏭 Industrial SOP, 💼 Turnkey MSME BOM).                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

const LANGUAGE_CONFIG = {
    en: { name: 'English', script: 'Latin', nativeName: 'English' },
    hi: { name: 'Hindi', script: 'Devanagari', nativeName: 'हिन्दी' },
    ta: { name: 'Tamil', script: 'Tamil', nativeName: 'தமிழ்' },
    te: { name: 'Telugu', script: 'Telugu', nativeName: 'తెలుగు' },
    mr: { name: 'Marathi', script: 'Devanagari', nativeName: 'मराठी' },
    bn: { name: 'Bengali', script: 'Bengali', nativeName: 'বাংলা' },
    gu: { name: 'Gujarati', script: 'Gujarati', nativeName: 'ગુજરાતી' },
    kn: { name: 'Kannada', script: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    ml: { name: 'Malayalam', script: 'Malayalam', nativeName: 'മലയാളം' },
    pa: { name: 'Punjabi', script: 'Gurmukhi', nativeName: 'ਪੰਜਾਬੀ' },
};

/**
 * Sanitize upstream text typos from raw government QP PDFs
 */
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\bpeform\b/gi, 'Perform')
        .replace(/\bpeforming\b/gi, 'Performing')
        .replace(/\bpeformed\b/gi, 'Performed')
        .replace(/\bacordance\b/gi, 'accordance')
        .replace(/\bguidence\b/gi, 'guidance')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Helper to construct rich structured AI prompt tailored to perspective & language
 */
function buildExplanationPrompt(pc, perspective, langConfig) {
    const langName = langConfig.name;
    const scriptName = langConfig.script;

    const sanitizedDesc = cleanText(pc.pc_description);
    const sanitizedIntent = cleanText(pc.pc_intent);
    const sanitizedNos = cleanText(pc.nos_title);
    const sanitizedQp = cleanText(pc.qp_name || pc.qp_code);
    const sanitizedModule = cleanText(pc.module_title);

    let perspectiveContext = '';
    if (perspective === 'sop') {
        perspectiveContext = `Factory SOP Mode: Focus on shop-floor execution, tolerances (${cleanText(pc.sop_parameter_tolerance) || 'nominal'}), and safety (${cleanText(pc.sop_critical_knack) || 'zero-energy state'}).`;
    } else if (perspective === 'msme') {
        perspectiveContext = `MSME Equipment Mode: Focus on ${cleanText(pc.machine_name) || 'commercial machine'}, setup, operational maintenance, and batch throughput.`;
    } else {
        perspectiveContext = `Vocational Masterclass Mode: Focus on apprentice skill building, tactile knacks, and practical steps.`;
    }

    return `You are a Senior Technical Curriculum Specialist in India.

Explain the practical task: "${sanitizedIntent || sanitizedDesc}"
Trade: "${sanitizedQp}" | NOS: "${sanitizedNos}"
Context: ${perspectiveContext}

Respond ONLY with valid JSON in ${langName} (${scriptName} script) matching this exact schema:
{
  "overview": "1-2 sentences explaining the technical importance in ${langName}",
  "steps": ["step 1 in ${langName}", "step 2 in ${langName}", "step 3 in ${langName}"],
  "safety": ["safety rule 1 in ${langName}", "safety rule 2 in ${langName}"],
  "pro_tip": "1 expert craftsman insider tip in ${langName}"
}

Output raw valid JSON only. Do not use emojis or icon characters.`;
}

/**
 * Format JSON payload into clean markdown for backwards compatibility & offline vaults
 */
function jsonToMarkdown(data, lang) {
    const isIndic = lang !== 'en';
    const hOverview = isIndic ? '### 1. प्रक्रिया व तांत्रिक महत्त्व' : '### 1. Technical Overview & Purpose';
    const hSteps    = isIndic ? '### 2. चरण-दर-चरण कार्य पद्धती' : '### 2. Practical Execution Sequence';
    const hSafety   = isIndic ? '### 3. सुरक्षितता व गुणवत्ता नियम' : '### 3. Safety & Quality Rules';
    const hTip      = isIndic ? '### 4. उस्ताद की सीख' : '### 4. Master Craftsman Pro Tip';

    const stepsList = (data.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
    const safetyList = (data.safety || []).map(s => `- ${s}`).join('\n');

    return `${hOverview}\n${data.overview || ''}\n\n${hSteps}\n${stepsList}\n\n${hSafety}\n${safetyList}\n\n${hTip}\n${data.pro_tip || ''}`;
}

/**
 * Generate fallback explanation when LLM is offline
 */
function buildDeterministicFallback(pc, perspective, lang) {
    const isIndic = lang !== 'en';
    const title = cleanText(pc.pc_intent || pc.pc_description);
    const nosTitle = cleanText(pc.nos_title) || 'Standard Workstation Procedure';
    const sector = pc.sector || 'Technical Vocational';
    
    if (perspective === 'sop') {
        const json = {
            overview: isIndic
                ? `हे कार्य ${sector} क्षेत्रातील मानकांनुसार आणि ${nosTitle} अंतर्गत सुरक्षिततेने पूर्ण केले जाते.`
                : `This task is executed in strict compliance with ${sector} safety standards under ${nosTitle}.`,
            steps: [
                isIndic ? 'कार्यस्थळावर आवश्यक टूल्स आणि PPE व्यवस्थित तपासा.' : 'Stage the workstation with verified tooling and dielectric PPE.',
                isIndic ? `${cleanText(pc.sop_action_directive) || cleanText(pc.pc_description)} नुसार अचूक कृती सुरू करा.` : `Execute action sequence: "${cleanText(pc.sop_action_directive) || cleanText(pc.pc_description)}".`,
                isIndic ? `टॉलरेंस मर्यादा (${cleanText(pc.sop_parameter_tolerance) || 'मानक मर्यादा'}) चे काटेकोर पालन करा.` : `Maintain nominal operating tolerance: ${cleanText(pc.sop_parameter_tolerance) || 'Standard nominal limits'}.`,
                isIndic ? 'अंतिम तपासणी पूर्ण करून लॉग बुकमध्ये नोंद करा.' : 'Complete final quality verification and record in plant logbook.'
            ],
            safety: [
                cleanText(pc.sop_critical_knack) || (isIndic ? 'शून्य-ऊर्जा स्थिती आणि योग्य PPE चे पालन करा.' : 'Maintain zero-energy state verification prior to terminal contact.'),
                isIndic ? 'कोणतीही त्रुटी आढळल्यास काम त्वरित थांबवून सुपरवायझरला कळवा.' : 'Quarantine non-conforming parts immediately to prevent line defects.'
            ],
            pro_tip: isIndic ? 'सटीक मापन आणि नियमित कॅलिब्रेशनमुळे मशीन डाउनटाइम ४०% पर्यंत कमी होतो.' : 'Verifying mechanical alignment and tool calibration before engagement prevents thermal stress.'
        };
        return {
            explanation_json: json,
            explanation_markdown: jsonToMarkdown(json, lang),
            key_takeaways: json.steps.slice(0, 3),
            safety_knacks: json.safety
        };
    }

    if (perspective === 'msme') {
        const json = {
            overview: isIndic
                ? `${cleanText(pc.machine_name) || 'व्यावसायिक उपकरण'} द्वारे उत्पादकता आणि बॅच गुणवत्ता वाढवली जाते.`
                : `${cleanText(pc.machine_name) || 'Commercial Precision Workstation'} optimizes batch throughput and shopfloor quality.`,
            steps: [
                isIndic ? 'सकाळच्या शिफ्टमध्ये उपकरणाचे व्हिज्युअल प्री-चेक आणि लुब्रिकेशन करा.' : 'Complete pre-operational visual inspection and fluid lubrication.',
                isIndic ? 'कच्चा माल लोड करून अचूक बॅच सायकल चालवा.' : 'Load certified input stock and run calibrated batch cycle.',
                isIndic ? 'दर तासाला आउटपुट आणि पॉवर वापरावर लक्ष ठेवा.' : 'Monitor hourly unit throughput and verify cycle-time metrics.',
                isIndic ? 'शिफ्ट संपल्यावर टूल्स स्वच्छ करून सुरक्षित ठेवा.' : 'Clean and lock out apparatus at shift completion.'
            ],
            safety: [
                isIndic ? 'समर्पित अर्थिंग (< २.० ओहम) आणि व्होल्टेज स्टॅबिलायझर सुनिश्चित करा.' : 'Ensure dedicated equipment earth pit (< 2.0 Ohm) and stabilizer.',
                isIndic ? 'चालू मशीनमध्ये कधीही अंतर्गत भाग बदलू नका.' : 'Never attempt internal part adjustments while drive motor is active.'
            ],
            pro_tip: isIndic ? 'नियमित प्रतिबंधात्मक देखभालीमुळे उपकरणाचे आयुष्य दुप्पट होते.' : 'Preventive maintenance schedules protect machine uptime and guarantee continuous batch quality.'
        };
        return {
            explanation_json: json,
            explanation_markdown: jsonToMarkdown(json, lang),
            key_takeaways: json.steps.slice(0, 3),
            safety_knacks: json.safety
        };
    }

    // Default 'skill'
    const json = {
        overview: isIndic
            ? `${sector} उद्योगात "${cleanText(pc.pc_description)}" हे एक अत्यंत महत्त्वाचे मूलभूत प्रात्यक्षिक कौशल्य आहे.`
            : `In the ${sector} sector, mastering "${cleanText(pc.pc_description)}" is fundamental to becoming an industry-ready technician.`,
        steps: [
            isIndic ? 'कामाची योजना करा आणि आवश्यक टूल्स व साधने गोळा करा.' : 'Prepare the workstation and inspect all required tooling and instruments.',
            isIndic ? 'मानक SOP चे पालन करून काळजीपूर्वक प्रात्यक्षिक सुरू करा.' : 'Execute the primary sequence systematically following occupational guidelines.',
            isIndic ? 'प्रत्येक टप्प्यावर अचूकता आणि भौतिक मापांची तपासणी करा.' : 'Validate physical tolerances at intermediate stages to eliminate rework.',
            isIndic ? 'अंतिम तपासणी पूर्ण करून वर्कस्टेशन स्वच्छ ठेवा.' : 'Complete the final quality audit and clean the work zone.'
        ],
        safety: [
            isIndic ? 'काम करताना सुरक्षा नियमांचे पालन करा आणि निर्धारित PPE वापरा.' : 'Avoid skipping calibration checks prior to live operations.',
            isIndic ? 'उपकरणात थोडाही बिघाड दिसल्यास तातडीने सुधारणा करा.' : 'Maintain personal protective equipment (PPE) compliance at all times.'
        ],
        pro_tip: isIndic ? 'योग्य ग्रिप आणि नियमित सरावामुळे कामाचा वेग व अचूकता ३०% ने वाढते.' : 'Proper hand posture and steady tool grip reduce operator fatigue and increase accuracy by over 30%.'
    };
    return {
        explanation_json: json,
        explanation_markdown: jsonToMarkdown(json, lang),
        key_takeaways: json.steps.slice(0, 3),
        safety_knacks: json.safety
    };
}

/**
 * Call Sarvam AI API with fast JSON response parsing
 */
async function callSarvamExplainer(prompt, lang) {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) return null;

    const models = ['sarvam-105b-conversations', 'sarvam-105b'];

    for (const model of models) {
        try {
            const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': apiKey.trim()
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.2,
                    max_tokens: 500
                }),
                signal: AbortSignal.timeout(18000)
            });

            if (res.ok) {
                const data = await res.json();
                const choice = data.choices?.[0];
                let raw = choice?.message?.content;
                
                if (!raw && choice?.message?.reasoning_content) {
                    const reasoning = choice.message.reasoning_content;
                    const match = reasoning.match(/\{[\s\S]+\}/);
                    if (match) raw = match[0];
                }

                if (raw && raw.trim().length > 30) {
                    // Strip markdown wrapping ```json ... ``` if present
                    const cleanJsonStr = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
                    try {
                        const parsed = JSON.parse(cleanJsonStr);
                        if (parsed && (parsed.overview || parsed.steps)) {
                            return {
                                json: parsed,
                                markdown: jsonToMarkdown(parsed, lang)
                            };
                        }
                    } catch (pErr) {
                        // If JSON parse failed, return raw markdown
                        return {
                            json: null,
                            markdown: raw.trim()
                        };
                    }
                }
            }
        } catch (err) {
            console.warn(`[AI Explainer] Sarvam ${model} error: ${err.message}`);
        }
    }

    return null;
}

// ── GET & POST /api/ai/explain ───────────────────────────────────────────────
async function handleExplainRequest(req, res) {
    const pcId        = parseInt(req.body?.pc_id || req.query?.pc_id);
    const perspective = String(req.body?.perspective || req.query?.perspective || 'skill').toLowerCase().trim();
    const lang        = String(req.body?.lang || req.query?.lang || 'en').toLowerCase().trim();

    if (!pcId || isNaN(pcId)) {
        return res.status(400).json({ success: false, error: 'Missing or invalid pc_id parameter' });
    }

    const langConfig = LANGUAGE_CONFIG[lang] || LANGUAGE_CONFIG.en;
    const validPerspective = ['skill', 'sop', 'msme'].includes(perspective) ? perspective : 'skill';

    try {
        // 1. Check PostgreSQL Cache (0ms latency, 0 API cost)
        const cacheRes = await db.pool.query(
            `SELECT * FROM pc_explanations_cache WHERE pc_id = $1 AND perspective = $2 AND lang = $3`,
            [pcId, validPerspective, lang]
        );

        if (cacheRes.rows && cacheRes.rows.length > 0) {
            const cached = cacheRes.rows[0];
            return res.json({
                success: true,
                is_cached: true,
                pc_id: pcId,
                perspective: validPerspective,
                lang: lang,
                lang_name: langConfig.name,
                explanation_markdown: cached.explanation_markdown,
                key_takeaways: cached.key_takeaways || [],
                safety_knacks: cached.safety_knacks || [],
                model_used: cached.model_used,
                created_at: cached.created_at
            });
        }

        // 2. Fetch rich contextual PC details from relational database
        const pcRes = await db.pool.query(`
            SELECT 
                p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description, p.pc_intent,
                p.sop_action_directive, p.sop_parameter_tolerance, p.sop_critical_knack,
                p.machine_name, p.machine_spec, p.machine_capex_cost_inr,
                q.qp_name, q.sector,
                n.nos_title,
                m.module_title
            FROM nsqf_pcs p
            JOIN nsqf_qps q ON p.qp_code = q.qp_code
            LEFT JOIN nsqf_nos n ON p.qp_code = n.qp_code AND p.nos_code = n.nos_code
            LEFT JOIN nsqf_modules m ON p.module_id = m.id
            WHERE p.id = $1
            LIMIT 1;
        `, [pcId]);

        if (!pcRes.rows || pcRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: `PC record with ID ${pcId} not found.` });
        }

        const pc = pcRes.rows[0];

        // 3. Generate explanation (Sarvam AI JSON Mode with deterministic fallback)
        const prompt = buildExplanationPrompt(pc, validPerspective, langConfig);
        const sarvamResult = await callSarvamExplainer(prompt, lang);
        let explanationMarkdown = '';
        let explanationJson = null;
        let modelUsed = 'sarvam-105b-conversations';

        let takeaways = [];
        let safetyKnacks = [];

        if (sarvamResult && sarvamResult.markdown) {
            explanationMarkdown = sarvamResult.markdown;
            explanationJson = sarvamResult.json;
            if (sarvamResult.json) {
                takeaways = sarvamResult.json.steps || [];
                safetyKnacks = sarvamResult.json.safety || [];
            }
        } else {
            const fallback = buildDeterministicFallback(pc, validPerspective, lang);
            explanationMarkdown = fallback.explanation_markdown;
            explanationJson = fallback.explanation_json;
            takeaways = fallback.key_takeaways;
            safetyKnacks = fallback.safety_knacks;
            modelUsed = 'haya-deterministic-v2';
        }

        // 4. Save to PostgreSQL Cache (Write-Through)
        try {
            await db.pool.query(`
                INSERT INTO pc_explanations_cache 
                    (pc_id, perspective, lang, explanation_markdown, key_takeaways, safety_knacks, model_used)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (pc_id, perspective, lang) DO UPDATE SET
                    explanation_markdown = EXCLUDED.explanation_markdown,
                    key_takeaways = EXCLUDED.key_takeaways,
                    safety_knacks = EXCLUDED.safety_knacks,
                    model_used = EXCLUDED.model_used,
                    created_at = NOW();
            `, [pcId, validPerspective, lang, explanationMarkdown, JSON.stringify(takeaways), JSON.stringify(safetyKnacks), modelUsed]);
        } catch (dbErr) {
            console.warn(`[AI Explainer] Cache insert warning: ${dbErr.message}`);
        }

        // 5. Return result
        return res.json({
            success: true,
            is_cached: false,
            pc_id: pcId,
            perspective: validPerspective,
            lang: lang,
            lang_name: langConfig.name,
            explanation_json: explanationJson,
            explanation_markdown: explanationMarkdown,
            key_takeaways: takeaways,
            safety_knacks: safetyKnacks,
            model_used: modelUsed,
            created_at: new Date().toISOString()
        });

    } catch (err) {
        console.error(`[AI Explainer] Route error:`, err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

router.post('/explain', handleExplainRequest);
router.get('/explain', handleExplainRequest);

// Return list of supported languages
router.get('/languages', (req, res) => {
    res.json({ success: true, languages: LANGUAGE_CONFIG });
});

module.exports = router;
