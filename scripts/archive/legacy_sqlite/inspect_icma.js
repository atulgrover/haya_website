'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'server', 'portal_database.db'));

const rows = db.prepare(`SELECT id, qp_code, nos_code, pc_code, pc_intent, pc_description FROM nsqf_pcs WHERE qp_code = 'ICMA/BSC/Q2401'`).all();
console.log(`Found ${rows.length} PCs for ICMA/BSC/Q2401:\n`);
rows.forEach(r => {
    console.log(`ID: ${r.id} | PC: ${r.pc_code} | INTENT: ${r.pc_intent}`);
});
