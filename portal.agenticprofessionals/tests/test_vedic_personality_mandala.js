'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== RUNNING VEDIC PERSONALITY SOUL MANDALA TEST SUITE ===');

// 1. Read personalities_vedic.html
const html = fs.readFileSync(path.join(__dirname, '../personalities_vedic.html'), 'utf8');

// 2. Extract JS from personalities_vedic.html
const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
const match = scriptRegex.exec(html);
assert(match, 'Failed to extract inline script from personalities_vedic.html');
const jsCode = match[1];

// 3. Setup mock DOM environment for evaluation
const mockDOM = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        style: {},
        classList: {
          add(c) { this._classes.add(c); },
          remove(c) { this._classes.delete(c); },
          toggle(c, val) { if (val) this._classes.add(c); else this._classes.delete(c); },
          contains(c) { return this._classes.has(c); },
          _classes: new Set()
        },
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k]; }
      };
    }
    return this.elements[id];
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

// Evaluate the script functions in VM or Function context
const context = {
  window: { addEventListener() {} },
  document: mockDOM,
  navigator: {},
  fetch: async () => ({ json: async () => ({ success: true }) }),
  console
};

const fn = new Function('window', 'document', 'navigator', 'fetch', 'console', `
  ${jsCode}
  return {
    computeGunaWeights,
    computeMandalaXY,
    computeCounterWeightGunas,
    generateSoulMarkdown,
    MANDALA_ARCHETYPE_PRESETS,
    MANDALA_VERTICES
  };
`);

const engine = fn(context.window, context.document, context.navigator, context.fetch, context.console);

// TEST 1: Barycentric Coordinates strictly sum to 100%
console.log('\n--- Test 1: Barycentric Coordinate Math ---');
const testPoints = [
  { x: 190, y: 48, desc: 'Sattva Apex' },
  { x: 50, y: 290, desc: 'Rajas Corner' },
  { x: 330, y: 290, desc: 'Tamas Corner' },
  { x: 190, y: 209, desc: 'Centroid' },
  { x: 10, y: 10, desc: 'Far Outside (Clamping check)' },
  { x: 500, y: 500, desc: 'Far Outside Bottom (Clamping check)' }
];

testPoints.forEach(p => {
  const w = engine.computeGunaWeights(p.x, p.y);
  const total = w.s + w.r + w.t;
  console.log(`Point (${p.x}, ${p.y}) [${p.desc}]: S=${w.s}%, R=${w.r}%, T=${w.t}% -> Sum = ${total}%`);
  assert.strictEqual(total, 100, `Weights must strictly sum to 100% for ${p.desc}`);
  assert(w.s >= 0 && w.s <= 100, 'Sattva must be 0-100%');
  assert(w.r >= 0 && w.r <= 100, 'Rajas must be 0-100%');
  assert(w.t >= 0 && w.t <= 100, 'Tamas must be 0-100%');
});
console.log('✓ Test 1 Passed: All Barycentric coordinates normalize and sum strictly to 100%');

// TEST 2: Counter-Weight Inversion Algorithm
console.log('\n--- Test 2: Counter-Weight Balancing Inversion ---');
// Rajasic user (action heavy) -> expects Sattva (wisdom/discernment)
const rajasUser = engine.computeCounterWeightGunas(25, 65, 10);
console.log('Rajasic User (25, 65, 10) -> Counter-Weight Agent:', rajasUser);
assert.strictEqual(rajasUser.sattva, 65, 'Agent must elevate Sattva to balance Rajasic drive');
assert.strictEqual(rajasUser.rajas, 25, 'Agent Rajas must be calibrated');

// Tamasic user (inertia/hesitant) -> expects Rajas (dynamic action)
const tamasUser = engine.computeCounterWeightGunas(10, 20, 70);
console.log('Tamasic User (10, 20, 70) -> Counter-Weight Agent:', tamasUser);
assert.strictEqual(tamasUser.rajas, 70, 'Agent must elevate Rajas to break Tamasic inertia');

// Sattvik user (pure reflection) -> expects Rajas (execution drive)
const sattvaUser = engine.computeCounterWeightGunas(80, 15, 5);
console.log('Sattvik User (80, 15, 5) -> Counter-Weight Agent:', sattvaUser);
assert.strictEqual(sattvaUser.rajas, 80, 'Agent must elevate Rajas to materialize Sattvik ideas');
console.log('✓ Test 2 Passed: Counter-Weight inversion logic operates accurately across all 3 Guna dominances');

// TEST 3: soul.md Markdown & YAML Frontmatter Generation
console.log('\n--- Test 3: soul.md Schema & Content Synthesis ---');
const sampleArch = {
  name: 'Arjuna',
  sanskrit_title: 'Dhananjaya',
  eccp_code: 'SR-BM-K-D',
  epic: 'Mahabharata',
  devanagari: 'तस्मात्त्वमुत्तिष्ठ यशो लभस्व जित्वा शत्रून् भुङ्क्ष्व राज्यं समृद्धम् ।',
  quote: 'Become merely an instrument of cosmic duty.',
  epic_citation: 'Bhagavad Gita 11.33',
  antahkarana: 'Buddhi-Led Objective Reasoning',
  competency: 'Kshatriya Strategic Execution',
  purpose: 'Dharma Universal Order',
  shadow_warning: 'Vulnerability to existential despondency (Vishada).'
};

// Generate Mirror Soul
const mirrorSoul = engine.generateSoulMarkdown(sampleArch, 'mirror', { sattva: 25, rajas: 65, tamas: 10 });
assert(mirrorSoul.startsWith('---\n'), 'soul.md must start with YAML frontmatter delimiter');
assert(mirrorSoul.includes('name: "Arjuna Alter-Ego"'), 'Must contain character alter-ego name');
assert(mirrorSoul.includes('interaction_mode: "Alter-Ego (Mirror)"'), 'Must record Alter-Ego mode');
assert(mirrorSoul.includes('target_harness: "Hayagriva Desktop IPE"'), 'Must specify target harness');
assert(mirrorSoul.includes('schema_version: "1.0.0"'), 'Must specify schema version');
assert(mirrorSoul.includes('## 1. Dharmic Core & Cognitive Locus'), 'Must contain Core & Locus');
assert(mirrorSoul.includes('## 2. Guiding Shastric Maxims'), 'Must contain Shastric Maxims');
assert(mirrorSoul.includes('## 3. Dharmic Directives & Operational Knacks'), 'Must contain Directives');
assert(mirrorSoul.includes('## 4. Voice & Communication Protocol'), 'Must contain Tone & Voice');
assert(mirrorSoul.includes('Pravritti (Dynamic Alignment)'), 'Mirror mode must include Pravritti directive');

// Generate Counter-Weight Soul
const counterSoul = engine.generateSoulMarkdown(sampleArch, 'counterweight', { sattva: 65, rajas: 25, tamas: 10 });
assert(counterSoul.includes('interaction_mode: "Counter-Weight (Keep Me in Check)"'), 'Must record Counter-Weight mode');
assert(counterSoul.includes('Nivritti (Counter-Balancing Check)'), 'Counter-Weight mode must include Nivritti directive');

console.log('Generated soul.md sample preview:\n' + mirrorSoul.slice(0, 320) + '\n...');
console.log('✓ Test 3 Passed: Valid YAML frontmatter and Dharmic directives in generated soul.md');

// TEST 4: Header Unification Verification across all 5 files
console.log('\n--- Test 4: Universal 4-Pillar Header Verification ---');
const filesToCheck = [
  'index.html',
  'employees_nsqf.html',
  'employers_sop.html',
  'entrepreneurs_msme.html',
  'personalities_vedic.html'
];

filesToCheck.forEach(file => {
  const fileContent = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert(fileContent.includes('ai.playbooks'), `${file} must contain ai.playbooks`);
  assert(fileContent.includes('ai.workflows'), `${file} must contain ai.workflows`);
  assert(fileContent.includes('ai.ventures'), `${file} must contain ai.ventures`);
  assert(fileContent.includes('ai.personality'), `${file} must contain ai.personality`);
  assert(fileContent.includes('Hayagriva Harness'), `${file} must contain Hayagriva Harness download CTA`);
  assert(!fileContent.includes('Personality Tests'), `${file} must NOT contain Personality Tests dropdown`);
  assert(fileContent.includes('<span>agentic professionals</span>'), `${file} must display 'agentic professionals' logo`);
  console.log(`✓ ${file}: Header verified (4 tabs + Hayagriva Harness, no dropdown, lowercase brand)`);
});

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
