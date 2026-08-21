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

    let perspectiveDirectives = '';
    if (perspective === 'sop') {
        perspectiveDirectives = `
Perspective: INDUSTRIAL PLANT WORKSTATION STANDARD OPERATING PROCEDURE (SOP)
- Context: Factory shop-floor standard work instruction for plant technicians.
- Action Directive: "${cleanText(pc.sop_action_directive) || sanitizedDesc}"
- Engineering Tolerance: "${cleanText(pc.sop_parameter_tolerance) || 'Strict nominal tolerances'}"
- Critical Safety Knack: "${cleanText(pc.sop_critical_knack) || 'Zero-energy state & PPE adherence'}"
- Tone: Crisp, compliant, safety-first, procedural.
`;
    } else if (perspective === 'msme') {
        perspectiveDirectives = `
Perspective: MSME TURNKEY COMMERCIAL SETUP & MACHINERY BOM
- Context: Small enterprise owner / commercial workshop operator setting up operations.
- Commercial Machine: "${cleanText(pc.machine_name) || 'Industrial Calibrated Workstation'}"
- Equipment Spec: "${cleanText(pc.machine_spec) || 'Commercial grade 220V/440V unit'}"
- Estimated CAPEX: "₹${pc.machine_capex_cost_inr || '35,000'}"
- Tone: Business-oriented, equipment operation, maintenance, batch throughput.
`;
    } else {
        perspectiveDirectives = `
Perspective: VOCATIONAL SKILL MASTERCLASS (INTERN / APPRENTICE)
- Context: Practical training demonstration for vocational students and apprentices.
- Task Description: "${sanitizedDesc}"
- Standard Action Intent: "${sanitizedIntent}"
- Tone: Pedagogical, encouraging, hands-on, step-by-step.
`;
    }

    return `You are a Senior Vocational Master Craftsman and Technical Curriculum Specialist in India.

Explain the following practical vocational task in 200 to 280 words in ${langName} language (${scriptName} script):

- Sector: "${pc.sector || 'Technical Vocational'}"
- Qualification Pack: "${sanitizedQp}"
- Occupational Standard (NOS): "${sanitizedNos || 'Core Occupational Task'}"
- Workstation Module: "${sanitizedModule || 'Workstation Execution'}"
${perspectiveDirectives}

Structure your response clearly with clean Markdown (DO NOT use emojis or icons):
### 1. Technical Overview
(1-2 paragraphs explaining why this task is crucial and the core mechanism)

### 2. Practical Execution Sequence
(3-4 concise numbered bullet steps)

### 3. Critical Safety & Quality Rules
(2 bullet points on common mistakes & tolerances)

### 4. Master Craftsman Pro Tip
(1 insider tip for flawless execution)

IMPORTANT: Write naturally and fluently in ${langName} (${scriptName} script). Do NOT include any emojis or icon characters in the output. Output raw markdown only.`;
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
        return {
            explanation_markdown: isIndic
                ? `### मानक संचालन प्रक्रिया (SOP): ${title}\n\n### 1. प्रक्रिया का उद्देश्य\nयह कार्य इकाई ${sector} क्षेत्र के सुरक्षा मानकों और गुणवत्ता दिशानिर्देशों के तहत निष्पादित की जाती है। ${nosTitle} के तहत सभी ऑपरेटरों को कार्य शुरू करने से पहले उपकरण और वर्कपीस की जांच करनी चाहिए।\n\n### 2. चरण-दर-चरण कार्य विधि\n1. कार्यस्थल पर आवश्यक टूल्स, वर्कपीस और सुरक्षा उपकरणों (PPE) को व्यवस्थित करें।\n2. ${cleanText(pc.sop_action_directive) || cleanText(pc.pc_description)} के अनुसार प्रारंभिक सेटिंग्स की पुष्टि करें।\n3. टॉलरेंस सीमा: **${cleanText(pc.sop_parameter_tolerance) || 'निर्दिष्ट इंजीनियरिंग मानकों के भीतर'}** का कड़ाई से पालन करें।\n4. कार्य पूरा होने पर गुणवत्ता चेकलिस्ट सत्यापित कर लॉग बुक में दर्ज करें।\n\n### 3. सुरक्षा एवं गुणवत्ता नियंत्रण\n- ${cleanText(pc.sop_critical_knack) || 'कार्य के दौरान उचित सुरक्षात्मक गियर पहनें और शून्य-ऊर्जा स्थिति बनाए रखें।'}\n- गैर-अनुरूपता पाए जाने पर कार्य तुरंत रोकें और लाइन सुपरवाइजर को सूचित करें।\n\n### 4. उस्ताद की सीख\nसटीक माप और नियमित कैलिब्रेशन से मशीन डाउनटाइम और स्क्रैप दर में उल्लेखनीय कमी आती है।`
                : `### Standard Operating Procedure (SOP): ${title}\n\n### 1. Procedural Objective\nThis workstation task is executed strictly in compliance with ${sector} industrial safety codes and quality rubrics under ${nosTitle}. Prior to execution, verify all safety interlocks and calibration parameters.\n\n### 2. Step-by-Step Execution Sequence\n1. Stage the workstation with certified tooling, clean workpieces, and dielectric PPE.\n2. Execute action sequence: "${cleanText(pc.sop_action_directive) || cleanText(pc.pc_description)}".\n3. Maintain nominal operating tolerance: **${cleanText(pc.sop_parameter_tolerance) || 'Standard nominal limits'}**.\n4. Complete final dimensional/functional verification and update plant log.\n\n### 3. Safety & Quality Controls\n- ${cleanText(pc.sop_critical_knack) || 'Maintain zero-energy state verification prior to terminal contact.'}\n- Quarantine non-conforming items immediately to prevent downstream defects.\n\n### 4. Master Pro-Tip\nVerifying mechanical alignment and tool calibration before engagement prevents thermal stress and micro-fractures.`,
            key_takeaways: [
                `Tolerance: ${pc.sop_parameter_tolerance || 'Standard nominal limits'}`,
                `Action: ${pc.sop_action_directive || pc.pc_description}`,
                `Safety: ${pc.sop_critical_knack || 'Adhere to statutory plant safety codes'}`
            ],
            safety_knacks: [pc.sop_critical_knack || 'Zero-energy lock-out tag-out (LOTO) mandatory']
        };
    }

    if (perspective === 'msme') {
        return {
            explanation_markdown: isIndic
                ? `### MSME मशीनरी एवं व्यवसाय गाइड: ${cleanText(pc.machine_name) || 'व्यावसायिक उपकरण'}\n\n### 1. उपकरण का विवरण एवं लागत\n- **मशीन का नाम:** ${cleanText(pc.machine_name) || 'औद्योगिक वर्कस्टेशन'}\n- **विनिर्देश (Spec):** ${cleanText(pc.machine_spec) || 'कमर्शियल 220V/440V सेटअप'}\n- **अनुमानित पूंजी निवेश (CAPEX):** ₹${pc.machine_capex_cost_inr || '35,000'}\n\n### 2. दैनिक उत्पादन चक्र\n1. सुबह की शिफ्ट में ऑपरेटर मशीन का प्री-चेक और लुब्रिकेशन पूरा करें।\n2. कच्चा माल लोड करें और स्पेसिफिकेशन के अनुसार बैच रन शुरू करें।\n3. प्रति घंटे आउटपुट और पावर खपत की निगरानी रखें।\n4. शिफ्ट समाप्त होने पर टूल्स को साफ कर सुरक्षा लॉक लगाएं।\n\n### 3. बैंक एवं मुद्रा लोन योजना\nयह उपकरण PMEGP और Mudra लोन सब्सिडी के अंतर्गत 100% बैंक योग्य प्रोजेक्ट प्रोफाइल के अनुकूल है।\n\n### 4. उस्ताद की सीख\nनियमित निवारक रखरखाव से उपकरण की आयु दोगुनी हो जाती है।`
                : `### MSME Machine & Commercial Blueprint: ${cleanText(pc.machine_name) || 'Commercial Apparatus'}\n\n### 1. Equipment & CAPEX Profile\n- **Machinery Name:** ${cleanText(pc.machine_name) || 'Commercial Precision Workstation'}\n- **Specification:** ${cleanText(pc.machine_spec) || 'Industrial 220V/440V Calibrated Apparatus'}\n- **Estimated Capital Outlay (CAPEX):** ₹${pc.machine_capex_cost_inr || '35,000'}\n\n### 2. Daily Production Workflow\n1. Complete pre-operational visual inspection and fluid lubrication.\n2. Calibrate tooling and execute primary batch processing.\n3. Verify unit throughput and record cycle-time metrics.\n4. Clean and secure equipment at shift completion.\n\n### 3. Bankable Feasibility\nThis capital equipment is fully eligible for PMEGP and Mudra MSME credit guarantee support.\n\n### 4. Master Pro-Tip\nPreventive maintenance schedules protect machine uptime and guarantee continuous batch quality.`,
            key_takeaways: [
                `Machine: ${pc.machine_name || 'Commercial Precision Workstation'}`,
                `CAPEX: ₹${pc.machine_capex_cost_inr || '35,000'}`,
                `Spec: ${pc.machine_spec || 'Industrial Calibrated Apparatus'}`
            ],
            safety_knacks: ['Ensure dedicated earth pit (< 2.0 Ohm) and voltage stabilizer']
        };
    }

    // Default 'skill'
    return {
        explanation_markdown: isIndic
            ? `### वोकेशनल मास्टरक्लास: ${title}\n\n### 1. व्यावहारिक सिद्धांत\n${sector} उद्योग में "${cleanText(pc.pc_description)}" एक महत्वपूर्ण बुनियादी कौशल है। ${nosTitle} के अंतर्गत सही तकनीक से कार्य करने पर उत्पादकता और सटीकता दोनों में सुधार होता है।\n\n### 2. चरण-दर-चरण कार्य विधि\n1. कार्य की योजना बनाएं और आवश्यक टूल्स एवं सामग्री एकत्रित करें।\n2. मानक कार्यविधि (SOP) का पालन करते हुए कार्य को सावधानीपूर्वक शुरू करें।\n3. हर चरण पर सटीकता और भौतिक माप की जांच करें।\n4. अंतिम परिणाम का निरीक्षण करें और अपने वर्कस्टेशन को स्वच्छ रखें।\n\n### 3. गुणवत्ता एवं सावधानियां\n- काम करते समय सुरक्षा नियमों का पालन करें और निर्धारित PPE पहनें।\n- किसी भी उपकरण या पार्ट में विचलन दिखने पर तुरंत सुधार करें।\n\n### 4. उस्ताद की सीख\nनियमित अभ्यास और बुनियादी टूल्स की सही समझ ही एक कुशल कारीगर की पहचान है।`
            : `### Vocational Skill Masterclass: ${title}\n\n### 1. Technical Overview & Core Principle\nIn the ${sector} sector, mastering "${cleanText(pc.pc_description)}" is fundamental to becoming an industry-ready technician. Adhering to ${nosTitle} standards ensures operational safety and tactile proficiency.\n\n### 2. Step-by-Step Practical Sequence\n1. Prepare the workstation and inspect all required tooling and instruments.\n2. Execute the primary sequence systematically following occupational guidelines.\n3. Validate physical tolerances at intermediate stages to eliminate rework.\n4. Complete the final quality audit and clean the work zone.\n\n### 3. Quality Rules & Common Pitfalls\n- Avoid skipping calibration checks prior to live operations.\n- Maintain personal protective equipment (PPE) compliance at all times.\n\n### 4. Master Craftsman Pro-Tip\nProper hand posture and steady tool grip reduce operator fatigue and increase accuracy by over 30%.`,
        key_takeaways: [
            `Core Focus: ${pc.pc_intent || pc.pc_description}`,
            `Sector: ${pc.sector || 'Vocational Training'}`,
            `Role: ${pc.qp_name || 'Certified Specialist'}`
        ],
        safety_knacks: ['Always follow safety protocols and wear prescribed PPE']
    };
}

/**
 * Call Sarvam AI API
 */
async function callSarvamExplainer(prompt) {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) return null;

    // Try fast conversational model first, fallback to base 105b
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
                    max_tokens: 1500
                }),
                signal: AbortSignal.timeout(25000)
            });

            if (res.ok) {
                const data = await res.json();
                const choice = data.choices?.[0];
                let text = choice?.message?.content;
                
                if (!text && choice?.message?.reasoning_content) {
                    const reasoning = choice.message.reasoning_content;
                    const match = reasoning.match(/###[\s\S]+/);
                    if (match) text = match[0];
                }

                if (text && text.trim().length > 50) {
                    return text.trim();
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

        // 3. Generate explanation (Sarvam AI with deterministic fallback)
        const prompt = buildExplanationPrompt(pc, validPerspective, langConfig);
        let explanationMarkdown = await callSarvamExplainer(prompt);
        let modelUsed = 'sarvam-105b';

        let takeaways = [];
        let safetyKnacks = [];

        if (!explanationMarkdown) {
            const fallback = buildDeterministicFallback(pc, validPerspective, lang);
            explanationMarkdown = fallback.explanation_markdown;
            takeaways = fallback.key_takeaways;
            safetyKnacks = fallback.safety_knacks;
            modelUsed = 'haya-deterministic-v2';
        } else {
            // Extract bullets from markdown if present
            const bullets = explanationMarkdown.match(/[-*]\s+([^\n]+)/g);
            if (bullets) {
                takeaways = bullets.slice(0, 3).map(b => b.replace(/^[-*]\s+/, '').trim());
            }
            safetyKnacks = [pc.sop_critical_knack || 'Follow statutory plant safety codes'];
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
