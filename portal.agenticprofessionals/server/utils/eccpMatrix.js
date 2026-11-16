'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * HPTI ECCP MATRIX UTILITY & EUCLIDEAN SCORING ENGINE
 * Formalized under Chapter 22 (Algorithmic Scoring & Vector Space)
 * ══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const MATRIX_FILE = path.join(__dirname, '../data/eccp_144_matrix.json');
let matrixCache = null;

function loadMatrix() {
  if (!matrixCache) {
    if (fs.existsSync(MATRIX_FILE)) {
      const raw = fs.readFileSync(MATRIX_FILE, 'utf8');
      matrixCache = JSON.parse(raw);
    } else {
      throw new Error(`ECCP 144 Matrix file not found at: ${MATRIX_FILE}`);
    }
  }
  return matrixCache;
}

/**
 * Normalizes raw score vectors into the 14-dimensional Simplex Space
 * Feature Vector Psi = [ S, R, T | BM, MM, AM | B, K, V, S | D, A, K, M ]
 * Total = 3 + 3 + 4 + 4 = 14 Dimensions.
 * Each sub-vector sums to 1.0 (Unit Simplex).
 */
function normalizeSubvectors(rawScores) {
  const { guna, cognition, competency, purpose } = rawScores;

  // 1. Triguna (3-simplex)
  const sumGuna = (guna.S || 0) + (guna.R || 0) + (guna.T || 0) || 1;
  const vE = [
    (guna.S || 0) / sumGuna,
    (guna.R || 0) / sumGuna,
    (guna.T || 0) / sumGuna
  ];

  // 2. Antahkarana (3-simplex)
  const bVal = (cognition.B !== undefined ? cognition.B : cognition.BM) || 0;
  const mVal = (cognition.M !== undefined ? cognition.M : cognition.MM) || 0;
  const aVal = (cognition.A !== undefined ? cognition.A : cognition.AM) || 0;
  const sumCog = (bVal + mVal + aVal) || 1;
  const vC = [
    bVal / sumCog,
    mVal / sumCog,
    aVal / sumCog
  ];

  // 3. Varna-Swabhava (4-simplex)
  const sumComp = (competency.B || 0) + (competency.K || 0) + (competency.V || 0) + (competency.S || 0) || 1;
  const vV = [
    (competency.B || 0) / sumComp,
    (competency.K || 0) / sumComp,
    (competency.V || 0) / sumComp,
    (competency.S || 0) / sumComp
  ];

  // 4. Purushartha (4-simplex)
  const sumPurp = (purpose.D || 0) + (purpose.A || 0) + (purpose.K || 0) + (purpose.M || 0) || 1;
  const vP = [
    (purpose.D || 0) / sumPurp,
    (purpose.A || 0) / sumPurp,
    (purpose.K || 0) / sumPurp,
    (purpose.M || 0) / sumPurp
  ];

  const fullVector = [...vE, ...vC, ...vV, ...vP];

  return {
    vector14: fullVector,
    normalized: {
      energy: { S: Math.round(vE[0] * 100), R: Math.round(vE[1] * 100), T: Math.round(vE[2] * 100) },
      cognition: { BM: Math.round(vC[0] * 100), MM: Math.round(vC[1] * 100), AM: Math.round(vC[2] * 100) },
      competency: { B: Math.round(vV[0] * 100), K: Math.round(vV[1] * 100), V: Math.round(vV[2] * 100), S: Math.round(vV[3] * 100) },
      purpose: { D: Math.round(vP[0] * 100), A: Math.round(vP[1] * 100), K: Math.round(vP[2] * 100), M: Math.round(vP[3] * 100) }
    }
  };
}

/**
 * Calculates Euclidean Distance between user vector and archetype centroid
 * d(u, c_k) = sqrt(sum((u_j - c_k,j)^2))
 */
function euclideanDistance(v1, v2) {
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = (v1[i] || 0) - (v2[i] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Evaluates the 14-dimensional user vector against all 144 Archetype Centroids
 */
function matchCentroids(vector14) {
  const data = loadMatrix();
  const archetypes = data.list;

  let best = null;
  let second = null;
  let minDistance = Infinity;
  let secondMinDistance = Infinity;
  let maxDistance = -Infinity;

  const distances = [];

  for (const arch of archetypes) {
    const dist = euclideanDistance(vector14, arch.centroid_vector);
    distances.push({ id: arch.id, code: arch.eccp_code, distance: dist });

    if (dist < minDistance) {
      secondMinDistance = minDistance;
      second = best;
      minDistance = dist;
      best = arch;
    } else if (dist < secondMinDistance) {
      secondMinDistance = dist;
      second = arch;
    }

    if (dist > maxDistance) {
      maxDistance = dist;
    }
  }

  // Maximum theoretical Euclidean distance across 4 unit simplexes is sqrt(2 + 2 + 2 + 2) = sqrt(8) ~ 2.8284
  const theoreticalMax = Math.sqrt(8);
  const confidenceIndex = Math.max(5, Math.min(99, Math.round((1 - (minDistance / theoreticalMax)) * 100)));

  return {
    bestMatch: best,
    secondMatch: second || best,
    minDistance: Math.round(minDistance * 1000) / 1000,
    confidenceIndex,
    allDistances: distances.sort((a, b) => a.distance - b.distance).slice(0, 10)
  };
}

/**
 * Retrieves an archetype record by exact or partial ECCP code
 */
function getArchetypeByCode(code) {
  const data = loadMatrix();
  if (data.archetypes[code]) return data.archetypes[code];

  // Try flexible lookup
  const clean = code.toUpperCase().replace(/\s+/g, '');
  for (const k of Object.keys(data.archetypes)) {
    if (k.replace(/-/g, '') === clean.replace(/-/g, '')) {
      return data.archetypes[k];
    }
  }
  return data.list[0];
}

/**
 * Dynamic Narrative Synthesizer for Local LLM / RAG Agent
 */
function synthesizeDynamicProfile(archetype, normalized, confidenceIndex) {
  const { energy, cognition, competency, purpose } = normalized;

  return {
    headline: `${archetype.english_title} (${archetype.sanskrit_title})`,
    epic_mirror: archetype.epic_anchor,
    confidence_rating: `${confidenceIndex}% Archetypal Concordance`,
    vector_summary: {
      energy: `Dominant ${archetype.energy_mode} (${energy.S}% Sattva, ${energy.R}% Rajas, ${energy.T}% Tamas)`,
      cognition: `Dominant ${archetype.cognition_locus} (${cognition.BM}% Buddhi, ${cognition.MM}% Manas, ${cognition.AM}% Ahankara)`,
      competency: `Innate Swabhava: ${archetype.competency_domain} (B:${competency.B}%, K:${competency.K}%, V:${competency.V}%, S:${competency.S}%)`,
      purpose: `Primary Purushartha: ${archetype.purpose_vector} (D:${purpose.D}%, A:${purpose.A}%, K:${purpose.K}%, M:${purpose.M}%)`
    },
    narrative: `You express the psychological architecture of ${archetype.english_title}. Your energetic baseline operates primarily through ${archetype.energy_mode.toLowerCase()} dynamics, governed by ${archetype.cognition_locus.toLowerCase()} discernment. Your vocational instincts naturally incline toward ${archetype.competency_domain} systems, oriented toward the realization of ${archetype.purpose_vector}. In classical literature, your core qualities resonate deeply with ${archetype.epic_anchor}.`,
    vocational_crosswalk: {
      nsqf_level: archetype.ncvet_alignment.nsqf_level,
      sector: archetype.ncvet_alignment.primary_sector,
      qp_code: archetype.ncvet_alignment.qp_code,
      onet_code: archetype.ncvet_alignment.us_onet_code,
      recommended_roles: archetype.ncvet_alignment.aligned_careers
    },
    sadhana_protocol: archetype.sadhana_protocol,
    shadow_warning: archetype.shadow_warning
  };
}

module.exports = {
  loadMatrix,
  normalizeSubvectors,
  euclideanDistance,
  matchCentroids,
  getArchetypeByCode,
  synthesizeDynamicProfile
};
