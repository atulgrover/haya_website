# Agentic Spaces Split-View Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the split-view radar architecture from 3002 (`openibc-s`) directly into 3000 (`Agentic Professionals` portal), delivering a full-height interactive map and card list for Study Cafes & AI Libraries with slide-out inspector drawer, powered by Supabase PostgreSQL and dual Go/Node backend routes with zero-breakage offline fallback.

**Architecture:** 
1. Supabase PostgreSQL `agentic_spaces` table with verified geospatial coordinates, facilities metadata, and type checks.
2. Dual-backend API (`/api/radar/spaces`, `/api/radar/cafes`, `/api/radar/libraries`) implemented in Go (`internal/home/router.go`) and Node (`Home/server.js`) with resilient fallback data.
3. Frontend port in `public/home/index.html` replicating 3002's layout (sidebar, collapse tab `[ < ]`, Leaflet map, inspector drawer, mobile view switcher), removing the brand dropdown while preserving institutional top megamenus with safe hover tunnels and live subdomain links.

**Tech Stack:** Pure HTML5/CSS3/Vanilla JS (buildless), Leaflet 1.9.4, Go 1.22 (`net/http`), Node.js (pure built-in `http`), Supabase PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-11-22-agentic-spaces-radar-design.md`

## Global Constraints
- Brand Lockup on Port 3000 must NOT contain any dropdown menu (no `#brand-title-btn` dropdown).
- Top Megamenus must maintain safe hover tunnels (`padding-top: 10px`) so they do not abruptly close when moving the mouse.
- Subdomain links for IBC and BNS must link to live sites (`https://ibc.agenticprofessionals.net` and `https://bns.agenticprofessionals.net`).
- Radar View must occupy the full viewport below the 60px header (`height: calc(100vh - 60px)`), with no hero banner pushing it down.
- Database queries must never crash or stall the server if PostgreSQL connection is interrupted; graceful fallback to seeded constants is mandatory.
- Both repositories (`agenticprofessionals-net` and `AgenticProfessionals`) must be synchronized and committed.

## Review Focus
1. **Database Schema & Connectivity:** Table creation and data seeding in Supabase Postgres succeed; fallback data triggers cleanly when DB is offline.
2. **API Endpoint Uniformity:** `/api/radar/spaces`, `/api/radar/cafes`, and `/api/radar/libraries` return identical JSON structures across Go (8080) and Node (3000).
3. **Brand Lockup Cleanliness:** Unicorn icon and "Agentic Professionals" text have no dropdown arrow and no popover menu.
4. **Radar Mechanics:** Left sidebar filter buttons switch cleanly between cafes and libraries; cards render with proximity, Wi-Fi badge, and click handler.
5. **Inspector Drawer & Map Interaction:** Clicking a card or map pin smoothly centers the Leaflet map and opens the right inspector drawer with full details, directions button, and reservation CTA.

---

### Task 1: Supabase PostgreSQL Schema Migration & Seed Data

**Files:**
- Create: `scripts/migrations/20261122_agentic_spaces.sql`
- Create: `scripts/seed_spaces.py`

**Interfaces:**
- Produces: Table `agentic_spaces` in PostgreSQL with 16 seeded records (8 cafes, 8 libraries).

- [ ] **Step 1: Write migration SQL script**
Create `scripts/migrations/20261122_agentic_spaces.sql` with table definition, constraints, and indexes.

- [ ] **Step 2: Write Python migration and verification script**
Create `scripts/seed_spaces.py` connecting to Supabase PostgreSQL using `psycopg2`, creating `agentic_spaces`, and inserting 16 curated spaces with coordinates and facilities.

- [ ] **Step 3: Execute migration and verify row counts**
Run: `python3 scripts/seed_spaces.py`
Expected: 16 rows inserted/verified in Supabase PostgreSQL (`8 cafes, 8 libraries`).

- [ ] **Step 4: Commit migration scripts in both repositories**
```bash
git add scripts/migrations/ scripts/seed_spaces.py
git commit -m "feat(db): add agentic_spaces table migration and seed script"
```

---

### Task 2: Backend API Endpoints in Go and Node.js

**Files:**
- Modify: `internal/home/router.go`
- Modify: `Home/server.js`

**Interfaces:**
- Consumes: PostgreSQL `agentic_spaces` table or internal fallback data slices.
- Produces:
  - `GET /api/radar/spaces` -> `{ "spaces": [...] }`
  - `GET /api/radar/cafes` -> `{ "cafes": [...] }`
  - `GET /api/radar/libraries` -> `{ "libraries": [...] }`

- [ ] **Step 1: Add fallback data structures and SQL query logic in Go**
In `internal/home/router.go`, define `Space` struct, fallback slice of 16 spaces, and handler `handleRadarSpaces`.

- [ ] **Step 2: Recompile and restart Go multi-domain server on port 8080**
Run: `cd /Users/atulgrover/Desktop/agenticprofessionals-net && go build -o bin/server ./cmd/server/main.go`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Add API routes in Node.js gateway**
In `AgenticProfessionals/Home/server.js`, handle `/api/radar/spaces`, `/api/radar/cafes`, and `/api/radar/libraries` with CORS and fallback data.

- [ ] **Step 4: Verify endpoints with curl**
Run:
```bash
curl -s http://localhost:8080/api/radar/spaces | grep -o '"name":' | wc -l
curl -s http://localhost:3000/api/radar/spaces | grep -o '"name":' | wc -l
```
Expected: Both return 16 spaces.

- [ ] **Step 5: Commit backend changes in both repositories**
```bash
git add internal/home/router.go Home/server.js
git commit -m "feat(api): implement /api/radar/spaces endpoints in Go and Node"
```

---

### Task 3: Port 3002 Split-View Radar Layout to 3000 Frontend

**Files:**
- Modify: `public/home/index.html` (in `agenticprofessionals-net`)
- Modify: `Home/public/index.html` (in `AgenticProfessionals`)

**Interfaces:**
- Consumes: `/api/radar/spaces`, `/api/radar/cafes`, `/api/radar/libraries`
- Produces: Complete UI below 60px header replicating 3002 split-view:
  - Header: Clean brand lockup without dropdown.
  - Megamenus: Skills, Cohorts (live links), Spaces (active), Events.
  - Left Sidebar: Mode switcher, search box, city select, stats bar, card list.
  - Sidebar Collapse Tab `[ < ]`.
  - Right Leaflet Map Canvas with custom pins and popups.
  - Slide-out Inspector Drawer (`#inspector-drawer`).
  - Mobile Floating View Switcher Pill.

- [ ] **Step 1: Replace main container in `public/home/index.html` with 3002 Radar layout**
Incorporate `.site-header` with brand lockup without dropdown, megamenus with hover tunnel, and `<main class="main-canvas" id="main-canvas">` containing `#radar-view`.

- [ ] **Step 2: Integrate CSS styles from 3002 (`style.css`)**
Ensure `.sidebar`, `.sidebar-header`, `.mode-switcher`, `.card-list`, `.inspector-drawer`, `.sidebar-toggle-tab`, `.map-canvas`, and mobile responsive media queries are pixel-perfect.

- [ ] **Step 3: Integrate JavaScript logic from 3002 (`radar.js`) adapted for Spaces**
Implement:
  - `loadData()` fetching `/api/radar/spaces`
  - Mode switching between cafes and libraries
  - Leaflet map initialization, custom marker creation with pulse animations
  - Card rendering with tags and metrics
  - Card click pan & inspector drawer display
  - Inspector drawer close and back actions
  - Sidebar collapse/expand toggle tab and keyboard shortcuts (`[` and `\`)
  - Mobile view switcher pill toggling map and list

- [ ] **Step 4: Mirror updated `index.html` to `AgenticProfessionals/Home/public/index.html`**
Ensure both repositories are identical.

- [ ] **Step 5: Commit frontend changes in both repositories**
```bash
git add public/home/index.html Home/public/index.html
git commit -m "feat(ui): port 3002 split-view radar layout to agentic professionals portal"
```

---

### Task 4: End-to-End Visual and Functional Verification

**Files:**
- Test via Browser Subagent & HTTP curls.

- [ ] **Step 1: Test port 3000 & port 8080 HTTP responses**
Verify `http://localhost:3000/` and `http://localhost:8080/` return HTTP 200 and contain expected elements (`#radar-view`, `#sidebar`, `#leaflet-map`, `#inspector-drawer`).

- [ ] **Step 2: Dispatch Browser Visual Verifier Subagent**
Inspect UI on `http://localhost:3000/`:
  - Confirm brand header has NO dropdown.
  - Confirm sidebar displays 8 cafes / 8 libraries.
  - Click card -> verify map zooms to marker and inspector drawer opens from right.
  - Click sidebar collapse tab `[ < ]` -> verify sidebar collapses and map expands.
  - Hover over megamenus -> verify they open smoothly and do not close prematurely.
  - Confirm cohort links point to `https://ibc.agenticprofessionals.net` and `https://bns.agenticprofessionals.net`.

- [ ] **Step 3: Final Git Sync & Push to Origin**
Push both repositories (`origin/main`).
