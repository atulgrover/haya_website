'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

// Seed initial custom enterprise skills if custom_skills table is empty
async function seedCustomSkillsIfEmpty() {
    try {
        const countRow = await db.prepare(`SELECT COUNT(*) as count FROM custom_skills`).get();
        if (countRow && countRow.count === 0) {
            const seedSkills = [
                {
                    title: 'Accounting & GST Filing Workflow',
                    company_id: 'acme_corp',
                    employee_email_id: 'sarah.accounting@acme.com',
                    schema_json: JSON.stringify({
                        title: 'Accounting & GST Filing Workflow',
                        tag: 'Accounting',
                        description: '11-step complete guide for corporate GST reconciliation and e-way bill generation.',
                        reels: [
                            { step: 1, title: 'GST Ledger Verification', videoId: 'dQw4w9WgXcQ' },
                            { step: 2, title: 'Input Tax Credit Audit', videoId: 'dQw4w9WgXcQ' }
                        ]
                    })
                },
                {
                    title: 'Automotive Electric Vehicle Battery Assembly',
                    company_id: 'tesla_motors',
                    employee_email_id: 'alex.engineer@evtech.com',
                    schema_json: JSON.stringify({
                        title: 'Automotive Electric Vehicle Battery Assembly',
                        tag: 'Automotive Assembly',
                        description: 'High-voltage EV pack wiring and thermal management safety protocols.',
                        reels: [
                            { step: 1, title: 'BMS Calibration', videoId: 'dQw4w9WgXcQ' }
                        ]
                    })
                },
                {
                    title: 'Blockchain Smart Contract Auditing',
                    company_id: 'web3_labs',
                    employee_email_id: 'crypto.lead@web3labs.io',
                    schema_json: JSON.stringify({
                        title: 'Blockchain Smart Contract Auditing',
                        tag: 'Blockchain',
                        description: 'Reentrancy vulnerability linting and Gas optimization for ERC-20 tokens.',
                        reels: [
                            { step: 1, title: 'Static Analysis with Slither', videoId: 'dQw4w9WgXcQ' }
                        ]
                    })
                },
                {
                    title: 'Customer Service Escalation & Conflict Resolution',
                    company_id: 'global_support',
                    employee_email_id: 'maria.support@helpdesk.com',
                    schema_json: JSON.stringify({
                        title: 'Customer Service Escalation Protocol',
                        tag: 'Customer Service',
                        description: 'SLA tracking and Tier-3 ticket escalation procedures for enterprise client accounts.',
                        reels: [
                            { step: 1, title: 'De-escalation Communication', videoId: 'dQw4w9WgXcQ' }
                        ]
                    })
                },
                {
                    title: 'Drone Payload Calibration & Flight Safety',
                    company_id: 'aero_drones',
                    employee_email_id: 'flight.ops@aerodrones.in',
                    schema_json: JSON.stringify({
                        title: 'Drone Payload Calibration',
                        tag: 'Drone Maintenance',
                        description: 'LiDAR sensor alignment and DGCA airspace flight clearance checklist.',
                        reels: [
                            { step: 1, title: 'Pre-flight Telemetry Checks', videoId: 'dQw4w9WgXcQ' }
                        ]
                    })
                },
                {
                    title: 'Fire Safety & Industrial Emergency Evacuation',
                    company_id: 'safety_first',
                    employee_email_id: 'hse.officer@safetycorp.org',
                    schema_json: JSON.stringify({
                        title: 'Industrial Emergency Evacuation',
                        tag: 'Fire Safety',
                        description: 'Hazmat response, CO2 extinguisher operation, and emergency assembly point drills.',
                        reels: [
                            { step: 1, title: 'Alarm Activation Protocols', videoId: 'dQw4w9WgXcQ' }
                        ]
                    })
                }
            ];

            for (const s of seedSkills) {
                await db.prepare(`
                    INSERT INTO custom_skills (title, company_id, employee_email_id, schema_json)
                    VALUES (?, ?, ?, ?)
                `).run(s.title, s.company_id, s.employee_email_id, s.schema_json);
            }
            console.log('[Haya Portal DB] Seeded initial custom skills.');
        }
    } catch (e) {
        console.error('[Haya Portal DB] Seeding error:', e.message);
    }
}
seedCustomSkillsIfEmpty();

// GET /api/skillpedia/custom/keywords
// Returns consolidated, deduplicated alphabetical A-Z list of keywords with skill counts
router.get('/custom/keywords', async (req, res) => {
    try {
        const skills = await db.prepare(`SELECT schema_json, title FROM custom_skills`).all();
        const tagCounts = {};

        skills.forEach(s => {
            let tag = 'General';
            try {
                const schema = JSON.parse(s.schema_json);
                if (schema.tag) tag = schema.tag.trim();
                else {
                    const firstWord = s.title.split(' ')[0];
                    if (firstWord) tag = firstWord;
                }
            } catch (e) {
                const firstWord = s.title.split(' ')[0];
                if (firstWord) tag = firstWord;
            }
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        const sortedTags = Object.keys(tagCounts).sort((a, b) => a.localeCompare(b)).map(tag => ({
            tag,
            count: tagCounts[tag],
            firstLetter: tag.charAt(0).toUpperCase()
        }));

        res.json({
            success: true,
            totalKeywords: sortedTags.length,
            keywords: sortedTags
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/custom/all-skills
// Returns custom skill cards filtered by q, tag, letter, email, or skillId
router.get('/custom/all-skills', async (req, res) => {
    try {
        const { q, tag, letter, email, skillId } = req.query;
        let sql = `SELECT * FROM custom_skills WHERE 1=1`;
        const args = [];

        if (skillId) {
            sql += ` AND id = ?`;
            args.push(skillId);
        }
        if (email) {
            sql += ` AND employee_email_id = ?`;
            args.push(email.trim().toLowerCase());
        }
        if (q) {
            sql += ` AND (title LIKE ? OR employee_email_id LIKE ? OR schema_json LIKE ?)`;
            const term = `%${q.trim()}%`;
            args.push(term, term, term);
        }

        sql += ` ORDER BY id DESC`;
        const rows = await db.prepare(sql).all(...args);

        let parsedSkills = rows.map(s => {
            let schema = {};
            try { schema = JSON.parse(s.schema_json); } catch (e) {}
            // Normalise lessons — support both new (schema.lessons[]) and old (schema.reels[]) formats
            const lessons = Array.isArray(schema.lessons) ? schema.lessons
                          : Array.isArray(schema.reels)   ? schema.reels.map((r, i) => ({
                                id: `les_${i+1}`, reel_index: i+1,
                                nos_code: `CUST/N010${i+1}`, title: r.title || `Step ${i+1}`,
                                subtitle: r.title || `Step ${i+1}`, video_id: r.videoId || '',
                                video_platform: 'youtube', pcs: []
                            }))
                          : [];
            return {
                id: s.id,
                title: s.title,
                company_id: s.company_id || 'N/A',
                employee_email_id: s.employee_email_id,
                created_at: s.created_at,
                tag: schema.tag || s.title.split(' ')[0] || 'General',
                description: schema.description || 'Enterprise SOP micro-learning reel and operational workflow.',
                lessons,
                schema
            };
        });

        if (tag) {
            parsedSkills = parsedSkills.filter(s => s.tag.toLowerCase() === tag.trim().toLowerCase());
        }
        if (letter) {
            parsedSkills = parsedSkills.filter(s => s.tag.toUpperCase().startsWith(letter.trim().toUpperCase()));
        }

        res.json({
            success: true,
            count: parsedSkills.length,
            skills: parsedSkills
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/qps/sectors
router.get('/qps/sectors', async (req, res) => {
    try {
        const rows = await db.prepare(`SELECT DISTINCT sector FROM nsqf_qps WHERE sector != '' ORDER BY sector ASC`).all();
        const sectors = rows.map(r => r.sector);
        res.json({ success: true, count: sectors.length, sectors });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/qps/subsectors
router.get('/qps/subsectors', async (req, res) => {
    try {
        const { sector } = req.query;
        let sql = `SELECT DISTINCT sub_sector FROM nsqf_qps WHERE sub_sector != ''`;
        const args = [];
        if (sector) {
            sql += ` AND sector = ?`;
            args.push(sector);
        }
        sql += ` ORDER BY sub_sector ASC`;

        const rows = await db.prepare(sql).all(...args);
        const subsectors = rows.map(r => r.sub_sector);
        res.json({ success: true, count: subsectors.length, subsectors });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/qps/occupations
router.get('/qps/occupations', async (req, res) => {
    try {
        const { sector, subsector } = req.query;
        let sql = `SELECT DISTINCT occupation FROM nsqf_qps WHERE occupation != ''`;
        const args = [];
        if (sector) {
            sql += ` AND sector = ?`;
            args.push(sector);
        }
        if (subsector) {
            sql += ` AND sub_sector = ?`;
            args.push(subsector);
        }
        sql += ` ORDER BY occupation ASC`;

        const rows = await db.prepare(sql).all(...args);
        const occupations = rows.map(r => r.occupation);
        res.json({ success: true, count: occupations.length, occupations });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/qps/jobroles
router.get('/qps/jobroles', async (req, res) => {
    try {
        const { sector, subsector, occupation } = req.query;
        let sql = `SELECT DISTINCT qp_name FROM nsqf_qps WHERE qp_name != ''`;
        const args = [];
        if (sector) {
            sql += ` AND sector = ?`;
            args.push(sector);
        }
        if (subsector) {
            sql += ` AND sub_sector = ?`;
            args.push(subsector);
        }
        if (occupation) {
            sql += ` AND occupation = ?`;
            args.push(occupation);
        }
        sql += ` ORDER BY qp_name ASC`;

        const rows = await db.prepare(sql).all(...args);
        const jobroles = rows.map(r => r.qp_name);
        res.json({ success: true, count: jobroles.length, jobroles });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/qps/cards
router.get('/qps/cards', async (req, res) => {
    try {
        const { q, sector, subsector, occupation, jobrole, limit } = req.query;
        let baseSql = `FROM nsqf_qps WHERE 1=1`;
        const args = [];

        if (q) {
            baseSql += ` AND (qp_name LIKE ? OR qp_code LIKE ? OR sector LIKE ? OR occupation LIKE ? OR min_education_exp LIKE ?)`;
            const term = `%${q.trim()}%`;
            args.push(term, term, term, term, term);
        }
        if (sector) {
            baseSql += ` AND sector = ?`;
            args.push(sector);
        }
        if (subsector) {
            baseSql += ` AND sub_sector = ?`;
            args.push(subsector);
        }
        if (occupation) {
            baseSql += ` AND occupation = ?`;
            args.push(occupation);
        }
        if (jobrole) {
            baseSql += ` AND qp_name = ?`;
            args.push(jobrole);
        }

        // Get total matching count (distinct QPs)
        const countRow = await db.prepare(`SELECT COUNT(DISTINCT qp_code) as total ${baseSql}`).get(...args);
        const matchCount = countRow ? countRow.total : 0;

        // Get overall database count (distinct QPs)
        const dbCountRow = await db.prepare(`SELECT COUNT(DISTINCT qp_code) as total FROM nsqf_qps`).get();
        const totalDatabaseCount = dbCountRow ? dbCountRow.total : 2176;

        const maxLimit = limit ? parseInt(limit) : 60;
        const isPostgres = !!process.env.DATABASE_URL;
        const querySql = isPostgres 
            ? `SELECT DISTINCT ON (qp_code) * ${baseSql} ORDER BY qp_code, id ASC LIMIT ${maxLimit}`
            : `SELECT * ${baseSql} GROUP BY qp_code ORDER BY id ASC LIMIT ${maxLimit}`;

        const cards = await db.prepare(querySql).all(...args);
        res.json({
            success: true,
            totalDatabaseCount,
            matchCount,
            count: cards.length,
            hasFiltered: !!(q || sector || subsector || occupation || jobrole),
            cards
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/nsqf/curriculum — fetch parsed NOS modules & Performance Criteria (PC) for student player
router.get('/nsqf/curriculum', async (req, res) => {
    try {
        let rawCode = req.query.qp || req.query.qpCode || '';
        if (rawCode.startsWith('/')) rawCode = rawCode.substring(1);
        const qpCode = decodeURIComponent(rawCode).trim().replace(/_/g, '/');
        const cleanQp = qpCode.replace(/\//g, '_');

        // Fetch QP metadata
        const qpRow = await db.prepare(`SELECT * FROM nsqf_qps WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?`).get(qpCode, cleanQp);
        const qpName = qpRow ? qpRow.qp_name : `Qualification Pack ${qpCode || 'Skill'}`;
        const sector = qpRow ? qpRow.sector : 'Vocational Training';

        // 1. Query relational 5-table schema (nsqf_pcs + nsqf_nos + nsqf_modules)
        const pcRows = await db.prepare(`
            SELECT 
                p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_description, p.pc_intent, p.pc_intent_hi,
                p.video_id, p.video_title, p.video_url, p.channel_title, p.duration_seconds,
                p.start_seconds, p.end_seconds, p.study_takeaways_json, p.viva_quiz_json,
                p.video_id_hi, p.video_title_hi, p.video_url_hi, p.channel_title_hi, p.duration_seconds_hi,
                p.contextual_search_query, p.contextual_search_query_hi, p.audit_score,
                p.sop_intent, p.sop_intent_hi, p.sop_search_query, p.sop_action_directive,
                p.sop_parameter_tolerance, p.sop_critical_knack, p.sop_video_url,
                p.dpr_intent, p.dpr_intent_hi, p.dpr_search_query, p.machine_name,
                p.machine_spec, p.machine_capex_cost_inr, p.machine_power_kw, p.dpr_video_url,
                COALESCE(n.nos_title, 'Occupational Standards') as nos_title,
                COALESCE(m.module_title, 'Module') as module_title
            FROM nsqf_pcs p
            LEFT JOIN nsqf_nos n ON p.qp_code = n.qp_code AND p.nos_code = n.nos_code
            LEFT JOIN nsqf_modules m ON p.qp_code = m.qp_code AND p.nos_code = m.nos_code
            WHERE p.qp_code = ? OR REPLACE(p.qp_code, '/', '_') = ?
            ORDER BY p.id ASC
        `).all(qpCode, cleanQp);

        if (Array.isArray(pcRows) && pcRows.length > 0) {
            // Helper to extract numeric order from PC code / intent / module title
            const getPcNum = (code, text) => {
                const m1 = (code || '').match(/\d+/);
                if (m1) return parseInt(m1[0]);
                const m2 = (text || '').match(/(?:pc|module)\s*(\d+)/i);
                if (m2) return parseInt(m2[1]);
                return 999;
            };

            // Sort pcRows in natural numeric order so PC1, PC2... always come first
            pcRows.sort((a, b) => getPcNum(a.pc_code, a.pc_intent) - getPcNum(b.pc_code, b.pc_intent));

            // Group PC rows into NOS modules
            const moduleMap = {};
            pcRows.forEach(row => {
                const key = `${row.nos_code}_${row.module_title}`;
                if (!moduleMap[key]) {
                    moduleMap[key] = {
                        nos_code: row.nos_code,
                        nos_title: row.nos_title,
                        module_title: row.module_title,
                        min_pc_num: getPcNum(row.pc_code, row.pc_intent),
                        video_id: row.video_id || null,
                        pcs: []
                    };
                }

                let takeaways = row.study_takeaways_json;
                if (typeof takeaways === 'string') {
                    try { takeaways = JSON.parse(takeaways); } catch (_) { takeaways = null; }
                }
                let vivaQuiz = row.viva_quiz_json;
                if (typeof vivaQuiz === 'string') {
                    try { vivaQuiz = JSON.parse(vivaQuiz); } catch (_) { vivaQuiz = null; }
                }

                moduleMap[key].pcs.push({
                    id: row.id,
                    pc_id: row.pc_code,
                    pc_intent: row.pc_intent || row.pc_description,
                    pc_intent_hi: row.pc_intent_hi,
                    pc_desc: row.pc_description,
                    // 🎬 Video — null means front-end should on-demand harvest from YouTube
                    video_id: row.video_id || null,
                    video_title: row.video_title || null,
                    video_url: row.video_url || null,
                    channel_title: row.channel_title || null,
                    duration_seconds: row.duration_seconds || null,
                    start_seconds: (row.start_seconds !== null && row.start_seconds !== undefined) ? row.start_seconds : null,
                    end_seconds: (row.end_seconds !== null && row.end_seconds !== undefined) ? row.end_seconds : null,
                    study_takeaways: takeaways,
                    viva_quiz: vivaQuiz,
                    // 🔍 Search vectors for on-demand YouTube harvesting
                    contextual_search_query: row.contextual_search_query || null,
                    contextual_search_query_hi: row.contextual_search_query_hi || null,
                    video_id_hi: row.video_id_hi || null,
                    video_title_hi: row.video_title_hi || null,
                    video_url_hi: row.video_url_hi || null,
                    channel_title_hi: row.channel_title_hi || null,
                    duration_seconds_hi: row.duration_seconds_hi || null,
                    audit_score: row.audit_score || 90,

                    // 🏭 2. SOP Perspective
                    sop_intent: row.sop_intent || `${row.pc_intent || row.pc_description} Standard Work Instruction`,
                    sop_intent_hi: row.sop_intent_hi,
                    sop_search_query: row.sop_search_query,
                    sop_action_directive: row.sop_action_directive || row.pc_description,
                    sop_parameter_tolerance: row.sop_parameter_tolerance || 'Strict conformance to nominal engineering tolerance bounds',
                    sop_critical_knack: row.sop_critical_knack || 'Maintain steady hand motion, verified alignment, and clean contact surfaces.',
                    sop_video_url: row.sop_video_url,

                    // 💼 3. DPR / Machine Perspective
                    dpr_intent: row.dpr_intent || `${row.machine_name || 'Commercial Diagnostic Station'} Commercial Setup`,
                    dpr_intent_hi: row.dpr_intent_hi,
                    dpr_search_query: row.dpr_search_query,
                    machine_name: row.machine_name || 'Commercial Precision Apparatus & Tooling Kit',
                    machine_spec: row.machine_spec || '220V 1-Phase Industrial Calibrated Apparatus',
                    machine_capex_cost_inr: Number(row.machine_capex_cost_inr) || 35000,
                    machine_power_kw: row.machine_power_kw || '1.0 kW 1-Phase',
                    dpr_video_url: row.dpr_video_url
                });
            });

            // Extract explicit Module number (Module 1 -> 1, Module 2 -> 2)
            const getModNum = (modTitle, pcs) => {
                const m = (modTitle || '').match(/module\s*(\d+)/i);
                if (m) return parseInt(m[1]);
                if (Array.isArray(pcs)) {
                    for (const pc of pcs) {
                        const m2 = (pc.pc_intent || pc.pc_desc || '').match(/module\s*(\d+)/i);
                        if (m2) return parseInt(m2[1]);
                    }
                }
                return 999;
            };

            // Sort modules naturally by explicit Module number (Module 1 before Module 4)
            const nosModules = Object.values(moduleMap).sort((a, b) => {
                const numA = getModNum(a.module_title, a.pcs);
                const numB = getModNum(b.module_title, b.pcs);
                if (numA !== numB) return numA - numB;
                return a.min_pc_num - b.min_pc_num;
            });
            return res.json({
                success: true,
                curriculum: {
                    qp_code: qpCode,
                    qp_name: qpName,
                    version: qpRow ? qpRow.version : '1.0',
                    sector: sector,
                    total_modules: nosModules.length,
                    total_pcs: pcRows.length,
                    nos_modules: nosModules
                }
            });
        }

        // 2. Fallback: Fetch schema_json from nsqf_curricula table (legacy JSON blob path)
        let row = await db.prepare(`SELECT * FROM nsqf_curricula WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?`).get(qpCode, qpCode.replace('/', '_'));
        
        if (row && row.schema_json) {
            return res.json({
                success: true,
                curriculum: JSON.parse(row.schema_json)
            });
        }

        // 3. Fallback: Return 11 baseline fallback module reels for unseeded QP
        const fallbackModules = [
            { module_title: `Introduction & Overview of ${qpName}`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0101`, intent_query: `${qpName} training tutorial overview`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC1', pc_intent: 'Understand Job Role & Standard Guidelines', pc_desc: `Overview of ${qpName} role` }] },
            { module_title: `Workplace Safety & Personal Protective Equipment`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0101`, intent_query: `${qpName} safety PPE guidelines`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC2', pc_intent: 'Inspect & Wear Safety Gear', pc_desc: 'Wear PPE equipment' }] },
            { module_title: `Tool Setup & Equipment Inspection`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0102`, intent_query: `${qpName} equipment setup tools`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC3', pc_intent: 'Pre-operational Equipment Check', pc_desc: 'Check machinery readiness' }] },
            { module_title: `Core Operational Procedure Step 1`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0102`, intent_query: `${qpName} operational process step 1`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC4', pc_intent: 'Execute Primary Operation', pc_desc: 'Execute primary process' }] },
            { module_title: `Core Operational Procedure Step 2`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0102`, intent_query: `${qpName} operational process step 2`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC5', pc_intent: 'Execute Secondary Assembly', pc_desc: 'Execute secondary process' }] },
            { module_title: `Quality Inspection & Defect Control`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0103`, intent_query: `${qpName} quality inspection defect control`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC6', pc_intent: 'Audit Product Quality & Log Defects', pc_desc: 'Audit output quality' }] },
            { module_title: `Measurement & Specification Verification`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0103`, intent_query: `${qpName} measurement specification check`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC7', pc_intent: 'Verify Dimensions against Spec Sheet', pc_desc: 'Verify dimensions' }] },
            { module_title: `Documentation & Logbook Entry`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0103`, intent_query: `${qpName} documentation logbook entry`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC8', pc_intent: 'Record Shift Logs & Production Data', pc_desc: 'Record shift metrics' }] },
            { module_title: `Maintenance & Cleaning Standards`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0104`, intent_query: `${qpName} machine maintenance cleaning`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC9', pc_intent: 'Perform Daily Machine Maintenance', pc_desc: 'Clean and oil equipment' }] },
            { module_title: `Troubleshooting & Incident Reporting`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0104`, intent_query: `${qpName} troubleshooting error reporting`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC10', pc_intent: 'Escalate Operational Faults', pc_desc: 'Escalate equipment faults' }] },
            { module_title: `Handover & Shift Wrap-up`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0104`, intent_query: `${qpName} shift handover wrapup`, video_id: '8aGhZQkoFbQ', pcs: [{ pc_id: 'PC11', pc_intent: 'Complete Shift Handover Briefing', pc_desc: 'Handover to next shift' }] }
        ];

        res.json({
            success: true,
            curriculum: {
                qp_code: qpCode,
                qp_name: qpName,
                version: qpRow ? qpRow.version : '1.0',
                sector: sector,
                total_modules: 11,
                total_pcs: 11,
                nos_modules: fallbackModules
            }
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/skillpedia/nsqf/swap-video or /nsqf/update-pc — update single PC video, timestamps, and metadata
router.post(['/nsqf/swap-video', '/nsqf/update-pc'], async (req, res) => {
    try {
        let { qpCode, pcId, videoId, videoTitle, startSeconds, endSeconds, studyTakeaways, vivaQuiz } = req.body;
        if (!qpCode || !pcId || !videoId) {
            return res.status(400).json({ error: 'qpCode, pcId, and videoId are required.' });
        }

        // Clean videoId in case full YouTube URL was pasted
        const ytMatch = String(videoId).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            videoId = ytMatch[1];
        } else {
            videoId = String(videoId).trim();
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const startSec = (startSeconds !== undefined && startSeconds !== null && startSeconds !== '') ? parseInt(startSeconds, 10) : 0;
        const endSec   = (endSeconds !== undefined && endSeconds !== null && endSeconds !== '') ? parseInt(endSeconds, 10) : null;
        
        const takeawaysJson = studyTakeaways ? (typeof studyTakeaways === 'object' ? JSON.stringify(studyTakeaways) : studyTakeaways) : null;
        const vivaQuizJson  = vivaQuiz ? (typeof vivaQuiz === 'object' ? JSON.stringify(vivaQuiz) : vivaQuiz) : null;

        // Write to nsqf_pcs (the canonical PostgreSQL source)
        await db.prepare(`
            UPDATE nsqf_pcs 
            SET video_id = ?, 
                video_title = ?, 
                video_url = ?,
                start_seconds = ?,
                end_seconds = ?,
                study_takeaways_json = COALESCE(?, study_takeaways_json),
                viva_quiz_json = COALESCE(?, viva_quiz_json)
            WHERE (qp_code = ? OR REPLACE(qp_code, '/', '_') = ?) AND pc_code = ?
        `).run(videoId, videoTitle || 'NSQF Demonstration', videoUrl, startSec, endSec, takeawaysJson, vivaQuizJson, qpCode, qpCode.replace('/', '_'), pcId);

        res.json({ 
            success: true, 
            message: `Successfully updated video and bounds for ${qpCode} ${pcId}`,
            updated: {
                qp_code: qpCode,
                pc_code: pcId,
                video_id: videoId,
                video_url: videoUrl,
                start_seconds: startSec,
                end_seconds: endSec
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/sop/details — fetch full ISO 9001 Workstation SOPs for an entire QP
router.get(['/sop/details', '/sop/details/*'], async (req, res) => {
    try {
        let rawCode = req.query.qp || req.query.qpCode || '';
        if (!rawCode && req.params[0]) {
            rawCode = req.params[0];
        }
        if (rawCode.startsWith('/')) rawCode = rawCode.substring(1);
        const qpCode = decodeURIComponent(rawCode).trim().replace(/_/g, '/');
        const cleanQp = qpCode.replace(/\//g, '_');

        const qpRes = await db.pool.query(
            `SELECT * FROM nsqf_qps WHERE qp_code = $1 OR REPLACE(qp_code, '/', '_') = $2 LIMIT 1`,
            [qpCode, cleanQp]
        );
        const qpRow = qpRes.rows && qpRes.rows[0];

        // Fetch real Occupational Standards (NOS) from PostgreSQL
        const nosRes = await db.pool.query(
            `SELECT id, qp_code, nos_code, nos_title, sequence_order 
             FROM nsqf_nos 
             WHERE qp_code = $1 OR REPLACE(qp_code, '/', '_') = $2 
             ORDER BY sequence_order ASC, id ASC`,
            [qpCode, cleanQp]
        );
        const nosList = nosRes.rows || [];

        // Fetch all atomic Performance Criteria (PCs) for this QP
        const pcsRes = await db.pool.query(
            `SELECT 
                id, qp_code, nos_code, pc_code, pc_description, pc_intent,
                sop_intent, sop_action_directive, sop_parameter_tolerance, sop_critical_knack, sop_search_query,
                video_id, video_title, start_seconds, end_seconds
             FROM nsqf_pcs
             WHERE qp_code = $1 OR REPLACE(qp_code, '/', '_') = $2
             ORDER BY id ASC`,
            [qpCode, cleanQp]
        );
        const pcsList = pcsRes.rows || [];

        // Group into real industrial workstations
        const isGenericTol = (val) => {
            if (!val) return true;
            const v = String(val).toLowerCase().trim();
            return v.includes('nominal engineering tolerances') || v.includes('strict nominal tolerances') || v.includes('nominal tolerances');
        };

        const isGenericKnk = (val) => {
            if (!val) return true;
            const v = String(val).toLowerCase().trim();
            return v.includes('steady hand motion') || v.includes('physical alignment prior to final fixation') || v.includes('statutory plant safety codes');
        };

        const workstations = nosList.map((n, idx) => {
            const nosPcs = pcsList.filter(p => p.nos_code === n.nos_code);
            return {
                workstation_number: `WS-0${idx + 1}`,
                nos_code: n.nos_code,
                workstation_title: n.nos_title,
                total_checkpoints: nosPcs.length,
                checkpoints: nosPcs.map((p, pIdx) => ({
                    id: p.id,
                    step_number: pIdx + 1,
                    pc_code: p.pc_code,
                    pc_description: p.pc_description,
                    action_directive: p.sop_action_directive || p.pc_description,
                    parameter_tolerance: isGenericTol(p.sop_parameter_tolerance) ? null : p.sop_parameter_tolerance,
                    critical_safety_knack: isGenericKnk(p.sop_critical_knack) ? null : p.sop_critical_knack,
                    video_id: p.video_id,
                    video_title: p.video_title,
                    start_seconds: p.start_seconds || 0,
                    end_seconds: p.end_seconds || null
                }))
            };
        });

        res.json({
            success: true,
            qp_code: qpCode,
            qp_name: qpRow ? qpRow.qp_name : qpCode,
            sector: qpRow ? qpRow.sector : 'General',
            sub_sector: qpRow ? qpRow.sub_sector : '',
            occupation: qpRow ? qpRow.occupation : '',
            nsqf_level: qpRow ? qpRow.nsqf_level : '4',
            total_workstations: workstations.length,
            total_pcs: pcsList.length,
            workstations
        });
    } catch (e) {
        console.error('[/sop/details error]:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

const { generateMsmeBlueprint } = require('../utils/msmeSynthesizer');

// GET /api/skillpedia/msme/cards — fetch MSME Business Opportunity Cards
router.get('/msme/cards', async (req, res) => {
    try {
        const sector = req.query.sector || '';
        const limit = parseInt(req.query.limit) || 60;
        const offset = parseInt(req.query.offset) || 0;

        let query = `
            SELECT 
                q.qp_code, q.qp_name, q.sector, q.sub_sector, q.nsqf_level,
                b.business_title, b.tagline, b.executive_summary, b.financial_model
            FROM nsqf_qps q
            LEFT JOIN msme_business_blueprints b ON q.qp_code = b.qp_code
            WHERE 1=1
        `;
        const params = [];

        if (sector && sector !== 'all') {
            params.push(sector);
            query += ` AND (q.sector = $${params.length} OR q.sector ILIKE '%' || $${params.length} || '%')`;
        }

        query += ` ORDER BY q.id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const rows = await db.pool.query(query, params);

        const cards = rows.rows.map(r => {
            const fm = r.financial_model || {};
            const cleanTitle = (r.qp_name || 'Commercial Trade')
                .replace(/^Standard Operating Procedure:\s*/i, '')
                .replace(/^SOP\s*:\s*/i, '')
                .trim();
            const busTitle = r.business_title || `Turnkey ${cleanTitle} Enterprise`;
            const totalCost = fm.total_project_cost_inr || 350000;
            const netProfit = fm.net_monthly_profit_inr || 65000;
            const subsidyPct = fm.pmegp_subsidy_pct || 35;

            return {
                qp_code: r.qp_code,
                qp_name: r.qp_name,
                sector: r.sector || 'General',
                sub_sector: r.sub_sector || '',
                nsqf_level: r.nsqf_level || '4',
                business_title: busTitle,
                tagline: r.tagline || `${r.sector || 'Commercial'} MSME Business Blueprint`,
                executive_summary: r.executive_summary || '',
                total_project_cost_inr: totalCost,
                net_monthly_profit_inr: netProfit,
                subsidy_pct: subsidyPct,
                is_synthesized: !!r.business_title
            };
        });

        res.json({
            success: true,
            count: cards.length,
            cards
        });
    } catch (e) {
        console.error('[MSME Cards] Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/skillpedia/msme/details — fetch full MSME Blueprint with live LLM synthesis & write-through cache
router.get(['/msme/details', '/msme/details/*', '/msme/blueprint'], async (req, res) => {
    try {
        let rawCode = req.query.qp || req.query.qpCode || req.query.nos || req.query.nosCode || '';
        if (!rawCode && req.params[0]) {
            rawCode = req.params[0];
        }
        if (rawCode.startsWith('/')) rawCode = rawCode.substring(1);
        const qpCode = decodeURIComponent(rawCode).trim().replace(/_/g, '/');

        // Fetch master QP row
        const qpRes = await db.pool.query(
            `SELECT qp_code, qp_name, sector, sub_sector, occupation, nsqf_level 
             FROM nsqf_qps 
             WHERE qp_code = $1 OR REPLACE(qp_code, '/', '_') = $2 LIMIT 1`,
            [qpCode, qpCode.replace(/\//g, '_')]
        );

        if (!qpRes.rows || qpRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: `Qualification pack ${qpCode} not found` });
        }
        const qpRow = qpRes.rows[0];

        // Synthesize or retrieve from PostgreSQL write-through cache
        const blueprint = await generateMsmeBlueprint(qpRow.qp_code);

        res.json({
            success: true,
            qp_code: qpRow.qp_code,
            qp_name: qpRow.qp_name,
            sector: qpRow.sector,
            sub_sector: qpRow.sub_sector,
            nsqf_level: qpRow.nsqf_level,
            blueprint
        });
    } catch (e) {
        console.error('[MSME Details] Error generating blueprint:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ReelCurator AI Agent Routes
const reelCuratorAgent = require('../services/reelCuratorAgent');

// GET /api/skillpedia/agent/suggestions — fetch pending AI video swap suggestions
router.get('/agent/suggestions', async (req, res) => {
    try {
        const suggestions = await reelCuratorAgent.getPendingSwapSuggestions();
        res.json({ success: true, suggestions });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/skillpedia/agent/accept-swap — accept AI video swap suggestion
router.post('/agent/accept-swap', async (req, res) => {
    try {
        const { suggestionId } = req.body;
        if (!suggestionId) return res.status(400).json({ error: 'suggestionId is required.' });
        const result = await reelCuratorAgent.acceptSwapSuggestion(suggestionId);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/skillpedia/agent/reject-swap — reject AI video swap suggestion
router.post('/agent/reject-swap', async (req, res) => {
    try {
        const { suggestionId } = req.body;
        if (!suggestionId) return res.status(400).json({ error: 'suggestionId is required.' });
        const result = await reelCuratorAgent.rejectSwapSuggestion(suggestionId);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/skillpedia/agent/trigger-audit — trigger AI audit for a QP
router.post('/agent/trigger-audit', async (req, res) => {
    try {
        const qpCode = req.body.qpCode || 'AMH/Q0103';
        const result = await reelCuratorAgent.auditQpVideos(qpCode);
        res.json({ success: true, qpCode, ...result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});



// POST /api/skillpedia/save-skill
router.post('/save-skill', async (req, res) => {
    try {
        const { title, companyId, employeeEmailId, schemaJson } = req.body;
        if (!title || !schemaJson) {
            return res.status(400).json({ error: 'Title and schemaJson are required.' });
        }

        const schemaString = typeof schemaJson === 'string' ? schemaJson : JSON.stringify(schemaJson);

        // Default anonymous builder if no email provided
        const normalizedEmail = (employeeEmailId || 'builder@hayagriva.ai').trim().toLowerCase();
        
        // Extract tag and description from parsed schema if available
        let extractedTag = 'General';
        let extractedDesc = '';
        let parsedSchema = null;
        try {
            parsedSchema = typeof schemaJson === 'string' ? JSON.parse(schemaJson) : schemaJson;
        } catch (_) {}

        if (parsedSchema && typeof parsedSchema === 'object') {
            extractedTag = parsedSchema.tag || parsedSchema.sector || 'General';
            extractedDesc = parsedSchema.description || parsedSchema.subtitle || '';
        }

        const result = await db.prepare(`
            INSERT INTO custom_skills (title, tag, description, company_id, employee_email_id, schema_json)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(title.trim(), extractedTag, extractedDesc, companyId ? companyId.trim() : null, normalizedEmail, schemaString);

        res.json({
            success: true,
            skillId: result.lastInsertRowid,
            message: `Custom skill "${title}" saved successfully.`
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/skill/:id  — fetch one custom skill by numeric ID or title slug
router.get('/skill/:id', async (req, res) => {
    try {
        const param = req.params.id.trim();
        let row = null;
        if (/^\d+$/.test(param)) {
            row = await db.prepare(`SELECT * FROM custom_skills WHERE id = ?`).get(param);
        }
        if (!row) {
            const cleanSlug = param.toLowerCase().replace(/[- ]+/g, '_');
            row = await db.prepare(`
                SELECT * FROM custom_skills 
                WHERE LOWER(REPLACE(REPLACE(title, ' ', '_'), '-', '_')) = ?
            `).get(cleanSlug);
        }
        if (!row) return res.status(404).json({ error: 'Skill not found.' });

        let schema = {};
        try { schema = JSON.parse(row.schema_json); } catch (e) {}

        // Normalise lessons
        const lessons = Array.isArray(schema.lessons) ? schema.lessons
                      : Array.isArray(schema.reels)   ? schema.reels.map((r, i) => ({
                            id: `les_${i+1}`, reel_index: i+1,
                            nos_code: `CUST/N010${i+1}`, title: r.title || `Step ${i+1}`,
                            subtitle: r.title || `Step ${i+1}`, video_id: r.videoId || '',
                            video_platform: 'youtube', pcs: []
                        }))
                      : [];

        res.json({
            success: true,
            skill: {
                id: row.id,
                title: row.title,
                subtitle: schema.subtitle || `11-Reel AI Skill Package`,
                sector: schema.sector || 'Custom Micro-Learning',
                nsqf_level: schema.nsqf_level || 3,
                tag: schema.tag || 'General',
                description: schema.description || '',
                lessons,
                created_at: row.created_at
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/employee-skills
router.get('/employee-skills', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ error: 'Employee email parameter is required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const skills = await db.prepare(`
            SELECT * FROM custom_skills WHERE employee_email_id = ? ORDER BY id DESC
        `).all(normalizedEmail);

        const parsedSkills = skills.map(s => ({
            ...s,
            schema_json: JSON.parse(s.schema_json)
        }));

        res.json({
            success: true,
            employeeEmailId: normalizedEmail,
            count: parsedSkills.length,
            skills: parsedSkills
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/skillpedia/save-progress
router.post('/save-progress', async (req, res) => {
    try {
        const { userId, employeeEmailId, skillId, completedPcs, score } = req.body;
        if (!employeeEmailId || !skillId) {
            return res.status(400).json({ error: 'employeeEmailId and skillId are required.' });
        }

        const normalizedEmail = employeeEmailId.trim().toLowerCase();
        const pcsString = Array.isArray(completedPcs) ? JSON.stringify(completedPcs) : (completedPcs || '[]');

        const existing = await db.prepare(`
            SELECT id FROM skill_progress WHERE employee_email_id = ? AND skill_id = ?
        `).get(normalizedEmail, String(skillId));

        if (existing) {
            await db.prepare(`
                UPDATE skill_progress 
                SET completed_pcs = ?, score = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(pcsString, score || 0, existing.id);
        } else {
            await db.prepare(`
                INSERT INTO skill_progress (user_id, employee_email_id, skill_id, completed_pcs, score)
                VALUES (?, ?, ?, ?, ?)
            `).run(userId || null, normalizedEmail, String(skillId), pcsString, score || 0);
        }

        res.json({ success: true, message: 'Progress saved successfully.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/skillpedia/progress/toggle-pc — toggle completed status of a Performance Criteria (PC)
router.post('/progress/toggle-pc', async (req, res) => {
    try {
        const { userId, qpCode, pcCode, completed } = req.body;
        if (!qpCode || !pcCode) {
            return res.status(400).json({ error: 'qpCode and pcCode are required.' });
        }
        const uId = userId || 0;
        const isComp = completed ? 1 : 0;

        if (isComp) {
            await db.prepare(`
                INSERT INTO user_pc_progress (user_id, qp_code, pc_code, completed, updated_at)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, qp_code, pc_code) DO UPDATE SET
                    completed = 1,
                    updated_at = CURRENT_TIMESTAMP
            `).run(uId, qpCode, pcCode);
        } else {
            await db.prepare(`
                DELETE FROM user_pc_progress WHERE user_id = ? AND qp_code = ? AND pc_code = ?
            `).run(uId, qpCode, pcCode);
        }

        const countRow = await db.prepare(`
            SELECT COUNT(*) as c FROM user_pc_progress WHERE user_id = ? AND qp_code = ? AND completed = 1
        `).get(uId, qpCode);

        res.json({ success: true, completedCount: countRow ? countRow.c : 0 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
