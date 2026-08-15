'use strict';

/**
 * Sub-Step 1.1: Automated PDF Harvester & Downloader
 * Downloads official NCVET NSQF Curriculum PDFs from NSDC S3 buckets into local data/pdfs/ folder
 * and updates pipeline_status = 'pdf_downloaded' in SQLite.
 *
 * Usage:
 *   node scripts/nsqf_pdf_harvester.js --limit=5
 *   node scripts/nsqf_pdf_harvester.js --qp=AMH/Q0103
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const db = require('../server/db');

const PDF_DIR = path.join(__dirname, '..', 'data', 'pdfs');

// Ensure output directory exists
if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Construct default NSDC S3 PDF URL if missing
 */
function getPdfUrl(qpCode, version = '1.0') {
    const cleanCode = String(qpCode || '').replace(/\//g, '_');
    const cleanVer = String(version || '1.0').replace(/^v/i, '');
    return `https://s3.ap-south-1.amazonaws.com/nsdcproddocuments/qpPdf/${cleanCode}_v${cleanVer}.pdf`;
}

/**
 * Download a file via HTTP/HTTPS with redirect support
 */
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(destPath);
        const protocol = url.startsWith('https') ? https : http;

        const request = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        }, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                fileStream.close();
                fs.unlinkSync(destPath);
                return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                fileStream.close();
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            }

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close(() => {
                    const stats = fs.statSync(destPath);
                    if (stats.size < 1000) {
                        // File too small, likely an error page
                        fs.unlinkSync(destPath);
                        return reject(new Error(`Downloaded file too small (${stats.size} bytes)`));
                    }
                    resolve({ size: stats.size });
                });
            });
        });

        request.on('error', (err) => {
            fileStream.close();
            if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
            reject(err);
        });

        request.setTimeout(15000, () => {
            request.destroy();
            fileStream.close();
            if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
            reject(new Error('Download request timed out after 15s'));
        });
    });
}

/**
 * Main Harvester Function
 */
async function harvestPdfs() {
    const args = process.argv.slice(2);
    let limit = 5;
    let targetQp = null;

    args.forEach(arg => {
        if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1]);
        if (arg.startsWith('--qp=')) targetQp = arg.split('=')[1].trim();
    });

    console.log('================================================================================');
    console.log('📥 [Sub-Step 1.1] AUTOMATED NSQF CURRICULUM PDF HARVESTER & DOWNLOADER');
    console.log('================================================================================\n');

    let rows = [];
    if (targetQp) {
        rows = await db.prepare(`SELECT * FROM nsqf_qps WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?`).all(targetQp, targetQp.replace('/', '_'));
    } else {
        rows = await db.prepare(`SELECT * FROM nsqf_qps ORDER BY id ASC LIMIT ?`).all(limit);
    }

    if (rows.length === 0) {
        console.log('❌ No Qualification Packs found matching target criteria.');
        return;
    }

    console.log(`Processing ${rows.length} Qualification Packs...\n`);

    let downloadedCount = 0;
    let existingCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const qp = rows[i];
        const cleanCode = qp.qp_code.replace(/\//g, '_');
        const pdfFileName = `${cleanCode}.pdf`;
        const destPath = path.join(PDF_DIR, pdfFileName);
        const pdfUrl = qp.curriculum_pdf_url || getPdfUrl(qp.qp_code, qp.version);

        console.log(`[${i + 1}/${rows.length}] 📌 QP: ${qp.qp_code} — "${qp.qp_name}"`);
        console.log(`        Target PDF: ${pdfUrl}`);

        if (fs.existsSync(destPath)) {
            const stats = fs.statSync(destPath);
            console.log(`        ✅ Already Exists on Disk (${(stats.size / 1024).toFixed(1)} KB) ➔ ${destPath}`);
            existingCount++;

            // Sync database status (markdown_path set later by nsqf_pdf_to_md.py)
            await db.prepare(`
                UPDATE nsqf_qps 
                SET curriculum_pdf_url = ?, pipeline_status = 'pdf_downloaded'
                WHERE id = ?
            `).run(pdfUrl, qp.id);
            continue;
        }

        try {
            console.log(`        ⏳ Downloading PDF stream...`);
            const res = await downloadFile(pdfUrl, destPath);
            console.log(`        🎉 Download Complete (${(res.size / 1024).toFixed(1)} KB) ➔ Saved to data/pdfs/${pdfFileName}`);
            downloadedCount++;

            // Update database status (markdown_path set later by nsqf_pdf_to_md.py)
            await db.prepare(`
                UPDATE nsqf_qps 
                SET curriculum_pdf_url = ?, pipeline_status = 'pdf_downloaded'
                WHERE id = ?
            `).run(pdfUrl, qp.id);

        } catch (err) {
            console.warn(`        ⚠️ Download Warning: ${err.message}`);
            failedCount++;

            // Update database status to pending_pdf
            await db.prepare(`
                UPDATE nsqf_qps 
                SET curriculum_pdf_url = ?, pipeline_status = 'pending_pdf'
                WHERE id = ?
            `).run(pdfUrl, qp.id);
        }
        console.log('--------------------------------------------------------------------------------');
    }

    console.log('\n================================================================================');
    console.log(`📊 SUB-STEP 1.1 SUMMARY:`);
    console.log(`   Total QPs Processed:  ${rows.length}`);
    console.log(`   Newly Downloaded:     ${downloadedCount}`);
    console.log(`   Already Existing:     ${existingCount}`);
    console.log(`   Failed / Pending:     ${failedCount}`);
    console.log(`   PDF Output Directory: ${PDF_DIR}`);
    console.log('================================================================================\n');
}

harvestPdfs().catch(console.error);
