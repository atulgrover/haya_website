const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/hayadb' });
const { FLAGSHIP_ALIGNMENTS } = require('../server/utils/careerAligner');

async function auditAlignments() {
  console.log('Auditing FLAGSHIP_ALIGNMENTS against nsqf_qps in PostgreSQL...');
  let totalQps = 0;
  let validQps = 0;
  let missingList = [];

  for (const varna of ['Brahmana', 'Kshatriya', 'Vaishya', 'Shudra']) {
    const sectors = FLAGSHIP_ALIGNMENTS[varna] || {};
    for (const [sectorKey, data] of Object.entries(sectors)) {
      // Check primary
      totalQps++;
      const pRes = await pool.query('SELECT qp_code, qp_name, sector FROM nsqf_qps WHERE qp_code = $1', [data.qp_code]);
      if (pRes.rows.length > 0) {
        validQps++;
      } else {
        missingList.push(`[${varna}:${sectorKey}] Primary ${data.qp_code}`);
      }

      // Check aligned careers
      for (const c of (data.aligned_careers || [])) {
        const m = c.match(/^(.*?)\s*\(([A-Z0-9_/]+)\s*-\s*NSQF\s*([^)]+)\)$/i);
        if (m) {
          totalQps++;
          const cCode = m[2];
          const cRes = await pool.query('SELECT qp_code, qp_name, sector FROM nsqf_qps WHERE qp_code = $1', [cCode]);
          if (cRes.rows.length > 0) {
            validQps++;
          } else {
            missingList.push(`[${varna}:${sectorKey}] Career ${cCode} in "${c}"`);
          }
        } else {
          missingList.push(`[${varna}:${sectorKey}] Regex failed on "${c}"`);
        }
      }
    }
  }

  console.log(`\nAudit complete: ${validQps} / ${totalQps} QPs verified in PostgreSQL.`);
  if (missingList.length === 0) {
    console.log('🎉 100% of all QPs exist in nsqf_qps table!');
  } else {
    console.error('❌ Missing items:', missingList);
  }
  await pool.end();
}
auditAlignments().catch(console.error);
