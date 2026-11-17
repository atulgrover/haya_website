# Federated Hubs Clean-up, Testing & Render Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up redundant files and folders across the workspace, establish an automated unit and health test suite for all 3 hubs, and standardize configuration for multi-service deployment on Render with a shared database.

**Architecture:** Maintain a 3-hub federated architecture where Port 3001 (Node.js/Express) serves the unified master shell and learning portal, while Port 3002 (Go/Calnode) and Port 3003 (Go/Calnode) run independent legal hubs. All hubs connect independently to a shared PostgreSQL instance (Neon/Supabase) via connection pooling.

**Tech Stack:** Node.js v24 (Express, `node:test`), Go 1.22+ (`openibc-server`, `openbns-server`), PostgreSQL (Neon/Supabase with PgBouncer), Bash, Render Web Services.

---

## Global Constraints
- Port 3000 remains permanently retired; active ports are strictly 3001, 3002, and 3003.
- Buildless vanilla frontend: no bundlers (Webpack, Vite, Rollup) on Port 3001 frontend assets.
- Subdomain naming convention: `portal.agenticprofessionals`, `ibc.agenticprofessionals`, and `bns.agenticprofessionals` remain the authoritative service directory names.
- Navigation labels and track identifiers must remain lowercase: `employees`, `employers`, `entrepreneurs`.
- All automated unit tests must run offline with zero external network dependencies.

## Review Focus
1. **Redirect Loops / Stale Routes**: Ensure `employees.html` redirects to `employees_nsqf.html` (not `employers_sop.html`).
2. **Database Connection Saturation**: Verify connection pooling strings (`:6543`) are documented and used in `.env.example`.
3. **Frontend Shell Regression**: Ensure unit tests catch any missing `.track-picker-wrapper` or misaligned dropdowns before deployment.
4. **Offline Test Reliability**: Ensure `npm test` does not hang waiting for a local Postgres daemon.
5. **Port Binding & Process Hygiene**: Ensure `./start.sh` and `./stop.sh` cleanly kill existing PIDs without zombie processes.

---

## Tasks

### Task 1: Workspace Hygiene & Redundancy Clean-Up

**Files:**
- Move: `hayagriva.agenticprofessionals/` -> `archive/hayagriva.agenticprofessionals/`
- Modify: `.gitignore`
- Modify: `portal.agenticprofessionals/employees.html`
- Move: `portal.agenticprofessionals/test_varaha_auth_header.js` -> `portal.agenticprofessionals/tests/api/test_varaha_auth_header.js`
- Move/Remove: `portal.agenticprofessionals/server_daemon.log`

- [x] **Step 1.1: Archive retired Port 3000 repository**
  Create an `archive/` folder at workspace root (if not present) and relocate `hayagriva.agenticprofessionals` into it:
  ```bash
  mkdir -p archive
  mv hayagriva.agenticprofessionals archive/
  ```

- [x] **Step 1.2: Update root `.gitignore`**
  Ensure `.gitignore` cleanly covers `archive/`, `logs/`, `.pids/`, and environment files without stale references:
  ```gitignore
  .DS_Store
  node_modules/
  .env
  *.log
  logs/
  .pids/
  archive/
  .superpowers/

  # Subdomain independent repositories (managed as separate git repos)
  ibc.agenticprofessionals/
  bns.agenticprofessionals/
  ```

- [x] **Step 1.3: Fix contradictory redirect in `employees.html`**
  In `portal.agenticprofessionals/employees.html`, change the refresh target from `employers_sop.html` to `employees_nsqf.html` so bookmarked links route to the proper track:
  ```html
  <meta http-equiv="refresh" content="0; url=employees_nsqf.html">
  ```

- [x] **Step 1.4: Tidy stray files in `portal.agenticprofessionals`**
  Move `test_varaha_auth_header.js` into `tests/api/` and delete or relocate `server_daemon.log`:
  ```bash
  mv portal.agenticprofessionals/test_varaha_auth_header.js portal.agenticprofessionals/tests/api/
  rm -f portal.agenticprofessionals/server_daemon.log
  ```

- [x] **Step 1.5: Verify workspace cleanliness**
  Run `ls -la` to confirm the root only contains the 3 active hubs (`portal.*`, `ibc.*`, `bns.*`), scripts, and config.

---

### Task 2: Automated Unit Test Suite for Header & Shell Structure

**Files:**
- Create: `portal.agenticprofessionals/tests/unit/header_structure.test.js`
- Modify: `portal.agenticprofessionals/package.json`

- [x] **Step 2.1: Write the header structure unit test**
  Create `portal.agenticprofessionals/tests/unit/header_structure.test.js` using Node's built-in test runner (`node:test` and `node:assert`).
  The test reads each of the 5 key portal pages:
  - `index.html`
  - `employees_nsqf.html`
  - `employers_sop.html`
  - `entrepreneurs_msme.html`
  - `personalities_vedic.html`
  And asserts:
  1. Header contains `.brand-title-static` with text `agentic professionals`.
  2. Header contains `.brand-dash` with text `-`.
  3. Header contains `.track-picker-wrapper` with `id="brand-trigger"`.
  4. `#subdomain-dropdown` is located strictly inside `.track-picker-wrapper`.
  5. `#subdomain-dropdown` uses `@keyframes dropdownFadeIn` (not `fadeInDown`).
  6. All 3 tracks (`employees`, `employers`, `entrepreneurs`) exist in the dropdown.
  7. Actions tray contains `answers`, `reports`, and `sign in`.

- [x] **Step 2.2: Add unit test script to `package.json`**
  In `portal.agenticprofessionals/package.json`, add:
  ```json
  "test:unit": "node --test tests/unit/*.test.js"
  ```

- [x] **Step 2.3: Run the unit test**
  Run:
  ```bash
  cd portal.agenticprofessionals && npm run test:unit
  ```
  Expected output: 5 passing tests, 0 failures.

---

### Task 3: Tri-Domain Health & Smoke Test Suite

**Files:**
- Create: `tests/federation_health.sh`
- Create: `tests/test_smoke.py` (root level)

- [x] **Step 3.1: Create `tests/federation_health.sh`**
  Create a fast bash health script that checks all 3 federated services:
  ```bash
  #!/usr/bin/env bash
  set -e
  echo "Checking 3001 (Portal)..."
  curl -sf -o /dev/null http://localhost:3001/
  curl -sf -o /dev/null http://localhost:3001/employees
  curl -sf -o /dev/null http://localhost:3001/employers
  curl -sf -o /dev/null http://localhost:3001/entrepreneurs
  echo "✔ Port 3001 OK"

  echo "Checking 3002 (IBC)..."
  curl -sf -o /dev/null http://localhost:3002/
  echo "✔ Port 3002 OK"

  echo "Checking 3003 (BNS)..."
  curl -sf -o /dev/null http://localhost:3003/
  echo "✔ Port 3003 OK"

  echo "🎉 All 3 Federated Hubs Responding!"
  ```
  Make executable: `chmod +x tests/federation_health.sh`.

- [x] **Step 3.2: Verify with running services**
  Run `tests/federation_health.sh` while `./start.sh` is running and verify all endpoints return 200 OK.

---

### Task 4: Standardize Environment Templates & Render Deployment Blueprints

**Files:**
- Create: `portal.agenticprofessionals/.env.example`
- Create: `ibc.agenticprofessionals/.env.example` (or review existing)
- Create: `bns.agenticprofessionals/.env.example` (or review existing)
- Create: `render.yaml` (root blueprint for Render infrastructure-as-code)

- [x] **Step 4.1: Create `.env.example` for `portal.agenticprofessionals`**
  Document all environment variables needed by the Node portal:
  ```env
  PORT=3001
  NODE_ENV=production
  DATABASE_URL=postgresql://user:password@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
  SUPABASE_URL=https://xyz.supabase.co
  SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  JWT_SECRET=super-secret-key
  CORS_ORIGIN=https://portal.agenticprofessionals.net,https://openibc.in,https://openbns.in
  ```

- [x] **Step 4.2: Standardize `.env.example` in Go hubs**
  Ensure `ibc.agenticprofessionals/.env.example` and `bns.agenticprofessionals/.env.example` document:
  - `PORT` (defaults to 3002 and 3003 locally, provided dynamically by Render via `$PORT`)
  - `DATABASE_URL` (with pooled connection parameter)
  - `APP_URL` (production domain)

- [x] **Step 4.3: Create multi-service `render.yaml` blueprint**
  Create root `render.yaml` defining the 3 Web Services:
  - `portal-agenticprofessionals` (Node environment, root: `portal.agenticprofessionals`)
  - `ibc-agenticprofessionals` (Go environment, root: `ibc.agenticprofessionals`)
  - `bns-agenticprofessionals` (Go environment, root: `bns.agenticprofessionals`)

---

### Task 5: Final Verification & Git Commit

- [x] **Step 5.1: Run all test suites**
  - Run `npm run test:unit` in `portal.agenticprofessionals`.
  - Run `./status.sh` to ensure all 3 services are active.
  - Run `tests/federation_health.sh` to confirm zero network regressions.

- [x] **Step 5.2: Stage and commit cleaned workspace**
  Stage files cleanly and commit with a clear descriptive message:
  `chore(federation): clean up workspace redundancies, add automated unit tests and render blueprint`
