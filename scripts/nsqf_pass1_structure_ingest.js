'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PASS 1: NSQF Structural Ingestion  (v2 — PostgreSQL, non-destructive)  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Reads v2 Markdown files from data/md/, extracts NOS / Module / PC     ║
 * ║  structure, and upserts into local hayadb (nsqf_nos, nsqf_modules,     ║
 * ║  nsqf_pcs).                                                             ║
 * ║                                                                          ║
 * ║  Key improvements over v1:                                               ║
 * ║  1. PostgreSQL ON CONFLICT upserts — video_id/title preserved on re-run ║
 * ║  2. v2 MD format: handles leading "- PC1." list-item style              ║
 * ║  3. NOS regex: handles 2-part AND 3-part NSQF codes                     ║
 * ║  4. NOS headings (#### NIE/ELE/N0812: ...) detected as NOS+module break ║
 * ║  5. Expanded generic soft-skill NOS blocklist (N9901/2/3, DGT, VSQ)    ║
 * ║  6. Sequence_order corrected via SQL window function after each QP      ║
 * ║  7. Resume checkpoint — --resume picks up from last completed QP        ║
 * ║  8. No default placeholder video_id written                              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/nsqf_pass1_structure_ingest.js --limit=10
 *   node scripts/nsqf_pass1_structure_ingest.js --qp=NIE/ELE/Q0803
 *   node scripts/nsqf_pass1_structure_ingest.js --all
 *   node scripts/nsqf_pass1_structure_ingest.js --all --resume
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../server/db');

const MD_DIR          = path.join(__dirname, '..', 'data', 'md');
const NSQF_JSON_DIR   = path.join(__dirname, '..', 'data', 'json', 'nsqf');
const JSON_DIR        = fs.existsSync(NSQF_JSON_DIR) ? NSQF_JSON_DIR : path.join(__dirname, '..', 'data', 'json');
const CHECKPOINT_PATH = path.join(__dirname, '..', 'data', '.pass1_checkpoint.json');

// ── JSON AST Parser (Preferred Canonical Input) ──────────────────────────────
function parseJsonToStructure(jsonPath, qpCode) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const nosList     = [];
    const modulesList = [];
    const pcsList     = [];

    for (const nos of data.nos_units || []) {
        if (nos.is_generic || isGenericNos(nos.nos_code, nos.nos_title)) continue;

        nosList.push({
            nos_code:       nos.nos_code,
            nos_title:      nos.nos_title,
            sequence_order: nosList.length + 1,
        });

        for (const mod of nos.modules || []) {
            if (!mod.pcs || mod.pcs.length === 0) continue;

            modulesList.push({
                nos_code:       nos.nos_code,
                module_title:   mod.module_title,
                sequence_order: modulesList.length + 1,
            });

            for (const pc of mod.pcs) {
                pcsList.push({
                    nos_code:        nos.nos_code,
                    module_title:    mod.module_title,
                    pc_code:         pc.pc_code,
                    pc_description:  pc.pc_description,
                    theory_marks:    pc.theory_marks || null,
                    practical_marks: pc.practical_marks || null,
                });
            }
        }
    }

    return { nosList, modulesList, pcsList };
}

// ── Generic soft-skill NOS blocklist ─────────────────────────────────────────
// These NOS units are curriculum boilerplate — not vocational skill content.
const GENERIC_NOS_CODES = new Set([
    'DGT/VSQ/N0101', 'VSQ/N0101', 'N0101',   // Employability Skills (universal)
    'N9901', 'N9902', 'N9903',                 // Generic NSQF life-skills
]);

const GENERIC_NOS_TITLE_PATTERNS = [
    /employability/i,                  // catches: Employability Skills, Employability Skills-3, etc.
    /entrepreneurship/i,
    /english\s*communication/i,
    /it\s*literacy/i,
    /digital\s*literacy/i,
    /basic\s*discipline/i,
    /soft\s*skills/i,
    /gender\s*sensitivity/i,
    /environmental\s*health/i,
    /health\s*and\s*sanitation/i,
    /personal\s*hygiene/i,
    /life\s*skills/i,
    /communication\s*skills/i,
    /vocational\s*skills/i,
];

function isGenericNos(code, title) {
    const c = String(code || '').toUpperCase().trim();
    const t = String(title || '');

    // Exact code blocklist
    if (GENERIC_NOS_CODES.has(c)) return true;

    // Prefix blocklist
    if (c.startsWith('VSQ/') || c.startsWith('DGT/VSQ/') || c.includes('/VSQ/')) return true;

    // N9901-N9999 range = generic cross-sector NOS
    const nosNum = parseInt((c.match(/\/N(\d{4})$/) || [])[1] || '0');
    if (nosNum >= 9901 && nosNum <= 9999) return true;

    // Title keyword blocklist
    if (GENERIC_NOS_TITLE_PATTERNS.some(p => p.test(t))) return true;

    return false;
}

// ── Regex patterns ────────────────────────────────────────────────────────────
// Matches 2-part (AGR/N0101) and 3-part (NIE/ELE/N0810, DGT/VSQ/N0101) NSQF codes.
// {0,2} makes the middle segment(s) optional — handles both forms.
const NOS_CODE_RE = /([A-Z]{2,8}(?:\/[A-Z0-9]{2,10}){0,2}\/N\d{3,4})/gi;

// Matches PC lines in v2 MD format: "- PC1. text" or "PC1. text" or "| PC1. | text |"
const PC_LINE_RE   = /^[-*]?\s*PC\s*(\d+)[.:]\s*(.+)/i;
const PC_TABLE_RE  = /^\|\s*PC\s*(\d+)[.:]\s*\|\s*([^|]+)/i;

// NOS heading line in v2 MD: "#### AGR/N0101: Seed Prep" or "#### NIE/ELE/N0812: Software Repair"
const NOS_HEADING_RE = /^####\s*([A-Z]{2,8}(?:\/[A-Z0-9]{2,10}){0,2}\/N\d{3,4})\s*[:\-]?\s*(.*)/i;

// Module heading: "#### Module 1: ..." or "#### Section 1" or "#### Unit 1"
const MOD_HEADING_RE = /^####\s*(Module|Section|Unit|Element)\s*\d*/i;

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanText(txt) {
    return String(txt || '').replace(/\s+/g, ' ').replace(/\.{3,}/g, '').replace(/[|]/g, '').trim();
}

function extractPcNum(pcCode) {
    const m = String(pcCode || '').match(/\d+/);
    return m ? parseInt(m[0]) : 999;
}

function extractNosNum(nosCode) {
    const m = String(nosCode || '').match(/(\d{3,4})$/);
    return m ? parseInt(m[1]) : 999;
}

// ── Core MD parser ────────────────────────────────────────────────────────────
function parseMarkdownToStructure(filePath, qpCode, qpName) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines   = content.split('\n');

    const nosList     = [];
    const modulesList = [];
    const pcsList     = [];
    const seenNos     = new Set();
    const seenPcs     = new Set();  // dedup: "nosCode:pcCode"

    // ── STEP 1: Pre-scan full content for all NOS codes ──────────────────────
    let m;
    NOS_CODE_RE.lastIndex = 0;
    while ((m = NOS_CODE_RE.exec(content)) !== null) {
        const code = m[1].trim().toUpperCase();
        if (!seenNos.has(code) && !isGenericNos(code, '')) {
            seenNos.add(code);
            nosList.push({
                nos_code:       code,
                nos_title:      code,
                sequence_order: nosList.length + 1,
            });
        }
    }

    // Fallback: if no NOS codes found in content, create a synthetic one
    if (nosList.length === 0) {
        const synCode = qpCode.replace(/\//g, '_') + '_N01';
        nosList.push({
            nos_code:       synCode,
            nos_title:      `${qpName || qpCode} Core Vocational Operations`,
            sequence_order: 1,
        });
    }

    // ── STEP 2: Line-by-line scan for Modules and PCs ────────────────────────
    let currentNos    = nosList[0];
    let currentModule = null;
    let modOrder      = 1;

    for (let i = 0; i < lines.length; i++) {
        const raw  = lines[i];
        const line = raw.trim();
        if (!line) continue;

        // ── NOS heading (#### NIE/ELE/N0812: Software Repair) ────────────────
        const nosHeadMatch = line.match(NOS_HEADING_RE);
        if (nosHeadMatch) {
            const code  = nosHeadMatch[1].trim().toUpperCase();
            const title = cleanText(nosHeadMatch[2] || code)
                .replace(/\s+\d{1,3}$/, '')    // strip trailing page-number artifact
                .trim();
            const found = nosList.find(n => n.nos_code === code);
            if (found) {
                if (!found._titleSet) { found.nos_title = title || code; found._titleSet = true; }
                currentNos = found;
                currentModule = {
                    nos_code:       code,
                    module_title:   title || code,
                    sequence_order: modOrder++,
                };
                modulesList.push(currentModule);
            }
            continue;
        }

        // ── Module/Section heading (#### Module 1: ...) ───────────────────────
        if (MOD_HEADING_RE.test(line)) {
            const modTitle = cleanText(line.replace(/^####\s*/, ''));
            if (modTitle.length > 3) {
                currentModule = {
                    nos_code:       currentNos.nos_code,
                    module_title:   modTitle,
                    sequence_order: modOrder++,
                };
                modulesList.push(currentModule);
            }
            continue;
        }

        // ── Generic #### heading — also check if it contains a NOS code ──────
        if (line.startsWith('####')) {
            const innerNosMatch = line.match(NOS_CODE_RE);
            if (innerNosMatch) {
                const code = innerNosMatch[0].trim().toUpperCase();
                const found = nosList.find(n => n.nos_code === code);
                if (found) {
                    currentNos = found;
                    if (!currentModule || currentModule.nos_code !== code) {
                        currentModule = {
                            nos_code:       code,
                            module_title:   cleanText(line.replace(/^####\s*/, '').replace(code, '').replace(/^[:\-\s]+/, '')).trim() || code,
                            sequence_order: modOrder++,
                        };
                        modulesList.push(currentModule);
                    }
                }
            }
            continue;
        }

        // ── Inline NOS code in plain text (e.g. a table row with NOS code) ──
        // Switch currentNos if a known NOS code appears inline
        const inlineNosMatch = line.match(new RegExp(NOS_CODE_RE.source, 'i'));
        if (inlineNosMatch && !PC_LINE_RE.test(line) && !PC_TABLE_RE.test(line)) {
            const code = inlineNosMatch[0].trim().toUpperCase();
            const found = nosList.find(n => n.nos_code === code);
            if (found) currentNos = found;
        }

        // ── Performance Criteria — list item: "- PC1. text" ──────────────────
        const pcMatch = line.match(PC_LINE_RE) || line.match(PC_TABLE_RE);
        if (pcMatch) {
            const pcNum  = pcMatch[1];
            const pcCode = `PC${pcNum}.`;
            const pcDesc = cleanText(pcMatch[2]);

            if (pcDesc.length < 5) continue;

            // Ensure a module exists for this NOS
            if (!currentModule || currentModule.nos_code !== currentNos.nos_code) {
                currentModule = {
                    nos_code:       currentNos.nos_code,
                    module_title:   `${currentNos.nos_title} — Core Practical Execution`,
                    sequence_order: modOrder++,
                };
                modulesList.push(currentModule);
            }

            const dedupKey = `${currentNos.nos_code}:${pcCode}`;
            if (!seenPcs.has(dedupKey)) {
                seenPcs.add(dedupKey);
                pcsList.push({
                    nos_code:       currentNos.nos_code,
                    module_title:   currentModule.module_title,
                    pc_code:        pcCode,
                    pc_description: pcDesc,
                });
            }
        }
    }

    // ── STEP 3: Filter generic NOS and cascade to modules & pcs ─────────────
    const validNosList = nosList.filter(n => !isGenericNos(n.nos_code, n.nos_title));
    const validNosCodes = new Set(validNosList.map(n => n.nos_code));

    // Re-index sequence_order
    validNosList.forEach((n, idx) => { n.sequence_order = idx + 1; });

    const validModulesList = modulesList.filter(m => validNosCodes.has(m.nos_code));
    const validPcsList     = pcsList.filter(p => validNosCodes.has(p.nos_code));

    return { nosList: validNosList, modulesList: validModulesList, pcsList: validPcsList };
}

// ── Sequence reorder: SQL window function — no field shuffling ────────────────
async function reorderPcs(qpCode, pool) {
    await pool.query(`
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY qp_code
                    ORDER BY
                        (SELECT sequence_order FROM nsqf_nos
                         WHERE nsqf_nos.qp_code = nsqf_pcs.qp_code
                           AND nsqf_nos.nos_code = nsqf_pcs.nos_code
                         LIMIT 1) NULLS LAST,
                        COALESCE(
                            NULLIF(REGEXP_REPLACE(pc_code, '[^0-9]', '', 'g'), '')::INT,
                            999
                        )
                ) AS rn
            FROM nsqf_pcs
            WHERE qp_code = $1
        )
        UPDATE nsqf_pcs SET sequence_order = ranked.rn
        FROM ranked
        WHERE nsqf_pcs.id = ranked.id
    `, [qpCode]);
}

// ── Checkpoint helpers ────────────────────────────────────────────────────────
function loadCheckpoint() {
    try {
        if (fs.existsSync(CHECKPOINT_PATH)) {
            return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8'));
        }
    } catch {}
    return null;
}

function saveCheckpoint(qpId, qpCode) {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({
        last_processed_id:  qpId,
        last_processed_qp:  qpCode,
        timestamp:          new Date().toISOString(),
    }), 'utf-8');
}

function clearCheckpoint() {
    try { fs.unlinkSync(CHECKPOINT_PATH); } catch {}
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const args       = process.argv.slice(2);
    const doAll      = args.includes('--all');
    const doResume   = args.includes('--resume');
    const limitFlag  = args.find(a => a.startsWith('--limit='));
    const qpFlag     = args.find(a => a.startsWith('--qp='));
    const limit      = limitFlag ? parseInt(limitFlag.split('=')[1]) : 5;
    const targetQp   = qpFlag ? qpFlag.split('=')[1].trim() : null;

    console.log('================================================================================');
    console.log('🏛️  [PASS 1] NSQF STRUCTURAL INGESTION  (v2 — PostgreSQL, non-destructive)');
    console.log('   Targets: nsqf_nos, nsqf_modules, nsqf_pcs  →  local hayadb');
    console.log('================================================================================\n');

    // ── Fetch QP list ─────────────────────────────────────────────────────────
    let rows = [];
    if (targetQp) {
        const clean = targetQp.replace(/\//g, '_');
        rows = await db.prepare(
            `SELECT * FROM nsqf_qps WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?`
        ).all(targetQp, clean);
    } else if (doAll) {
        rows = await db.prepare(`SELECT * FROM nsqf_qps ORDER BY id ASC`).all();
    } else {
        rows = await db.prepare(`SELECT * FROM nsqf_qps ORDER BY id ASC LIMIT ?`).all(limit);
    }

    if (rows.length === 0) {
        console.log('❌  No Qualification Packs found. Is hayadb seeded?');
        process.exit(1);
    }

    // ── Resume: skip already-processed QPs ───────────────────────────────────
    let startIdx = 0;
    if (doResume && !targetQp) {
        const cp = loadCheckpoint();
        if (cp) {
            const idx = rows.findIndex(r => r.id === cp.last_processed_id);
            startIdx = idx >= 0 ? idx + 1 : 0;
            console.log(`⏩  Resuming from QP #${cp.last_processed_id} (${cp.last_processed_qp}) — skipping ${startIdx} already done.\n`);
        }
    }

    console.log(`Processing ${rows.length - startIdx} of ${rows.length} QP(s)...\n`);

    // ── Get raw pg.Pool for transaction-aware per-QP client acquisition ────────
    const pgPool = db.pool;  // Exposed by db.js: module.exports.pool = pool

    let totalNos = 0, totalMods = 0, totalPcs = 0, successCount = 0, skipCount = 0;

    for (let i = startIdx; i < rows.length; i++) {
        const qp        = rows[i];
        const cleanCode = qp.qp_code.replace(/\//g, '_');
        const jsonPath  = path.join(JSON_DIR, `${cleanCode}.json`);
        const mdPath    = path.join(MD_DIR, `${cleanCode}.md`);

        let parsed = null;
        if (fs.existsSync(jsonPath)) {
            try {
                parsed = parseJsonToStructure(jsonPath, qp.qp_code);
            } catch (e) {
                console.error(`  ❌  JSON parse error for ${qp.qp_code}: ${e.message}`);
            }
        }

        if (!parsed && fs.existsSync(mdPath)) {
            try {
                parsed = parseMarkdownToStructure(mdPath, qp.qp_code, qp.qp_name);
            } catch (e) {
                console.error(`  ❌  MD parse error for ${qp.qp_code}: ${e.message}`);
            }
        }

        if (!parsed) {
            skipCount++;
            continue;
        }

        const { nosList, modulesList, pcsList } = parsed;

        if (nosList.length === 0 && pcsList.length === 0) {
            skipCount++;
            continue;
        }

        // ── Acquire dedicated client and wrap all QP writes in a transaction ──
        const client = await pgPool.connect();
        try {
            await client.query('BEGIN');

            // ── 1. Upsert nsqf_nos (preserve existing data) ──────────────────
            // First: remove any synthetic fallback NOS codes left from prior runs
            if (nosList.length > 0 && !nosList[0].nos_code.match(/_N\d+$/)) {
                await client.query(
                    `DELETE FROM nsqf_pcs WHERE qp_code = $1 AND (nos_code LIKE '%\\_N0%' OR nos_code LIKE '%\\_N1%')`,
                    [qp.qp_code]
                );
                await client.query(
                    `DELETE FROM nsqf_nos WHERE qp_code = $1 AND (nos_code LIKE '%\\_N0%' OR nos_code LIKE '%\\_N1%')`,
                    [qp.qp_code]
                );
            }
            for (const n of nosList) {
                await client.query(`
                    INSERT INTO nsqf_nos (qp_code, nos_code, nos_title, sequence_order)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (qp_code, nos_code) DO UPDATE SET
                        nos_title      = EXCLUDED.nos_title,
                        sequence_order = EXCLUDED.sequence_order
                `, [qp.qp_code, n.nos_code, n.nos_title, n.sequence_order]);
            }
            totalNos += nosList.length;

            // ── 2. Modules: delete old, insert fresh ─────────────────────────
            await client.query(`DELETE FROM nsqf_modules WHERE qp_code = $1`, [qp.qp_code]);
            const moduleMap = new Map();  // "nos_code:module_title" → new id
            for (const m of modulesList) {
                const key = `${m.nos_code}:${m.module_title}`;
                if (moduleMap.has(key)) continue;
                const r = await client.query(`
                    INSERT INTO nsqf_modules (qp_code, nos_code, module_title, sequence_order)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, [qp.qp_code, m.nos_code, m.module_title, m.sequence_order]);
                moduleMap.set(key, r.rows[0].id);
            }
            totalMods += modulesList.length;

            // ── 3. Upsert nsqf_pcs — NEVER overwrite video_id on conflict ────
            for (const p of pcsList) {
                const key   = `${p.nos_code}:${p.module_title}`;
                const modId = moduleMap.get(key) || null;
                await client.query(`
                    INSERT INTO nsqf_pcs
                        (qp_code, nos_code, module_id, pc_code, pc_description, sequence_order)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (qp_code, nos_code, pc_code) DO UPDATE SET
                        pc_description = EXCLUDED.pc_description,
                        module_id      = EXCLUDED.module_id,
                        sequence_order = EXCLUDED.sequence_order
                `, [qp.qp_code, p.nos_code, modId, p.pc_code, p.pc_description, 0]);
            }
            totalPcs += pcsList.length;

            // ── 4. Delete PCs + NOS for ANY generic NOS — unconditionally ────
            const GENERIC_NOS_TITLE_SQL = `(
                nos_title ILIKE '%employability%'
                OR nos_title ILIKE '%entrepreneurship%'
                OR nos_title ILIKE '%english communication%'
                OR nos_title ILIKE '%it literacy%'
                OR nos_title ILIKE '%digital literacy%'
                OR nos_title ILIKE '%soft skills%'
                OR nos_title ILIKE '%gender sensitivity%'
                OR nos_title ILIKE '%life skills%'
                OR nos_title ILIKE '%communication skills%'
                OR nos_title ILIKE '%vocational skills%'
            )`;

            await client.query(`
                DELETE FROM nsqf_pcs
                WHERE qp_code = $1
                  AND (
                    nos_code LIKE 'DGT/VSQ/%'
                    OR nos_code LIKE 'VSQ/%'
                    OR nos_code ~ '\\/N99[0-9][0-9]$'
                    OR nos_code IN ('N0101', 'VSQ/N0101', 'DGT/VSQ/N0101')
                    OR nos_code IN (
                        SELECT nos_code FROM nsqf_nos
                        WHERE qp_code = $1 AND ${GENERIC_NOS_TITLE_SQL}
                    )
                  )
            `, [qp.qp_code]);

            await client.query(`
                DELETE FROM nsqf_nos
                WHERE qp_code = $1
                  AND (
                    nos_code LIKE 'DGT/VSQ/%'
                    OR nos_code LIKE 'VSQ/%'
                    OR nos_code ~ '\\/N99[0-9][0-9]$'
                    OR nos_code IN ('N0101', 'VSQ/N0101', 'DGT/VSQ/N0101')
                    OR ${GENERIC_NOS_TITLE_SQL}
                  )
            `, [qp.qp_code]);

            // ── 5. Fix sequence_order via SQL window function ─────────────────
            try {
                await client.query(`
                    UPDATE nsqf_pcs AS p
                    SET sequence_order = sub.rn
                    FROM (
                        SELECT id, ROW_NUMBER() OVER (PARTITION BY qp_code ORDER BY id) AS rn
                        FROM nsqf_pcs WHERE qp_code = $1
                    ) AS sub
                    WHERE p.id = sub.id
                `, [qp.qp_code]);
            } catch (_) { /* Non-fatal — ordering can be fixed later */ }

            // ── 6. Detect abbreviated-format PDFs ────────────────────────────
            let isAbbreviated = false;
            if (pcsList.length > 0) {
                const uniqueDescs = new Set(
                    pcsList.map(p => p.pc_description.trim().toLowerCase().substring(0, 60))
                );
                if (uniqueDescs.size === 1) {
                    isAbbreviated = true;
                    console.log(`  ⚠️  Abbreviated PDF detected for ${qp.qp_code} — all ${pcsList.length} PCs identical: "${[...uniqueDescs][0].substring(0, 50)}"`);
                    await client.query(`DELETE FROM nsqf_pcs WHERE qp_code = $1`, [qp.qp_code]);
                }
            }

            // ── 7. Update master QP status ───────────────────────────────────
            const finalStatus = isAbbreviated ? 'abbreviated_pdf_no_pcs' : 'structure_ingested';
            await client.query(`
                UPDATE nsqf_qps
                SET total_nos       = $1,
                    total_pcs       = $2,
                    pipeline_status = $3
                WHERE id = $4
            `, [nosList.length, isAbbreviated ? 0 : pcsList.length, finalStatus, qp.id]);

            await client.query('COMMIT');

        } catch (txErr) {
            await client.query('ROLLBACK');
            console.error(`  ❌  Transaction rolled back for ${qp.qp_code}: ${txErr.message}`);
            skipCount++;
            continue;
        } finally {
            client.release();
        }

        successCount++;
        saveCheckpoint(qp.id, qp.qp_code);

        // Progress every 50 QPs or always if small batch
        if (successCount % 50 === 0 || rows.length <= 20 || i === rows.length - 1) {
            const pct = ((i + 1) / rows.length * 100).toFixed(1);
            console.log(`[${i + 1}/${rows.length}] (${pct}%) ✅  ${qp.qp_code}  →  NOS: ${nosList.length}  Modules: ${modulesList.length}  PCs: ${pcsList.length}`);
        }
    }

    if (successCount === rows.length - startIdx) {
        clearCheckpoint();
        console.log('\n✅  All QPs processed — checkpoint cleared.\n');
    } else {
        console.log(`\n⚠️  ${skipCount} QPs skipped (no MD file or parse error). Run --resume to retry.\n`);
    }

    console.log('================================================================================');
    console.log('📊 PASS 1 SUMMARY');
    console.log(`   QPs Processed:     ${successCount}`);
    console.log(`   QPs Skipped:       ${skipCount}`);
    console.log(`   NOS Records:       ${totalNos}`);
    console.log(`   Module Reels:      ${totalMods}`);
    console.log(`   Performance Criteria: ${totalPcs}`);
    console.log(`   DB Status:         pipeline_status = 'structure_ingested'`);
    console.log('================================================================================\n');

    process.exit(0);
}

main().catch(e => {
    console.error('\n❌  Fatal error in Pass 1:', e.message);
    console.error(e.stack);
    process.exit(1);
});
