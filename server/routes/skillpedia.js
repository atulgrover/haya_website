'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/skillpedia/save-skill
// Saves custom 11-reel skill with employee_email_id isolation
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
// Fetches custom 11-reel skills isolated by employee_email_id
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
// Saves completed PCs & quiz scores for an employee/student
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
