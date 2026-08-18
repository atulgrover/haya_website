'use strict';

/**
 * 📸 Automated Compliance Evidence Screenshot Generator
 * Generates the 4 exact high-resolution PNG compliance screenshots for Google YouTube API Verification.
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
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

    const outputDir = path.join('/Users/atulgrover/Desktop', 'YouTube_API_Evidence');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\n================================================================================`);
    console.log(`📸 GENERATING 4 COMPLIANCE SCREENSHOTS FOR GOOGLE YOUTUBE API QUOTA REQUEST`);
    console.log(`================================================================================\n`);

    // 1. Privacy Policy Screenshot
    console.log('📸 1. Capturing Privacy Policy (YouTube & Google Policy disclosures)...');
    await page.goto('http://localhost:3099/privacy', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        const sec = document.getElementById('youtube-compliance') || document.querySelectorAll('.policy-section')[3];
        if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 600));
    const p1 = path.join(outputDir, '1_Privacy_Policy_YouTube_Compliance.png');
    await page.screenshot({ path: p1, fullPage: false });
    console.log(`   ✅ Saved: ${p1}`);

    // 2. Homepage Footer Screenshot
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

    // 3. Terms of Service Screenshot
    console.log('📸 3. Capturing Terms of Service (YouTube Content & Terms disclosures)...');
    await page.goto('http://localhost:3099/terms', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        const sec = document.getElementById('youtube-terms') || document.querySelectorAll('.policy-section')[2];
        if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 600));
    const p3 = path.join(outputDir, '3_Terms_of_Service_YouTube_Compliance.png');
    await page.screenshot({ path: p3, fullPage: false });
    console.log(`   ✅ Saved: ${p3}`);

    // 4. Video Player & Learning Reel Embed Screenshot
    console.log('📸 4. Capturing YouTube Player Embed in Students NSQF Skillpedia...');
    await page.goto('http://localhost:3099/reel.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    const p4 = path.join(outputDir, '4_YouTube_Player_Embed_Skillpedia.png');
    await page.screenshot({ path: p4, fullPage: false });
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
