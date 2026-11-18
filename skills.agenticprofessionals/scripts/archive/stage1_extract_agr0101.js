'use strict';

/**
 * 🌾 STAGE 1: Precision Context Extractor for AGR/Q0101 (Paddy Cultivator)
 *
 * Robust, line-buffered parser that:
 * 1. Tracks exact NOS unit boundaries (AGR/N0101 through AGR/N9903, DGT/VSQ/N0101)
 * 2. Captures Element / Module headers (e.g. Seed Treatment, Nursery Preparation)
 * 3. Assembles multi-line wrapped PC descriptions into full, complete sentences
 * 4. Ignores assessment tables, marks columns, and header noise
 * 5. Outputs a Human-In-The-Loop (HIL) review table & staging JSON
 */

const fs = require('fs');
const path = require('path');

const MD_PATH = path.join(__dirname, '../data/md/AGR_Q0101.md');
const OUTPUT_STAGING_PATH = path.join(__dirname, '../data/stage1_agr0101_extracted.json');

function cleanSentence(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/NSQC Approved\s*\|\|[^\n]*/gi, '')
        .replace(/Agriculture Skill Council of India[^\n]*/gi, '')
        .replace(/Qualification Pack[^\n]*/gi, '')
        .replace(/Knowledge and Understanding[^\n]*/gi, '')
        .replace(/\|\s*[:\-\s]+\s*\|/g, '')
        .replace(/-\s*-\s*-\s*-/g, '')
        .replace(/\s*,\s*$/, '')
        .trim();
}

function extractAgr0101() {
    console.log(`================================================================================`);
    console.log(`🌾 STAGE 1: CONTEXT EXTRACTION & UN-TRUNCATION FOR AGR/Q0101`);
    console.log(`   Source: ${MD_PATH}`);
    console.log(`================================================================================\n`);

    if (!fs.existsSync(MD_PATH)) {
        console.error(`❌ Error: Markdown file not found at ${MD_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(MD_PATH, 'utf8');
    const lines = content.split('\n');

    const nosList = [];
    const extractedCriteria = [];

    let currentNos = null;
    let currentElement = 'Core Practical Execution';
    let inElementsSection = false;
    let currentPc = null;

    // Regex patterns
    const nosHeaderRegex = /^(AGR\/N[0-9]{4}|AGR\/N9903|DGT\/VSQ\/N[0-9]{4}):\s*(.+)/i;
    const elementStartRegex = /^Elements and Performance Criteria/i;
    const elementEndRegex = /^National Occupational Standards \(NOS\) Parameters|^Assessment Criteria/i;
    const pcHeaderRegex = /^(PC\d+[\.\:]?)\s*(.*)/i;

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].trim();

        // 1. Check for NOS Section Header
        const nosMatch = rawLine.match(nosHeaderRegex);
        if (nosMatch && !rawLine.includes('....') && !rawLine.includes('|')) {
            const nosCode = nosMatch[1].toUpperCase();
            const nosTitle = cleanSentence(nosMatch[2]);
            currentNos = { nos_code: nosCode, nos_title: nosTitle };
            if (!nosList.find(n => n.nos_code === nosCode)) {
                nosList.push(currentNos);
            }
            inElementsSection = false;
            currentElement = 'Core Practical Execution';
            continue;
        }

        // 2. Element section start & end boundaries
        if (elementStartRegex.test(rawLine)) {
            inElementsSection = true;
            continue;
        }
        if (elementEndRegex.test(rawLine) || rawLine.startsWith('### Page 30') || rawLine.startsWith('### Page 31')) {
            // Flush any active PC
            if (currentPc) {
                currentPc.pc_description = cleanSentence(currentPc.pc_description);
                extractedCriteria.push(currentPc);
                currentPc = null;
            }
            inElementsSection = false;
            continue;
        }

        if (!inElementsSection || !currentNos) continue;

        // Skip page breaks, markdown dividers, and boilerplate
        if (rawLine.startsWith('### Page') || rawLine.startsWith('---') || rawLine.startsWith('|') || rawLine.startsWith('#')) continue;
        if (/^To be competent,\s*the user\/individual/i.test(rawLine)) continue;

        // 3. Check for PC Header (e.g. PC1. select varieties...)
        const pcMatch = rawLine.match(pcHeaderRegex);
        if (pcMatch) {
            // Flush previous PC
            if (currentPc) {
                currentPc.pc_description = cleanSentence(currentPc.pc_description);
                extractedCriteria.push(currentPc);
            }

            const pcCode = pcMatch[1].replace(':', '.');
            const initialText = pcMatch[2] || '';

            currentPc = {
                qp_code: 'AGR/Q0101',
                nos_code: currentNos.nos_code,
                nos_title: currentNos.nos_title,
                element_name: currentElement,
                pc_code: pcCode.endsWith('.') ? pcCode : pcCode + '.',
                pc_description: initialText
            };
            continue;
        }

        // 4. If we are within an active PC, append multi-line wrapped text
        if (currentPc) {
            // Check if this line is an Element title rather than wrapped text
            if (rawLine.length < 60 && !rawLine.endsWith('.') && !rawLine.endsWith(',') && !rawLine.includes(';') && (rawLine.match(/^[A-Z][a-zA-Z\s&]+$/) || /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(rawLine))) {
                // It's a new element header
                currentPc.pc_description = cleanSentence(currentPc.pc_description);
                extractedCriteria.push(currentPc);
                currentPc = null;
                currentElement = rawLine;
            } else {
                currentPc.pc_description += ' ' + rawLine;
            }
        } else {
            // Standalone element heading line before PCs
            if (rawLine.length < 60 && !rawLine.endsWith('.') && !rawLine.endsWith(',') && (rawLine.match(/^[A-Z][a-zA-Z\s&]+$/) || /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(rawLine))) {
                currentElement = rawLine;
            }
        }
    }

    // Flush last PC
    if (currentPc) {
        currentPc.pc_description = cleanSentence(currentPc.pc_description);
        extractedCriteria.push(currentPc);
    }

    // Save Staging JSON
    fs.writeFileSync(OUTPUT_STAGING_PATH, JSON.stringify({
        qp_code: 'AGR/Q0101',
        qp_name: 'Paddy Cultivator',
        sector: 'Agriculture',
        total_nos: nosList.length,
        nos_list: nosList,
        total_pcs: extractedCriteria.length,
        criteria: extractedCriteria
    }, null, 2));

    console.log(`✅ Extraction Complete!`);
    console.log(`   📦 Found ${nosList.length} NOS Units`);
    console.log(`   📋 Found ${extractedCriteria.length} Un-truncated Criteria (PCs)`);
    console.log(`   💾 Staged to: ${OUTPUT_STAGING_PATH}\n`);

    console.log(`================================================================================`);
    console.log(`🔍 STAGE 1 HIL INSPECTION: EXTRACTED CRITERIA BY NOS & MODULE`);
    console.log(`================================================================================\n`);

    // Group criteria by NOS for clean human review
    for (const nos of nosList) {
        const nosPcs = extractedCriteria.filter(c => c.nos_code === nos.nos_code);
        console.log(`📌 NOS: [${nos.nos_code}] - ${nos.nos_title} (${nosPcs.length} PCs)`);
        console.table(nosPcs.map(p => ({
            'PC Code': p.pc_code,
            'Module / Element': p.element_name,
            'Full Un-truncated Sentence': p.pc_description.length > 75 ? p.pc_description.slice(0, 72) + '...' : p.pc_description
        })));
        console.log('\n');
    }
}

extractAgr0101();
