const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/hayadb' });

async function findRealQps() {
  const sectors = [
    'Aerospace and Aviation',
    'IT-ITeS',
    'Healthcare',
    'BFSI',
    'Management',
    'Green Jobs',
    'Logistics',
    'Automotive',
    'Electronics',
    'Construction',
    'Media & Entertainment',
    'Agriculture',
    'Life Sciences',
    'Telecom',
    'Capital Goods'
  ];

  for (const sec of sectors) {
    const res = await pool.query(
      `SELECT qp_code, qp_name, nsqf_level, sub_sector, occupation 
       FROM nsqf_qps 
       WHERE sector = $1 
       ORDER BY CAST(NULLIF(regexp_replace(nsqf_level, '[^0-9.]', '', 'g'), '') AS NUMERIC) DESC NULLS LAST 
       LIMIT 10`,
      [sec]
    );
    console.log(`\n=== ${sec} ===`);
    res.rows.forEach(r => console.log(`  ${r.qp_code} | L${r.nsqf_level} | ${r.qp_name}`));
  }
  await pool.end();
}
findRealQps().catch(console.error);
