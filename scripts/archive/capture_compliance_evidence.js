'use strict';

/**
 * 📸 Automated Compliance Evidence Screenshot Generator
 * Generates the 4 exact high-resolution PNG compliance screenshots for Google YouTube API Verification:
 * 1. Privacy Policy (Section 4: 7-Day Ephemeral Cache, 100% Free Public Education, No Paywalls, Google Security Links)
 * 2. Homepage Footer (Showing Privacy Policy & Terms of Service links)
 * 3. Terms of Service (Section 3: YouTube Terms Agreement, Google Privacy Policy, 7-Day Ephemeral Cache)
 * 4. Interactive Video Player & Bilingual Viva Quiz Modal in NSQF Skillpedia
 */

const fs = require('fs');
const path = require('path');

async function capture() {
    let puppeteer;
    try {
        puppeteer = require('puppeteer');
    } catch (e) {
        console.log('Installing puppeteer locally for screenshot capture...');
        require('child_process').execSync('npm install --no-save puppeteer', { stdio: 'inherit' });
        puppeteer = require('puppeteer');
    }

    const express = require('express');
    const app = express();
    app.use(express.static(path.join(__dirname, '..')));
    app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, '../privacy.html')));
    app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, '../terms.html')));
    
    let server = null;
    try {
        server = await new Promise(resolve => {
            const s = app.listen(3099, () => resolve(s));
        });
    } catch (_) {}

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 2 });

    const outputDir = path.join('/Users/atulgrover/Desktop', 'YouTube_API_Evidence');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\n================================================================================`);
    console.log(`📸 GENERATING 4 COMPLIANCE SCREENSHOTS FOR GOOGLE YOUTUBE API QUOTA REQUEST`);
    console.log(`================================================================================\n`);

    // ── 1. Privacy Policy Screenshot ──────────────────────────────────────────
    console.log('📸 1. Capturing Privacy Policy (Section 4: 7-Day Cache, Free Education, Google links)...');
    await page.goto('http://localhost:3099/privacy', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        const sec = document.getElementById('youtube-compliance') || document.querySelectorAll('.policy-section')[3];
        if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 600));
    const p1 = path.join(outputDir, '1_Privacy_Policy_YouTube_Compliance.png');
    await page.screenshot({ path: p1, fullPage: false });
    console.log(`   ✅ Saved: ${p1}`);

    // ── 2. Homepage Footer Screenshot ─────────────────────────────────────────
    console.log('📸 2. Capturing Homepage Footer (showing Privacy Policy & Terms of Service links)...');
    await page.goto('http://localhost:3099/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        const footer = document.querySelector('footer');
        if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 600));
    const p2 = path.join(outputDir, '2_Homepage_Footer_Privacy_Links.png');
    await page.screenshot({ path: p2, fullPage: false });
    console.log(`   ✅ Saved: ${p2}`);

    // ── 3. Terms of Service Screenshot ────────────────────────────────────────
    console.log('📸 3. Capturing Terms of Service (Section 3: YouTube Agreement & Free Access)...');
    await page.goto('http://localhost:3099/terms', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        const sec = document.getElementById('youtube-terms') || document.querySelectorAll('.policy-section')[2];
        if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 600));
    const p3 = path.join(outputDir, '3_Terms_of_Service_YouTube_Compliance.png');
    await page.screenshot({ path: p3, fullPage: false });
    console.log(`   ✅ Saved: ${p3}`);

    // ── 4. Interactive YouTube Player & Bilingual Viva Quiz Modal ─────────────
    console.log('📸 4. Capturing New YouTube Player & Viva Quiz Modal in NSQF Skillpedia...');
    await page.goto('http://localhost:3099/employees_nsqf.html', { waitUntil: 'networkidle0' });
    
    // Inject rich sample PC data with YouTube player, auto-bounds, study takeaways, and viva quiz
    await page.evaluate(() => {
        window.activeInspectorAllPcs = [
            {
                pc_id: 'PC1.1',
                pc_intent: 'Solar PV String Inverter Site Survey & Polarity Verification',
                pc_intent_hi: 'सोलर पीवी स्ट्रिंग इन्वर्टर साइट सर्वेक्षण और ध्रुवीयता सत्यापन',
                pc_desc: 'Execute systematic site survey and Voc string polarity testing for solar PV array installation per IEC 62852 and IS 3043 standards.',
                video_id: '8aGhZQkoFbQ',
                start_seconds: 45,
                end_seconds: 135,
                nos_code: 'SGJ/N0101',
                nos_title: 'Site survey for installation of solar PV system',
                qp_code: 'SGJ/Q0101',
                qp_name: 'Solar PV Installer (Suryamitra) — NCVET Level 4.0',
                study_takeaways: {
                    pro_tips: [
                        'Verify MC4 solar connector contact resistance (<0.5 Ω) using calibrated micro-ohmmeter before array coupling.',
                        'Maintain standardized station illumination (>300 Lux) and verify IS 3043 station earthing resistance (<2.0 Ω).'
                    ],
                    common_mistakes: [
                        'Skipping Voc string polarity verification prior to central inverter DC combiner connection.',
                        'Operating without verifying statutory PPE dielectric isolation rating (>1000V DC).'
                    ],
                    safety_mandate: 'Statutory safety mandates strict Lockout-Tagout (LOTO), certified dielectric PPE, and IS 3043 earthing (<2.0 Ohms).'
                },
                viva_quiz: [
                    {
                        question_en: 'What is the maximum allowable contact resistance for an MC4 solar connector during PV string installation?',
                        question_hi: 'सोलर पीवी स्ट्रिंग इंस्टॉलेशन के दौरान MC4 कनेक्टर के लिए अधिकतम स्वीकार्य संपर्क प्रतिरोध कितना है?',
                        options: [
                            { text: '0.5 Ω (milli-ohm level) — IEC 62852 Standard', is_correct: true },
                            { text: '5.0 Ω', is_correct: false },
                            { text: '25.0 Ω', is_correct: false }
                        ],
                        explanation: 'IEC 62852 standards mandate contact resistance < 0.5 Ω to prevent localized heating and DC arc faults.'
                    },
                    {
                        question_en: 'What is the mandatory earthing resistance limit for solar PV array structures in India?',
                        question_hi: 'भारत में सोलर पीवी एरे संरचनाओं के लिए अनिवार्य अर्थिंग प्रतिरोध सीमा क्या है?',
                        options: [
                            { text: '< 2.0 Ohms (IS 3043 Indian Standard)', is_correct: true },
                            { text: '< 50.0 Ohms', is_correct: false },
                            { text: 'Earthing is optional', is_correct: false }
                        ],
                        explanation: 'Indian Standard IS 3043 specifies station earthing resistance must not exceed 2.0 Ohms for safe fault dissipation.'
                    },
                    {
                        question_en: 'Which safety protocol must be executed immediately if string Voc polarity inversion is detected?',
                        question_hi: 'यदि स्ट्रिंग Voc ध्रुवीयता उलटाव का पता चलता है तो तुरंत किस सुरक्षा प्रोटोकॉल का पालन किया जाना चाहिए?',
                        options: [
                            { text: 'Open DC isolator and correct string wiring before combiner connection', is_correct: true },
                            { text: 'Close AC breaker to test inverter tolerance', is_correct: false },
                            { text: 'Ignore and continue commissioning', is_correct: false }
                        ],
                        explanation: 'Reversed polarity damages inverter DC input bridges and must be corrected at the isolator.'
                    }
                ]
            }
        ];

        // Trigger open modal
        if (typeof openPcTiddlerModal === 'function') {
            openPcTiddlerModal('PC1.1');
        }
    });

    await new Promise(r => setTimeout(r, 1200));

    // Scroll modal content to display both the video player and the viva quiz
    const modalElement = await page.$('#pcTiddlerModal > div');
    const p4 = path.join(outputDir, '4_YouTube_Player_Embed_Skillpedia.png');
    if (modalElement) {
        await modalElement.screenshot({ path: p4 });
    } else {
        await page.screenshot({ path: p4, fullPage: false });
    }
    console.log(`   ✅ Saved: ${p4}`);

    await browser.close();
    if (server) server.close();

    console.log(`\n================================================================================`);
    console.log(`🎉 ALL 4 COMPLIANCE SCREENSHOTS READY ON YOUR DESKTOP!`);
    console.log(`📁 Folder: ${outputDir}`);
    console.log(`================================================================================\n`);
}

capture().catch(err => {
    console.error('Screenshot error:', err);
    process.exit(1);
});
