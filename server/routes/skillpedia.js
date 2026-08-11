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

        // Get total matching count
        const countRow = await db.prepare(`SELECT COUNT(*) as total ${baseSql}`).get(...args);
        const matchCount = countRow ? countRow.total : 0;

        // Get overall database count
        const dbCountRow = await db.prepare(`SELECT COUNT(*) as total FROM nsqf_qps`).get();
        const totalDatabaseCount = dbCountRow ? dbCountRow.total : 2176;

        const maxLimit = limit ? parseInt(limit) : 60;
        const querySql = `SELECT * ${baseSql} ORDER BY id ASC LIMIT ${maxLimit}`;

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

// GET /api/skillpedia/nsqf/curriculum/:qpCode — fetch parsed NOS modules & Performance Criteria (PC) for student player
router.get('/nsqf/curriculum/:qpCode', async (req, res) => {
    try {
        const rawCode = req.params.qpCode;
        const qpCode = decodeURIComponent(rawCode).trim().replace('_', '/');
        
        let row = await db.prepare(`SELECT * FROM nsqf_curricula WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?`).get(qpCode, qpCode.replace('/', '_'));
        
        if (row && row.schema_json) {
            return res.json({
                success: true,
                curriculum: JSON.parse(row.schema_json)
            });
        }

        // Fallback: Fetch metadata from nsqf_qps table to construct clean fallback curriculum
        const qpRow = await db.prepare(`SELECT * FROM nsqf_qps WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?`).get(qpCode, qpCode.replace('/', '_'));
        const qpName = qpRow ? qpRow.qp_name : `Qualification Pack ${qpCode}`;
        const sector = qpRow ? qpRow.sector : 'Vocational Training';

        // Return 11 clean fallback module reels for any unseeded QP
        const fallbackModules = [
            { module_title: `Introduction & Overview of ${qpName}`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0101`, intent_query: `${qpName} training tutorial overview`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC1', pc_intent: 'Understand Job Role & Standard Guidelines', pc_desc: `Overview of ${qpName} role` }] },
            { module_title: `Workplace Safety & Personal Protective Equipment`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0101`, intent_query: `${qpName} safety PPE guidelines`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC2', pc_intent: 'Inspect & Wear Safety Gear', pc_desc: 'Wear PPE equipment' }] },
            { module_title: `Tool Setup & Equipment Inspection`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0102`, intent_query: `${qpName} equipment setup tools`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC3', pc_intent: 'Pre-operational Equipment Check', pc_desc: 'Check machinery readiness' }] },
            { module_title: `Core Operational Procedure Step 1`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0102`, intent_query: `${qpName} operational process step 1`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC4', pc_intent: 'Execute Primary Operation', pc_desc: 'Execute primary process' }] },
            { module_title: `Core Operational Procedure Step 2`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0102`, intent_query: `${qpName} operational process step 2`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC5', pc_intent: 'Execute Secondary Assembly', pc_desc: 'Execute secondary process' }] },
            { module_title: `Quality Inspection & Defect Control`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0103`, intent_query: `${qpName} quality inspection defect control`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC6', pc_intent: 'Audit Product Quality & Log Defects', pc_desc: 'Audit output quality' }] },
            { module_title: `Measurement & Specification Verification`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0103`, intent_query: `${qpName} measurement specification check`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC7', pc_intent: 'Verify Dimensions against Spec Sheet', pc_desc: 'Verify dimensions' }] },
            { module_title: `Documentation & Logbook Entry`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0103`, intent_query: `${qpName} documentation logbook entry`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC8', pc_intent: 'Record Shift Logs & Production Data', pc_desc: 'Record shift metrics' }] },
            { module_title: `Maintenance & Cleaning Standards`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0104`, intent_query: `${qpName} machine maintenance cleaning`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC9', pc_intent: 'Perform Daily Machine Maintenance', pc_desc: 'Clean and oil equipment' }] },
            { module_title: `Troubleshooting & Incident Reporting`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0104`, intent_query: `${qpName} troubleshooting error reporting`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC10', pc_intent: 'Escalate Operational Faults', pc_desc: 'Escalate equipment faults' }] },
            { module_title: `Handover & Shift Wrap-up`, nos_code: `${qpCode.split('/')[0] || 'NOS'}/N0104`, intent_query: `${qpName} shift handover wrapup`, video_id: 'x9PQgbB4y6M', pcs: [{ pc_id: 'PC11', pc_intent: 'Complete Shift Handover Briefing', pc_desc: 'Handover to next shift' }] }
        ];

        const fallbackSchema = {
            qp_code: qpCode,
            qp_name: qpName,
            version: qpRow ? qpRow.version : '1.0',
            sector: sector,
            total_modules: 11,
            total_pcs: 11,
            nos_modules: fallbackModules
        };

        res.json({
            success: true,
            curriculum: fallbackSchema
        });

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

        // Default anonymous builder if no email provided
        const normalizedEmail = (employeeEmailId || 'builder@hayagriva.ai').trim().toLowerCase();
        const schemaString = typeof schemaJson === 'string' ? schemaJson : JSON.stringify(schemaJson);

        const result = await db.prepare(`
            INSERT INTO custom_skills (title, company_id, employee_email_id, schema_json)
            VALUES (?, ?, ?, ?)
        `).run(title.trim(), companyId ? companyId.trim() : null, normalizedEmail, schemaString);

        res.json({
            success: true,
            skillId: result.lastInsertRowid,
            message: `Custom skill "${title}" saved successfully.`
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/skillpedia/skill/:id  — fetch one custom skill by ID (used by reel.html deep-link)
router.get('/skill/:id', async (req, res) => {
    try {
        const row = await db.prepare(`SELECT * FROM custom_skills WHERE id = ?`).get(req.params.id);
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

        res.json({
            success: true,
            message: 'Progress saved successfully.'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
