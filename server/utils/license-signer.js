'use strict';

/**
 * Haya Portal Ed25519 License Signer
 * -----------------------------------
 * Generates Ed25519 Key Pairs and signs offline license tokens
 * for Hayagriva Desktop's license validator.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, '..', 'keys');
const PRIV_KEY_PATH = path.join(KEYS_DIR, 'ed25519_private.pem');
const PUB_KEY_PATH = path.join(KEYS_DIR, 'ed25519_public.pem');

/**
 * Ensures an Ed25519 KeyPair exists on the server.
 */
function ensureKeyPair() {
    if (!fs.existsSync(KEYS_DIR)) {
        fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    if (!fs.existsSync(PRIV_KEY_PATH) || !fs.existsSync(PUB_KEY_PATH)) {
        console.log('[License Signer] Generating new server Ed25519 Key Pair...');
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
        const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
        const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

        fs.writeFileSync(PUB_KEY_PATH, pubPem, 'utf8');
        fs.writeFileSync(PRIV_KEY_PATH, privPem, 'utf8');
        console.log(`[License Signer] Ed25519 Public Key saved to ${PUB_KEY_PATH}`);
    }
}

function toBase64URL(buffer) {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generates an Ed25519-signed license token string.
 *
 * @param {object} payload - { sub, tier, expiresAt, gracePeriodDays, allowedDomains }
 * @returns {string} - "<base64url(payload)>.<base64url(signature)>"
 */
function generateLicenseKey(payload) {
    ensureKeyPair();

    const privKeyPem = fs.readFileSync(PRIV_KEY_PATH, 'utf8');
    const privateKey = crypto.createPrivateKey(privKeyPem);

    const payloadJsonStr = JSON.stringify(payload);
    const payloadB64URL = toBase64URL(Buffer.from(payloadJsonStr, 'utf8'));

    const payloadBytes = Buffer.from(payloadB64URL, 'utf8');
    const signatureBytes = crypto.sign(null, payloadBytes, privateKey);
    const signatureB64URL = toBase64URL(signatureBytes);

    return `${payloadB64URL}.${signatureB64URL}`;
}

/**
 * Returns public key PEM string for embedding/testing.
 */
function getPublicKeyPem() {
    ensureKeyPair();
    return fs.readFileSync(PUB_KEY_PATH, 'utf8');
}

module.exports = { generateLicenseKey, getPublicKeyPem, ensureKeyPair };
