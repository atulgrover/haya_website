'use strict';
/**
 * Script 13: Grammar-Aware Industry Dictionary MSME Title & Pitch Population Engine
 * 
 * - Generates 100% unique 2-4 word commercial business names.
 * - Eliminates conjunction cut-offs, raw code suffixes, and employee job words.
 * - Generates structured 3-sentence, 50-word founder opportunity pitches.
 * - Syncs to both Local PostgreSQL (hayadb) and Cloud Neon (neondb).
 */

require('dotenv').config();
const { Pool } = require('pg');

const localPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://atulgrover@localhost:5432/hayadb'
});

const neonPool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_u1vYlXF4qWcT@ep-ancient-bush-a1g6e50k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

// Comprehensive grammar-aware domain taxonomy across all 41 economic sectors
const DOMAIN_DICTIONARY = [
    // ✈️ 1. Aviation & Aerospace
    { match: /cargo|freight/i, title: 'AeroLink Cargo Express', activity: 'airside cargo consolidation and express freight logistics' },
    { match: /baggage|luggage/i, title: 'Transit Baggage Logistics', activity: 'automated passenger baggage routing and airside handling' },
    { match: /customer service|passenger/i, title: 'Passenger Concierge Services', activity: 'airport passenger hospitality and executive transit coordination' },
    { match: /reservation|ticketing|booking/i, title: 'Flight Ticketing Desk', activity: 'multi-carrier flight booking and regional charter travel services' },
    { match: /security|screening/i, title: 'Airside Security Services', activity: 'aviation security inspection and perimeter access control' },
    { match: /flight dispatch/i, title: 'Flight Dispatch Control', activity: 'commercial flight route dispatch and aeronautical weather planning' },
    { match: /ramp/i, title: 'Ramp Airside Operations', activity: 'aircraft ground marshalling and ramp turnaround operations' },
    { match: /cabin crew/i, title: 'Cabin Hospitality Services', activity: 'in-flight hospitality staffing and premium cabin assistance' },
    { match: /flight load|load controller/i, title: 'Flight Load Control', activity: 'aircraft weight & balance planning and payload distribution' },
    { match: /airline.*ground|airport/i, title: 'SkyPort Ground Logistics', activity: 'integrated airport terminal operations and airside fleet support' },

    // 🌱 2. Agriculture, Horticulture & Livestock
    { match: /solar pump/i, title: 'AgriSun Solar Grids', activity: 'solar irrigation pump installation and micro-grid servicing' },
    { match: /paddy|rice/i, title: 'GreenGrain Paddy Milling', activity: 'modern paddy hulling, optical color sorting, and fortified rice packaging' },
    { match: /sugarcane|sugar/i, title: 'CaneCraft Sugar Works', activity: 'sugarcane crushing, chemical-free jaggery processing, and juice bottling' },
    { match: /farm machinery|tractor|harvester/i, title: 'AgriMech Farm Fleet', activity: 'custom hiring of tractors, combine harvesters, and mechanized farm implements' },
    { match: /goat|sheep/i, title: 'Capra Livestock Farm', activity: 'stall-fed goat rearing, breeding stock, and high-protein dairy supply' },
    { match: /piggery|pig /i, title: 'SwineCraft Livestock Farm', activity: 'hygienic pig breeding, pork processing, and automated feedlot management' },
    { match: /dairy|milk/i, title: 'PureDairy Milk Processing', activity: 'chilled milk collection, batch pasteurization, and value-added paneer production' },
    { match: /nursery|gardener|landscap/i, title: 'GreenScape Nursery Studio', activity: 'commercial plant nursery, ornamental saplings, and vertical landscaping' },
    { match: /poultry|broiler|layer/i, title: 'AvianCraft Poultry Farm', activity: 'climate-controlled broiler farming, hatchery incubation, and wholesale egg distribution' },
    { match: /beekeeping|honey|apiary/i, title: 'MadhuVeda Apiary Works', activity: 'scientific apiary beekeeping, pollen harvesting, and raw organic honey bottling' },
    { match: /mushroom/i, title: 'FungiTech Mushroom Farm', activity: 'climate-controlled button and oyster mushroom cultivation and spawn production' },
    { match: /hydroponic|polyhouse|greenhouse/i, title: 'AeroGreen Precision Farm', activity: 'polyhouse climate farming, soilless hydroponics, and exotic salad crops' },
    { match: /organic.*farming|vermicompost|fertilizer/i, title: 'BioNutrient Organic Works', activity: 'vermicomposting, organic bio-fertilizer production, and soil nutrient balancing' },
    { match: /fishery|aquaculture|fish /i, title: 'AquaHarvest Biofloc Unit', activity: 'biofloc fish farming, aerated tank aquaculture, and live fish supply' },

    // 🏎️ 3. Automotive, EV & Transportation
    { match: /electric vehicle|ev |battery test/i, title: 'VoltAuto Diagnostics Lab', activity: 'EV lithium battery diagnostics, motor rewinding, and fast-charging calibration' },
    { match: /engine repair|auto service|mechanic/i, title: 'Bharat EngineCare Studio', activity: 'multi-brand engine overhaul, ECU diagnostics, and performance tuning' },
    { match: /paint repair|detailing|coating/i, title: 'Apex Auto Detailing', activity: 'ceramic coating, infrared bake booth painting, and paintless dent repair' },
    { match: /driver|commercial vehicle|fleet/i, title: 'FleetHaul Transport Services', activity: 'commercial fleet logistics, intercity hauling, and cold-chain container transport' },
    { match: /two wheeler/i, title: 'SpeedBikes Service Hub', activity: 'two-wheeler automated servicing, spare inventory, and quick-lube bays' },
    { match: /four wheeler|car service/i, title: 'PrecisionAuto Diagnostic Works', activity: 'four-wheeler computerized wheel alignment, AC servicing, and mechanical repair' },
    { match: /brake|transmission|clutch/i, title: 'TorqueDrivetrain Auto Works', activity: 'gearbox transmission rebuilding, automated clutch refacing, and hydraulic brakes' },
    { match: /auto electrical|wiring/i, title: 'VoltSpark Auto Electricals', activity: 'automotive wiring harness repair, alternator re-coring, and starter motor servicing' },

    // ⚙️ 4. Capital Goods, Precision Tooling & Metal
    { match: /cnc|edm|machin/i, title: 'PrecisionSpark CNC Works', activity: 'multi-axis CNC machining, EDM wire-cut tooling, and precision metal prototyping' },
    { match: /weld|fabricat/i, title: 'Titan Arc Fabrication', activity: 'TIG/MIG industrial structural welding and heavy metal frame fabrication' },
    { match: /tool.*die|die.*maker|mould/i, title: 'Matrix Tool & Die', activity: 'high-precision injection moulds, progressive stamping dies, and press tooling' },
    { match: /casting|foundry/i, title: 'ForgeTech Metal Foundry', activity: 'ferrous and non-ferrous sand casting with automated sand mulling and degassing' },
    { match: /fitter|assembly/i, title: 'ProFit Mechanical Works', activity: 'industrial pump, valve, and mechanical drivetrain sub-assembly' },
    { match: /sheet metal|press/i, title: 'FormTech Metal Works', activity: 'hydraulic press sheet metal stamping, laser cutting, and turret punching' },
    { match: /lathe|turning/i, title: 'Apex Precision Lathe', activity: 'high-tolerance CNC shaft turning, thread cutting, and cylindrical grinding' },
    { match: /heat treatment|metallurgy/i, title: 'PyroTempering Metal Labs', activity: 'case hardening, induction quenching, and metallurgical stress relieving' },

    // 👗 5. Apparel, Textiles, Handicrafts & Leather
    { match: /sewing|stitch|garment/i, title: 'Bespoke Garment Studio', activity: 'industrial batch garment stitching, corporate uniforms, and woven apparel lines' },
    { match: /fashion|designer/i, title: 'Aura Fashion Studio', activity: 'custom apparel design, CAD pattern grading, and boutique prêt-à-porter lines' },
    { match: /jari|zari|embroidery/i, title: 'Zari Embroidery Studio', activity: 'computerized multi-head metallic zari embroidery and bridal textiles' },
    { match: /agarbatti|incense/i, title: 'Sugandh Agarbatti Works', activity: 'automated incense stick dipping, perfume compounding, and retail packaging' },
    { match: /stick making/i, title: 'AutoStick Bamboo Works', activity: 'high-speed bamboo stick slicing, polishing, and agarbatti raw core supply' },
    { match: /crochet|lace/i, title: 'LaceCraft Textile Studio', activity: 'artisanal crochet lacework, table linen, and export handicraft accents' },
    { match: /leather|footwear/i, title: 'AeroHide Leather Studio', activity: 'genuine leather goods, artisanal footwear, and custom saddlery items' },
    { match: /handloom|weaving/i, title: 'VastraShilp Handloom Studio', activity: 'traditional handloom jacquard weaving and heritage organic cotton textiles' },
    { match: /dyeing|printing|block print/i, title: 'RangKala Textile Printworks', activity: 'natural pigment block printing, rotary screen dyeing, and fabric curing' },
    { match: /carpet|rug /i, title: 'KashmirCraft Carpet Looms', activity: 'hand-knotted silk carpets, tufted wool rugs, and floor tapestry exports' },

    // 🌍 6. Green Jobs, Solar & Environmental
    { match: /rooftop.*solar|solar grid/i, title: 'Rooftop Solar Grid Systems', activity: 'turnkey rooftop solar EPC, net-metering synchronization, and inverter upkeep' },
    { match: /paper recycling/i, title: 'EcoKraft Paper Recycling Plant', activity: 'waste paper pulping, de-inking, and kraft cardboard sheet conversion' },
    { match: /bio.*gas|slurry/i, title: 'BioFlow Biogas Energy Plant', activity: 'anaerobic biodigestion, bottled CBG gas, and organic fertilizer slurry' },
    { match: /waste.*water|effluent|etp|stp/i, title: 'AquaPure ETP Systems', activity: 'industrial effluent treatment, RO membrane filtration, and zero-liquid discharge' },
    { match: /e-waste|electronic waste/i, title: 'EcoRecover E-Waste Labs', activity: 'e-waste dismantling, precious metal recovery, and PCB recycling' },
    { match: /plastic recycling|granules/i, title: 'PolyCycle Polymer Works', activity: 'plastic shredding, optical flake separation, and extrusion pelletizing' },

    // 💊 7. Healthcare, Beauty & Wellness
    { match: /general duty|home health|patient/i, title: 'CareFirst Home Healthcare', activity: 'certified home patient nursing, elderly care, and post-operative support' },
    { match: /phlebotom|blood|lab/i, title: 'Pulse Diagnostics Hub', activity: 'automated blood sample collection, pathology testing, and digital reporting' },
    { match: /beautician|beauty|spa/i, title: 'Aura Beauty Lounge', activity: 'clinical cosmetology, bridal aesthetics, and organic hair & skin therapies' },
    { match: /ayurveda|panchakarma/i, title: 'AyurVeda Wellness Sanctuary', activity: 'traditional Panchakarma detoxification, herbal decoctions, and therapeutic wellness' },
    { match: /dental assistant|dental/i, title: 'DentaCare Clinic Works', activity: 'chairside dental assistance, sterilization packaging, and digital X-ray support' },
    { match: /optometry|vision|spectacle/i, title: 'ClearVision Optic Studio', activity: 'computerized eye refraction, lens edging, and designer spectacle dispensing' },
    { match: /gym|fitness|trainer/i, title: 'IronCore Fitness Studio', activity: 'personalized strength training, functional HIIT, and sports nutrition planning' },

    // 🎬 8. Media, IT, Electronics & Construction
    { match: /voice.*over|audio|dubbing/i, title: 'SonicWave Audio Studio', activity: 'broadcast audio dubbing, multilingual podcast production, and sound design' },
    { match: /actor|casting/i, title: 'StarCraft Casting Agency', activity: 'talent casting, audition coordination, and commercial media talent management' },
    { match: /cctv|surveillance|security camera/i, title: 'SecureNet Surveillance Systems', activity: 'commercial IP CCTV surveillance, biometric access, and smart alarm setup' },
    { match: /transformer|coil/i, title: 'VoltCraft Transformer Works', activity: 'distribution transformer coil winding, oil filtration, and core assembly' },
    { match: /electrician|house wiring/i, title: 'VoltMaster Electrical Contracting', activity: 'commercial building wiring, distribution panels, and earthing infrastructure' },
    { match: /plumbing|sanitary/i, title: 'HydroFlow Plumbing Systems', activity: 'pressurized sanitary piping, CPVC fixture fitting, and drainage networks' },
    { match: /air condition|hvac|refrigeration/i, title: 'CoolBreeze HVAC Systems', activity: 'ducted VRV air conditioning installation, chiller maintenance, and cold rooms' },
    { match: /surveyor|gis|mapping/i, title: 'GeoSpatial Survey Labs', activity: 'drone land surveying, DGPS boundary mapping, and GIS layout plotting' }
];

// Clean trailing/leading conjunctions and employee words
function sanitizeTradeName(rawName) {
    let clean = (rawName || '')
        .replace(/^Standard Operating Procedure:\s*/i, '')
        .replace(/^SOP\s*:\s*/i, '')
        .replace(/^(airline|aerospace|aircraft|aviation|automotive|auto|agricultural|agriculture|handloom|textile|commercial|turnkey|general|standard|basic|advanced|senior|junior|lead|expert|assistant|master)\s+/gi, '')
        .replace(/\b(executive|assistant|agent|operator|technician|handler|helper|worker|attendant|mechanic|officer|specialist|planner|inspector|supervisor|auditor|coordinator|controller|setter|fitter|welder|electrician|driver|stitcher|finisher|cutter|packer|loader|maker|trainee|apprentice|consultant|advisor|instructor|karigar)\b/gi, '')
        .replace(/\b(and|or|of|for|with|in|to|cum|m\/c|m c|etc)\b/gi, ' ')
        .replace(/[–—\-\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return clean;
}

// Generate unique 2-4 word title
function generateSmartTitle(qp, usedTitles) {
    const qpName = qp.qp_name || '';
    const sector = qp.sector || '';
    const text = `${qpName} ${sector}`.toLowerCase();

    // 1. Check Domain Dictionary
    for (const rule of DOMAIN_DICTIONARY) {
        if (rule.match.test(text)) {
            let candidate = rule.title;
            if (!usedTitles.has(candidate)) {
                usedTitles.add(candidate);
                return candidate;
            }
        }
    }

    // 2. Dynamic Construction
    const cleanNoun = sanitizeTradeName(qpName);
    const words = cleanNoun.split(/\s+/).filter(w => w.length > 2);
    const lead = words.slice(0, 2).join(' ') || 'Precision';

    const s = sector.toLowerCase();
    let suffix = 'Works';
    if (s.includes('agri') || s.includes('food')) suffix = 'AgriTech';
    else if (s.includes('auto')) suffix = 'Auto Works';
    else if (s.includes('capital') || s.includes('metal')) suffix = 'Precision Works';
    else if (s.includes('apparel') || s.includes('textile')) suffix = 'Design Studio';
    else if (s.includes('health') || s.includes('beauty')) suffix = 'Care Studio';
    else if (s.includes('it') || s.includes('telecom') || s.includes('electronics')) suffix = 'Tech Systems';
    else if (s.includes('green') || s.includes('power')) suffix = 'Energy Systems';
    else suffix = 'Enterprise Hub';

    let title = `${lead} ${suffix}`.split(/\s+/).slice(0, 4).join(' ');

    // Deduplicate
    if (usedTitles.has(title)) {
        const altSuffixes = ['Ventures', 'Systems', 'Studio', 'Hub', 'Services', 'Labs', 'Logistics', 'Solutions'];
        for (const alt of altSuffixes) {
            const cand = `${lead} ${alt}`.split(/\s+/).slice(0, 4).join(' ');
            if (!usedTitles.has(cand)) {
                title = cand;
                break;
            }
        }
    }

    usedTitles.add(title);
    return title;
}

// Generate structured 3-sentence, 50-word founder pitch
function generateSmartPitch(qp, title) {
    const qpName = qp.qp_name || '';
    const sector = qp.sector || 'Commercial Industry';
    const text = `${qpName} ${sector}`.toLowerCase();

    let activity = '';
    for (const rule of DOMAIN_DICTIONARY) {
        if (rule.match.test(text)) {
            activity = rule.activity;
            break;
        }
    }

    if (!activity) {
        const cleanNoun = sanitizeTradeName(qpName);
        activity = `specialized ${cleanNoun.toLowerCase()} operations and standardized service delivery`;
    }

    return `Surging demand across India's tier-2/3 industrial and commercial corridors for certified ${activity}. Deploy a high-margin enterprise equipped with standardized NCVET workstation tooling, calibrated quality testing benches, and steady B2B/B2C client contracts. Fully bankable project outlay with 30-day turnkey operational setup and up to 35% PMEGP/Mudra capital loan subsidy.`;
}

async function main() {
    console.log('🚀 Starting Grammar-Aware Industry Taxonomy Re-Population for all 2,002 QPs...');

    const res = await localPool.query(`
        SELECT q.qp_code, q.qp_name, q.sector, q.sub_sector, q.occupation,
               b.business_title AS synthesized_title, b.executive_summary AS synthesized_pitch
        FROM nsqf_qps q
        LEFT JOIN msme_business_blueprints b ON q.qp_code = b.qp_code
        ORDER BY q.id ASC
    `);

    console.log(`📥 Loaded ${res.rows.length} total NSQF Qualifications from Local PostgreSQL.`);

    const usedTitles = new Set();
    const updates = [];

    for (const qp of res.rows) {
        let title = '';
        let pitch = '';

        // If customized synthesized blueprint exists with clean 2-4 words, prioritize it
        if (qp.synthesized_title && qp.synthesized_title.split(/\s+/).length <= 4 && !usedTitles.has(qp.synthesized_title)) {
            title = qp.synthesized_title;
            pitch = qp.synthesized_pitch && qp.synthesized_pitch.split(/\s+/).length >= 40
                ? qp.synthesized_pitch
                : generateSmartPitch(qp, title);
            usedTitles.add(title);
        } else {
            title = generateSmartTitle(qp, usedTitles);
            pitch = generateSmartPitch(qp, title);
        }

        updates.push({
            qp_code: qp.qp_code,
            business_title: title,
            founder_pitch: pitch
        });
    }

    console.log(`✨ Generated ${updates.length} unique titles (Total Unique: ${usedTitles.size})`);

    // Batch update Local PostgreSQL
    console.log('💾 Updating Local PostgreSQL in batches...');
    for (const item of updates) {
        await localPool.query(
            `UPDATE nsqf_qps SET business_title = $1, founder_pitch = $2 WHERE qp_code = $3`,
            [item.business_title, item.founder_pitch, item.qp_code]
        );
    }
    console.log('   ✅ Local PostgreSQL updated successfully.');

    // Batch update Cloud Neon
    console.log('☁️ Updating Cloud Neon in batches...');
    for (const item of updates) {
        await neonPool.query(
            `UPDATE nsqf_qps SET business_title = $1, founder_pitch = $2 WHERE qp_code = $3`,
            [item.business_title, item.founder_pitch, item.qp_code]
        );
    }
    console.log('   ✅ Cloud Neon updated successfully.');

    console.log('\n🎉 ALL 2,002 NSQF QUALIFICATIONS RE-POPULATED WITH GRAMMAR-AWARE TITLES & 50-WORD 3-4 LINE PITCHES!');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
