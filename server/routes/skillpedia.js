'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

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

// POST /api/skillpedia/save-skill
router.post('/save-skill', async (req, res) => {
    try {
        const { title, companyId, employeeEmailId, schemaJson } = req.body;
        if (!title || !employeeEmailId || !schemaJson) {
            return res.status(400).json({ error: 'Title, employeeEmailId, and schemaJson are required.' });
        }

        const normalizedEmail = employeeEmailId.trim().toLowerCase();
        const schemaString = typeof schemaJson === 'string' ? schemaJson : JSON.stringify(schemaJson);

        const result = await db.prepare(`
            INSERT INTO custom_skills (title, company_id, employee_email_id, schema_json)
            VALUES (?, ?, ?, ?)
        `).run(title.trim(), companyId ? companyId.trim() : null, normalizedEmail, schemaString);

        res.json({
            success: true,
            skillId: result.lastInsertRowid,
            message: `Custom skill "${title}" saved successfully for ${normalizedEmail}.`
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
