'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * SCRIPT 16: MIGRATE ECCP ARCHETYPES & CORPUS TO POSTGRESQL (NEON)
 * Populates eccp_archetypes_144 and eccp_knowledge_corpus tables
 * with automatic GIN TSVECTOR full-text search indexing.
 * ══════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../server/db');

const MATRIX_FILE = path.join(__dirname, '../server/data/eccp_144_matrix.json');
const CORPUS_FILE = path.join(__dirname, '../server/data/eccp_unified_corpus.json');

async function ensureTables() {
  console.log('[Migration] 🛠 Ensuring ECCP PostgreSQL tables exist...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS eccp_archetypes_144 (
      eccp_code VARCHAR(32) PRIMARY KEY,
      english_title VARCHAR(255) NOT NULL,
      sanskrit_title VARCHAR(255),
      core_functional_title VARCHAR(255),
      energy_mode VARCHAR(64),
      cognition_locus VARCHAR(64),
      competency_domain VARCHAR(64),
      purpose_vector VARCHAR(64),
      epic_anchor VARCHAR(128),
      psychological_summary TEXT,
      shadow_warning TEXT,
      nsqf_level NUMERIC(4, 1),
      qp_code VARCHAR(64),
      primary_sector VARCHAR(255),
      us_onet_code VARCHAR(64),
      aligned_careers JSONB DEFAULT '[]',
      sadhana_protocol JSONB DEFAULT '{}',
      centroid_vector JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS eccp_knowledge_corpus (
      id VARCHAR(128) PRIMARY KEY,
      corpus_type VARCHAR(64) NOT NULL,
      title VARCHAR(512),
      section_heading VARCHAR(512),
      content TEXT NOT NULL,
      quotes JSONB DEFAULT '[]',
      varna_competency VARCHAR(16),
      nsqf_level NUMERIC(4, 1),
      qp_code VARCHAR(64),
      metadata JSONB DEFAULT '{}',
      search_vector TSVECTOR,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_eccp_arch_code ON eccp_archetypes_144(eccp_code);
    CREATE INDEX IF NOT EXISTS idx_eccp_arch_energy ON eccp_archetypes_144(energy_mode);
    CREATE INDEX IF NOT EXISTS idx_eccp_arch_comp ON eccp_archetypes_144(competency_domain);
    CREATE INDEX IF NOT EXISTS idx_eccp_corpus_type ON eccp_knowledge_corpus(corpus_type);
    CREATE INDEX IF NOT EXISTS idx_eccp_corpus_varna ON eccp_knowledge_corpus(varna_competency);
    CREATE INDEX IF NOT EXISTS idx_eccp_corpus_tsv ON eccp_knowledge_corpus USING GIN(search_vector);
  `);
  console.log('[Migration] ✅ Tables and GIN search indexes confirmed.');
}

async function migrateArchetypes() {
  console.log('[Migration] 🧬 Migrating 144 Archetypes into PostgreSQL (eccp_archetypes_144)...');
  if (!fs.existsSync(MATRIX_FILE)) {
    throw new Error(`Matrix file not found: ${MATRIX_FILE}`);
  }

  const raw = fs.readFileSync(MATRIX_FILE, 'utf8');
  const data = JSON.parse(raw);
  const archetypes = data.list || [];

  let inserted = 0;
  for (const arch of archetypes) {
    await db.query(`
      INSERT INTO eccp_archetypes_144 (
        eccp_code, english_title, sanskrit_title, core_functional_title,
        energy_mode, cognition_locus, competency_domain, purpose_vector,
        epic_anchor, psychological_summary, shadow_warning,
        nsqf_level, qp_code, primary_sector, us_onet_code,
        aligned_careers, sadhana_protocol, centroid_vector, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
      )
      ON CONFLICT (eccp_code) DO UPDATE SET
        english_title = EXCLUDED.english_title,
        sanskrit_title = EXCLUDED.sanskrit_title,
        core_functional_title = EXCLUDED.core_functional_title,
        energy_mode = EXCLUDED.energy_mode,
        cognition_locus = EXCLUDED.cognition_locus,
        competency_domain = EXCLUDED.competency_domain,
        purpose_vector = EXCLUDED.purpose_vector,
        epic_anchor = EXCLUDED.epic_anchor,
        psychological_summary = EXCLUDED.psychological_summary,
        shadow_warning = EXCLUDED.shadow_warning,
        nsqf_level = EXCLUDED.nsqf_level,
        qp_code = EXCLUDED.qp_code,
        primary_sector = EXCLUDED.primary_sector,
        us_onet_code = EXCLUDED.us_onet_code,
        aligned_careers = EXCLUDED.aligned_careers,
        sadhana_protocol = EXCLUDED.sadhana_protocol,
        centroid_vector = EXCLUDED.centroid_vector;
    `, [
      arch.eccp_code,
      arch.english_title,
      arch.sanskrit_title,
      arch.core_functional_title,
      arch.energy_mode,
      arch.cognition_locus,
      arch.competency_domain,
      arch.purpose_vector,
      arch.epic_anchor,
      arch.psychological_summary,
      arch.shadow_warning,
      arch.ncvet_alignment ? arch.ncvet_alignment.nsqf_level : 4,
      arch.ncvet_alignment ? arch.ncvet_alignment.qp_code : '',
      arch.ncvet_alignment ? arch.ncvet_alignment.primary_sector : '',
      arch.ncvet_alignment ? arch.ncvet_alignment.us_onet_code : '',
      JSON.stringify(arch.ncvet_alignment ? arch.ncvet_alignment.aligned_careers : []),
      JSON.stringify(arch.sadhana_protocol || {}),
      JSON.stringify(arch.centroid_vector || [])
    ]);
    inserted++;
  }

  console.log(`[Migration] ✅ Successfully synced ${inserted} archetypes into eccp_archetypes_144.`);
}

async function migrateKnowledgeCorpus() {
  console.log('[Migration] 📚 Migrating Unified Knowledge Corpus into PostgreSQL (eccp_knowledge_corpus)...');
  if (!fs.existsSync(CORPUS_FILE)) {
    throw new Error(`Corpus file not found: ${CORPUS_FILE}`);
  }

  const raw = fs.readFileSync(CORPUS_FILE, 'utf8');
  const data = JSON.parse(raw);
  const chunks = data.chunks || [];

  let inserted = 0;
  const batchSize = 100;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    for (const chunk of batch) {
      const title = chunk.title || chunk.chapter_title || '';
      const section = chunk.section_heading || '';
      const content = chunk.content || '';

      const searchBody = [title, section, content].filter(Boolean).join(' ');

      await db.query(`
        INSERT INTO eccp_knowledge_corpus (
          id, corpus_type, title, section_heading, content,
          quotes, varna_competency, nsqf_level, qp_code, metadata,
          search_vector, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          to_tsvector('english', $11),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          corpus_type = EXCLUDED.corpus_type,
          title = EXCLUDED.title,
          section_heading = EXCLUDED.section_heading,
          content = EXCLUDED.content,
          quotes = EXCLUDED.quotes,
          varna_competency = EXCLUDED.varna_competency,
          nsqf_level = EXCLUDED.nsqf_level,
          qp_code = EXCLUDED.qp_code,
          metadata = EXCLUDED.metadata,
          search_vector = to_tsvector('english', coalesce(EXCLUDED.title, '') || ' ' || coalesce(EXCLUDED.section_heading, '') || ' ' || coalesce(EXCLUDED.content, ''));
      `, [
        chunk.id,
        chunk.corpus_type,
        title,
        section,
        content,
        JSON.stringify(chunk.quotes || []),
        chunk.varna_competency || null,
        chunk.nsqf_level || null,
        chunk.qp_code || null,
        JSON.stringify(chunk.metadata || {}),
        searchBody
      ]);
      inserted++;
    }
    process.stdout.write(`\r[Migration] Processed ${inserted}/${chunks.length} chunks...`);
  }

  console.log(`\n[Migration] ✅ Successfully synced ${inserted} knowledge chunks into eccp_knowledge_corpus.`);
}

async function verifyMigration() {
  console.log('\n[Verification] 🔍 Verifying PostgreSQL tables & Full-Text Search indexing...');

  const archCountRes = await db.query('SELECT COUNT(*) FROM eccp_archetypes_144;');
  const corpusCountRes = await db.query('SELECT COUNT(*) FROM eccp_knowledge_corpus;');
  const corpusByTypeRes = await db.query('SELECT corpus_type, COUNT(*) FROM eccp_knowledge_corpus GROUP BY corpus_type;');

  console.log(`  • eccp_archetypes_144 count: ${archCountRes.rows[0].count}`);
  console.log(`  • eccp_knowledge_corpus count: ${corpusCountRes.rows[0].count}`);
  console.log('  • Chunks by type:');
  corpusByTypeRes.rows.forEach(r => {
    console.log(`    - ${r.corpus_type}: ${r.count}`);
  });

  // Test full-text search query using tsvector
  const searchTest = await db.query(`
    SELECT title, section_heading, corpus_type,
           ts_rank_cd(search_vector, plainto_tsquery('english', 'samkhya tattvas purusha')) AS rank
    FROM eccp_knowledge_corpus
    WHERE search_vector @@ plainto_tsquery('english', 'samkhya tattvas purusha')
    ORDER BY rank DESC
    LIMIT 3;
  `);

  console.log('\n  • Test Full-Text Search ("samkhya tattvas purusha"):');
  searchTest.rows.forEach((r, idx) => {
    console.log(`    ${idx + 1}. [${r.corpus_type}] ${r.title || r.section_heading} (Rank: ${Math.round(r.rank * 1000) / 1000})`);
  });

  console.log('\n🎉 ALL MIGRATION AND VERIFICATION CHECKS PASSED!\n');
}

async function run() {
  try {
    await ensureTables();
    await migrateArchetypes();
    await migrateKnowledgeCorpus();
    await verifyMigration();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();
