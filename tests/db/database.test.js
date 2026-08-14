'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../server/db');

test('Database Engine & Table Schema Verification (PostgreSQL hayadb)', async (t) => {
  await t.test('db instance exposes prepare, exec & query', () => {
    assert.strictEqual(typeof db.prepare, 'function');
    assert.strictEqual(typeof db.exec, 'function');
    assert.strictEqual(typeof db.query, 'function');
  });

  await t.test('users table exists in hayadb', async () => {
    const row = await db.prepare("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='users'").get();
    assert.ok(row, 'users table should exist in hayadb');
  });

  await t.test('licenses table exists in hayadb', async () => {
    const row = await db.prepare("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='licenses'").get();
    assert.ok(row, 'licenses table should exist in hayadb');
  });

  await t.test('report_orders table exists in hayadb', async () => {
    const row = await db.prepare("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='report_orders'").get();
    assert.ok(row, 'report_orders table should exist in hayadb');
  });

  await t.test('custom_skills table exists in hayadb', async () => {
    const row = await db.prepare("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='custom_skills'").get();
    assert.ok(row, 'custom_skills table should exist in hayadb');
  });

  await t.test('nsqf_qps table contains master NCVET NSQF Job Roles (>= 2,000)', async () => {
    const countRow = await db.prepare("SELECT COUNT(*) as count FROM nsqf_qps").get();
    assert.ok(countRow, 'countRow should be returned');
    assert.ok(Number(countRow.count) >= 2000, `nsqf_qps should contain >= 2,000 job roles (found ${countRow.count})`);
  });

  await t.test('nsqf_pcs table exists & contains over 200,000 criteria in hayadb', async () => {
    const countRow = await db.prepare("SELECT COUNT(*) as count FROM nsqf_pcs").get();
    assert.ok(countRow, 'countRow should be returned');
    assert.ok(Number(countRow.count) >= 200000, `nsqf_pcs should contain >= 200,000 criteria (found ${countRow.count})`);
  });
});





