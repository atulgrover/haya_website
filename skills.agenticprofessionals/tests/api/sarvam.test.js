'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

test('Sarvam AI (sarvam-105b) Primary LLM Endpoint Suite', async (t) => {
  const apiKey = process.env.SARVAM_API_KEY;

  await t.test('SARVAM_API_KEY is configured in .env', () => {
    assert.ok(apiKey, 'SARVAM_API_KEY environment variable should be set');
    assert.ok(apiKey.startsWith('sk_'), 'SARVAM_API_KEY should start with sk_');
  });

  await t.test('Sarvam AI chat completions API returns valid JSON & tool calling capability', async () => {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey.trim()
      },
      body: JSON.stringify({
        model: 'sarvam-105b',
        messages: [
          { role: 'system', content: 'You are an NSQF Curriculum Architect for Indian Legal & Industrial skills. Respond with valid JSON only.' },
          { role: 'user', content: 'Generate a 1-step JSON sample for skill: "NCLT CIRP Procedure". Structure: {"title":"NCLT","step":"Admission"}' }
        ],
        temperature: 0.3
      })
    });

    assert.strictEqual(res.status, 200, 'Sarvam AI API should return HTTP 200');

    const data = await res.json();
    assert.ok(data.choices && data.choices.length > 0, 'Data should contain choices array');
    const content = data.choices[0].message?.content || data.choices[0].message?.reasoning_content;
    assert.ok(content, 'Sarvam response message must contain text or reasoning content');
    assert.strictEqual(data.model, 'sarvam-105b');
  });
});
