# Federated Domain Network & Launchpad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the project root into a unified monorepo on Desktop containing segregated subdomain folders (`portal.agenticprofessionals`, `ibc.agenticprofessionals`, `bns.agenticprofessionals`, and `hayagriva.agenticprofessionals`), and build an interactive multi-domain launchpad grid with instant search on `index.html`.

**Architecture:** Monorepo filesystem structure with independent Git repositories per subdomain; responsive 3-column domain launchpad grid with client-side keyword triage and cluster filter pills; smart environment-aware routing helper (`getDomainUrl`) for seamless local and production navigation.

**Tech Stack:** Vanilla JavaScript (ES2022), HTML5, CSS3 Grid/Flexbox, Node.js / Express, PostgreSQL (`hayadb`).

**Spec:** `docs/superpowers/specs/2026-11-16-federated-domain-network-and-launchpad-design.md`

## Global Constraints

- **Zero Breakage of Existing 4 Pillars**: `ai.playbooks`, `ai.workflows`, `ai.ventures`, and `ai.personality` must remain fully operational.
- **Independent Git Control**: Subdomain repositories must preserve their independent Git remotes and histories.
- **Hayagriva Storage Isolation**: Heavy AI model weights (13 GB) must remain outside Git in `~/Desktop/Hayagriva/assets` with symlink integration.
- **Standardized Monospace Badges**: Every domain card must display its live production subdomain pill (e.g. `ibc.agenticprofessionals.net`).
- **Instant Search Filtering**: Typing in the search field must filter domain cards with zero server roundtrips.

## Review Focus

1. **Local Server Health**: The Express server for `portal` must run smoothly on port 3001 and connect to `hayadb` PostgreSQL.
2. **Launchpad Search Triage**: Searching for "IBC", "BNS", "tax", "insolvency", or "criminal" immediately isolates the corresponding cards.
3. **Cluster Pill Toggling**: Clicking "Corporate & Finance", "Taxation", or "Courts & Regulatory" filters cards by category.
4. **Link Routing Accuracy**: Domain cards use `getDomainUrl()` to navigate correctly in both localhost and production environments.
5. **Clean Desktop State**: Outer folder `domains.agentic professionals` is retired cleanly with no orphaned files left behind.

---

### Task 1: Filesystem Reorganization & Subdomain Segregation

**Files:**
- Move: Contents of `agenticprofessionals` into `agenticprofessionals/portal.agenticprofessionals/`
- Move: `domains.agentic professionals/ibc.agenticprofessionals` into `agenticprofessionals/ibc.agenticprofessionals/`
- Move: `domains.agentic professionals/bns.agenticprofessionals` into `agenticprofessionals/bns.agenticprofessionals/`
- Link: `agenticprofessionals/hayagriva.agenticprofessionals` &rarr; `~/Desktop/Hayagriva/harness`
- Retire: `~/Desktop/domains.agentic professionals` (empty)

- [x] **Step 1: Move master portal code into `portal.agenticprofessionals`**
  Move HTML, server, css, js, branding, data, and scripts into `portal.agenticprofessionals/`. Keep top-level `.git` or preserve repository root.
- [x] **Step 2: Move `ibc` and `bns` subdomains inside `agenticprofessionals`**
  Relocate `ibc.agenticprofessionals` and `bns.agenticprofessionals` from `domains.agentic professionals` into `agenticprofessionals/`.
- [x] **Step 3: Wire `hayagriva.agenticprofessionals` symlink**
  Create symlink `agenticprofessionals/hayagriva.agenticprofessionals` pointing to `/Users/atulgrover/Desktop/Hayagriva/harness`.
- [x] **Step 4: Retire old `domains.agentic professionals` folder**
  Confirm all files are moved, then remove the empty outer `domains.agentic professionals` directory.
- [x] **Step 5: Verify portal server runs on port 3001**
  Start `portal.agenticprofessionals` server and verify HTTP 200 response on port 3001.

---

### Task 2: Build the Multi-Domain Launchpad UI on `index.html`

**Files:**
- Modify: `index.html` (inside `portal.agenticprofessionals`)
- Modify: `css/responsive.css`

**Interfaces:**
- Consumes: Static domain metadata registry (IBC, BNS, GST, MCA, SEBI, DGFT, Hayagriva).
- Produces: Interactive Domain Grid, Instant Search Field, Cluster Filter Pills.

- [x] **Step 1: Add Launchpad CSS Styles**
  Define styles for `.domain-grid`, `.domain-card`, `.domain-badge`, `.domain-search-bar`, `.cluster-pills-row`, and `.domain-card-cta`.
- [x] **Step 2: Insert Search Bar & Cluster Pills in `index.html` Hero**
  Add the high-contrast search input and cluster filter pills (`All`, `Corporate & Finance`, `Taxation`, `Courts & Regulatory`, `Harness`).
- [x] **Step 3: Insert Responsive Domain Cards Grid**
  Add cards for:
  1. `ibc.agenticprofessionals.net` (Insolvency & Bankruptcy Code)
  2. `bns.agenticprofessionals.net` (Bharatiya Nyaya Sanhita)
  3. `mca.agenticprofessionals.net` (Corporate Affairs & Companies Act)
  4. `gst.agenticprofessionals.net` (Goods & Services Tax)
  5. `sebi.agenticprofessionals.net` (Securities & Capital Markets)
  6. `dgft.agenticprofessionals.net` (Foreign Trade & Customs)
  7. `cpc.agenticprofessionals.net` (Civil Procedure & Injunctions)
  8. `rera.agenticprofessionals.net` (Real Estate Regulatory Authority)
  9. `hayagriva.agenticprofessionals.net` (Sovereign Desktop Harness & Agent Forge)
- [x] **Step 4: Implement Instant Search & Filter Logic**
  Write JavaScript function `filterDomains()` that performs live keyword matching across title, acts, and tags as the user types.

---

### Task 3: Implement Smart Link Routing (`getDomainUrl`)

**Files:**
- Modify: `index.html`
- Modify: `js/components.js`

- [x] **Step 1: Implement `getDomainUrl(subdomain)` helper**
  Configure environment-aware URL resolver:
  - Localhost &rarr; resolves to corresponding local ports or local views (`:3002`, `:3003`, etc.).
  - Production &rarr; resolves to `https://${subdomain}.agenticprofessionals.net`.
- [x] **Step 2: Wire all card CTA buttons to `getDomainUrl()`**
  Ensure clicking any card routes to the correct target URL in both local dev and production.
- [x] **Step 3: Update Header Hayagriva CTA**
  Update the header download button to route via `getDomainUrl('hayagriva')`.

---

### Task 4: Verification, Automated Testing & Git Commit

**Files:**
- Test: `tests/test_launchpad_domains.js`

- [x] **Step 1: Write automated launchpad test script**
  Test domain card count, search filtering logic, subdomain badge formatting, and URL generation.
- [x] **Step 2: Execute automated test suite**
  Run `node tests/test_launchpad_domains.js` and verify 100% pass rate.
- [x] **Step 3: Smoke test all HTTP routes**
  Verify HTTP 200 on `/`, `/employees_nsqf.html`, `/employers_sop.html`, `/entrepreneurs_msme.html`, `/personalities_vedic.html`.
- [ ] **Step 4: Commit and push to Git**
  Stage all files, commit with descriptive message, and push to `origin main`.
