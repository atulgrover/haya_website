'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Sub-Step 1.3: Markdown-to-JSON Structural Compiler                    ║
 * ║                                                                          ║
 * ║  Compiles v4 Markdown files (data/md/*.md) into clean, canonical JSON   ║
 * ║  ASTs (data/json/*.json) for downstream ingestion by Pass 1 and Pass 2. ║
 * ║                                                                          ║
 * ║  CORE DESIGN PRINCIPLE:                                                  ║
 * ║  Extracts Performance Criteria STRICTLY from Assessment Criteria Tables ║
 * ║  (the official assessment rubric), capturing criteria text, practical   ║
 * ║  and theory marks, while extracting Knowledge (KU) & Skills (GS) from   ║
 * ║  the curriculum sections.                                               ║
 * ║                                                                          ║
 * ║  Usage:                                                                  ║
 * ║    node scripts/nsqf_md_to_json.js --qp=NIE/ELE/Q0803                  ║
 * ║    node scripts/nsqf_md_to_json.js --limit=10                           ║
 * ║    node scripts/nsqf_md_to_json.js --all                                ║
 * ║    node scripts/nsqf_md_to_json.js --all --resume                       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

const fs   = require('fs');
const path = require('path');

const MD_DIR          = path.join(__dirname, '..', 'data', 'md');
const JSON_DIR        = path.join(__dirname, '..', 'data', 'json', 'nsqf');
const CHECKPOINT_PATH = path.join(__dirname, '..', 'data', '.md2json_checkpoint.json');

// Ensure output directory exists
if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
}

// ── Generic NOS Detection ─────────────────────────────────────────────────────
const GENERIC_NOS_CODES = new Set([
    'DGT/VSQ/N0101', 'VSQ/N0101', 'N0101',
    'N9901', 'N9902', 'N9903',
]);

const GENERIC_NOS_TITLE_PATTERNS = [
    /employability/i, /entrepreneurship/i, /english\s*communication/i,
    /it\s*literacy/i, /digital\s*literacy/i, /basic\s*discipline/i,
    /soft\s*skills/i, /gender\s*sensitivity/i, /environmental\s*health/i,
    /health\s*and\s*sanitation/i, /personal\s*hygiene/i, /life\s*skills/i,
    /communication\s*skills/i, /vocational\s*skills/i,
];

function isGenericNos(code, title) {
    const c = String(code || '').toUpperCase().trim();
    const t = String(title || '');
    if (GENERIC_NOS_CODES.has(c)) return true;
    if (c.startsWith('VSQ/') || c.startsWith('DGT/VSQ/')) return true;
    const nosNum = parseInt((c.match(/\/N(\d{4})$/) || [])[1] || '0');
    if (nosNum >= 9901 && nosNum <= 9999) return true;
    if (GENERIC_NOS_TITLE_PATTERNS.some(p => p.test(t))) return true;
    return false;
}

// ── Regex Patterns ────────────────────────────────────────────────────────────
const NOS_CODE_RE    = /([A-Z&]{2,8}(?:\/[A-Z0-9&]{2,10}){0,2}\/N\d{3,4})/gi;
const NOS_HEADING_RE = /^(?:####\s*)?([A-Z&]{2,8}(?:\/[A-Z0-9&]{2,10}){0,2}\/N\d{3,4})\s*[:\-]?\s*(.*)/i;
const QP_HEADING_RE  = /^(?:####\s*)?([A-Z&]{2,8}(?:\/[A-Z0-9&]{2,10}){0,2}\/Q\d{3,4})/i;

const KU_RE       = /^[-*|]?\s*KU\s*(\d+(?:\.\d+)?)[.:\s-]+(.+)/i;
const GS_RE       = /^[-*|]?\s*GS\s*(\d+(?:\.\d+)?)[.:\s-]+(.+)/i;

// Table assessment criteria header patterns
const ASSESSMENT_TABLE_HEADER_RE = /(?:Assessment\s*Criteria|Assessment\s*Marks|Theory\s*Marks|Practical\s*Marks|Outcomes\s*and\s*Assessment)/i;

// Summary / footer rows in assessment tables to ignore
const TABLE_FOOTER_RE = /^(?:NOS\s*Total|Total\s*Marks|Total|Sub\s*Total|Module\s*Total|Assessment\s*Criteria\s*for\s*Outcomes|Outcomes|Guidelines)/i;

// PC row inside table: either "PC1. text", "PC 1: text", or simple number "1. text" / "1 text"
const TABLE_PC_PREFIX_RE = /^\s*(?:PC\s*#?\s*(\d+(?:\.\d+)?)[.:\s-]*|(\d+)\.\s+)(.+)/i;

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanText(txt) {
    return String(txt || '')
        .replace(/\\\|/g, '|')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanDescription(txt) {
    return String(txt || '')
        .replace(/\\\|/g, '|')
        .replace(/\s*\|\s*[-–—\d.]*\s*\|\s*[-–—\d.]*\s*\|\s*[-–—\d.]*\s*\|\s*[-–—\d.]*\s*$/g, '')  // trailing assessment marks: | - | - | - | - |
        .replace(/\s+\|\s*[-–—]\s*$/g, '')  // single trailing mark column
        .replace(/\s+/g, ' ')
        .replace(/\.{3,}/g, '')
        .replace(/\s+\d{1,3}\s*$/, '')  // trailing page numbers
        .trim();
}

function parseMark(val) {
    if (val === null || val === undefined) return null;
    const clean = String(val).trim().replace(/[-–—\s]/g, '');
    if (!clean) return null;
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
}

// ── Core MD → JSON Compiler (Targeting Assessment Tables) ─────────────────────
function compileMdToJson(mdPath, qpCode, qpName) {
    const content = fs.readFileSync(mdPath, 'utf-8');
    const lines   = content.split('\n');

    // Extract total pages from header
    let totalPages = 0;
    const pagesMatch = content.match(/\*\*Total Document Pages\*\*:\s*(\d+)/);
    if (pagesMatch) totalPages = parseInt(pagesMatch[1]);

    // ── PHASE 1: Pre-scan for all NOS codes ──────────────────────────────────
    const nosMap = new Map(); // nos_code → { nos_code, nos_title, sequence_order, is_generic, kus, gs, modules, tablePcs, fallbackPcs }
    let nosOrder = 0;

    let m;
    const globalNosRe = new RegExp(NOS_CODE_RE.source, 'gi');
    while ((m = globalNosRe.exec(content)) !== null) {
        const code = m[1].trim().toUpperCase();
        if (!nosMap.has(code)) {
            nosOrder++;
            nosMap.set(code, {
                nos_code:       code,
                nos_title:      code,
                sequence_order: nosOrder,
                is_generic:     isGenericNos(code, ''),
                kus:            [],
                gs:             [],
                modules:        [],
                tablePcs:       [],
                fallbackPcs:    [],
            });
        }
    }

    // Fallback if no NOS codes found
    if (nosMap.size === 0) {
        const synCode = qpCode.replace(/\//g, '_') + '_N01';
        nosMap.set(synCode, {
            nos_code:       synCode,
            nos_title:      `${qpName || qpCode} Core Vocational Operations`,
            sequence_order: 1,
            is_generic:     false,
            kus:            [],
            gs:             [],
            modules:        [],
            tablePcs:       [],
            fallbackPcs:    [],
        });
    }

    // ── PHASE 2: Line-by-line Parsing ────────────────────────────────────────
    let currentNos      = nosMap.values().next().value;
    let currentModule   = null;
    let inAssessTable   = false;
    let colHeaderMap    = {}; // Column index -> 'criteria' | 'theory' | 'practical' | 'project' | 'viva' | 'total'
    const seenTablePcs  = new Set();
    const seenKus       = new Set();
    const seenGs        = new Set();

    for (let i = 0; i < lines.length; i++) {
        const raw  = lines[i];
        const line = raw.trim();
        if (!line) continue;

        // ── 1. NOS Heading Detection ─────────────────────────────────────────
        const nosHeadMatch = line.match(NOS_HEADING_RE);
        if (nosHeadMatch) {
            const code  = nosHeadMatch[1].trim().toUpperCase();
            const title = cleanText(nosHeadMatch[2] || code);
            if (nosMap.has(code)) {
                const nosEntry = nosMap.get(code);
                if (title && title !== code) nosEntry.nos_title = title;
                nosEntry.is_generic = isGenericNos(code, nosEntry.nos_title);
                currentNos = nosEntry;
                currentModule = null;
                inAssessTable = false;
            }
            continue;
        }

        // NOS Code Parameters Table detection: "| NOS Code | NIE/ELE/N0810 |"
        if (line.includes('| NOS Code |') || line.includes('| NOS Name |')) {
            const innerCodeMatch = line.match(new RegExp(NOS_CODE_RE.source, 'i'));
            if (innerCodeMatch) {
                const code = innerCodeMatch[0].trim().toUpperCase();
                if (nosMap.has(code)) {
                    currentNos = nosMap.get(code);
                }
            }
            continue;
        }

        // ── 2. Knowledge (KU) Extraction ─────────────────────────────────────
        const kuMatch = line.match(KU_RE);
        if (kuMatch) {
            const kuNum  = kuMatch[1];
            const kuText = cleanText(kuMatch[2]);
            if (kuText.length >= 5) {
                const kuKey = `${currentNos.nos_code}:KU${kuNum}`;
                if (!seenKus.has(kuKey)) {
                    seenKus.add(kuKey);
                    currentNos.kus.push(`KU${kuNum}. ${kuText}`);
                }
            }
            continue;
        }

        // ── 3. Generic Skills (GS) Extraction ────────────────────────────────
        const gsMatch = line.match(GS_RE);
        if (gsMatch) {
            const gsNum  = gsMatch[1];
            const gsText = cleanText(gsMatch[2]);
            if (gsText.length >= 5) {
                const gsKey = `${currentNos.nos_code}:GS${gsNum}`;
                if (!seenGs.has(gsKey)) {
                    seenGs.add(gsKey);
                    currentNos.gs.push(`GS${gsNum}. ${gsText}`);
                }
            }
            continue;
        }

        // ── 4. Assessment Table Detection & Row Parsing ──────────────────────
        if (line.startsWith('|')) {
            // Check if this line is an Assessment Criteria Table Header
            if (ASSESSMENT_TABLE_HEADER_RE.test(line)) {
                inAssessTable = true;
                colHeaderMap  = {};
                const cols = line.split('|').map(c => c.trim().toLowerCase()).filter(c => c.length > 0);
                cols.forEach((col, idx) => {
                    if (col.includes('criteria') || col.includes('outcome')) colHeaderMap[idx] = 'criteria';
                    else if (col.includes('theory'))    colHeaderMap[idx] = 'theory';
                    else if (col.includes('practical')) colHeaderMap[idx] = 'practical';
                    else if (col.includes('project'))   colHeaderMap[idx] = 'project';
                    else if (col.includes('viva'))      colHeaderMap[idx] = 'viva';
                    else if (col.includes('total') || col.includes('out of')) colHeaderMap[idx] = 'total';
                });
                continue;
            }

            // Skip markdown table separator lines: "| --- | :---: |"
            if (/^\|\s*[-:]+\s*\|/.test(line)) continue;

            // If we are inside an Assessment Criteria Table, parse rows
            if (inAssessTable) {
                const rawCols = line.split('|');
                // Remove empty outer columns from leading/trailing pipes
                const cols = rawCols.slice(1, rawCols.length - 1).map(c => cleanText(c));
                if (cols.length === 0) continue;

                const col0 = cols[0];

                // Skip footer rows (NOS Total, Total Marks, etc.)
                if (TABLE_FOOTER_RE.test(col0)) {
                    // Check if NOS Total ends this assessment table
                    if (/NOS\s*Total/i.test(col0)) {
                        inAssessTable = false;
                    }
                    continue;
                }

                // Check if this row is an Assessment Criterion (PC)
                const pcMatch = col0.match(TABLE_PC_PREFIX_RE);
                if (pcMatch) {
                    const rawNum = pcMatch[1] || pcMatch[2];
                    const pcNum  = rawNum ? parseInt(rawNum) : currentNos.tablePcs.length + 1;
                    const pcCode = `PC${pcNum}`;
                    const pcDesc = cleanDescription(pcMatch[3]);

                    if (pcDesc.length >= 5) {
                        const dedupKey = `${currentNos.nos_code}:${pcCode}`;
                        if (!seenTablePcs.has(dedupKey)) {
                            seenTablePcs.add(dedupKey);

                            // Extract marks if columns exist
                            let theoryMarks    = null;
                            let practicalMarks = null;
                            let projectMarks   = null;
                            let vivaMarks      = null;

                            cols.forEach((val, idx) => {
                                const type = colHeaderMap[idx];
                                if (type === 'theory') theoryMarks = parseMark(val);
                                else if (type === 'practical') practicalMarks = parseMark(val);
                                else if (type === 'project') projectMarks = parseMark(val);
                                else if (type === 'viva') vivaMarks = parseMark(val);
                            });

                            // Ensure a module container exists in current NOS
                            if (!currentModule || !currentNos.modules.includes(currentModule)) {
                                currentModule = {
                                    module_title:   `${currentNos.nos_title} — Core Assessment Criteria`,
                                    sequence_order: currentNos.modules.length + 1,
                                    pcs:            [],
                                };
                                currentNos.modules.push(currentModule);
                            }

                            const pcItem = {
                                pc_code:         pcCode,
                                pc_description:  pcDesc,
                                sequence_order:  currentNos.tablePcs.length + 1,
                                theory_marks:    theoryMarks,
                                practical_marks: practicalMarks,
                                project_marks:   projectMarks,
                                viva_marks:      vivaMarks,
                            };

                            currentNos.tablePcs.push(pcItem);
                            currentModule.pcs.push(pcItem);
                        }
                    }
                    continue;
                }

                // If col0 is NOT a PC and has substantial text, it's an Outcome/Module Category inside the Assessment table!
                if (col0.length >= 3 && !/^(?:-|\d+)$/.test(col0)) {
                    // Create or switch to this Assessment Module
                    currentModule = {
                        module_title:   col0,
                        sequence_order: currentNos.modules.length + 1,
                        pcs:            [],
                    };
                    currentNos.modules.push(currentModule);
                }
                continue;
            }
        } else {
            // Not a table line - if we hit a standard heading or section break, exit table mode
            if (line.startsWith('###') || line.startsWith('####')) {
                inAssessTable = false;
            }
        }
    }

    // ── PHASE 3: Fallback Handling for Rare PDFs without Markdown Tables ────
    // If no table PCs were found (rare legacy formats), extract from narrative
    for (const [code, nos] of nosMap) {
        if (nos.tablePcs.length === 0 && !nos.is_generic) {
            // Scan narrative lines for fallback
            let fallbackMod = null;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const m = line.match(/^[-*]?\s*PC\s*(\d+)[.:\s-]+(.+)/i);
                if (m) {
                    const pcCode = `PC${m[1]}`;
                    const pcDesc = cleanText(m[2]);
                    if (pcDesc.length >= 5) {
                        const dedupKey = `${nos.nos_code}:${pcCode}`;
                        if (!seenTablePcs.has(dedupKey)) {
                            seenTablePcs.add(dedupKey);
                            if (!fallbackMod) {
                                fallbackMod = {
                                    module_title: `${nos.nos_title} — Core Practical Operations`,
                                    sequence_order: 1,
                                    pcs: [],
                                };
                                nos.modules.push(fallbackMod);
                            }
                            const pcItem = {
                                pc_code:         pcCode,
                                pc_description:  pcDesc,
                                sequence_order:  nos.tablePcs.length + 1,
                                theory_marks:    null,
                                practical_marks: null,
                                project_marks:   null,
                                viva_marks:      null,
                            };
                            nos.tablePcs.push(pcItem);
                            fallbackMod.pcs.push(pcItem);
                        }
                    }
                }
            }
        }
    }

    // ── PHASE 4: Build Canonical Output JSON ─────────────────────────────────
    let totalPcs = 0, totalKus = 0, totalGs = 0, genericFiltered = 0;
    const nosUnits = [];

    for (const [code, nos] of nosMap) {
        if (nos.is_generic) {
            genericFiltered++;
            continue;
        }

        // Keep modules with valid PCs and re-index sequence_order
        const validModules = nos.modules
            .filter(m => m.pcs.length > 0)
            .map((m, idx) => ({
                module_title:   m.module_title,
                sequence_order: idx + 1,
                pcs:            m.pcs.map((p, pIdx) => ({
                    ...p,
                    sequence_order: pIdx + 1,
                })),
            }));

        const nosPcCount = validModules.reduce((sum, m) => sum + m.pcs.length, 0);

        // Include NOS if it has PCs or Knowledge items
        if (nosPcCount === 0 && nos.kus.length === 0 && nos.gs.length === 0) continue;

        totalPcs += nosPcCount;
        totalKus += nos.kus.length;
        totalGs  += nos.gs.length;

        nosUnits.push({
            nos_code:       nos.nos_code,
            nos_title:      nos.nos_title,
            sequence_order: nosUnits.length + 1,
            is_generic:     false,
            kus:            nos.kus,
            gs:             nos.gs,
            modules:        validModules,
        });
    }

    return {
        schema_version: 'nsqf-curriculum-v1',
        qp_code:        qpCode,
        qp_name:        qpName || qpCode,
        clean_code:     qpCode.replace(/\//g, '_'),
        total_pages:    totalPages,
        source_target:  'Assessment Criteria Tables',
        compiled_at:    new Date().toISOString(),
        stats: {
            total_nos:            nosUnits.length,
            total_modules:        nosUnits.reduce((s, n) => s + n.modules.length, 0),
            total_pcs:            totalPcs,
            total_kus:            totalKus,
            total_gs:             totalGs,
            generic_nos_filtered: genericFiltered,
        },
        nos_units: nosUnits,
    };
}

// ── Checkpoint Helpers ────────────────────────────────────────────────────────
function loadCheckpoint() {
    try { if (fs.existsSync(CHECKPOINT_PATH)) return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8')); } catch {}
    return null;
}
function saveCheckpoint(qpCode, index) {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({ qp_code: qpCode, index }), 'utf-8');
}
function clearCheckpoint() {
    try { fs.unlinkSync(CHECKPOINT_PATH); } catch {}
}

// ── CLI ───────────────────────────────────────────────────────────────────────
function main() {
    const args       = process.argv.slice(2);
    const doAll      = args.includes('--all');
    const doResume   = args.includes('--resume');
    const limitFlag  = args.find(a => a.startsWith('--limit='));
    const qpFlag     = args.find(a => a.startsWith('--qp='));
    const limit      = limitFlag ? parseInt(limitFlag.split('=')[1]) : 5;
    const targetQp   = qpFlag ? qpFlag.split('=')[1].trim() : null;

    console.log('================================================================================');
    console.log('📦 [Sub-Step 1.3] ASSESSMENT CRITERIA TABLE COMPILER (MD → JSON)');
    console.log('   Target: Official Assessment Rubric Tables (Marks + Criteria) + KU/GS Context');
    console.log('================================================================================\n');

    // Build QP list from MD files on disk
    let qpList = [];
    if (targetQp) {
        const cleanCode = targetQp.replace(/\//g, '_');
        const mdPath    = path.join(MD_DIR, `${cleanCode}.md`);
        if (fs.existsSync(mdPath)) {
            qpList.push({ qpCode: targetQp, qpName: cleanCode, mdPath });
        } else {
            console.log(`❌  MD file not found: ${cleanCode}.md`);
            return;
        }
    } else {
        const mdFiles = fs.readdirSync(MD_DIR)
            .filter(f => f.endsWith('.md'))
            .sort();
        for (const f of mdFiles) {
            const cleanCode = f.replace(/\.md$/, '');
            const qpCode    = cleanCode.replace(/_/g, '/');
            qpList.push({
                qpCode,
                qpName:  cleanCode,
                mdPath:  path.join(MD_DIR, f),
            });
        }
        if (!doAll) qpList = qpList.slice(0, limit);
    }

    // Resume
    let startIdx = 0;
    if (doResume && !targetQp) {
        const cp = loadCheckpoint();
        if (cp) {
            startIdx = (cp.index || 0) + 1;
            console.log(`⏩  Resuming from index ${startIdx} (after ${cp.qp_code}).\n`);
        }
    }

    const total      = qpList.length;
    const toProcess  = qpList.slice(startIdx);
    console.log(`Compiling ${toProcess.length} of ${total} Qualification Pack(s)…\n`);

    let compiledCount = 0, failedCount = 0, zeroPcCount = 0;
    let grandTotalPcs = 0, grandTotalKus = 0, grandTotalGs = 0;

    for (let i = 0; i < toProcess.length; i++) {
        const { qpCode, qpName, mdPath } = toProcess[i];
        const absIdx    = startIdx + i;
        const cleanCode = qpCode.replace(/\//g, '_');

        try {
            const result   = compileMdToJson(mdPath, qpCode, qpName);
            const jsonPath = path.join(JSON_DIR, `${cleanCode}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

            const { stats } = result;
            grandTotalPcs += stats.total_pcs;
            grandTotalKus += stats.total_kus;
            grandTotalGs  += stats.total_gs;

            if (stats.total_pcs === 0) {
                zeroPcCount++;
                console.log(`[${absIdx + 1}/${total}] ⚠️  0 PCs  ${cleanCode}.json  (NOS: ${stats.total_nos}, KU: ${stats.total_kus}, GS: ${stats.total_gs})`);
            } else if (compiledCount % 100 === 0 || toProcess.length <= 20 || i === toProcess.length - 1) {
                console.log(`[${absIdx + 1}/${total}] ✅  ${cleanCode}.json  PCs: ${stats.total_pcs} (from Assessment Tables)  NOS: ${stats.total_nos}  KU: ${stats.total_kus}  GS: ${stats.total_gs}`);
            }
            compiledCount++;

        } catch (e) {
            console.error(`[${absIdx + 1}/${total}] ❌  Error for ${qpCode}: ${e.message}`);
            failedCount++;
        }

        saveCheckpoint(qpCode, absIdx);
    }

    if (failedCount === 0) {
        clearCheckpoint();
        console.log('\n✅  All QPs compiled — checkpoint cleared.\n');
    } else {
        console.log(`\n⚠️  ${failedCount} failed. Run with --resume to retry.\n`);
    }

    console.log('================================================================================');
    console.log('📊 SUB-STEP 1.3 SUMMARY');
    console.log(`   QPs Compiled:           ${compiledCount}`);
    console.log(`   Zero-PC QPs:            ${zeroPcCount}`);
    console.log(`   Failed:                 ${failedCount}`);
    console.log(`   Total Assessment PCs:   ${grandTotalPcs.toLocaleString()}`);
    console.log(`   Total KU Items:         ${grandTotalKus.toLocaleString()}`);
    console.log(`   Total GS Items:         ${grandTotalGs.toLocaleString()}`);
    console.log(`   Output Directory:       ${JSON_DIR}`);
    console.log('================================================================================\n');
}

if (require.main === module) {
    main();
}

module.exports = {
    compileMdToJson,
};
