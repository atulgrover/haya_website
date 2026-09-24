'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * HPTI SOVEREIGN KNOWLEDGE RETRIEVAL ENGINE
 * Hybrid Database (PostgreSQL GIN tsvector) + In-Memory Fallback
 * Searches 2,482 knowledge chunks across:
 * 1. 28-Chapter Vedic Compendium Shastra
 * 2. 144 Master ECCP Taxonomy
 * 3. 2,002 Certified NCVET Qualification Packs
 * ══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');

const CORPUS_FILE = path.join(__dirname, '../data/eccp_unified_corpus.json');
let corpusCache = null;

function loadCorpus() {
  if (!corpusCache) {
    if (fs.existsSync(CORPUS_FILE)) {
      const raw = fs.readFileSync(CORPUS_FILE, 'utf8');
      corpusCache = JSON.parse(raw);
    } else {
      corpusCache = { chunks: [] };
    }
  }
  return corpusCache;
}

/**
 * In-memory fallback keyword search
 */
function searchKnowledge(query, options = {}) {
  const corpus = loadCorpus();
  const {
    corpusType,
    varnaCompetency,
    nsqfLevelMin,
    nsqfLevelMax,
    limit = 5
  } = options;

  if (!query) return [];

  const terms = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
  if (!terms.length) return [];

  let candidates = corpus.chunks || [];

  if (corpusType) {
    candidates = candidates.filter(c => c.corpus_type === corpusType);
  }
  if (varnaCompetency) {
    candidates = candidates.filter(c => !c.varna_competency || c.varna_competency === varnaCompetency);
  }
  if (nsqfLevelMin !== undefined) {
    candidates = candidates.filter(c => !c.nsqf_level || c.nsqf_level >= nsqfLevelMin);
  }
  if (nsqfLevelMax !== undefined) {
    candidates = candidates.filter(c => !c.nsqf_level || c.nsqf_level <= nsqfLevelMax);
  }

  const scored = [];
  candidates.forEach(chunk => {
    let score = 0;
    const contentLower = (chunk.content || '').toLowerCase();
    const titleLower = (chunk.title || chunk.section_heading || chunk.chapter_title || '').toLowerCase();

    terms.forEach(term => {
      if (titleLower.includes(term)) score += 5;
      if (contentLower.includes(term)) score += 1;
    });

    if (score > 0) {
      scored.push({ score, chunk });
    }
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.chunk);
}

/**
 * Primary Database-backed Full-Text Search with GIN TSVECTOR ranking
 */
async function searchKnowledgeDb(query, options = {}) {
  const {
    corpusType,
    varnaCompetency,
    nsqfLevelMin,
    nsqfLevelMax,
    limit = 5
  } = options;

  if (!query) return [];

  try {
    const res = await db.query(`
      SELECT id, corpus_type, title, section_heading, content, quotes, varna_competency, nsqf_level, qp_code, metadata,
             ts_rank_cd(search_vector, plainto_tsquery('english', $1)) AS rank
      FROM eccp_knowledge_corpus
      WHERE search_vector @@ plainto_tsquery('english', $1)
        AND ($2::text IS NULL OR corpus_type = $2)
        AND ($3::text IS NULL OR varna_competency = $3)
        AND ($4::numeric IS NULL OR nsqf_level >= $4)
        AND ($5::numeric IS NULL OR nsqf_level <= $5)
      ORDER BY rank DESC
      LIMIT $6;
    `, [
      query,
      corpusType || null,
      varnaCompetency || null,
      nsqfLevelMin !== undefined ? nsqfLevelMin : null,
      nsqfLevelMax !== undefined ? nsqfLevelMax : null,
      limit
    ]);

    if (res && res.rows && res.rows.length > 0) {
      return res.rows.map(r => ({
        ...r,
        chapter_title: r.title,
        quotes: Array.isArray(r.quotes) ? r.quotes : (typeof r.quotes === 'string' ? JSON.parse(r.quotes) : [])
      }));
    }
  } catch (err) {
    // If DB fails or during offline test, seamlessly fall back to memory
  }

  return searchKnowledge(query, options);
}

/**
 * Grounded RAG response generator using retrieved compendium citations & NCVET QPs
 */
async function generateGroundedCounsel(query, archetype, eccpCode) {
  // 1. Retrieve relevant compendium chunks (Shastras)
  const compendiumResults = await searchKnowledgeDb(query, {
    corpusType: 'compendium_shastra',
    limit: 2
  });

  // 2. Retrieve matching NCVET qualification packs based on competency
  const compLetter = eccpCode ? eccpCode.split('-')[2] : 'K';
  const ncvetResults = await searchKnowledgeDb(query, {
    corpusType: 'ncvet_registry',
    varnaCompetency: compLetter,
    limit: 3
  });

  let shastricSnippet = '';
  if (compendiumResults.length > 0) {
    const topChunk = compendiumResults[0];
    const quote = topChunk.quotes && topChunk.quotes.length > 0 ? topChunk.quotes[0] : '';
    shastricSnippet = `\n\n📖 From ${topChunk.chapter_title || topChunk.title} (${topChunk.section_heading}):\n"${quote || topChunk.content.slice(0, 220) + '...'}"`;
  }

  let careerSnippet = '';
  if (ncvetResults.length > 0) {
    const qpNames = ncvetResults.map(q => `${q.title} (NSQF Level ${q.nsqf_level}, Code: ${q.qp_code})`).join('\n• ');
    careerSnippet = `\n\n🇮🇳 Certified NCVET Vocational Alignment:\n• ${qpNames}`;
  }

  return {
    shastric_insight: shastricSnippet,
    career_pathways: careerSnippet,
    citations: compendiumResults.map(c => `${c.chapter_title || c.title} - ${c.section_heading}`)
  };
}

module.exports = {
  loadCorpus,
  searchKnowledge,
  searchKnowledgeDb,
  generateGroundedCounsel
};
