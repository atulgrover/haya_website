'use strict';

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { generateLicenseKey, getPublicKeyPem, ensureKeyPair } = require('../../server/utils/license-signer');

test('Ed25519 Cryptographic Licensing Engine', async (t) => {
  await t.test('ensureKeyPair creates Ed25519 PEM keys', () => {
    ensureKeyPair();
    const pubKey = getPublicKeyPem();
    assert.ok(pubKey, 'Public key PEM should exist');
    assert.ok(pubKey.includes('BEGIN PUBLIC KEY'), 'Public key should be SPKI PEM format');
  });

  await t.test('generateLicenseKey produces valid Ed25519 signature payload', () => {
    const payload = {
      sub: 'user_123',
      email: 'practitioner@hayagriva.app',
      tier: 'enterprise',
      expiresAt: '2027-12-31T23:59:59.000Z',
      allowedDomains: ['bankruptcy', 'nclt']
    };

    const licenseKey = generateLicenseKey(payload);
    assert.ok(licenseKey, 'License key string should be returned');
    
    const parts = licenseKey.split('.');
    assert.strictEqual(parts.length, 2, 'License key must consist of payloadB64URL.signatureB64URL');

    const [payloadB64, sigB64] = parts;
    assert.ok(payloadB64.length > 10, 'Payload B64 string should be non-empty');
    assert.ok(sigB64.length > 10, 'Signature B64 string should be non-empty');

    // Verify signature cryptographically using public key
    const pubKeyPem = getPublicKeyPem();
    const publicKey = crypto.createPublicKey(pubKeyPem);

    const payloadBytes = Buffer.from(payloadB64, 'utf8');

    // Reconstruct standard Base64 from Base64URL
    let base64Sig = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Sig.length % 4 !== 0) {
      base64Sig += '=';
    }
    const signatureBytes = Buffer.from(base64Sig, 'base64');

    const isValid = crypto.verify(null, payloadBytes, publicKey, signatureBytes);
    assert.strictEqual(isValid, true, 'Cryptographic Ed25519 signature must verify as valid');
  });
});
