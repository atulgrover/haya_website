'use strict';

const assert = require('assert');
const path = require('path');
const express = require('express');
const http = require('http');

console.log('══════════════════════════════════════════════════════════════════');
console.log('🧪 RUNNING COMPREHENSIVE HPTI / ECCP E2E SUITE (POSTGRESQL)');
console.log('══════════════════════════════════════════════════════════════════\n');

async function main() {
  // 1. Test Master 144 Archetype Matrix & Vector Simplex Engine
  console.log('▶ [1/5] Testing 144 Master Archetype Matrix & 14D Simplex Engine...');
  const {
    loadMatrix,
    normalizeSubvectors,
    matchCentroids,
    getArchetypeByCode,
    synthesizeDynamicProfile
  } = require('../server/utils/eccpMatrix');

  const data = loadMatrix();
  assert(data && data.archetypes && data.list, 'Matrix data should contain archetypes dictionary and list');
  const matrix = data.list;
  assert.strictEqual(matrix.length, 144, `Matrix should contain exactly 144 archetypes, got ${matrix.length}`);

  // Verify archetype structure
  const sampleArch = matrix[0];
  assert(sampleArch.eccp_code, 'Archetype must have eccp_code');
  assert(sampleArch.english_title, 'Archetype must have english_title');
  assert(sampleArch.sanskrit_title, 'Archetype must have sanskrit_title');
  assert(sampleArch.centroid_vector, 'Archetype must have 14D centroid_vector');
  assert.strictEqual(sampleArch.centroid_vector.length, 14, 'Centroid vector must be exactly 14-dimensional');

  // Test 14D simplex normalization
  const testScores = {
    guna: { S: 35, R: 10, T: 5 },
    cognition: { BM: 30, MM: 10, AM: 10 },
    competency: { B: 25, K: 20, V: 5, S: 0 },
    purpose: { D: 40, A: 5, K: 5, M: 10 }
  };
  const { vector14, normalized } = normalizeSubvectors(testScores);
  assert.strictEqual(vector14.length, 14, 'Normalized vector must have 14 elements');

  const sumE = vector14[0] + vector14[1] + vector14[2];
  const sumC = vector14[3] + vector14[4] + vector14[5];
  const sumV = vector14[6] + vector14[7] + vector14[8] + vector14[9];
  const sumP = vector14[10] + vector14[11] + vector14[12] + vector14[13];

  assert(Math.abs(sumE - 1.0) < 0.001, 'Energy simplex must sum to 1.0');
  assert(Math.abs(sumC - 1.0) < 0.001, 'Cognition simplex must sum to 1.0');
  assert(Math.abs(sumV - 1.0) < 0.001, 'Competency simplex must sum to 1.0');
  assert(Math.abs(sumP - 1.0) < 0.001, 'Purpose simplex must sum to 1.0');

  // Test Centroid matching
  const matchResult = matchCentroids(vector14);
  assert(matchResult.bestMatch, 'Should have best match');
  assert(matchResult.confidenceIndex >= 5 && matchResult.confidenceIndex <= 99, 'Confidence index must be between 5 and 99%');
  console.log(`  ✓ Matched Top Archetype: "${matchResult.bestMatch.english_title}" (${matchResult.bestMatch.eccp_code}) with ${matchResult.confidenceIndex}% concordance`);

  // Test Dynamic narrative synthesis
  const narrative = synthesizeDynamicProfile(matchResult.bestMatch, normalized, matchResult.confidenceIndex);
  assert(narrative.narrative.length > 50, 'Narrative must be synthesized');
  console.log(`  ✓ Dynamic narrative synthesized successfully ("${narrative.headline}" - ${narrative.confidence_rating})`);

  // 2. Test Question Bank Integrity
  console.log('\n▶ [2/5] Testing Psychometric Question Bank (APA/ITC Compliance)...');
  const {
    RAPID_QUESTIONS,
    VOCATIONAL_QUESTIONS_27,
    VIKRITI_QUESTIONS
  } = require('../server/utils/questionBank');

  assert.strictEqual(RAPID_QUESTIONS.length, 9, `Rapid bank must have 9 items, got ${RAPID_QUESTIONS.length}`);
  assert.strictEqual(VOCATIONAL_QUESTIONS_27.length, 27, `Vocational battery must have 27 items, got ${VOCATIONAL_QUESTIONS_27.length}`);
  assert.strictEqual(VIKRITI_QUESTIONS.length, 6, `Vikriti audit must have 6 items, got ${VIKRITI_QUESTIONS.length}`);

  // Check dimension balance in 27 vocational battery
  const dimensionCounts = {};
  VOCATIONAL_QUESTIONS_27.forEach(q => {
    dimensionCounts[q.dimension] = (dimensionCounts[q.dimension] || 0) + 1;
    assert(q.options && q.options.length >= 3, `Question ${q.id} must have at least 3 options`);
    q.options.forEach(opt => {
      assert(opt.weights, `Option in ${q.id} must have dimensional weights`);
    });
  });
  console.log('  ✓ 27-Item Dimension Distribution:', dimensionCounts);
  assert.strictEqual(dimensionCounts.energy, 7, 'Energy must have 7 items');
  assert.strictEqual(dimensionCounts.cognition, 7, 'Cognition must have 7 items');
  assert.strictEqual(dimensionCounts.competency, 7, 'Competency must have 7 items');
  assert.strictEqual(dimensionCounts.purpose, 6, 'Purpose must have 6 items');

  // 3. Test Sovereign Knowledge Retrieval & Unified Corpus
  console.log('\n▶ [3/5] Testing Knowledge Retriever (Database + In-Memory Fallback)...');
  const {
    loadCorpus,
    searchKnowledge,
    searchKnowledgeDb,
    generateGroundedCounsel
  } = require('../server/utils/knowledgeRetriever');

  const corpus = loadCorpus();
  assert(corpus.chunks && corpus.chunks.length > 2000, `Unified corpus should have >2000 chunks, got ${corpus.chunks ? corpus.chunks.length : 0}`);
  console.log(`  ✓ Total unified corpus chunks available: ${corpus.chunks.length}`);

  // Test search knowledge across shastric compendium via DB
  const shastraHits = await searchKnowledgeDb('kosha buddhi viveka', { corpusType: 'compendium_shastra', limit: 2 });
  assert(shastraHits.length > 0, 'Should find compendium shastra chunks');
  console.log(`  ✓ Shastric Search Hit: [${shastraHits[0].chapter_title || shastraHits[0].title}] ${shastraHits[0].section_heading}`);

  // Test search knowledge across NCVET Qualification Packs via DB
  const ncvetHits = await searchKnowledgeDb('data science machine learning', { corpusType: 'ncvet_registry', limit: 2 });
  assert(ncvetHits.length > 0, 'Should find NCVET QPs');
  console.log(`  ✓ NCVET Search Hit: ${ncvetHits[0].title} (NSQF Level ${ncvetHits[0].nsqf_level}, QP: ${ncvetHits[0].qp_code})`);

  // Test Grounded counsel generation
  const counsel = await generateGroundedCounsel('How does my discernment help in AI architecture?', matchResult.bestMatch, matchResult.bestMatch.eccp_code);
  assert(counsel.citations.length > 0, 'Should produce shastric citations');
  console.log(`  ✓ Grounded citations generated: ${counsel.citations.join(' | ')}`);

  // 4. Test Psychometrics Engine & Empirical Telemetry Logging
  console.log('\n▶ [4/5] Testing Psychometrics Engine & PostgreSQL Logging...');
  const {
    recordSessionTelemetry,
    getPsychometricReport,
    exportFactorAnalysisCSV,
    calculateCronbachAlpha
  } = require('../server/utils/psychometrics');

  const sampleItemMatrix = [
    [5, 4, 5, 4, 5],
    [4, 4, 4, 3, 4],
    [5, 5, 5, 4, 5],
    [2, 2, 3, 2, 2],
    [1, 2, 1, 2, 1],
    [3, 3, 3, 3, 4],
    [4, 5, 4, 4, 5],
    [5, 4, 5, 5, 5]
  ];
  const alphaResult = calculateCronbachAlpha(sampleItemMatrix);
  console.log(`  ✓ Cronbach's Alpha on sample calibration matrix: ${alphaResult.alpha} (${alphaResult.interpretation})`);
  assert(alphaResult.alpha > 0.80, `Cronbach's alpha should be high for aligned test items, got ${alphaResult.alpha}`);

  // 5. Test Express Personality Router Direct Endpoints
  console.log('\n▶ [5/5] Testing Express Router Endpoints with Database RAG...');
  const personalitiesRouter = require('../server/routes/personalities');
  const app = express();
  app.use(express.json());
  app.use('/api/personalities', personalitiesRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/personalities`;

  try {
    // Test 1: GET /questions?tier=vocational
    const qRes = await fetch(`${baseUrl}/questions?tier=vocational`);
    const qData = await qRes.json();
    assert(qData.success, 'Questions endpoint should succeed');
    assert.strictEqual(qData.count, 27, `Vocational tier should return 27 questions, got ${qData.count}`);
    console.log(`  ✓ GET /api/personalities/questions?tier=vocational -> 27 questions`);

    // Test 2: POST /evaluate (27 items)
    const simulatedAnswers = {};
    qData.questions.forEach((q) => {
      simulatedAnswers[q.id] = q.options[0].id;
    });

    const evalRes = await fetch(`${baseUrl}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: simulatedAnswers,
        vikriti_answers: { V1: 'seldom', V2: 'seldom', V3: 'seldom', V4: 'seldom', V5: 'seldom', V6: 'seldom' }
      })
    });
    const evalData = await evalRes.json();
    assert(evalData.success, 'Evaluate endpoint should succeed');
    assert(evalData.master_144_archetype, 'Should return master_144_archetype');
    assert(evalData.master_144_archetype.compound_title, 'Should have compound title');
    assert(evalData.normalized, 'Should have 14D normalized vector');
    console.log(`  ✓ POST /api/personalities/evaluate -> Matched: "${evalData.master_144_archetype.compound_title}" (${evalData.master_144_archetype.eccp_code}) with ${evalData.confidence_index}% concordance`);

    // Test 3: GET /psychometrics/stats
    const statsRes = await fetch(`${baseUrl}/psychometrics/stats`);
    const statsData = await statsRes.json();
    assert(statsData.success, 'Stats endpoint should return success');
    console.log(`  ✓ GET /api/personalities/psychometrics/stats -> Recorded sessions: ${statsData.total_sessions}, Target Alpha: ${statsData.target_benchmarks ? statsData.target_benchmarks.cronbach_alpha_target : '>=0.85'}`);

    // Test 4: GET /psychometrics/export
    const exportRes = await fetch(`${baseUrl}/psychometrics/export`);
    assert.strictEqual(exportRes.status, 200, 'Export endpoint should return 200');
    const csvText = await exportRes.text();
    assert(csvText.includes('session_id,tier,eccp_code'), 'CSV must contain standard headers');
    console.log(`  ✓ GET /api/personalities/psychometrics/export -> Exported CSV with ${csvText.split('\n').length} lines`);

    // Test 5: POST /chat with Grounded RAG counsel
    const chatRes = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What career roles and shastric wisdom align with my Swadharma?',
        archetype_id: evalData.matched_archetype ? evalData.matched_archetype.id : 'rama',
        eccp_code: evalData.eccp_code
      })
    });
    const chatData = await chatRes.json();
    assert(chatData.success, 'Chat endpoint should succeed');
    assert(chatData.response.length > 50, 'Chat response must be detailed');
    console.log(`  ✓ POST /api/personalities/chat -> Received grounded response with Shastric & NCVET citations`);
    console.log(`    Sample snippet: "${chatData.response.slice(0, 100)}..."`);

    // Test 6: GET /corpus/search (Database full-text search)
    const searchRes = await fetch(`${baseUrl}/corpus/search?q=samkhya+tattvas`);
    const searchData = await searchRes.json();
    assert(searchData.success, 'Search endpoint should succeed');
    console.log(`  ✓ GET /api/personalities/corpus/search?q=samkhya+tattvas -> Found ${searchData.count} chunks via PostgreSQL`);

    // Test 7: GET /sectors (Multi-Sector Directory)
    const sectorsRes = await fetch(`${baseUrl}/sectors`);
    const sectorsData = await sectorsRes.json();
    assert(sectorsData.success, 'Sectors endpoint should succeed');
    assert(sectorsData.flagships.length === 12, 'Must have 12 Flagship Sectors');
    console.log(`  ✓ GET /api/personalities/sectors -> Found ${sectorsData.count} total sectors (${sectorsData.flagships.length} Flagships)`);

    // Test 8: GET /careers (Sector Career Alignment Engine)
    const careersRes = await fetch(`${baseUrl}/careers?code=SR-BM-K-D&sector=healthcare`);
    const careersData = await careersRes.json();
    assert(careersData.success, 'Careers endpoint should succeed');
    assert.strictEqual(careersData.swabhava_role, 'Healthcare Quality Assurance Manager & Hospital Operations Arbiter', 'Kshatriya Healthcare role must match');
    assert(careersData.aligned_careers.length >= 4, 'Must return at least 4 certified QPs');
    console.log(`  ✓ GET /api/personalities/careers?code=SR-BM-K-D&sector=healthcare -> "${careersData.swabhava_role}" (${careersData.aligned_careers.length} QPs)`);

    console.log('\n🎉 ALL 5 E2E PHASES & TESTS PASSED PERFECTLY WITH POSTGRESQL!\n');
    server.close();
    process.exit(0);
  } catch (err) {
    server.close();
    throw err;
  }
}

main().catch(err => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
