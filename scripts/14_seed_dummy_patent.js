'use strict';

/**
 * Script 14: Seed Flagship Patent Blueprints in PostgreSQL (hayadb)
 */

require('dotenv').config();
const db = require('../server/db');

const SEED_PATENTS = [
    {
        qp_code: 'CSC/Q0115',
        patent_title: 'Autonomous In-Situ Acoustic Emission Monitoring and Closed-Loop Thermal Drift Compensator for CNC Spindles',
        ipc_classes: ['B23Q 17/09', 'G05B 19/404', 'G01N 29/14', 'B23B 25/06'],
        technical_field: 'Precision CNC Machining, Industrial IoT Telemetry, and Dynamic Machine Tool Thermal Compensation',
        background_problem: 'During high-speed continuous CNC turning, tool wear and spindle bearing friction induce localized thermal expansion exceeding ±0.008 mm. Conventional shop-floor inspections rely on intermittent manual dial-gauge probing after part ejection, which leads to high scrap rates during long production cycles and failure to detect micro-chipping on carbide inserts in real time.',
        technical_solution: 'An integrated non-invasive piezoelectric acoustic emission (AE) collar mounted directly onto the tool turret combined with a ring of multi-channel infrared pyrometers. The signals are digitized by a high-speed DSP microcontroller (100 kHz sampling rate) executing a localized edge wavelet transform. If acoustic resonance indicates micro-chipping or if thermal drift exceeds 0.003 mm, the system calculates a real-time positional delta and injects dynamic G-code offset commands directly into the CNC PLC controller within 1.2 milliseconds without stopping the spindle.',
        hardware_bom: [
            { item: 'Piezoelectric AE Ring Sensor', spec: 'Frequency response 50kHz–400kHz, IP68 oil-resistant', quantity: 1, est_cost_inr: 18500 },
            { item: 'Non-Contact Multi-Zone IR Pyrometer Ring', spec: '0°C to 450°C, 1ms response time, Modbus RTU', quantity: 1, est_cost_inr: 22000 },
            { item: 'Edge DSP Signal Processor & Wavelet Analyzer', spec: 'STM32H7 Dual-Core ARM Cortex-M7 with hardware FPU', quantity: 1, est_cost_inr: 14500 },
            { item: 'Optocoupled Industrial PLC Interfacing Bridge', spec: 'Isolated RS485 / Profinet / Fanuc High-Speed Ethernet', quantity: 1, est_cost_inr: 9500 },
            { item: 'NEMA 4X Industrial Enclosure & Vibration Isolator Mount', spec: 'Machined anodized 6061-T6 aluminum with magnetic base', quantity: 1, est_cost_inr: 6500 }
        ],
        operational_steps: [
            { step_no: 1, phase: 'Sensor Initialization & Noise Baseline', action: 'Continuous background acoustic calibration during spindle spin-up to establish ambient floor noise filter.' },
            { step_no: 2, phase: 'Real-time Wavelet Decomposition', action: 'Sampling transient acoustic bursts at 100 kS/s and extracting high-frequency stress waves characteristic of tool friction.' },
            { step_no: 3, phase: 'Thermal Profile Mapping', action: 'Monitoring 3-point temperature gradient along the spindle nose and predicting thermal elongation axis Z.' },
            { step_no: 4, phase: 'Closed-Loop Micro-Offset Injection', action: 'Transmitting sub-micron G-code tool wear offset compensation (W-axis) to the CNC controller within 1.2 ms.' },
            { step_no: 5, phase: 'Automated Fail-Safe Retraction', action: 'Triggering instantaneous tool retract cycle if fracture signature threshold is breached, preventing workpiece destruction.' }
        ],
        claims_apparatus: [
            {
                claim_no: 1,
                claim_type: 'independent',
                text: 'An autonomous thermal drift and tool wear compensation system for a multi-axis CNC machine tool, comprising: an annular acoustic emission sensor collar adapted for mounting on a tool turret; a multi-channel infrared pyrometer assembly focused on a cutting interface; an edge signal processor in communication with said acoustic sensor and pyrometer, said processor configured to execute real-time wavelet packet decomposition on captured acoustic stress waves; and an isolated controller communication interface configured to dynamically feed calculated micro-coordinate compensation offsets into a CNC machine controller during an uninterrupted machining cut.'
            },
            {
                claim_no: 2,
                claim_type: 'dependent',
                text: 'The system of claim 1, wherein said edge signal processor calculates tool micro-chipping indicators when acoustic emission energy in a frequency band between 120 kHz and 280 kHz exceeds a dynamic sliding window standard deviation threshold by at least 3.5 sigma.'
            },
            {
                claim_no: 3,
                claim_type: 'dependent',
                text: 'The system of claim 1, wherein said micro-coordinate compensation offset maintains dimensional tolerances within ±0.002 mm over continuous spindle run times exceeding four hours.'
            }
        ],
        claims_method: [
            {
                claim_no: 4,
                claim_type: 'independent',
                text: 'A method for in-situ thermal and vibrational compensation in precision subtractive manufacturing, comprising: capturing continuous acoustic stress waves from a cutting tool holder at a sampling frequency of at least 100 kHz; simultaneously measuring localized surface temperature at a tool-workpiece interface; decomposing the captured acoustic stress waves into frequency sub-bands to detect shear deformation anomalies; computing a real-time dimensional compensation vector based on the measured temperature and detected shear anomalies; and transmitting said compensation vector to a machine numerical controller without interrupting spindle rotation.'
            },
            {
                claim_no: 5,
                claim_type: 'dependent',
                text: 'The method of claim 4, further comprising executing an emergency retract routine when an acoustic fracture envelope indicates instantaneous carbide catastrophic failure.'
            }
        ],
        prior_art_queries: [
            'CNC spindle thermal drift acoustic emission closed loop compensation wavelet',
            'Tool wear monitoring piezoelectric collar real-time G-code offset injection',
            'In-situ temperature compensation multi-axis turning machine infrared pyrometer'
        ],
        commercial_viability: 'Target market includes 12,000+ precision machine shops across automotive and aerospace clusters in India (Pune, Chennai, Peenya, Rajkot). Low BOM cost under ₹75,000 enables retrofit ROI within 4 months by cutting scrap rates by 85%.'
    },
    {
        qp_code: 'AAS/Q0103',
        patent_title: 'Smart Automated Unit Load Device (ULD) Weight Distribution & Center-of-Gravity Verification Gantry',
        ipc_classes: ['B64F 1/32', 'G01G 19/07', 'B65G 43/00'],
        technical_field: 'Aviation Ground Handling, Air Cargo Safety Systems, and Automated Weight & Balance Telemetry',
        background_problem: 'Manual aircraft cargo loading relies on estimated pallet weights and static weighbridges that do not detect internal Center-of-Gravity (CoG) offsets inside enclosed Unit Load Devices (ULDs). Uneven cargo loading causes dangerous pitch/roll trim instability in commercial aircraft, increased cruise fuel burn, and risk of ULD pallet lock failure during turbulence.',
        technical_solution: 'A 4-corner multi-axis load cell dynamic turntable integrated with a 3D LiDAR volumetric scanning arch. As a ULD pallet rolls onto the motorized transfer bed, the load cells take 1,000 weight readings while the LiDAR computes actual volumetric density distribution. The onboard processor calculates the exact 3D Cartesian coordinates (X, Y, Z) of the ULD Center-of-Gravity and transmits a cryptographically signed manifest to the airline Flight Operations System via ACARS/MQTT.',
        hardware_bom: [
            { item: 'Hermetically Sealed Shear Beam Load Cells (5,000kg rated)', spec: 'OIML C3 certified, ±0.02% accuracy, IP68 stainless steel', quantity: 4, est_cost_inr: 48000 },
            { item: 'Solid-State Industrial 3D LiDAR Scanner', spec: '905nm eye-safe, 300,000 pts/sec, 120° FOV', quantity: 2, est_cost_inr: 65000 },
            { item: 'Industrial Real-Time Weigh-In-Motion Telemetry Controller', spec: 'Linux Edge gateway with CAN bus & dual Gigabit Ethernet', quantity: 1, est_cost_inr: 32000 },
            { item: 'Motorized Omni-Directional Roller Bed Assembly', spec: 'Heavy duty polyurethane rollers with integrated encoder', quantity: 1, est_cost_inr: 55000 }
        ],
        operational_steps: [
            { step_no: 1, phase: 'Tare & Optical Barcode Scan', action: 'Scanning ULD container IATA alphanumeric code and zero-calibrating load cell platform.' },
            { step_no: 2, phase: 'Dynamic 4-Corner Mass Acquisition', action: 'Recording differential weight distribution across all 4 corner load cells at 200 Hz.' },
            { step_no: 3, phase: '3D Point Cloud Volume Reconstruction', action: 'Constructing spatial mesh of cargo contours and verifying internal volume occupancy.' },
            { step_no: 4, phase: '3D Center-of-Gravity Calculation', action: 'Computing precise X, Y, Z center-of-mass vector relative to ULD centroid.' },
            { step_no: 5, phase: 'Flight Trim Certification & Manifest Signing', action: 'Generating automated IATA AHM 560 compliant digital trim sheet with cryptographic sign-off.' }
        ],
        claims_apparatus: [
            {
                claim_no: 1,
                claim_type: 'independent',
                text: 'An automated air cargo verification system for Unit Load Devices (ULDs), comprising: a motorized transfer platform supported by a plurality of isolated multi-axis load cells; an overhead optical sensing gantry positioned to scan cargo passing over said platform; and a telemetry computing unit coupled to said load cells and optical gantry, configured to compute a three-dimensional Center-of-Gravity vector for an individual ULD and verify said vector against aircraft bay structural limits prior to airside loading.'
            },
            {
                claim_no: 2,
                claim_type: 'dependent',
                text: 'The system of claim 1, wherein said telemetry computing unit rejects ULD loading if the calculated lateral Center-of-Gravity offset exceeds 75 mm from the container geometric centerline.'
            }
        ],
        claims_method: [
            {
                claim_no: 3,
                claim_type: 'independent',
                text: 'A method for validating air cargo load stability in real time, comprising: measuring continuous four-point force vectors from a moving ULD on an instrumented roller platform; simultaneously capturing a 3D LiDAR point cloud of the ULD external envelope; calculating an internal mass distribution matrix; and generating an automated flight trim certification payload for transmission to an aircraft Flight Management System.'
            }
        ],
        prior_art_queries: [
            'Air cargo ULD center of gravity automated measurement LiDAR load cell',
            'Aircraft load and trim automated verification gantry unit load device',
            'Dynamic weight and balance cargo pallet multi-axis sensor arch'
        ],
        commercial_viability: 'Target deployment across 140+ civilian airports and air cargo terminals across South Asia and Middle East. Directly reduces aircraft fuel burn by optimizing trim drag.'
    }
];

async function seedPatents() {
    console.log('[Patent Seed] 🛠  Bootstrapping nsqf_patents table and seed blueprints...');

    for (const patent of SEED_PATENTS) {
        await db.prepare(`
            INSERT INTO nsqf_patents (
                qp_code, patent_title, ipc_classes, technical_field, background_problem,
                technical_solution, hardware_bom, operational_steps, claims_apparatus,
                claims_method, prior_art_queries, commercial_viability
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (qp_code) DO UPDATE SET
                patent_title = EXCLUDED.patent_title,
                ipc_classes = EXCLUDED.ipc_classes,
                technical_field = EXCLUDED.technical_field,
                background_problem = EXCLUDED.background_problem,
                technical_solution = EXCLUDED.technical_solution,
                hardware_bom = EXCLUDED.hardware_bom,
                operational_steps = EXCLUDED.operational_steps,
                claims_apparatus = EXCLUDED.claims_apparatus,
                claims_method = EXCLUDED.claims_method,
                prior_art_queries = EXCLUDED.prior_art_queries,
                commercial_viability = EXCLUDED.commercial_viability,
                updated_at = NOW()
        `).run(
            patent.qp_code,
            patent.patent_title,
            JSON.stringify(patent.ipc_classes),
            patent.technical_field,
            patent.background_problem,
            patent.technical_solution,
            JSON.stringify(patent.hardware_bom),
            JSON.stringify(patent.operational_steps),
            JSON.stringify(patent.claims_apparatus),
            JSON.stringify(patent.claims_method),
            JSON.stringify(patent.prior_art_queries),
            patent.commercial_viability
        );
        console.log(`[Patent Seed] ✅ Seeded patent for ${patent.qp_code}: "${patent.patent_title}"`);
    }

    console.log('[Patent Seed] ✨ Patent seed complete.');
    process.exit(0);
}

seedPatents().catch(err => {
    console.error('[Patent Seed] ❌ Error:', err);
    process.exit(1);
});
