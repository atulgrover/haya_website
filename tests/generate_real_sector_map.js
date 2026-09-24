const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/hayadb' });

async function generateRealSectorMap() {
  const flagships = [
    { id: 'aerospace', name: 'Aerospace & Aviation', dbSector: 'Aerospace and Aviation', icon: '🚀' },
    { id: 'it_ai', name: 'IT-ITeS & Future Tech', dbSector: 'IT-ITeS', icon: '💻' },
    { id: 'healthcare', name: 'Healthcare & Wellness', dbSector: 'Healthcare', icon: '🏥' },
    { id: 'bfsi', name: 'BFSI & Financial Markets', dbSector: 'BFSI', icon: '📈' },
    { id: 'management', name: 'Management & Entrepreneurship', dbSector: 'Management', icon: '🏛️' },
    { id: 'green_energy', name: 'Green Jobs & Sustainability', dbSector: 'Green Jobs', icon: '🌱' },
    { id: 'logistics', name: 'Logistics & Supply Chain', dbSector: 'Logistics', icon: '🚢' },
    { id: 'automotive', name: 'Automotive & Smart Mobility', dbSector: 'Automotive', icon: '⚡' },
    { id: 'electronics', name: 'Electronics & Semiconductors', dbSector: 'Electronics', icon: '🔬' },
    { id: 'construction', name: 'Construction & Smart Infrastructure', dbSector: 'Construction', icon: '🏗️' },
    { id: 'media', name: 'Media & Entertainment', dbSector: 'Media & Entertainment', icon: '🎬' },
    { id: 'agriculture', name: 'Agriculture & Agri-Tech', dbSector: 'Agriculture', icon: '🌾' }
  ];

  for (const f of flagships) {
    const res = await pool.query(`
      SELECT qp_code, qp_name, nsqf_level, sub_sector, occupation, awarding_body
      FROM nsqf_qps
      WHERE sector = $1
      ORDER BY CAST(NULLIF(regexp_replace(nsqf_level, '[^0-9.]', '', 'g'), '') AS NUMERIC) DESC NULLS LAST, qp_code ASC
    `, [f.dbSector]);

    console.log(`\n=================== ${f.name} [${f.dbSector}] (${res.rows.length} QPs) ===================`);
    res.rows.slice(0, 15).forEach(r => {
      console.log(`  ${r.qp_code} | L${r.nsqf_level} | ${r.qp_name} | Sub: ${r.sub_sector || 'N/A'}`);
    });
  }
  await pool.end();
}
generateRealSectorMap().catch(console.error);
