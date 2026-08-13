'use strict';

/**
 * Pass 1 Script: Instant Structural Ingestion into SQLite
 * Parses all converted Markdown files in data/md/, filters out generic soft skills (VSQ/DGT Employability Skills),
 * extracts core vocational NOS, Modules, and PCs, and populates SQLite relational tables:
 *   - nsqf_nos
 *   - nsqf_modules
 *   - nsqf_pcs (with pc_intent = NULL, ready for Pass 2 LLM Intent Synthesis)
 *
 * Usage:
 *   node scripts/nsqf_pass1_structure_ingest.js --limit=5
 *   node scripts/nsqf_pass1_structure_ingest.js --qp=WBSC/HCS/Q0501
 *   node scripts/nsqf_pass1_structure_ingest.js --limit=2176
 */

const fs = require('fs');
const path = require('path');
const db = require('../server/db');

const MD_DIR = path.join(__dirname, '..', 'data', 'md');

/**
 * Filter out generic employability / soft skills NOS codes & titles
 */
function isGenericSoftSkillNos(code, title) {
    const cUpper = String(code || '').toUpperCase();
    const tUpper = String(title || '').toUpperCase();

    // Check generic prefixes
    if (cUpper.startsWith('VSQ/') || cUpper.startsWith('DGT/') || cUpper.includes('/VSQ/')) return true;

    // Check soft skill title keywords
    if (/employability skills|english communication|basic discipline|soft skills|gender sensitivity|environmental health/i.test(tUpper)) {
        if (/employability/i.test(tUpper)) return true;
    }

    return false;
}

/**
 * Clean text strings
 */
function cleanText(txt) {
    return String(txt || '').replace(/\s+/g, ' ').replace(/\.{3,}/g, '').trim();
}

/**
 * Parse a Markdown file into structured NOS, Modules, and PCs
 */
function parseMarkdownToStructure(filePath, qpCode, qpName) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const nosList = [];
    const modulesList = [];
    const pcsList = [];

    let currentNos = null;
    let currentModule = null;
    let nosOrder = 1;
    let modOrder = 1;
    let pcOrder = 1;

    // 1. Scan NOS catalog summary section first
    const nosSummaryRegex = /([A-Z0-9_]{3,8}\/[A-Z0-9_]{2,8}\/N[0-9]{3,4}|[A-Z0-9_]{3,8}\/N[0-9]{3,4})\s*:?\s*([^\n]+)/gi;
    let summaryMatch;
    const seenNosCodes = new Set();

    while ((summaryMatch = nosSummaryRegex.exec(content)) !== null) {
        const code = summaryMatch[1].trim();
        let title = cleanText(summaryMatch[2].replace(/^NOS Name|^Description|^-\s*/i, ''));
        title = title.replace(/[\.\s]*\d+\s*$/, ''); // Strip page number tails

        if (!seenNosCodes.has(code) && !isGenericSoftSkillNos(code, title)) {
            seenNosCodes.add(code);
            nosList.push({
                nos_code: code,
                nos_title: title || `${code} Vocational Unit`,
                sequence_order: nosOrder++
            });
        }
    }

    // Default Fallback NOS if none matched summary
    if (nosList.length === 0) {
        const defaultNosCode = `${qpCode.replace('/', '_')}_N01`;
        nosList.push({
            nos_code: defaultNosCode,
            nos_title: `${qpName || qpCode} Core Vocational Operations`,
            sequence_order: 1
        });
    }

    currentNos = nosList[0];

    // 2. Scan Modules and PCs
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check if line indicates a new NOS section
        const nosCheck = line.match(/([A-Z0-9_]{3,8}\/[A-Z0-9_]{2,8}\/N[0-9]{3,4}|[A-Z0-9_]{3,8}\/N[0-9]{3,4})\s*:?\s*([^\n]+)/i);
        if (nosCheck) {
            const foundCode = nosCheck[1].trim();
            const matchingNos = nosList.find(n => n.nos_code === foundCode);
            if (matchingNos) {
                currentNos = matchingNos;
                currentModule = null; // reset active module
            }
        }

        // Check if line indicates a Training Module
        if (/^####\s*(Module|Unit\s*\d+|Section\s*\d+)/i.test(line) || /^Module\s*\d+/i.test(line)) {
            const modTitle = cleanText(line.replace(/^####\s*/, ''));
            if (modTitle.length > 3) {
                currentModule = {
                    nos_code: currentNos ? currentNos.nos_code : nosList[0].nos_code,
                    module_title: modTitle,
                    sequence_order: modOrder++
                };
                modulesList.push(currentModule);
            }
        }

        // Check if line indicates a Performance Criteria (PC)
        const pcMatch = line.match(/^(####\s*)?(PC\s*\d+[\.\d]*)\s*[\.:-]?\s*(.+)/i) || line.match(/^\|\s*(PC\s*\d+[\.\d]*)\s*[\.:-]?\s*([^|]+)/i);
        if (pcMatch) {
            const pcCode = pcMatch[2].replace(/\s+/g, '').toUpperCase();
            const pcDesc = cleanText(pcMatch[3]);

            if (pcDesc.length > 5) {
                // Ensure parent module exists
                if (!currentModule) {
                    currentModule = {
                        nos_code: currentNos ? currentNos.nos_code : nosList[0].nos_code,
                        module_title: `Module ${modulesList.length + 1}: ${currentNos ? currentNos.nos_title : 'Core Practical Execution'}`,
                        sequence_order: modOrder++
                    };
                    modulesList.push(currentModule);
                }

                pcsList.push({
                    nos_code: currentModule.nos_code,
                    module_title: currentModule.module_title,
                    pc_code: pcCode,
                    pc_description: pcDesc,
                    sequence_order: pcOrder++
                });
            }
        }
    }

    return { nosList, modulesList, pcsList };
}

/**
 * Main Pass 1 Structural Ingestion Function
 */
async function processPass1Ingestion() {
    const args = process.argv.slice(2);
    let limit = 2176;
    let targetQp = null;

    args.forEach(arg => {
        if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1]);
        if (arg.startsWith('--qp=')) targetQp = arg.split('=')[1].trim();
    });

    console.log('================================================================================');
    console.log('🏛️ [PASS 1] INSTANT STRUCTURAL INGESTION INTO SQLITE DATABASE');
    console.log('   (Populating nsqf_nos, nsqf_modules, and nsqf_pcs with pc_intent = NULL)');
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

    console.log(`Processing Pass 1 Ingestion for ${rows.length} Qualification Packs...\n`);

    let totalNosInserted = 0;
    let totalModulesInserted = 0;
    let totalPcsInserted = 0;
    let successQpCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const qp = rows[i];
        const cleanCode = qp.qp_code.replace(/\//g, '_');
        const mdPath = path.join(MD_DIR, `${cleanCode}.md`);

        if (!fs.existsSync(mdPath)) {
            continue;
        }

        const { nosList, modulesList, pcsList } = parseMarkdownToStructure(mdPath, qp.qp_code, qp.qp_name);

        // Clean previous records for fresh Pass 1 alignment
        await db.prepare(`DELETE FROM nsqf_nos WHERE qp_code = ?`).run(qp.qp_code);
        await db.prepare(`DELETE FROM nsqf_modules WHERE qp_code = ?`).run(qp.qp_code);
        await db.prepare(`DELETE FROM nsqf_pcs WHERE qp_code = ?`).run(qp.qp_code);

        // 1. Insert nsqf_nos
        for (const n of nosList) {
            await db.prepare(`
                INSERT OR IGNORE INTO nsqf_nos (qp_code, nos_code, nos_title, sequence_order)
                VALUES (?, ?, ?, ?)
            `).run(qp.qp_code, n.nos_code, n.nos_title, n.sequence_order);
            totalNosInserted++;
        }

        // 2. Insert nsqf_modules & map module_id
        const moduleMap = new Map();
        for (const m of modulesList) {
            const key = `${m.nos_code}:${m.module_title}`;
            if (!moduleMap.has(key)) {
                const info = await db.prepare(`
                    INSERT INTO nsqf_modules (qp_code, nos_code, module_title, sequence_order)
                    VALUES (?, ?, ?, ?)
                `).run(qp.qp_code, m.nos_code, m.module_title, m.sequence_order);
                moduleMap.set(key, info.lastInsertRowid);
                totalModulesInserted++;
            }
        }

        // 3. Insert nsqf_pcs (with pc_intent = NULL for Pass 2 enrichment)
        for (const p of pcsList) {
            const key = `${p.nos_code}:${p.module_title}`;
            const modId = moduleMap.get(key) || null;
            const defaultVideoId = 'x9PQgbB4y6M';
            const defaultVideoTitle = `${qp.qp_name} Demonstration ${p.pc_code}`;

            await db.prepare(`
                INSERT OR REPLACE INTO nsqf_pcs 
                (qp_code, nos_code, module_id, pc_code, pc_description, pc_intent, contextual_search_query, video_id, video_title, video_url, audit_score, sequence_order)
                VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)
            `).run(
                qp.qp_code, p.nos_code, modId, p.pc_code, p.pc_description,
                defaultVideoId, defaultVideoTitle, `https://www.youtube.com/watch?v=${defaultVideoId}`, 80, p.sequence_order
            );
            totalPcsInserted++;
        }

        // Update master nsqf_qps status
        await db.prepare(`
            UPDATE nsqf_qps 
            SET total_nos = ?, total_pcs = ?, pipeline_status = 'structure_ingested'
            WHERE id = ?
        `).run(nosList.length, pcsList.length, qp.id);

        successQpCount++;

        if (successQpCount % 200 === 0 || i === rows.length - 1 || rows.length <= 10) {
            console.log(`[${i + 1}/${rows.length}] 📌 Ingested QP: ${qp.qp_code} ➔ (NOS: ${nosList.length}, Modules: ${modulesList.length}, PCs: ${pcsList.length})`);
        }
    }

    console.log('\n================================================================================');
    console.log(`📊 PASS 1 STRUCTURAL INGESTION SUMMARY:`);
    console.log(`   Total QPs Ingested:       ${successQpCount} / ${rows.length}`);
    console.log(`   Total NOS Records:       ${totalNosInserted}`);
    console.log(`   Total Module Reels:      ${totalModulesInserted}`);
    console.log(`   Total Performance PCs:   ${totalPcsInserted}`);
    console.log(`   Database Status:         pipeline_status = 'structure_ingested'`);
    console.log('================================================================================\n');
}

processPass1Ingestion().catch(console.error);
