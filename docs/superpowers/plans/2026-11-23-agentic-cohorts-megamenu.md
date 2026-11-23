# Agentic Cohorts Megamenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the "agentic cohorts" megamenu on `http://localhost:3000` (and `agenticprofessionals-net`) to mirror the compact 2-column layout and interactive advisory dock of `http://localhost:3002/investors/` (consultations dock), based on the user's wireframe sketch.

**Architecture:**
- **Layout:** Replaces the current 3-card horizontal grid (`Commercial / IBC`, `Criminal / BNS`, `Civil / CPC`) with a compact 2-column dual layout (`.megamenu-grid-dual`, 660px wide).
- **Left Column:** Displays `agentic cohorts` title, followed by compact `.menu-card` items for `ibc professionals` and `bns professionals`.
- **Right Column:** Displays a dark gradient dock (`.megamenu-col-dark`) containing an upcoming cohort narrative card (`.cohort-narrative-card`), a high-contrast green CTA button (`join a cohort ->`), and the emergency contact row (`emergency contact: 93160-15274 (11 am - 4 pm)`).
- **Interactivity:** Mirroring 3002's `radar.js`, hovering over `ibc professionals` or `bns professionals` highlights the card (`.selected`) and dynamically updates the right dock narrative and CTA button text. Clicking the button opens the registration/cohort intake flow.

**Tech Stack:** HTML5, CSS3 (CSS Variables, Flexbox/Grid, Dark gradients), Vanilla JavaScript (DOM event listeners, dynamic link resolution).

**Spec & Reference:**
- Wireframe sketch: `media_1795433053385_47954b0e.jpg`
- Reference implementation: `http://localhost:3002/investors/` (`ibc.agenticprofessionals/apps/website/public/index.html` lines 88–134 and `radar.js` lines 1281–1335)

---

## Global Constraints

- Megamenu width must be constrained to `660px` with `padding: 14px 16px` to keep height under 170px.
- Left column cards must be clean: lowercase typography, no bulky tags or oversized badges.
- Right column must feature the green CTA button `#10b981` / hover `#34d399` and the emergency phone link `tel:+919316015274`.
- Dynamic deep links must resolve correctly to local ports (`3002` for IBC, `3003` for BNS) on localhost, and to live subdomains in production.
- Changes must be 100% synchronized between `AgenticProfessionals/Home/public/index.html` and `agenticprofessionals-net/public/home/index.html`.

---

## Task Decomposition

### Task 1: Update CSS Styles in `index.html`
**Files:**
- Modify: `AgenticProfessionals/Home/public/index.html` (CSS `<style>` section)

**Steps:**
- [ ] Add `.cohort-narrative-card`, `.cohort-narrative-text`, and ensure `.menu-card.selected` styling matches 3002 (`background: #f0f9ff; border-color: #7dd3fc;`).
- [ ] Add/verify `.fast-track-submit-btn` styling (`height: 34px; background: #10b981; font-family: var(--font-heading); text-transform: lowercase; font-weight: 700;`).
- [ ] Add/verify `.calnode-emergency-contact` styling (`font-family: var(--font-mono); font-size: 9.5px;`).

### Task 2: Refactor HTML Structure for `#nav-item-cohorts`
**Files:**
- Modify: `AgenticProfessionals/Home/public/index.html` (lines ~1497–1535)

**Steps:**
- [ ] Replace existing 3-column `#nav-item-cohorts .megamenu-panel` with:
  ```html
  <li class="nav-item" id="nav-item-cohorts">
    <button type="button" class="nav-btn" aria-haspopup="true">
      <span>agentic cohorts</span>
      <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div class="megamenu-panel" style="width: 660px; padding: 14px 16px;">
      <div class="megamenu-grid-dual">
        <!-- Left Column: Cohorts Index -->
        <div class="megamenu-col-left">
          <div>
            <h3 class="megamenu-col-title">agentic cohorts</h3>
            <div class="space-y-1" id="cohorts-tracks-list">
              <!-- Track 1: IBC Professionals -->
              <a href="https://ibc.agenticprofessionals.net" class="menu-card cohort-card selected" data-cohort="ibc" id="cohort-card-ibc">
                <div class="menu-card-info">
                  <h4>ibc professionals</h4>
                  <p>Insolvency, liquidation waterfalls &amp; restructuring practice pods across 16 NCLT benches.</p>
                </div>
              </a>

              <!-- Track 2: BNS Professionals -->
              <a href="https://bns.agenticprofessionals.net" class="menu-card cohort-card" data-cohort="bns" id="cohort-card-bns">
                <div class="menu-card-info">
                  <h4>bns professionals</h4>
                  <p>Bharatiya Nyaya Sanhita, cyber forensics &amp; criminal practice clinics across 48 jurisdictions.</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <!-- Right Column: Cohort Scope & Advisory Dock -->
        <div class="megamenu-col-dark" style="justify-content:space-between;">
          <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;min-height:0;">
            <div class="cohort-narrative-card">
              <p class="cohort-narrative-text">
                <strong id="cohort-dock-title">upcoming cohorts</strong> &ndash;
                <span id="cohort-dock-desc">Next sovereign cohort sprint across IBC restructuring and BNS criminal forensics starts Dec 1st. Live peer pods, case debriefs &amp; mock bench arguments.</span>
              </p>
            </div>

            <button type="button" class="fast-track-submit-btn" id="join-cohort-btn" onclick="openCohortIntake();">
              <span id="join-cohort-btn-text">join a cohort &rarr;</span>
            </button>
          </div>

          <a href="tel:+919316015274" class="calnode-emergency-contact">
            <span style="color:#94a3b8;">emergency contact:</span>
            <strong style="color:#34d399;">93160-15274</strong>
            <span style="color:#64748b;">(11 am &ndash; 4 pm)</span>
          </a>
        </div>
      </div>
    </div>
  </li>
  ```

### Task 3: Implement Interactive Cohort Switcher JS Logic
**Files:**
- Modify: `AgenticProfessionals/Home/public/index.html` (JavaScript `<script>` section)

**Steps:**
- [ ] Add `initCohortSwitcher()`:
  - Stores cohort metadata (`upcoming cohorts`, `ibc professionals`, `bns professionals`).
  - Attaches `mouseenter` and `click` listeners to `.cohort-card` items.
  - Dynamically updates the narrative text, title, and CTA button label (`join ibc cohort →`, `join bns cohort →`).
  - Auto-resolves localhost URLs when on `localhost:3000` (pointing IBC to `http://localhost:3002/investors/` and BNS to `http://localhost:3003/police/`).
  - Defines `openCohortIntake()` to trigger the registration / application modal.
- [ ] Call `initCohortSwitcher()` on `DOMContentLoaded`.

### Task 4: Mirror to `agenticprofessionals-net`
**Files:**
- Modify: `agenticprofessionals-net/public/home/index.html`

**Steps:**
- [ ] Copy the updated `Home/public/index.html` to `agenticprofessionals-net/public/home/index.html`.
- [ ] Verify both files are byte-for-byte synchronized.

### Task 5: Verification & Quality Assurance
**Steps:**
- [ ] Test HTTP response on `http://127.0.0.1:3000/` and `http://127.0.0.1:8080/`.
- [ ] Verify HTML structure, closing tags, and bounding box dimensions.
- [ ] Verify interactive track hover/selection and CTA button behavior.
- [ ] Commit and push both repositories (`AgenticProfessionals` and `agenticprofessionals-net`).
