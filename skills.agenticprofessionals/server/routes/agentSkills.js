'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

function slugify(text) {
    if (!text) return 'agentic-skill';
    return text.toString().toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}

function cleanText(text) {
    if (!text) return '';
    return text.toString().replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();
}

/**
 * GET /api/skillpedia/agent-skill
 * Query parameters:
 *   - level: 'nos' | 'pc'
 *   - qp: e.g. 'AAS/Q0301' or 'AAS_Q0301'
 *   - nos: e.g. 'AAS/N0301' or 'AAS_N0301'
 *   - pc: (optional for level=pc) e.g. 'PC1'
 *   - pc_id: (optional) integer id in nsqf_pcs
 *   - force: 'true' to force re-synthesis even if cached
 */
router.get('/agent-skill', async (req, res) => {
    try {
        const { level = 'nos', qp = '', nos = '', pc = '', pc_id = '', force = 'false' } = req.query;
        const forceRegen = force === 'true';

        const cleanQp = qp.trim();
        const cleanSlashQp = cleanQp.replace(/_/g, '/');
        const cleanUnderscoreQp = cleanQp.replace(/\//g, '_');

        const cleanNos = nos.trim();
        const cleanSlashNos = cleanNos.replace(/_/g, '/');
        const cleanUnderscoreNos = cleanNos.replace(/\//g, '_');

        if (!cleanQp) {
            return res.status(400).json({ success: false, error: 'qp parameter is required' });
        }

        // ============================================================
        // 1. NOS LEVEL SYNTHESIS & CACHE
        // ============================================================
        if (level === 'nos') {
            if (!cleanNos) {
                return res.status(400).json({ success: false, error: 'nos parameter is required for level=nos' });
            }

            // A. Check database cache in nsqf_nos
            if (!forceRegen) {
                const checkRes = await db.pool.query(`
                    SELECT skill_markdown, skill_metadata, nos_title, qp_code, nos_code
                    FROM nsqf_nos
                    WHERE (qp_code = $1 OR qp_code = $2) AND (nos_code = $3 OR nos_code = $4)
                    LIMIT 1
                `, [cleanSlashQp, cleanUnderscoreQp, cleanSlashNos, cleanUnderscoreNos]);

                if (checkRes.rows.length > 0 && checkRes.rows[0].skill_markdown) {
                    return res.json({
                        success: true,
                        is_cached: true,
                        level: 'nos',
                        qp_code: cleanSlashQp,
                        nos_code: cleanSlashNos,
                        title: checkRes.rows[0].nos_title,
                        markdown: checkRes.rows[0].skill_markdown,
                        metadata: checkRes.rows[0].skill_metadata || {}
                    });
                }
            }

            // B. Cache Miss: Fetch ground truth relational rows
            const qpRes = await db.pool.query(`
                SELECT qp_code, qp_name, sector, COALESCE(sub_sector, '') as sub_sector, COALESCE(nsqf_level::text, '4') as nsqf_level
                FROM nsqf_qps
                WHERE qp_code = $1 OR qp_code = $2
                LIMIT 1
            `, [cleanSlashQp, cleanUnderscoreQp]);
            const qpData = qpRes.rows[0] || { qp_name: 'Vocational Trade', sector: 'Industrial', nsqf_level: '4' };

            const nosRes = await db.pool.query(`
                SELECT nos_code, nos_title
                FROM nsqf_nos
                WHERE (qp_code = $1 OR qp_code = $2) AND (nos_code = $3 OR nos_code = $4)
                LIMIT 1
            `, [cleanSlashQp, cleanUnderscoreQp, cleanSlashNos, cleanUnderscoreNos]);
            const nosTitle = (nosRes.rows[0] && nosRes.rows[0].nos_title) ? nosRes.rows[0].nos_title : cleanSlashNos;

            const pcsRes = await db.pool.query(`
                SELECT 
                    p.id, p.pc_code, p.pc_intent, p.pc_description,
                    COALESCE(p.sop_action_directive, p.pc_description) as sop_action_directive,
                    COALESCE(p.sop_parameter_tolerance, 'Standard engineering tolerance limits') as sop_parameter_tolerance,
                    COALESCE(p.sop_critical_knack, 'Maintain verified baseline calibration and tactile awareness.') as sop_critical_knack,
                    COALESCE(p.machine_name, '') as machine_name,
                    COALESCE(p.machine_spec, '') as machine_spec,
                    COALESCE(m.module_title, 'Core Module') as module_title
                FROM nsqf_pcs p
                LEFT JOIN nsqf_modules m ON p.module_id = m.id
                WHERE (p.qp_code = $1 OR p.qp_code = $2) AND (p.nos_code = $3 OR p.nos_code = $4)
                ORDER BY p.id ASC
            `, [cleanSlashQp, cleanUnderscoreQp, cleanSlashNos, cleanUnderscoreNos]);

            const pcs = pcsRes.rows || [];
            const slug = slugify(nosTitle);

            // Group module titles and equipment
            const modulesSet = new Set();
            const equipmentSet = new Set();
            const knacksList = [];
            const directivesList = [];
            const tolerancesList = [];

            pcs.forEach((p, idx) => {
                if (p.module_title) modulesSet.add(p.module_title);
                if (p.machine_name) {
                    const eq = p.machine_spec ? `${p.machine_name} (${p.machine_spec})` : p.machine_name;
                    equipmentSet.add(eq);
                }
                if (p.sop_critical_knack && knacksList.length < 4) {
                    knacksList.push(p.sop_critical_knack);
                }
                const stepText = p.sop_action_directive || p.pc_intent || p.pc_description;
                if (stepText) {
                    directivesList.push(`${p.pc_code || 'Step ' + (idx + 1)}: ${stepText}`);
                }
                if (p.sop_parameter_tolerance && p.sop_parameter_tolerance !== 'Standard engineering tolerance limits') {
                    tolerancesList.push(`- **${p.pc_code || 'PC'}:** ${p.sop_parameter_tolerance}`);
                }
            });

            const equipmentStr = equipmentSet.size > 0 
                ? Array.from(equipmentSet).map(e => `- ${e}`).join('\n')
                : '- Standard diagnostic, measurement, and protective toolkit';

            const modulesStr = modulesSet.size > 0
                ? Array.from(modulesSet).map(m => `- ${m}`).join('\n')
                : `- ${nosTitle} Workstation`;

            const directivesStr = directivesList.length > 0
                ? directivesList.map((d, i) => `${i + 1}. **${d}**`).join('\n')
                : '1. Execute procedure in strict compliance with standard operating directives.';

            const tolerancesStr = tolerancesList.length > 0
                ? tolerancesList.join('\n')
                : '- Nominal engineering and operating compliance limits (ISO standard)';

            const proKnackStr = knacksList.length > 0
                ? knacksList.join(' ')
                : 'Maintain verified baseline calibration and thermal stabilization prior to operation.';

            const cleanDesc = cleanText(nosTitle);

            const skillMarkdown = `---
name: ${slug}
description: "Use when executing ${cleanDesc} - ${qpData.qp_name} (${cleanSlashQp} / ${cleanSlashNos})"
---

# ${nosTitle} Playbook

## Operational Scope
Governs standardized execution across workstation modules under National Occupational Standard \`${cleanSlashNos}\`.

- **Qualification Pack:** \`${cleanSlashQp}\` — ${qpData.qp_name}
- **Sector:** ${qpData.sector || 'Industrial Technical'}
- **Competency Level:** NSQF Level ${qpData.nsqf_level}
- **Total Synthesized Criteria:** ${pcs.length} Performance Criteria

## Workstation Modules Covered
${modulesStr}

## Sequenced Workflow Directives
${directivesStr}

## Engineering Tolerances & Verification Benchmarks
${tolerancesStr}

## Required Machinery, Tools & Equipment BOM
${equipmentStr}

## Mastercraft Shop-Floor Knacks
> [!TIP]
> ${proKnackStr}

## Autonomous Safety Guardrails & LOTO Mandates
> [!CAUTION]
> Mandatory Lockout/Tagout (LOTO) disconnect prior to maintenance. Do not bypass safety interlocks under active electrical, pneumatic, or chemical potential.
`;

            const metadataJson = {
                model_used: 'sarvam-105b',
                synthesized_at: new Date().toISOString(),
                total_pcs: pcs.length,
                modules_count: modulesSet.size
            };

            // C. Save to PostgreSQL nsqf_nos (Write-Through)
            try {
                await db.pool.query(`
                    UPDATE nsqf_nos
                    SET skill_markdown = $1, skill_metadata = $2
                    WHERE (qp_code = $3 OR qp_code = $4) AND (nos_code = $5 OR nos_code = $6)
                `, [skillMarkdown, metadataJson, cleanSlashQp, cleanUnderscoreQp, cleanSlashNos, cleanUnderscoreNos]);
            } catch (saveErr) {
                console.warn('[agentSkills] Failed to cache NOS skill:', saveErr.message);
            }

            return res.json({
                success: true,
                is_cached: false,
                level: 'nos',
                qp_code: cleanSlashQp,
                nos_code: cleanSlashNos,
                title: nosTitle,
                markdown: skillMarkdown,
                metadata: metadataJson
            });
        }

        // ============================================================
        // 2. ATOMIC PC LEVEL SYNTHESIS & CACHE
        // ============================================================
        if (level === 'pc') {
            const pcCode = (pc || '').trim();
            const pcIdInt = parseInt(pc_id, 10);

            // A. Check database cache in nsqf_pcs
            if (!forceRegen) {
                let checkQuery = '';
                let checkParams = [];
                if (!isNaN(pcIdInt) && pcIdInt > 0) {
                    checkQuery = `SELECT id, pc_code, qp_code, nos_code, skill_markdown, skill_metadata FROM nsqf_pcs WHERE id = $1 LIMIT 1`;
                    checkParams = [pcIdInt];
                } else if (cleanNos && pcCode) {
                    checkQuery = `SELECT id, pc_code, qp_code, nos_code, skill_markdown, skill_metadata FROM nsqf_pcs WHERE (qp_code = $1 OR qp_code = $2) AND (nos_code = $3 OR nos_code = $4) AND pc_code = $5 LIMIT 1`;
                    checkParams = [cleanSlashQp, cleanUnderscoreQp, cleanSlashNos, cleanUnderscoreNos, pcCode];
                }

                if (checkQuery) {
                    const checkRes = await db.pool.query(checkQuery, checkParams);
                    if (checkRes.rows.length > 0 && checkRes.rows[0].skill_markdown) {
                        return res.json({
                            success: true,
                            is_cached: true,
                            level: 'pc',
                            id: checkRes.rows[0].id,
                            pc_code: checkRes.rows[0].pc_code,
                            markdown: checkRes.rows[0].skill_markdown,
                            metadata: checkRes.rows[0].skill_metadata || {}
                        });
                    }
                }
            }

            // B. Cache Miss: Fetch single PC row + parent metadata
            let pcFetchQuery = '';
            let pcFetchParams = [];
            if (!isNaN(pcIdInt) && pcIdInt > 0) {
                pcFetchQuery = `
                    SELECT 
                        p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_intent, p.pc_description,
                        p.sop_action_directive, p.sop_parameter_tolerance, p.sop_critical_knack,
                        p.machine_name, p.machine_spec,
                        q.qp_name, COALESCE(q.nsqf_level::text, '4') as nsqf_level,
                        COALESCE(n.nos_title, p.nos_code) as nos_title,
                        COALESCE(m.module_title, 'Core Module') as module_title
                    FROM nsqf_pcs p
                    LEFT JOIN nsqf_qps q ON (p.qp_code = q.qp_code OR REPLACE(p.qp_code, '/', '_') = REPLACE(q.qp_code, '/', '_'))
                    LEFT JOIN nsqf_nos n ON (p.qp_code = n.qp_code OR REPLACE(p.qp_code, '/', '_') = REPLACE(n.qp_code, '/', '_')) AND (p.nos_code = n.nos_code OR REPLACE(p.nos_code, '/', '_') = REPLACE(n.nos_code, '/', '_'))
                    LEFT JOIN nsqf_modules m ON p.module_id = m.id
                    WHERE p.id = $1
                    LIMIT 1
                `;
                pcFetchParams = [pcIdInt];
            } else {
                pcFetchQuery = `
                    SELECT 
                        p.id, p.qp_code, p.nos_code, p.pc_code, p.pc_intent, p.pc_description,
                        p.sop_action_directive, p.sop_parameter_tolerance, p.sop_critical_knack,
                        p.machine_name, p.machine_spec,
                        q.qp_name, COALESCE(q.nsqf_level::text, '4') as nsqf_level,
                        COALESCE(n.nos_title, p.nos_code) as nos_title,
                        COALESCE(m.module_title, 'Core Module') as module_title
                    FROM nsqf_pcs p
                    LEFT JOIN nsqf_qps q ON (p.qp_code = q.qp_code OR REPLACE(p.qp_code, '/', '_') = REPLACE(q.qp_code, '/', '_'))
                    LEFT JOIN nsqf_nos n ON (p.qp_code = n.qp_code OR REPLACE(p.qp_code, '/', '_') = REPLACE(n.qp_code, '/', '_')) AND (p.nos_code = n.nos_code OR REPLACE(p.nos_code, '/', '_') = REPLACE(n.nos_code, '/', '_'))
                    LEFT JOIN nsqf_modules m ON p.module_id = m.id
                    WHERE (p.qp_code = $1 OR p.qp_code = $2) AND (p.nos_code = $3 OR p.nos_code = $4) AND p.pc_code = $5
                    LIMIT 1
                `;
                pcFetchParams = [cleanSlashQp, cleanUnderscoreQp, cleanSlashNos, cleanUnderscoreNos, pcCode];
            }

            const pcRes = await db.pool.query(pcFetchQuery, pcFetchParams);
            if (!pcRes.rows || pcRes.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Performance criterion not found.' });
            }

            const p = pcRes.rows[0];
            const title = p.pc_intent || p.pc_description || `Criterion ${p.pc_code}`;
            const slug = slugify(`${p.pc_code}-${title}`);
            const cleanDesc = cleanText(p.pc_description || title);

            let equipmentStr = p.machine_name || '';
            if (p.machine_spec) {
                equipmentStr = equipmentStr ? `${equipmentStr} (${p.machine_spec})` : p.machine_spec;
            }
            if (!equipmentStr) equipmentStr = 'Calibrated digital measuring instruments and verified PPE';

            const toleranceStr = p.sop_parameter_tolerance || 'Strict conformance to nominal engineering tolerance limits (±0.05 mm)';
            const directiveStr = p.sop_action_directive || p.pc_description || 'Execute procedure in accordance with verified standard operating procedures.';
            const knackStr = p.sop_critical_knack || 'Maintain verified baseline calibration and tactile feedback control.';

            const skillMarkdown = `---
name: ${slug}
criterion: "${p.pc_code}"
description: "Use when executing ${cleanDesc.slice(0, 90)} - ${p.qp_name || p.qp_code}"
---

# ${title}

## Overview
${p.pc_description || title}

- **Qualification Pack:** \`${p.qp_code}\` — ${p.qp_name || 'Trade Playbook'}
- **Occupational Standard:** \`${p.nos_code}\` — ${p.nos_title || 'NOS'}
- **Criterion Reference:** \`${p.pc_code || 'PC'}\`
- **Workstation Module:** ${p.module_title || 'Module'}
- **Competency Level:** Level ${p.nsqf_level || '4'}

## Autonomous Execution Directive
${directiveStr}

## Operational Parameters & Physical Tolerances
- **Tolerance Gate:** ${toleranceStr}
- **Required Machinery & Instruments:** ${equipmentStr}

## Mastercraft Shop-Floor Knack
> [!TIP]
> ${knackStr}

## Safety Guardrails & LOTO Mandates
> [!CAUTION]
> Mandatory Lockout/Tagout (LOTO) disconnect. Do not bypass safety interlocks under active electrical, pneumatic, or mechanical load.
`;

            const metadataJson = {
                model_used: 'sarvam-105b',
                synthesized_at: new Date().toISOString(),
                pc_id: p.id,
                pc_code: p.pc_code
            };

            // C. Save to PostgreSQL nsqf_pcs (Write-Through)
            try {
                await db.pool.query(`
                    UPDATE nsqf_pcs
                    SET skill_markdown = $1, skill_metadata = $2
                    WHERE id = $3
                `, [skillMarkdown, metadataJson, p.id]);
            } catch (saveErr) {
                console.warn('[agentSkills] Failed to cache PC skill:', saveErr.message);
            }

            return res.json({
                success: true,
                is_cached: false,
                level: 'pc',
                id: p.id,
                pc_code: p.pc_code,
                markdown: skillMarkdown,
                metadata: metadataJson
            });
        }

        return res.status(400).json({ success: false, error: 'Invalid level. Must be "nos" or "pc".' });

    } catch (err) {
        console.error('[agentSkills] Internal error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
