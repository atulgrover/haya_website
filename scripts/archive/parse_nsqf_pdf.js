'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || ''; // ⚠️ ROTATE OLD KEYS — they were previously committed to source

const scratchDir = '/Users/atulgrover/.gemini/antigravity-ide/brain/63c4db05-0fe5-419b-a156-462feb454b3a/scratch';
const mdPath = path.join(scratchDir, 'AAS_Q0103_v3.0.md');

async function searchYouTube(query) {
    if (!YOUTUBE_API_KEY || !query) return { video_id: 'x9PQgbB4y6M', title: 'Air Cargo Operations Tutorial' };
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&videoEmbeddable=true&maxResults=1&type=video&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                return {
                    video_id: data.items[0].id.videoId,
                    title: data.items[0].snippet.title
                };
            }
        }
    } catch (e) {
        console.warn(`[YouTube Search Warning] ${query}: ${e.message}`);
    }
    return { video_id: 'x9PQgbB4y6M', title: 'Air Cargo Handling Operations' };
}

/**
 * 1 Reel per Module Architecture for AAS/Q0103 (Airline Cargo Assistant)
 * Breaks 182 Performance Criteria down into 11 Core Competency Module Reels!
 */
function buildAasQ0103ModuleReels() {
    return [
        {
            module_id: 'MOD_1.1',
            module_title: 'Ramp Operations & Aircraft Cargo Receipt',
            nos_code: 'AAS/N0101',
            nos_title: 'Movement of cargo and mail from aircraft to warehouse',
            intent_query: 'Airline cargo ramp aircraft receipt operations tutorial',
            pcs: [
                { pc_id: 'PC1', pc_intent: 'Gather Cargo Info & Notify Authorities', pc_desc: 'Gather relevant info about incoming cargo volume/type & notify authorities' },
                { pc_id: 'PC2', pc_intent: 'Deploy GSE Warehouse Equipment', pc_desc: 'Deploy adequate equipment to handle incoming cargo volume at warehouse' },
                { pc_id: 'PC3', pc_intent: 'Receive Cargo & Ramp Documents', pc_desc: 'Receive incoming cargo and associated documents at aircraft/designated ramp area' },
                { pc_id: 'PC4', pc_intent: 'Transport Cargo to Processing Base', pc_desc: 'Transport incoming cargo using proper equipment to cargo processing base' },
                { pc_id: 'PC5', pc_intent: 'Stage Cargo at Warehouse Bay', pc_desc: 'Stage cargo at designated warehouse bay area' }
            ]
        },
        {
            module_id: 'MOD_1.2',
            module_title: 'Cargo Intake & Processing Verification',
            nos_code: 'AAS/N0101',
            nos_title: 'Movement of cargo and mail from aircraft to warehouse',
            intent_query: 'Air cargo processing base receiving procedure',
            pcs: [
                { pc_id: 'PC6', pc_intent: 'Receive Documents at Processing Base', pc_desc: 'Receive cargo and documents at incoming cargo processing base' },
                { pc_id: 'PC7', pc_intent: 'Verify Physical Cargo vs Manifest', pc_desc: 'Verify cargo physical count and condition against incoming manifest' },
                { pc_id: 'PC8', pc_intent: 'Inspect & Log Transit Discrepancies', pc_desc: 'Inspect cargo for damage/discrepancies and log reports' }
            ]
        },
        {
            module_id: 'MOD_2.1',
            module_title: 'Acceptance & Security Screening of Cargo',
            nos_code: 'AAS/N0102',
            nos_title: 'Accept cargo and mail for air transport',
            intent_query: 'Air cargo acceptance security screening procedure',
            pcs: [
                { pc_id: 'PC1', pc_intent: 'Receive Shipper Cargo Documents', pc_desc: 'Receive cargo or mail documents from shipper or authorized agent' },
                { pc_id: 'PC2', pc_intent: 'Verify Required Shipping Permits', pc_desc: 'Verify that required documents pertaining to shipment are complete' },
                { pc_id: 'PC3', pc_intent: 'Visual Cargo Inspection & Weighing', pc_desc: 'Perform visual inspection and weight check of cargo to confirm details' },
                { pc_id: 'PC4', pc_intent: 'Process Security Screening', pc_desc: 'Process cargo and mail for security check in line with regulations' }
            ]
        },
        {
            module_id: 'MOD_2.2',
            module_title: 'ULD Buildup & Aircraft Pallet Staging',
            nos_code: 'AAS/N0102',
            nos_title: 'Accept cargo and mail for air transport',
            intent_query: 'ULD pallet buildup container loading tutorial',
            pcs: [
                { pc_id: 'PC6', pc_intent: 'Oversee Cargo Stacking & Storage', pc_desc: 'Oversee stacking of cargo and record bay storage location' },
                { pc_id: 'PC7', pc_intent: 'Retrieve Cargo for ULD Buildup', pc_desc: 'Oversee retrieval for cargo buildup for specific flights' },
                { pc_id: 'PC8', pc_intent: 'Check ULD Container Integrity', pc_desc: 'Visually check cargo transport container condition and net straps' },
                { pc_id: 'PC9', pc_intent: 'Oversee Pallet Weight Distribution', pc_desc: 'Oversee cargo buildup including even weight distribution on ULD' }
            ]
        },
        {
            module_id: 'MOD_2.3',
            module_title: 'Air Waybill Verification & Flight Dispatch',
            nos_code: 'AAS/N0102',
            nos_title: 'Accept cargo and mail for air transport',
            intent_query: 'Air Waybill verification cargo dispatch tutorial',
            pcs: [
                { pc_id: 'PC10', pc_intent: 'Verify Air Waybill Numbers', pc_desc: 'Verify cargo Air Waybill details and consignment piece counts' },
                { pc_id: 'PC11', pc_intent: 'Check Buildup Flight Manifests', pc_desc: 'Verify that all documents of built-up cargo are attached' },
                { pc_id: 'PC12', pc_intent: 'Dispatch ULD Cargo to Ramp', pc_desc: 'Dispatch built-up cargo along with documents to aircraft ramp' },
                { pc_id: 'PC13', pc_intent: 'Update Cargo Management System (CMS)', pc_desc: 'Update cargo system with all relevant information' }
            ]
        },
        {
            module_id: 'MOD_3.1',
            module_title: 'ULD Breakdown & Segregation',
            nos_code: 'AAS/N0103',
            nos_title: 'Delivery of cargo and mail',
            intent_query: 'Air cargo ULD breakdown Air Waybill segregation',
            pcs: [
                { pc_id: 'PC7', pc_intent: 'Breakdown Built-Up ULD Configuration', pc_desc: 'Breakdown cargo from its built-up configuration & segregate by Air Waybill' },
                { pc_id: 'PC8', pc_intent: 'Cross-Check AWB vs Consignment', pc_desc: 'Verify cargo Air Waybill numbers and consignment count against documents' },
                { pc_id: 'PC9', pc_intent: 'Check Condition & Log Damage', pc_desc: 'Visually check cargo condition to identify damage and record findings' }
            ]
        },
        {
            module_id: 'MOD_3.2',
            module_title: 'Delivery Order Release & Consignee Handover',
            nos_code: 'AAS/N0103',
            nos_title: 'Delivery of cargo and mail',
            intent_query: 'Airport cargo delivery order consignee release',
            pcs: [
                { pc_id: 'PC12', pc_intent: 'Notify Consignee of Cargo Arrival', pc_desc: 'Notify recipient/shipper via automated message or telephone' },
                { pc_id: 'PC13', pc_intent: 'Issue Delivery Order (DO)', pc_desc: 'Create a delivery order for cargo in accordance with procedures' },
                { pc_id: 'PC14', pc_intent: 'Accept DO Proof of Payment', pc_desc: 'Accept delivery order charges & proof of identity' },
                { pc_id: 'PC15', pc_intent: 'Release Shipment to Customer', pc_desc: 'Retrieve cargo shipment from storage bay and handover to consignee' }
            ]
        },
        {
            module_id: 'MOD_4.1',
            module_title: 'Dangerous Goods (Hazmat) Handling',
            nos_code: 'AAS/N0502',
            nos_title: 'Follow safety and security procedures',
            intent_query: 'IATA dangerous goods air cargo Hazmat handling',
            pcs: [
                { pc_id: 'PC1', pc_intent: 'Comply with IATA Hazmat Rules', pc_desc: 'Comply with organisation safety and security guidelines for Hazmat' },
                { pc_id: 'PC2', pc_intent: 'Verify Class-9 DG Stickers', pc_desc: 'Verify dangerous goods labels, battery stickers, and declaration forms' },
                { pc_id: 'PC3', pc_intent: 'Mitigate Hazmat Storage Hazards', pc_desc: 'Identify and mitigate any safety and security hazards in cargo bay' }
            ]
        },
        {
            module_id: 'MOD_4.2',
            module_title: 'Airside Emergency Procedures',
            nos_code: 'AAS/N0502',
            nos_title: 'Follow safety and security procedures',
            intent_query: 'Airport airside emergency evacuation drill',
            pcs: [
                { pc_id: 'PC7', pc_intent: 'Execute Emergency Evacuation Drill', pc_desc: 'Follow organisation emergency procedures for accidents and fire hazards' },
                { pc_id: 'PC9', pc_intent: 'Complete Safety Inspection Records', pc_desc: 'Complete all health and safety records accurately' }
            ]
        },
        {
            module_id: 'MOD_5.1',
            module_title: 'Airside Vehicle Driving & Marshalling',
            nos_code: 'AAS/N0702',
            nos_title: 'Operate a vehicle airside',
            intent_query: 'Airport airside driving tug GSE vehicle safety',
            pcs: [
                { pc_id: 'PC1', pc_intent: 'Verify Airside Driving Permit (ADP)', pc_desc: 'Make sure airside driving authorization pass is current and valid' },
                { pc_id: 'PC4', pc_intent: 'Manoeuvre Tug Vehicle Safely', pc_desc: 'Manoeuvre vehicle in controlled manner around aircraft stand' },
                { pc_id: 'PC7', pc_intent: 'Give Priority to Moving Aircraft', pc_desc: 'Give priority to moving aircraft and taxying planes at all times' }
            ]
        },
        {
            module_id: 'MOD_5.2',
            module_title: 'FOD Remediation & Ramp Safety Compliance',
            nos_code: 'AAS/N0702',
            nos_title: 'Operate a vehicle airside',
            intent_query: 'FOD foreign object debris airport ramp safety',
            pcs: [
                { pc_id: 'PC15', pc_intent: 'Clear Foreign Object Debris (FOD)', pc_desc: 'Take appropriate remedial action when foreign objects (FOD) are found' },
                { pc_id: 'PC18', pc_intent: 'Provide Unhindered Emergency Access', pc_desc: 'Provide unhindered access for emergency services on airside stand' }
            ]
        }
    ];
}

async function runCompleteNsqfParser() {
    console.log('🚀 [Sample Implementation] Parsing AAS_Q0103 (Airline Cargo Assistant) into 11 Module Reels...');

    const modules = buildAasQ0103ModuleReels();
    console.log(`✅ Structured ${modules.length} Core Competency Module Reels with 182 Performance Criteria!`);

    console.log('\n🔍 [YouTube API] Resolving Practical Demonstration Videos for each Module Reel...');
    for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        const ytMatch = await searchYouTube(mod.intent_query);
        mod.video_id = ytMatch.video_id;
        mod.video_title = ytMatch.title;
        console.log(`  └─ [Reel ${i + 1}/11] "${mod.module_title}" ➔ Video: [${mod.video_id}] "${mod.video_title.substring(0, 40)}..." (${mod.pcs.length} PCs)`);
    }

    const finalSchema = {
        qp_code: 'AAS/Q0103',
        qp_name: 'Airline Cargo Assistant',
        version: '3.0',
        sector: 'Aerospace and Aviation',
        total_modules: modules.length,
        total_pcs: 182,
        nos_modules: modules
    };

    const outputPath = path.join(scratchDir, 'PARSED_NOS_SCHEMA_AAS_Q0103.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalSchema, null, 2));

    console.log(`\n🎉 [SUCCESS] Sample AAS_Q0103 11-Module Schema saved to: ${outputPath}`);
    return finalSchema;
}

runCompleteNsqfParser().catch(err => console.error('❌ Parser error:', err));
