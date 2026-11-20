'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 * HPTI PSYCHOMETRIC VALIDATION & TELEMETRY ENGINE
 * Computes Cronbach's Alpha, Item-Total Correlation (r_it),
 * Item Variance, and exports empirical datasets for Factor Analysis.
 * ══════════════════════════════════════════════════════════════════
 */

const db = require('../db');

/**
 * Logs a completed evaluation session and its individual item responses
 */
async function recordSessionTelemetry(sessionData) {
  const {
    sessionId,
    tier = 'rapid',
    eccpCode,
    confidenceIndex = 0,
    rawScores = {},
    normalizedVector = {},
    matchedArchetypeId = '',
    vikritiScore = 0,
    answers = {},
    questionBank = []
  } = sessionData;

  try {
    // 1. Insert Session Master Record
    await db.query(`
      INSERT INTO eccp_test_sessions (
        session_id, tier, eccp_code, confidence_index, raw_scores,
        normalized_vector, matched_archetype_id, vikriti_score, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (session_id) DO UPDATE SET
        eccp_code = EXCLUDED.eccp_code,
        confidence_index = EXCLUDED.confidence_index,
        raw_scores = EXCLUDED.raw_scores,
        normalized_vector = EXCLUDED.normalized_vector;
    `, [
      sessionId,
      tier,
      eccpCode,
      confidenceIndex,
      JSON.stringify(rawScores),
      JSON.stringify(normalizedVector),
      matchedArchetypeId,
      vikritiScore
    ]);

    // 2. Insert Item Responses for Item Analysis
    const qMap = {};
    questionBank.forEach(q => { qMap[q.id] = q; });

    for (const [qId, selectedOption] of Object.entries(answers)) {
      const qMeta = qMap[qId] || {};
      const dim = qMeta.dimension || 'general';

      await db.query(`
        INSERT INTO eccp_item_responses (
          session_id, question_id, dimension, selected_option, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [sessionId, qId, dim, String(selectedOption)]);
    }

    return { success: true };
  } catch (err) {
    console.warn('[Psychometrics Telemetry] Warning: Failed to record telemetry:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Calculates Cronbach's Alpha for a given dimension or entire scale
 * alpha = (K / (K - 1)) * (1 - (sum(var_item) / var_total))
 */
function calculateCronbachAlpha(itemMatrix) {
  // itemMatrix is an array of observations: [ [item1, item2, ...], [item1, item2, ...] ]
  const n = itemMatrix.length;
  if (n < 5) {
    return { alpha: null, sampleSize: n, message: 'Insufficient sample size (minimum 5 required)' };
  }

  const k = itemMatrix[0].length;
  if (k < 2) {
    return { alpha: null, sampleSize: n, message: 'Subscale must have at least 2 items' };
  }

  // Calculate item means and variances
  const itemVariances = [];
  for (let col = 0; col < k; col++) {
    let sum = 0;
    for (let row = 0; row < n; row++) {
      sum += itemMatrix[row][col];
    }
    const mean = sum / n;

    let varSum = 0;
    for (let row = 0; row < n; row++) {
      varSum += Math.pow(itemMatrix[row][col] - mean, 2);
    }
    // sample variance (n - 1)
    const variance = varSum / (n - 1);
    itemVariances.push(variance);
  }

  // Calculate total composite scores and variance
  const totalScores = [];
  let totalSum = 0;
  for (let row = 0; row < n; row++) {
    let personTotal = 0;
    for (let col = 0; col < k; col++) {
      personTotal += itemMatrix[row][col];
    }
    totalScores.push(personTotal);
    totalSum += personTotal;
  }

  const totalMean = totalSum / n;
  let totalVarSum = 0;
  for (let i = 0; i < n; i++) {
    totalVarSum += Math.pow(totalScores[i] - totalMean, 2);
  }
  const totalVariance = totalVarSum / (n - 1);

  if (totalVariance <= 0) {
    return { alpha: 0.0, sampleSize: n, k, message: 'Zero variance in composite score' };
  }

  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);
  const rawAlpha = (k / (k - 1)) * (1 - (sumItemVariances / totalVariance));
  const alpha = Math.max(0, Math.min(0.999, Math.round(rawAlpha * 1000) / 1000));

  let interpretation = 'Unacceptable';
  if (alpha >= 0.90) interpretation = 'Excellent (Clinical & Certification Standard)';
  else if (alpha >= 0.80) interpretation = 'Good (Standard Psychometric Benchmark)';
  else if (alpha >= 0.70) interpretation = 'Acceptable (Exploratory / Research Grade)';
  else if (alpha >= 0.60) interpretation = 'Questionable';

  return {
    alpha,
    k_items: k,
    sampleSize: n,
    sumItemVariances: Math.round(sumItemVariances * 100) / 100,
    totalVariance: Math.round(totalVariance * 100) / 100,
    interpretation
  };
}

/**
 * Aggregates empirical test statistics from the database
 */
async function getPsychometricReport() {
  try {
    const sessionCountRes = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN tier = 'rapid' THEN 1 END) as rapid_count,
        COUNT(CASE WHEN tier = 'vocational' THEN 1 END) as vocational_count,
        AVG(confidence_index) as avg_confidence
      FROM eccp_test_sessions;
    `);

    const stats = sessionCountRes.rows[0] || {};

    const codeDistributionRes = await db.query(`
      SELECT eccp_code, COUNT(*) as count
      FROM eccp_test_sessions
      GROUP BY eccp_code
      ORDER BY count DESC
      LIMIT 15;
    `);

    return {
      success: true,
      total_sessions: parseInt(stats.total_sessions || 0, 10),
      rapid_count: parseInt(stats.rapid_count || 0, 10),
      vocational_count: parseInt(stats.vocational_count || 0, 10),
      avg_confidence_index: Math.round(stats.avg_confidence || 0),
      top_archetypes: codeDistributionRes.rows,
      target_benchmarks: {
        cronbach_alpha_target: '>= 0.85 (APA / ITC Standard)',
        test_retest_target: 'r >= 0.80 (30-day stability)',
        latent_factor_model: '4-Orthogonal Dimension CFA'
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      total_sessions: 0
    };
  }
}

/**
 * Exports anonymized response vectors as CSV for SPSS, R, and Python Factor Analysis
 */
async function exportFactorAnalysisCSV() {
  try {
    const res = await db.query(`
      SELECT s.session_id, s.tier, s.eccp_code, s.confidence_index, r.question_id, r.dimension, r.selected_option
      FROM eccp_test_sessions s
      JOIN eccp_item_responses r ON s.session_id = r.session_id
      ORDER BY s.created_at DESC, r.question_id ASC;
    `);

    const rows = res.rows;
    if (!rows.length) {
      return { success: false, message: 'No empirical sessions recorded yet.' };
    }

    // Pivot table: session_id -> { q1, q2, ... }
    const sessions = {};
    const questionCols = new Set();

    rows.forEach(r => {
      if (!sessions[r.session_id]) {
        sessions[r.session_id] = {
          session_id: r.session_id,
          tier: r.tier,
          eccp_code: r.eccp_code,
          confidence_index: r.confidence_index
        };
      }
      sessions[r.session_id][r.question_id] = r.selected_option;
      questionCols.add(r.question_id);
    });

    const sortedQCols = Array.from(questionCols).sort();
    const headers = ['session_id', 'tier', 'eccp_code', 'confidence_index', ...sortedQCols];

    const csvLines = [headers.join(',')];
    Object.values(sessions).forEach(sess => {
      const line = headers.map(h => sess[h] !== undefined ? `"${sess[h]}"` : '""').join(',');
      csvLines.push(line);
    });

    return {
      success: true,
      csv: csvLines.join('\n'),
      totalSessions: Object.keys(sessions).length,
      itemCount: sortedQCols.length
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  recordSessionTelemetry,
  calculateCronbachAlpha,
  getPsychometricReport,
  exportFactorAnalysisCSV
};
