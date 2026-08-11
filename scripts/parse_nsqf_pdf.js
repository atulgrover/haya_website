'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || 'sk_seyvp34z_e9uFel9TjYw0fYerbEcc3ikc';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyCUVDu9VitrRLhL1hUKqCShjfjW_vLhf2I';

const scratchDir = '/Users/atulgrover/.gemini/antigravity-ide/brain/63c4db05-0fe5-419b-a156-462feb454b3a/scratch';
const mdPath = path.join(scratchDir, 'AAS_Q0103_v3.0.md');

async function searchYouTube(query) {
    if (!YOUTUBE_API_KEY || !query) return { video_id: '', title: '' };
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
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
    return { video_id: '', title: '' };
}

function parseAllPcTablesFromMarkdown(fullText) {
    const lines = fullText.split('\n');
    const nosModulesMap = {};
    let currentNosCode = 'AAS/N0103';
    let currentNosTitle = 'Cargo Movement and Ramp Operations';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect NOS title line (e.g. AAS/N0103 or Outcome titles)
        const nosMatch = line.match(/(AAS\/N\d+)\s*[:|-]?\s*(.*)/i);
        if (nosMatch) {
            currentNosCode = nosMatch[1].toUpperCase();
            if (nosMatch[2].length > 5) currentNosTitle = nosMatch[2].trim();
        } else if (line.includes('Assessment Criteria for Outcomes') || line.includes('Movement of cargo') || line.includes('Delivery of cargo') || line.includes('Accept cargo') || line.includes('Prepare cargo')) {
            currentNosTitle = line.replace('Assessment Criteria for Outcomes', '').trim() || currentNosTitle;
        }

        // Detect PC lines
        const pcMatch = line.match(/^(PC\d+)\.\s*(.*)/i);
        if (pcMatch) {
            const pcId = pcMatch[1].toUpperCase();
            const pcDesc = pcMatch[2].trim();

            // Look ahead 1-3 lines to grab marks
            let tMarks = 3, pMarks = 3;
            for (let j = 1; j <= 3; j++) {
                if (lines[i + j]) {
                    const markMatch = lines[i + j].trim().match(/^(\d+)\s+(\d+)/);
                    if (markMatch) {
                        tMarks = parseInt(markMatch[1]);
                        pMarks = parseInt(markMatch[2]);
                        break;
                    }
                }
            }

            if (!nosModulesMap[currentNosCode]) {
                nosModulesMap[currentNosCode] = {
                    nos_code: currentNosCode,
                    nos_title: currentNosTitle || 'Core Vocational Competency',
                    pcs: []
                };
            }

            // Deduplicate by pc_id within same module
            if (!nosModulesMap[currentNosCode].pcs.some(p => p.pc_id === pcId && p.title === pcDesc)) {
                nosModulesMap[currentNosCode].pcs.push({
                    pc_id: pcId,
                    title: `${pcId}: ${pcDesc}`,
                    theory_marks: tMarks,
                    practical_marks: pMarks,
                    search_query: `Airline Cargo Assistant ${pcDesc.substring(0, 50)}`
                });
            }
        }
    }

    return Object.values(nosModulesMap);
}

async function runCompleteNsqfParser() {
    console.log('🚀 [NSQF Multi-NOS Parser] Processing AAS_Q0103_v3.0 NCVET Qualification Pack...');

    if (!fs.existsSync(mdPath)) {
        throw new Error(`File not found: ${mdPath}`);
    }

    const fullMarkdown = fs.readFileSync(mdPath, 'utf8');

    // Parse all NOS modules and Performance Criteria
    const nosModules = parseAllPcTablesFromMarkdown(fullMarkdown);

    let grandTotalPcs = 0;
    nosModules.forEach(m => grandTotalPcs += m.pcs.length);

    console.log(`✅ Extracted ${nosModules.length} NOS Modules with a total of ${grandTotalPcs} Performance Criteria (PC) reels!`);

    // Query Official YouTube API for each PC
    console.log('\n🔍 [YouTube API] Resolving Practical Demonstration Videos for all PCs...');
    for (const mod of nosModules) {
        console.log(`\n📂 NOS Module [${mod.nos_code}]: "${mod.nos_title}" (${mod.pcs.length} PCs)`);
        for (const pc of mod.pcs) {
            const ytMatch = await searchYouTube(`${pc.search_query}`);
            pc.video_id = ytMatch.video_id || 'QGsQCaazNYc';
            pc.video_title = ytMatch.title || 'Cargo Handling Demonstration';
            console.log(`  └─ [${pc.pc_id}] ${pc.title.substring(0, 50)}... ➔ Video: [${pc.video_id}] "${pc.video_title.substring(0, 35)}..."`);
        }
    }

    const finalSchema = {
        qp_code: 'AAS/Q0103',
        qp_name: 'Airline Cargo Assistant',
        version: '3.0',
        sector: 'Aerospace and Aviation',
        total_reels: grandTotalPcs,
        nos_modules: nosModules
    };

    const outputPath = path.join(scratchDir, 'PARSED_NOS_SCHEMA_AAS_Q0103.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalSchema, null, 2));

    console.log(`\n🎉 [SUCCESS] Complete Multi-NOS Schema saved to: ${outputPath}`);
}

runCompleteNsqfParser().catch(err => console.error('❌ Parser error:', err));
