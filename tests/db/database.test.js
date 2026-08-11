'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../server/db');

test('Database Engine & Table Schema Verification', async (t) => {
  await t.test('db instance exposes prepare & exec', () => {
    assert.strictEqual(typeof db.prepare, 'function');
    assert.strictEqual(typeof db.exec, 'function');
  });

  await t.test('users table exists', async () => {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    assert.ok(row, 'users table should exist');
  });

  await t.test('licenses table exists', async () => {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='licenses'").get();
    assert.ok(row, 'licenses table should exist');
  });

  await t.test('report_orders table exists', async () => {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='report_orders'").get();
    assert.ok(row, 'report_orders table should exist');
  });

  await t.test('custom_skills table exists', async () => {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='custom_skills'").get();
    assert.ok(row, 'custom_skills table should exist');
  });

  await t.test('nsqf_qps table contains 2,176 NCVET NSQF Job Roles', async () => {
    const countRow = await db.prepare("SELECT COUNT(*) as count FROM nsqf_qps").get();
    assert.ok(countRow, 'countRow should be returned');
    assert.strictEqual(Number(countRow.count), 2176, 'nsqf_qps should contain 2,176 job roles');
  });

  await t.test('nsqf_curricula table exists & seeds parsed curriculum', async () => {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='nsqf_curricula'").get();
    assert.ok(row, 'nsqf_curricula table should exist');
    
    const sampleRow = await db.prepare("SELECT qp_code, schema_json FROM nsqf_curricula WHERE qp_code = 'AAS/Q0103'").get();
    assert.ok(sampleRow, 'AAS/Q0103 sample curriculum row should exist');
    const parsed = JSON.parse(sampleRow.schema_json);
    assert.strictEqual(parsed.qp_code, 'AAS/Q0103');
    assert.ok(Array.isArray(parsed.nos_modules), 'schema_json should contain nos_modules array');
  });
});




