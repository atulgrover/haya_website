# Persistent App Shell & Decoupled Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple the header and footer from the middle workspace, unify header styles across all pages, and provide a 0ms, zero-jump client-side shell router for Playbooks, Workflows, and Ventures.

**Architecture:** A persistent fixed header shell (64px) at the top of the viewport, body locked to 100vh with overflow hidden, a sandboxed `#app-workspace` container with internal panel scrolling, and `HayaShellRouter` in `js/components.js` for seamless PJAX navigation with `document.startViewTransition()`.

**Tech Stack:** Vanilla JavaScript (ES2022), CSS3 Flexbox/Viewport Locking, DOMParser, History API (`pushState`/`popstate`).

**Spec:** `docs/superpowers/specs/2026-11-15-persistent-app-shell-design.md`

## Global Constraints

- **Exact Header Parity**: Hayagriva unicorn icon centered with 10px gap, 19px brand font size, -0.2px letter spacing, and font-weight 600 for navigation links across all pages.
- **Standalone Fallback**: Direct URL navigation, bookmarks, and browser refresh (`Cmd+R` / `F5`) must continue to work 100% identically without breaking.
- **No Third-Party Frameworks**: Pure vanilla JavaScript and native browser APIs only.
- **Zero Layout Shift**: Header position and dimensions must remain strictly constant (64px height) during all view transitions.
- **Database & API Invariants**: Do not modify backend endpoints (`/api/skillpedia`, `/api/sop`, `/api/msme`).

## Review Focus

1. **Direct Page Load**: Loading `/employers_sop.html` directly in a fresh tab displays the full layout and initializes the SOP directory without errors.
2. **Back/Forward History**: Navigating Playbooks -> Workflows -> Ventures, then pressing the browser Back button twice, restores Playbooks and its state seamlessly without page reload.
3. **Deep Linking with Query Parameters**: Visiting `/employees_nsqf.html?sector=Automotive` correctly selects the Automotive sector and populates the cards.
4. **Modal Compatibility**: Opening the NOS Skill Markdown modal or PC Detail modal after a view transition functions without broken event listeners.
5. **No Memory Leaks**: Switching back and forth repeatedly between views does not accumulate zombie event listeners or duplicate DOM nodes.

---

### Task 1: Header CSS Unification & Viewport Shell Framing

**Files:**
- Modify: `employees_nsqf.html:56-115`
- Modify: `css/responsive.css:45-120`

**Interfaces:**
- Consumes: `branding/hayagriva_icon.png`, standard CSS custom properties (`--primary-color`, `--border-color`).
- Produces: Universal viewport isolation rules for `#site-header` and `#app-workspace`.

- [ ] **Step 1: Inspect and remove obsolete local header styles in `employees_nsqf.html`**
  Remove the duplicate local definitions of `.header-nav`, `.nav-container`, `.brand-logo`, `.nav-links`, `.nav-link`, and `.login-btn` from `employees_nsqf.html` lines 56–115. Also move the trailing script tag placed after `</html>` into the `<body>` before closing `</body>`.

- [ ] **Step 2: Add viewport shell framing in `css/responsive.css`**
  In `css/responsive.css`, add the locked viewport frame rules:
  ```css
  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  #site-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    z-index: 10000;
    background-color: #FFFFFF;
  }
  #app-workspace {
    position: fixed;
    top: 64px;
    bottom: 0;
    left: 0;
    right: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }
  ```

- [ ] **Step 3: Verify CSS parity across headers**
  Run: `grep -n "brand-logo" employees_nsqf.html employers_sop.html entrepreneurs_msme.html`
  Expected: Only the HTML markup occurrences appear; no local CSS override remains in `employees_nsqf.html`.

- [ ] **Step 4: Commit**
  ```bash
  git add employees_nsqf.html css/responsive.css
  git commit -m "fix(header): unify header css across all pillars and lock viewport shell"
  ```

---

### Task 2: Standardize Workspace Markup Across Core Pillar Pages

**Files:**
- Modify: `employees_nsqf.html`
- Modify: `employers_sop.html`
- Modify: `entrepreneurs_msme.html`

**Interfaces:**
- Consumes: Existing `.pillar-hero`, `.ide-container`, `#site-footer`.
- Produces: Standardized `<main id="app-workspace" data-view="...">` container across all three pages.

- [ ] **Step 1: Wrap workspace in `employees_nsqf.html`**
  Wrap the `.pillar-hero`, `#ideContainer`, and `#site-footer` inside `<main id="app-workspace" data-view="playbooks"> ... </main>`.

- [ ] **Step 2: Wrap workspace in `employers_sop.html`**
  Wrap the `.pillar-hero`, `#ideContainer`, and `#site-footer` inside `<main id="app-workspace" data-view="workflows"> ... </main>`.

- [ ] **Step 3: Wrap workspace in `entrepreneurs_msme.html`**
  Wrap the `.pillar-hero`, `#ideContainer`, and `#site-footer` inside `<main id="app-workspace" data-view="ventures"> ... </main>`.

- [ ] **Step 4: Verify markup structure across all 3 files**
  Run: `grep -n '<main id="app-workspace"' employees_nsqf.html employers_sop.html entrepreneurs_msme.html`
  Expected: All three files show `<main id="app-workspace" data-view="...">`.

- [ ] **Step 5: Commit**
  ```bash
  git add employees_nsqf.html employers_sop.html entrepreneurs_msme.html
  git commit -m "refactor(layout): standardize #app-workspace container across all pillar pages"
  ```

---

### Task 3: Implement `HayaShellRouter` in `js/components.js`

**Files:**
- Modify: `js/components.js`

**Interfaces:**
- Consumes: Navigation clicks on `a[href="employees_nsqf.html"]`, `a[href="employers_sop.html"]`, `a[href="entrepreneurs_msme.html"]`.
- Produces: `window.HayaShellRouter` handling client-side workspace swapping, caching, history management, and view lifecycle hooks.

- [ ] **Step 1: Implement `HayaShellRouter` object**
  In `js/components.js`, define `HayaShellRouter`:
  - `viewCache = new Map()` for instant 0ms cached view fragments.
  - `init()`: Attach document-level click interceptor for in-shell links (`employees_nsqf.html`, `employers_sop.html`, `entrepreneurs_msme.html`).
  - `navigate(url, pushState)`:
    1. Update nav tabs `.active` state immediately for zero perceived latency.
    2. Fetch and parse incoming page DOM.
    3. If `document.startViewTransition` is supported, morph the workspace inside `startViewTransition`; otherwise replace directly.
    4. Update `document.title` and `history.pushState(null, '', url)` if `pushState !== false`.
    5. Re-run lifecycle initialization: `HayaIdeDocking.init()` and view-specific scripts.
  - Listen to `popstate` to handle browser Back/Forward smoothly.

- [ ] **Step 2: Add view re-initialization dispatcher**
  Implement `rehydrateView(viewName, newWorkspace)`:
  - Extract and execute scripts belonging to the new view.
  - Dispatch a custom `haya:view-mounted` event with `{ view: viewName }`.
  - Re-attach mobile drawer handlers and dock toggles.

- [ ] **Step 3: Verify router initialization on page load**
  Test using node script or curl to ensure syntax is clean and files serve properly without errors:
  Run: `node -c js/components.js`
  Expected: Clean syntax check with code 0.

- [ ] **Step 4: Commit**
  ```bash
  git add js/components.js
  git commit -m "feat(shell): implement persistent client shell router with zero-jump workspace swapping"
  ```

---

### Task 4: Integration Verification & Server Smoke Test

**Files:**
- Test: Integration check via browser and curl endpoints.

**Interfaces:**
- Consumes: Running node server on `http://localhost:3001`.
- Produces: Fully verified persistent app shell with zero header movement.

- [ ] **Step 1: Check server status and HTTP 200 responses**
  Run: `curl -sI http://localhost:3001/employees_nsqf.html | head -n 5`
  Run: `curl -sI http://localhost:3001/employers_sop.html | head -n 5`
  Run: `curl -sI http://localhost:3001/entrepreneurs_msme.html | head -n 5`
  Expected: HTTP/1.1 200 OK for all three routes.

- [ ] **Step 2: Verify git status and push to `origin main`**
  Run: `git status && git push origin main`
  Expected: All changes pushed cleanly to remote.
