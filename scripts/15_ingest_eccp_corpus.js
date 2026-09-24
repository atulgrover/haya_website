'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * PHASE 1 INGESTION PIPELINE: UNIFIED ECCP KNOWLEDGE CORPUS
 * Ingests and semantic-chunks three core pillars:
 * 1. Scriptural & HPTI Master Compendium (28 Chapters)
 * 2. ECCP Psychometric Taxonomy (144 Unique Archetypes)
 * 3. Certified NCVET / NQR Registry (2,176 Qualification Packs)
 * ══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const COMPENDIUM_DIR = path.join(__dirname, '../docs/hpti_compendium');
const MATRIX_FILE = path.join(__dirname, '../server/data/eccp_144_matrix.json');
const NSQF_SEED_FILE = path.join(__dirname, '../server/nsqf_seed.json');
const OUTPUT_CORPUS_FILE = path.join(__dirname, '../server/data/eccp_unified_corpus.json');

// Map NCVET Sectors to Varna-Swabhava Competency Quadrants
const SECTOR_TO_COMPETENCY = {
  // Brahmana (Knowledge, Systems, Theory, Healthcare, Science)
  'it-ites': 'B',
  'information technology': 'B',
  'life sciences': 'B',
  'healthcare': 'B',
  'education and skill development': 'B',
  'telecom': 'B',
  'management & professional skills': 'B',

  // Kshatriya (Command, Defense, Aviation, Public Safety, Governance)
  'aerospace and aviation': 'K',
  'security': 'K',
  'defense': 'K',
  'strategic management': 'K',
  'transportation': 'K',

  // Vaishya (Capital, Trade, Logistics, Retail, Media Commerce)
  'banking, financial services and insurance (bfsi)': 'V',
  'bfsi': 'V',
  'retail': 'V',
  'logistics': 'V',
  'media & entertainment': 'V',
  'tourism & hospitality': 'V',
  'apparel, made-ups & home furnishing': 'V',

  // Shudra (Direct Craft, Tooling, Manufacturing, Agriculture, Physical Hardware)
  'capital goods': 'S',
  'automotive': 'S',
  'construction': 'S',
  'electronics and hardware': 'S',
  'handicrafts and carpet': 'S',
  'textiles': 'S',
  'agriculture': 'S',
  'mining': 'S',
  'plumbing': 'S',
  'beauty & wellness': 'S',
  'power': 'S',
  'green jobs': 'S'
};

function getCompetencyForSector(sectorName) {
  if (!sectorName) return 'S';
  const clean = sectorName.toLowerCase().trim();
  for (const [key, comp] of Object.entries(SECTOR_TO_COMPETENCY)) {
    if (clean.includes(key)) return comp;
  }
  return 'S'; // Default operational craft
}

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (file.endsWith('.md') && !file.toLowerCase().includes('readme')) {
      results.push(fullPath);
    }
  });
  return results;
}

function ingestCompendium() {
  console.log('[Ingestion] 📚 Scanning HPTI Master Compendium...');
  const mdFiles = walkDir(COMPENDIUM_DIR);
  const chunks = [];

  mdFiles.forEach(filePath => {
    const relPath = path.relative(COMPENDIUM_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // Split chapter into semantic sections by H2 headers (##)
    const sections = content.split(/^##\s+/m);
    const chapterTitleMatch = content.match(/^#\s+(.+)$/m);
    const chapterTitle = chapterTitleMatch ? chapterTitleMatch[1].trim() : relPath;

    sections.forEach((sec, idx) => {
      if (!sec.trim()) return;
      const lines = sec.trim().split('\n');
      const sectionHeading = idx === 0 ? 'Introduction' : lines[0].trim();
      const body = idx === 0 ? sec.trim() : lines.slice(1).join('\n').trim();

      // Extract Sanskrit quotes or citations
      const quotes = [];
      const quoteMatches = body.match(/>\s*(.+)/g);
      if (quoteMatches) {
        quoteMatches.forEach(q => quotes.push(q.replace(/^>\s*/, '').trim()));
      }

      chunks.push({
        id: `compendium_${path.basename(filePath, '.md')}_sec${idx}`,
        corpus_type: 'compendium_shastra',
        file_path: relPath,
        chapter_title: chapterTitle,
        section_heading: sectionHeading,
        quotes,
        content: body,
        metadata: {
          source: 'HPTI 28-Chapter Compendium',
          relative_file: relPath
        }
      });
    });
  });

  console.log(`[Ingestion] ✅ Ingested ${chunks.length} semantic chunks across ${mdFiles.length} compendium chapters.`);
  return chunks;
}

function ingestTaxonomy() {
  console.log('[Ingestion] 🧬 Ingesting ECCP 144 Archetype Taxonomy...');
  if (!fs.existsSync(MATRIX_FILE)) {
    console.warn(`[Ingestion] Warning: Matrix file ${MATRIX_FILE} not found.`);
    return [];
  }

  const raw = fs.readFileSync(MATRIX_FILE, 'utf8');
  const matrixData = JSON.parse(raw);
  const chunks = [];

  matrixData.list.forEach(arch => {
    chunks.push({
      id: `eccp_${arch.eccp_code.toLowerCase()}`,
      corpus_type: 'eccp_taxonomy',
      eccp_code: arch.eccp_code,
      title: arch.english_title,
      sanskrit_title: arch.sanskrit_title,
      epic_anchor: arch.epic_anchor,
      energy_mode: arch.energy_mode,
      cognition_locus: arch.cognition_locus,
      competency_domain: arch.competency_domain,
      purpose_vector: arch.purpose_vector,
      nsqf_level: arch.ncvet_alignment.nsqf_level,
      qp_code: arch.ncvet_alignment.qp_code,
      careers: arch.ncvet_alignment.aligned_careers,
      content: `Archetype: ${arch.english_title} (${arch.sanskrit_title}). Code: ${arch.eccp_code}. Mirror: ${arch.epic_anchor}. ${arch.psychological_summary} Recommended Careers: ${arch.ncvet_alignment.aligned_careers.join(', ')}.`,
      metadata: {
        source: 'HPTI 144 Ontological Lexicon',
        centroid_vector: arch.centroid_vector
      }
    });
  });

  console.log(`[Ingestion] ✅ Ingested ${chunks.length} ECCP Archetype records.`);
  return chunks;
}

function ingestNCVET() {
  console.log('[Ingestion] 🇮🇳 Ingesting National Qualification Packs (NCVET/NSQF)...');
  if (!fs.existsSync(NSQF_SEED_FILE)) {
    console.warn(`[Ingestion] Warning: NSQF seed file ${NSQF_SEED_FILE} not found.`);
    return [];
  }

  const raw = fs.readFileSync(NSQF_SEED_FILE, 'utf8');
  const qps = JSON.parse(raw);
  const chunks = [];

  qps.forEach(qp => {
    const comp = getCompetencyForSector(qp.sector);
    const content = `Certified Job Role: ${qp.qp_name}. Code: ${qp.qp_code}. Sector: ${qp.sector || 'General'}. Sub-Sector: ${qp.sub_sector || 'General'}. NSQF Level: ${qp.nsqf_level}. Total Training Hours: ${qp.total_qp_hours || 'N/A'}. Educational Requirement: ${qp.min_education_exp || 'N/A'}.`;

    chunks.push({
      id: `ncvet_${qp.qp_code}`,
      corpus_type: 'ncvet_registry',
      qp_code: qp.qp_code,
      title: qp.qp_name,
      sector: qp.sector,
      sub_sector: qp.sub_sector,
      nsqf_level: parseFloat(qp.nsqf_level) || 4,
      varna_competency: comp,
      content,
      metadata: {
        source: 'NCVET National Qualifications Register',
        nqr_code: qp.nqr_code,
        version: qp.version
      }
    });
  });

  console.log(`[Ingestion] ✅ Ingested ${chunks.length} certified Qualification Packs.`);
  return chunks;
}

// Execute Ingestion Pipeline
function runIngestionPipeline() {
  const compendiumChunks = ingestCompendium();
  const taxonomyChunks = ingestTaxonomy();
  const ncvetChunks = ingestNCVET();

  const totalChunks = compendiumChunks.length + taxonomyChunks.length + ncvetChunks.length;

  const unifiedCorpus = {
    generated_at: new Date().toISOString(),
    total_chunks: totalChunks,
    counts: {
      compendium: compendiumChunks.length,
      eccp_taxonomy: taxonomyChunks.length,
      ncvet_qps: ncvetChunks.length
    },
    chunks: [
      ...taxonomyChunks,
      ...compendiumChunks,
      ...ncvetChunks
    ]
  };

  fs.writeFileSync(OUTPUT_CORPUS_FILE, JSON.stringify(unifiedCorpus, null, 2), 'utf8');
  console.log(`\n🎉 [Phase 1 Ingestion Complete] Successfully written ${totalChunks} structured chunks to:`);
  console.log(`   ${OUTPUT_CORPUS_FILE}\n`);
}

runIngestionPipeline();
