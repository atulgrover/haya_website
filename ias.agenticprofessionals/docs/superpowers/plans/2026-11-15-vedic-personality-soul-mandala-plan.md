# Vedic Personality Soul Mandala & 4-Pillar Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate `ai.personality` into a primary center navigation tab, remove the secondary right dropdown, build an interactive visual Triguna Mandala on `personalities_vedic.html` supporting "Mirror Alter-Ego" and "Counter-Weight (Keep Me in Check)" modes, and provide 1-click `soul.md` generation for the Hayagriva Desktop Harness.

**Architecture:** Symmetrical 4-pillar header across all 5 portal pages, interactive SVG/Canvas Triguna Mandala with barycentric coordinate mathematics, dynamic counter-weight vector inversion, and client-side YAML/Markdown `soul.md` synthesis with 1-click download.

**Tech Stack:** Vanilla JavaScript (ES2022), SVG/Canvas Geometry, CSS3 Flexbox/Grid, Blob/URL APIs.

**Spec:** `docs/superpowers/specs/2026-11-15-vedic-personality-soul-mandala-design.md`

## Global Constraints

- **Exact Header Consistency**: All 5 files must display:
  `[🦄] agentic professionals` | `ai.playbooks` | `ai.workflows` | `ai.ventures` | `ai.personality` | `[⤓ Hayagriva Harness]`
- **No Dropdown**: Strip the `Personality Tests ▾` dropdown from the right actions on all pages.
- **Valid `soul.md` Schema**: Generated `soul.md` must contain valid YAML frontmatter parseable by standard agent harnesses.
- **Zero Breakage**: Existing search and 144 archetype cards on `personalities_vedic.html` must remain fully operational.

## Review Focus

1. **Header Layout on Mobile and Tablet**: The 4 tabs must fit cleanly or collapse into the mobile drawer without horizontal clipping.
2. **Barycentric Normalization**: The Triguna puck coordinates must strictly sum to $S\% + R\% + T\% = 100\%$ regardless of drag position.
3. **Counter-Weight Inversion**: Switching from Mirror to Counter-Weight properly inverts dominant Gunas (e.g. Rajas &rarr; Sattva) and updates the HUD copy.
4. **Download Payload**: Clicking "Download soul.md" generates a file named `soul.md` containing proper markdown without empty fields.
5. **Direct Page Navigation**: Visiting `personalities_vedic.html` directly highlights the `ai.personality` tab as `.active`.

---

### Task 1: Header Restructuring Across All 5 Platform Pages

**Files:**
- Modify: `index.html`
- Modify: `employees_nsqf.html`
- Modify: `employers_sop.html`
- Modify: `entrepreneurs_msme.html`
- Modify: `personalities_vedic.html`
- Modify: `js/components.js`

**Interfaces:**
- Consumes: `ai.playbooks`, `ai.workflows`, `ai.ventures`, `ai.personality`.
- Produces: Unified 4-pillar navigation header with `Hayagriva Harness` as the sole right-side button.

- [ ] **Step 1: Update header in `employees_nsqf.html`**
  Add `<li><a href="personalities_vedic.html" class="nav-link">ai.personality</a></li>` to `.nav-links`. Remove the `.nav-dropdown` div from `.nav-right-actions`.

- [ ] **Step 2: Update header in `employers_sop.html`**
  Add `<li><a href="personalities_vedic.html" class="nav-link">ai.personality</a></li>` to `.nav-links`. Remove the `.nav-dropdown` div from `.nav-right-actions`.

- [ ] **Step 3: Update header in `entrepreneurs_msme.html`**
  Add `<li><a href="personalities_vedic.html" class="nav-link">ai.personality</a></li>` to `.nav-links`. Remove the `.nav-dropdown` div from `.nav-right-actions`.

- [ ] **Step 4: Update header in `index.html`**
  Add `<li><a href="personalities_vedic.html" class="nav-link">ai.personality</a></li>` to `.nav-links`. Remove the `.nav-dropdown` div from `.nav-right-actions`.

- [ ] **Step 5: Update header in `personalities_vedic.html`**
  Insert the static unified header markup with `ai.personality` marked as `class="nav-link active"`. Remove the `.nav-dropdown` div from `.nav-right-actions`.

- [ ] **Step 6: Update `js/components.js` dynamic fallback & mobile drawer**
  Update `renderSiteHeader()` HTML template in `js/components.js` to render the 4 tabs and remove the dropdown.

- [ ] **Step 7: Automated test to verify header structure**
  Run a Node script checking that all 5 files contain `ai.personality` and none contain `Personality Tests` dropdown.

- [ ] **Step 8: Commit**
  ```bash
  git add index.html employees_nsqf.html employers_sop.html entrepreneurs_msme.html personalities_vedic.html js/components.js
  git commit -m "feat(header): unify 4-pillar header with ai.personality and remove right dropdown"
  ```

---

### Task 2: Build the Interactive Visual Triguna Mandala Component

**Files:**
- Modify: `personalities_vedic.html`
- Modify: `css/responsive.css`

**Interfaces:**
- Consumes: 144 Archetype dataset from `personalities_vedic.html` / `server/routes/personalities.js`.
- Produces: Interactive Triguna Mandala with drag puck, Barycentric coordinate math, and Mirror vs Counter-Weight mode toggle.

- [ ] **Step 1: Add Triguna Mandala markup and styles in `personalities_vedic.html`**
  In the center panel header/workbench, insert the Mandala Hero Card:
  - Header: *"What personality do you want your AI Agent to have?"*
  - Dual Mode Toggle: `[ 🪞 Alter-Ego (Mirror) ]` vs `[ ⚖️ Counter-Weight (Keep Me in Check) ]`.
  - SVG Canvas: Equilateral triangle with vertices Sattva, Rajas, Tamas, color gradients, and draggable puck.
  - Live Guna metric pills: `Sattva: X%`, `Rajas: Y%`, `Tamas: Z%`.
  - Quick-preset archetype chips: Arjuna, Chanakya, Janaka, Bhima, Hanuman.

- [ ] **Step 2: Implement Barycentric Drag & Math Engine**
  Implement JavaScript functions:
  - `computeGunaCoordinates(px, py)`: Computes normalized distances to the 3 vertices.
  - `updateMandalaPuck(x, y)`: Clamps point within equilateral triangle and updates puck position.
  - `setMandalaMode(mode)`: Toggles between `'mirror'` and `'counterweight'`, recalculating the target agent profile.
  - `applyArchetypePreset(presetName)`: Moves puck to preset coordinate.

- [ ] **Step 3: Connect Mandala to Archetype Selection**
  When puck moves or preset is clicked:
  - Highlight the closest matching Epic Archetypes in the left list and center grid.
  - Update the active Archetype in the Right HUD.

- [ ] **Step 4: Verify Mandala Math and Interactivity**
  Run test script to verify $S + R + T = 100$ math and mode inversion logic.

- [ ] **Step 5: Commit**
  ```bash
  git add personalities_vedic.html css/responsive.css
  git commit -m "feat(mandala): implement interactive visual triguna mandala with mirror and counter-weight modes"
  ```

---

### Task 3: Implement Live Alter-Ego HUD & `soul.md` Generator & Downloader

**Files:**
- Modify: `personalities_vedic.html`

**Interfaces:**
- Consumes: Selected archetype, mode (`mirror` | `counterweight`), Guna percentages.
- Produces: `downloadSoulMarkdown()`, `copySoulMarkdown()`, and formatted `soul.md` file.

- [ ] **Step 1: Build the Right Panel Alter-Ego HUD**
  Create the live profile card in `panelRight`:
  - Archetype Title, Monogram, and Epic Root.
  - Relationship Mode Badge with dynamic explanation.
  - Guna Power Gauge (visual tri-color bar).
  - Guiding Maxim & Tactical Knack.
  - Dharmic Directives & Prohibited Actions.
  - Voice & Tone Protocol.
  - Action buttons: `[ ⚡ Download soul.md ]` and `[ 📋 Copy Soul Spec ]`.

- [ ] **Step 2: Implement `generateSoulMarkdown()` and Download Handlers**
  Implement:
  ```javascript
  function generateSoulMarkdown(profile, mode, gunas) { ... }
  function downloadSoulMarkdown() { ... }
  function copySoulMarkdown() { ... }
  ```
  Ensure YAML frontmatter is clean, valid, and contains metadata for the Hayagriva Desktop Harness.

- [ ] **Step 3: Test `soul.md` generation in Node**
  Verify generated markdown contains valid frontmatter, character title, gunas, and dharmic directives.

- [ ] **Step 4: Commit**
  ```bash
  git add personalities_vedic.html
  git commit -m "feat(soul): add live alter-ego hud and 1-click soul.md download engine"
  ```

---

### Task 4: Integration Verification, Smoke Test & Git Push

**Files:**
- Test: Verification across all routes and user flows.

- [ ] **Step 1: Verify HTTP 200 on all 4 core pages**
  Run curl check on `index.html`, `employees_nsqf.html`, `employers_sop.html`, `entrepreneurs_msme.html`, `personalities_vedic.html`.

- [ ] **Step 2: Verify git status and push to `origin main`**
  Run `git push origin main`.
