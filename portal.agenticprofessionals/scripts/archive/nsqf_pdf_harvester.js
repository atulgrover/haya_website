'use strict';

/**
 * Sub-Step 1.1: Automated PDF Harvester & Downloader (v2 — Multi-version S3 fallback)
 * Downloads official NCVET NSQF Curriculum PDFs from NSDC S3 buckets into local data/pdfs/ folder
 * and updates pipeline_status = 'pdf_downloaded' in local database.
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
 * Generate candidate NSDC S3 PDF URLs to handle versioning variations
 */
function getCandidatePdfUrls(qpCode, version = '1.0', explicitUrl = null) {
    const cleanCode = String(qpCode || '').replace(/\//g, '_');
    const cleanVer = String(version || '1.0').replace(/^v/i, '');
    const base = 'https://s3.ap-south-1.amazonaws.com/nsdcproddocuments/qpPdf';

    const candidates = [];
    if (explicitUrl && explicitUrl.startsWith('http')) {
        candidates.push(explicitUrl);
    }
    candidates.push(`${base}/${cleanCode}_v${cleanVer}.pdf`);
    candidates.push(`${base}/${cleanCode}_v1.0.pdf`);
    candidates.push(`${base}/${cleanCode}_v1.pdf`);
    candidates.push(`${base}/${cleanCode}_v2.0.pdf`);
    candidates.push(`${base}/${cleanCode}_V1.0.pdf`);
    candidates.push(`${base}/${cleanCode}.pdf`);

    // Return unique non-empty URLs
    return Array.from(new Set(candidates));
}

/**
 * Download a single URL via HTTP/HTTPS with redirect support
 */
function downloadSingleUrl(url, destPath) {
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
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                return downloadSingleUrl(response.headers.location, destPath).then(resolve).catch(reject);
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
                        // File too small, likely an XML error page
                        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                        return reject(new Error(`Downloaded file too small (${stats.size} bytes)`));
                    }
                    resolve({ size: stats.size, url });
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
 * Attempt downloading from candidate URLs in sequence until one succeeds
 */
async function downloadWithFallbacks(candidateUrls, destPath) {
    let lastError = null;
    for (const url of candidateUrls) {
        try {
            const res = await downloadSingleUrl(url, destPath);
            return res;
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error('All candidate URLs failed');
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
    try {
        if (targetQp) {
            rows = await db.prepare(`SELECT * FROM nsqf_qps WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?`).all(targetQp, targetQp.replace('/', '_'));
        } else {
            rows = await db.prepare(`SELECT * FROM nsqf_qps ORDER BY id ASC LIMIT ?`).all(limit);
        }
    } catch (dbErr) {
        console.warn(`⚠️  Database query note: ${dbErr.message} — falling back to direct mode.`);
        if (targetQp) {
            rows = [{
                id: null,
                qp_code: targetQp,
                qp_name: targetQp,
                version: '1.0',
                curriculum_pdf_url: null
            }];
        }
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
        const candidates = getCandidatePdfUrls(qp.qp_code, qp.version, qp.curriculum_pdf_url);

        console.log(`[${i + 1}/${rows.length}] 📌 QP: ${qp.qp_code} — "${qp.qp_name}"`);

        if (fs.existsSync(destPath)) {
            const stats = fs.statSync(destPath);
            console.log(`        ✅ Already Exists on Disk (${(stats.size / 1024).toFixed(1)} KB) ➔ ${destPath}`);
            existingCount++;

            // Sync database status if DB is accessible
            if (qp.id) {
                try {
                    await db.prepare(`
                        UPDATE nsqf_qps 
                        SET curriculum_pdf_url = COALESCE(curriculum_pdf_url, ?), pipeline_status = 'pdf_downloaded'
                        WHERE id = ?
                    `).run(candidates[0], qp.id);
                } catch {}
            }
            continue;
        }

        try {
            console.log(`        ⏳ Downloading with S3 fallback candidates...`);
            const res = await downloadWithFallbacks(candidates, destPath);
            console.log(`        🎉 Download Complete (${(res.size / 1024).toFixed(1)} KB) ➔ Saved to data/pdfs/${pdfFileName}`);
            downloadedCount++;

            // Update database status if DB is accessible
            if (qp.id) {
                try {
                    await db.prepare(`
                        UPDATE nsqf_qps 
                        SET curriculum_pdf_url = ?, pipeline_status = 'pdf_downloaded'
                        WHERE id = ?
                    `).run(res.url, qp.id);
                } catch {}
            }

        } catch (err) {
            console.warn(`        ⚠️ Download Warning for ${qp.qp_code}: ${err.message}`);
            failedCount++;

            if (qp.id) {
                try {
                    await db.prepare(`
                        UPDATE nsqf_qps 
                        SET pipeline_status = 'pending_pdf'
                        WHERE id = ?
                    `).run(qp.id);
                } catch {}
            }
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
