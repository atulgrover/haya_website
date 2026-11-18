'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/patents/catalog
 * Returns list of trades with patent availability
 */
router.get('/catalog', async (req, res) => {
    try {
        const sector = req.query.sector;
        let query = `
            SELECT 
                q.qp_code,
                q.qp_name,
                q.sector,
                q.nsqf_level,
                q.business_title,
                p.id as patent_id,
                p.patent_title,
                p.ipc_classes,
                p.technical_field,
                p.commercial_viability
            FROM nsqf_qps q
            LEFT JOIN nsqf_patents p ON (q.qp_code = p.qp_code OR REPLACE(q.qp_code, '/', '_') = REPLACE(p.qp_code, '/', '_'))
        `;
        const params = [];
        if (sector && sector !== 'all') {
            query += ` WHERE q.sector = ?`;
            params.push(sector);
        }
        query += ` ORDER BY (p.id IS NOT NULL) DESC, q.sector ASC, q.qp_name ASC LIMIT 100`;

        const catalog = await db.prepare(query).all(...params);
        res.json({ success: true, count: catalog.length, catalog });
    } catch (err) {
        console.error('[Patents API] Error in catalog:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/patents/qp, /api/patents/qp/*, /api/patents/details/*
 * Returns full patent blueprint for a specific trade
 */
router.get(['/qp', '/qp/*', '/details', '/details/*'], async (req, res) => {
    try {
        let rawCode = req.query.qp || req.query.qpCode || req.params[0] || '';
        if (rawCode.startsWith('/')) rawCode = rawCode.substring(1);
        const qpCode = decodeURIComponent(rawCode).trim().replace(/_/g, '/');

        if (!qpCode) {
            return res.status(400).json({ success: false, error: 'QP code parameter required.' });
        }

        // 1. Fetch QP metadata
        const qp = await db.prepare(`
            SELECT qp_code, qp_name, sector, sub_sector, nsqf_level, business_title, founder_pitch, total_qp_hours
            FROM nsqf_qps 
            WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ? LIMIT 1
        `).get(qpCode, qpCode.replace(/\//g, '_'));

        if (!qp) {
            return res.status(404).json({ success: false, error: `Trade Qualification Pack "${qpCode}" not found.` });
        }

        // 2. Fetch Patent Dossier from nsqf_patents
        let patent = await db.prepare(`
            SELECT * FROM nsqf_patents 
            WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ? LIMIT 1
        `).get(qp.qp_code, qp.qp_code.replace(/\//g, '_'));

        // Fallback: If no dedicated patent exists yet, synthesize an on-the-fly provisional template from shop-floor PC data
        if (!patent) {
            const pcs = await db.prepare(`
                SELECT pc_intent, sop_parameter_tolerance, sop_critical_knack, machine_name, machine_spec
                FROM nsqf_pcs WHERE qp_code = ? AND (sop_critical_knack IS NOT NULL OR machine_name IS NOT NULL)
                LIMIT 5
            `).all(qp.qp_code);

            const primaryMachine = pcs[0]?.machine_name || 'Industrial Precision Rig';
            const primaryTolerance = pcs[0]?.sop_parameter_tolerance || '±0.05 mm standard operational tolerance';
            const primaryKnack = pcs[0]?.sop_critical_knack || 'Automated sensor feedback and safety trip integration';

            patent = {
                qp_code: qp.qp_code,
                patent_title: `System and Method for Automated In-Situ Closed-Loop Feedback in ${qp.business_title || qp.qp_name}`,
                ipc_classes: ['G05B 19/00', 'B23Q 15/00', 'G01N 29/00'],
                technical_field: `${qp.sector} Automation, Shop-Floor Telemetry, and Real-Time Process Quality Optimization`,
                background_problem: `In traditional ${qp.qp_name} operations, manual quality calibration and delayed inspection allow parameter deviations beyond ${primaryTolerance}. Workstation bottlenecks frequently cause component defects and unmitigated tool wear during continuous commercial cycles.`,
                technical_solution: `An integrated edge sensing collar retrofitted onto the ${primaryMachine}. Incorporating high-speed acoustic telemetry and optical verification, the module detects process drift in under 5 milliseconds and applies dynamic PID micro-adjustments directly through the controller interface.`,
                hardware_bom: [
                    { item: `Precision Sensor Array for ${primaryMachine}`, spec: 'Industrial IP67 telemetry sensor with Modbus RTU', quantity: 1, est_cost_inr: 16500 },
                    { item: 'Edge Microcontroller & DSP Analysis Core', spec: 'Dual-Core ARM Cortex-M7 with real-time FPU', quantity: 1, est_cost_inr: 12000 },
                    { item: 'Optocoupled Closed-Loop PLC Actuator Interface', spec: 'High-speed industrial digital I/O with galvanic isolation', quantity: 1, est_cost_inr: 8500 }
                ],
                operational_steps: [
                    { step_no: 1, phase: 'Initial Parameter Calibration', action: `Establishing baseline vibration and tolerance thresholds for ${primaryMachine}.` },
                    { step_no: 2, phase: 'Continuous In-Situ Telemetry', action: 'Capturing dynamic load vectors and temperature gradients at 50 kHz sampling rate.' },
                    { step_no: 3, phase: 'Real-Time Edge Drift Analysis', action: `Comparing real-time telemetry against calibrated constraint: ${primaryKnack}.` },
                    { step_no: 4, phase: 'Closed-Loop Actuator Compensation', action: 'Transmitting instant micro-offset feedback to maintain zero-defect tolerance.' }
                ],
                claims_apparatus: [
                    {
                        claim_no: 1,
                        claim_type: 'independent',
                        text: `An automated industrial quality control system for ${qp.qp_name}, comprising: a sensor module coupled to a ${primaryMachine}; an edge signal processor configured to capture operational drift signatures; and a closed-loop controller configured to dynamically apply corrective adjustments within ${primaryTolerance} without halting production.`
                    }
                ],
                claims_method: [
                    {
                        claim_no: 2,
                        claim_type: 'independent',
                        text: `A method for real-time defect prevention in ${qp.sector} manufacturing, comprising: sensing localized vibrational anomalies during active operation; computing a dynamic error compensation vector; and executing instantaneous controller override to prevent part failure.`
                    }
                ],
                prior_art_queries: [
                    `${qp.sector} closed loop feedback sensor apparatus`,
                    `${primaryMachine} automated real time defect prevention`
                ],
                commercial_viability: `Readily commercializable across Indian MSME clusters with payback period under 6 months due to 80% reduction in inspection rejects.`
            };
        } else {
            // Parse JSON fields if returned as string
            if (typeof patent.ipc_classes === 'string') try { patent.ipc_classes = JSON.parse(patent.ipc_classes); } catch(e){}
            if (typeof patent.hardware_bom === 'string') try { patent.hardware_bom = JSON.parse(patent.hardware_bom); } catch(e){}
            if (typeof patent.operational_steps === 'string') try { patent.operational_steps = JSON.parse(patent.operational_steps); } catch(e){}
            if (typeof patent.claims_apparatus === 'string') try { patent.claims_apparatus = JSON.parse(patent.claims_apparatus); } catch(e){}
            if (typeof patent.claims_method === 'string') try { patent.claims_method = JSON.parse(patent.claims_method); } catch(e){}
            if (typeof patent.prior_art_queries === 'string') try { patent.prior_art_queries = JSON.parse(patent.prior_art_queries); } catch(e){}
        }

        res.json({
            success: true,
            qp,
            patent
        });
    } catch (err) {
        console.error('[Patents API] Error in get patent:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/patents/sample
 * Returns flagship sample patent
 */
router.get('/sample', async (req, res) => {
    try {
        const qpCode = 'CSC/Q0115';
        const patent = await db.prepare(`SELECT * FROM nsqf_patents WHERE qp_code = ?`).get(qpCode);
        const qp = await db.prepare(`SELECT qp_code, qp_name, sector, business_title, founder_pitch FROM nsqf_qps WHERE qp_code = ?`).get(qpCode);
        
        if (patent) {
            if (typeof patent.ipc_classes === 'string') try { patent.ipc_classes = JSON.parse(patent.ipc_classes); } catch(e){}
            if (typeof patent.hardware_bom === 'string') try { patent.hardware_bom = JSON.parse(patent.hardware_bom); } catch(e){}
            if (typeof patent.operational_steps === 'string') try { patent.operational_steps = JSON.parse(patent.operational_steps); } catch(e){}
            if (typeof patent.claims_apparatus === 'string') try { patent.claims_apparatus = JSON.parse(patent.claims_apparatus); } catch(e){}
            if (typeof patent.claims_method === 'string') try { patent.claims_method = JSON.parse(patent.claims_method); } catch(e){}
            if (typeof patent.prior_art_queries === 'string') try { patent.prior_art_queries = JSON.parse(patent.prior_art_queries); } catch(e){}
        }

        res.json({ success: true, qp, patent });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
