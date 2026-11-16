'use strict';

/**
 * 📱 STAGE 2: Bilingual Intent & Query Synthesizer for ELE/Q0803 (Mobile Phone Repair Assistant)
 * 
 * Generates:
 * 1. clean_intent: Imperative action summary
 * 2. search_query_en: Targeted English YouTube search query
 * 3. search_query_hi: Devanagari Hindi YouTube search query
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../data/stage1_ele0803_extracted.json');
const outputPath = path.join(__dirname, '../data/stage2_ele0803_queries.json');

if (!fs.existsSync(inputPath)) {
    console.error('Stage 1 input missing:', inputPath);
    process.exit(1);
}

const stage1Data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const items = stage1Data.pcs || [];
console.log(`📦 Loaded ${items.length} criteria for ${stage1Data.qp_code}`);

// Domain-specific keyword mapping for mobile repair
function generateMobileRepairQueries(pc) {
    const desc = pc.full_description || '';
    const descLower = desc.toLowerCase();
    const elem = (pc.element_name || '').toLowerCase();
    const nos = pc.nos_code;

    let cleanIntent = '';
    let queryEn = '';
    let queryHi = '';

    // Specialized mappings based on Mobile Repair curriculum
    if (descLower.includes('electricity') || descLower.includes('voltage') || descLower.includes('current') || descLower.includes('resistance')) {
        cleanIntent = 'Understand basic electronics voltage and current in mobile circuits';
        queryEn = 'Basic electronics voltage current resistance mobile repair tutorial';
        queryHi = 'मोबाइल रिपेयरिंग बेसिक इलेक्ट्रॉनिक्स वोल्टेज और करंट सीखें';
    } else if (descLower.includes('capacitor') || descLower.includes('resistor') || descLower.includes('transistor') || descLower.includes('smd')) {
        cleanIntent = 'Identify and test SMD resistors capacitors and transistors on PCB';
        queryEn = 'Mobile PCB SMD components resistor capacitor transistor testing tutorial';
        queryHi = 'मोबाइल पीसीबी पर एसएमडी कंपोनेंट्स कैपेसिटर रेसिस्टर कैसे चेक करें';
    } else if (descLower.includes('2g') || descLower.includes('3g') || descLower.includes('4g') || descLower.includes('5g') || descLower.includes('generations')) {
        cleanIntent = 'Understand 2G 3G 4G 5G mobile network architecture and bands';
        queryEn = 'Mobile network architecture 2G 3G 4G 5G explained tutorial';
        queryHi = 'मोबाइल नेटवर्क 2G 3G 4G 5G तकनीक और बैंड्स कैसे काम करते हैं';
    } else if (descLower.includes('disassembly') || descLower.includes('reassembly') || descLower.includes('open phone') || descLower.includes('teardown')) {
        cleanIntent = 'Safely disassemble and reassemble smartphone body and screen';
        queryEn = 'Smartphone teardown and safe disassembly reassembly tools tutorial';
        queryHi = 'स्मार्टफोन को सुरक्षित खोलने और असेंबल करने का सही तरीका';
    } else if (descLower.includes('display') || descLower.includes('screen') || descLower.includes('touch') || descLower.includes('combo') || descLower.includes('folder')) {
        cleanIntent = 'Replace damaged smartphone display touchscreen folder';
        queryEn = 'Mobile phone screen replacement display folder change tutorial';
        queryHi = 'मोबाइल का डिस्प्ले फोल्डर और टच स्क्रीन कैसे बदलें';
    } else if (descLower.includes('battery') || descLower.includes('charging') || descLower.includes('bms') || descLower.includes('cc board')) {
        cleanIntent = 'Test and replace mobile battery and charging jack connector';
        queryEn = 'Smartphone charging port and battery replacement repair tutorial';
        queryHi = 'मोबाइल चार्जिंग जैक और बैटरी कैसे बदलें और चेक करें';
    } else if (descLower.includes('soldering') || descLower.includes('desoldering') || descLower.includes('smb') || descLower.includes('reballing') || descLower.includes('microsoldering')) {
        cleanIntent = 'Perform precision soldering and SMD component replacement';
        queryEn = 'Mobile PCB micro soldering and SMD component removal tutorial';
        queryHi = 'मोबाइल पीसीबी पर माइक्रो सोल्डरिंग और एसएमडी कंपोनेंट रिपेयर';
    } else if (descLower.includes('mic') || descLower.includes('speaker') || descLower.includes('ringer') || descLower.includes('audio')) {
        cleanIntent = 'Troubleshoot and replace mobile microphone speaker and ringer';
        queryEn = 'Mobile phone speaker ringer mic not working repair tutorial';
        queryHi = 'मोबाइल का स्पीकर माइक और रिंगर कैसे बदलें और रिपेयर करें';
    } else if (descLower.includes('camera') || descLower.includes('sensor') || descLower.includes('proximity')) {
        cleanIntent = 'Test and replace front and rear smartphone camera module';
        queryEn = 'Mobile phone front rear camera replacement repair tutorial';
        queryHi = 'स्मार्टफोन का कैमरा और सेंसर कैसे चेक और चेंज करें';
    } else if (descLower.includes('flashing') || descLower.includes('rom') || descLower.includes('firmware') || descLower.includes('bootloop')) {
        cleanIntent = 'Flash stock ROM firmware to fix software brick and bootloop';
        queryEn = 'Smartphone stock ROM flashing and bootloop software repair tutorial';
        queryHi = 'मोबाइल फोन फ्लैशिंग सॉफ्टवेयर कैसे चढ़ाएं Stock ROM Flashing';
    } else if (descLower.includes('frp') || descLower.includes('pattern') || descLower.includes('pin') || descLower.includes('unlock')) {
        cleanIntent = 'Safely unlock device pattern PIN and FRP lock recovery';
        queryEn = 'Smartphone FRP bypass and software unlocking tools tutorial';
        queryHi = 'स्मार्टफोन एफआरपी लॉक और पैटर्न अनलॉक सॉफ्टवेयर टूल गाइड';
    } else if (descLower.includes('data recovery') || descLower.includes('backup') || descLower.includes('restore')) {
        cleanIntent = 'Recover data and take backup from damaged or formatted smartphone';
        queryEn = 'Mobile data recovery from broken phone and backup restore guide';
        queryHi = 'टूटे या खराब मोबाइल से डेटा रिकवरी और बैकअप कैसे निकालें';
    } else if (descLower.includes('water damage') || descLower.includes('liquid') || descLower.includes('short circuit') || descLower.includes('dead phone')) {
        cleanIntent = 'Clean water damage PCB and troubleshoot short circuits on DC supply';
        queryEn = 'Water damage dead phone short circuit finding with DC power supply';
        queryHi = 'पानी में गिरे डेड मोबाइल को डीसी मशीन से कैसे ठीक करें Short Circuit';
    } else if (descLower.includes('multimeter') || descLower.includes('dc power') || descLower.includes('hot air') || descLower.includes('smd rework')) {
        cleanIntent = 'Use digital multimeter and hot air SMD rework station properly';
        queryEn = 'How to use digital multimeter and SMD rework station mobile repair';
        queryHi = 'मोबाइल रिपेयरिंग में डिजिटल मल्टीमीटर और एसएमडी ब्लोअर का सही उपयोग';
    } else if (descLower.includes('billing') || descLower.includes('customer') || descLower.includes('cost estimate') || descLower.includes('quotation')) {
        cleanIntent = 'Provide repair job cost estimation and customer service billing';
        queryEn = 'Mobile repair shop customer handling job card and billing process';
        queryHi = 'मोबाइल रिपेयरिंग दुकान पर जॉब कार्ड और कस्टमर बिलिंग कैसे करें';
    } else if (descLower.includes('esd') || descLower.includes('safety') || descLower.includes('anti-static') || descLower.includes('mat')) {
        cleanIntent = 'Follow ESD anti-static safety precautions in mobile repair lab';
        queryEn = 'ESD safety and anti static mat wrist strap mobile repair lab';
        queryHi = 'मोबाइल लैब में ईएसडी एंटी-स्टैटिक सुरक्षा और सावधानियां';
    } else if (nos.includes('N0101') || descLower.includes('employability') || descLower.includes('communication') || descLower.includes('workplace')) {
        cleanIntent = 'Maintain professional communication and workplace ethics';
        queryEn = 'Workplace professional communication and customer service skills';
        queryHi = 'कार्यस्थल पर बातचीत और पेशेवर व्यवहार के नियम';
    } else {
        // High-quality fallback extraction
        const words = desc.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).slice(0, 7).join(' ');
        cleanIntent = `Demonstrate ${words}`;
        queryEn = `Mobile phone repair ${words} practical demonstration`;
        queryHi = `मोबाइल रिपेयरिंग ${words} प्रैक्टिकल सीखें`;
    }

    return {
        clean_intent: cleanIntent,
        search_query_en: queryEn,
        search_query_hi: queryHi
    };
}

const synthesizedItems = [];

for (let i = 0; i < items.length; i++) {
    const pc = items[i];
    const queries = generateMobileRepairQueries(pc);

    synthesizedItems.push({
        qp_code: stage1Data.qp_code,
        nos_code: pc.nos_code,
        nos_title: pc.nos_title,
        element_name: pc.element_name,
        pc_code: pc.pc_code,
        full_description: pc.full_description,
        clean_intent: queries.clean_intent,
        search_query_en: queries.search_query_en,
        search_query_hi: queries.search_query_hi
    });
}

const outputData = {
    qp_code: stage1Data.qp_code,
    qp_name: stage1Data.qp_name,
    sector: 'Electronics',
    total_synthesized: synthesizedItems.length,
    items: synthesizedItems
};

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

console.log(`\n================================================================================`);
console.log(`✨ STAGE 2 BILINGUAL QUERY SYNTHESIS COMPLETE FOR ${stage1Data.qp_code}`);
console.log(`================================================================================`);
console.log(`   Total Synthesized Criteria: ${synthesizedItems.length}`);
console.log(`   Output Saved:              ${outputPath}`);
console.log(`================================================================================\n`);
console.log('Sample Synthesized Criteria (first 4):');
synthesizedItems.slice(0, 4).forEach((it, idx) => {
    console.log(`[${idx + 1}] ${it.pc_code} (${it.nos_code})`);
    console.log(`   Intent: "${it.clean_intent}"`);
    console.log(`   Query EN: "${it.search_query_en}"`);
    console.log(`   Query HI: "${it.search_query_hi}"`);
});
