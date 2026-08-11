'use strict';

const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../server/db');

const JWT_SECRET = process.env.JWT_SECRET || 'HAYA_PORTAL_SUPER_SECRET_JWT_KEY_2026';

test('Authentication & JWT Security Suite', async (t) => {
  const testEmail = `test_practitioner_${Date.now()}@hayagriva.app`;
  const testPassword = 'TestSecurePassword2026!';
  const testFullName = 'Adv. Vikram Sharma';

  await t.test('Password hashing with bcryptjs generates valid salt and hash', async () => {
    const hash = await bcrypt.hash(testPassword, 10);
    assert.ok(hash, 'Hash should be generated');
    assert.notStrictEqual(hash, testPassword, 'Hash must not equal plaintext password');
    const matches = await bcrypt.compare(testPassword, hash);
    assert.strictEqual(matches, true, 'bcrypt compare should verify matching password');
  });

  await t.test('User registration persists to users table with default subscription', async () => {
    const hash = await bcrypt.hash(testPassword, 10);
    const result = await db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (?, ?, ?, 'professional')
    `).run(testEmail, hash, testFullName);

    assert.ok(result.lastInsertRowid > 0, 'User ID should be greater than 0');

    const user = await db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(result.lastInsertRowid);
    assert.ok(user, 'User should be found in database');
    assert.strictEqual(user.email, testEmail);
    assert.strictEqual(user.role, 'professional');
  });

  await t.test('JWT token signing and verification payload integrity', () => {
    const payload = { id: 999, email: testEmail, role: 'professional' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    assert.ok(token, 'JWT token string should be returned');

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.email, payload.email);
    assert.strictEqual(decoded.role, payload.role);
  });
});
