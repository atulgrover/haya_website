# Agentic Skills & Database Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the right inspector drawer and PC modal in the Node.js application (`employees_nsqf.html`) into an Agentic Professional Cockpit by persisting generated NOS and PC skill code directly in PostgreSQL (`nsqf_nos` and `nsqf_pcs`), removing academic exam/time clutter, and embedding clean `.md` skill downloads.

**Architecture:** PostgreSQL columns (`skill_markdown`, `skill_metadata`) added to `nsqf_nos` and `nsqf_pcs` serve as a write-through cache. The Express backend checks these columns first (0ms cached response); on cache miss, it synthesizes Superpowers/Antigravity `SKILL.md` (via Sarvam AI / deterministic compiler), saves to the database, and returns to the client. The frontend cleans the drawer (removes timers, Viva Exam, Open), adds a centered NOS Skill Code modal, and renders an atomic `.md` card below the YouTube player in the PC modal.

**Tech Stack:** Node.js, Express, PostgreSQL (`pg` pool, `hayadb`), HTML5, CSS3, Vanilla JavaScript.

**Port:** `http://localhost:3001` (running via `server/server.js`).

---

## Global Constraints

- **Database Table Scope:** Add `skill_markdown TEXT` and `skill_metadata JSONB` directly to `nsqf_nos` and `nsqf_pcs`.
- **Zero Academic Clutter:** All "Viva Exam" buttons, "Open" buttons, and `⏱ 45s-135s` badges are removed.
- **Write-Through Guarantee:** Cache hit returns stored code in 0ms; cache miss generates, stores in DB, and returns.
- **Standardized Skill Format:** Exported skills must conform strictly to Superpowers / Antigravity `SKILL.md` YAML frontmatter + markdown directives.
- **Backwards Compatibility:** Multilingual Sarvam AI Masterclass (10 Indic languages) and YouTube player remain 100% operational.

---

## Review Focus

- Slashes vs underscores in `qp_code` and `nos_code` (`AAS/Q0301` vs `AAS_Q0301`): query must match both formats.
- Rapid switching between PCs: ensure active PC state does not overwrite pending fetch results.
- Markdown special characters escaping in YAML frontmatter (quotes, newlines).
- Network / LLM offline resilience: deterministic compiler must always produce valid `SKILL.md` even if LLM API is unavailable.
- Single PC and NOS skill client-side downloads as clean `*.skill.md` files.

---

### Task 1: Database Schema Migration for Skill Columns

**Files:**
- Modify: `server/db.js`
- Test: Run migration query on `hayadb` and verify columns exist.

**Steps:**
- [x] Add migration queries in `server/db.js`:
  ```sql
  ALTER TABLE nsqf_nos ADD COLUMN IF NOT EXISTS skill_markdown TEXT;
  ALTER TABLE nsqf_nos ADD COLUMN IF NOT EXISTS skill_metadata JSONB;
  ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS skill_markdown TEXT;
  ALTER TABLE nsqf_pcs ADD COLUMN IF NOT EXISTS skill_metadata JSONB;
  ```
- [x] Execute migration on PostgreSQL `hayadb`.
- [x] Verify columns exist on `nsqf_nos` and `nsqf_pcs`.
- [x] Commit changes: `git commit -m "feat(db): add skill_markdown and skill_metadata to nsqf_nos and nsqf_pcs"`.

---

### Task 2: Backend Agent Skill Generator & Write-Through API

**Files:**
- Create: `server/routes/agentSkills.js`
- Modify: `server/server.js`
- Test: `curl -s "http://localhost:3001/api/skillpedia/agent-skill?level=nos&qp=AAS/Q0301&nos=AAS/N0301"`

**Steps:**
- [x] Create `server/routes/agentSkills.js` handling `GET /api/skillpedia/agent-skill`.
- [x] Implement NOS Level logic:
  - Check `nsqf_nos.skill_markdown` where `qp_code = $1 AND nos_code = $2`.
  - If cached: return `{ success: true, is_cached: true, markdown: ..., metadata: ... }`.
  - If miss: query all PCs of that `(qp_code, nos_code)` from `nsqf_pcs`.
  - Synthesize Superpowers/Antigravity `SKILL.md` (YAML frontmatter, operational scope, sequenced workflow, tolerances, BOM equipment, pro knacks, LOTO guardrails).
  - Update `nsqf_nos SET skill_markdown = $1, skill_metadata = $2`.
  - Return `{ success: true, is_cached: false, markdown: ... }`.
- [x] Implement PC Level logic:
  - Check `nsqf_pcs.skill_markdown` where `qp_code = $1 AND nos_code = $2 AND pc_code = $3` (or `id = $1`).
  - If cached: return `{ success: true, is_cached: true, markdown: ... }`.
  - If miss: query single PC row, synthesize atomic `.md` card, save to `nsqf_pcs.skill_markdown`.
  - Return `{ success: true, is_cached: false, markdown: ... }`.
- [x] Mount route in `server/server.js`.
- [x] Test with `curl` to verify cache miss saves to DB and subsequent call returns `is_cached: true`.
- [x] Commit changes: `git commit -m "feat(api): add agent-skill write-through cache endpoint"`.

---

### Task 3: Right Inspector Drawer UI Clean-Up

**Files:**
- Modify: `employees_nsqf.html`
- Test: Visual check of the right drawer on `http://localhost:3001/employees_nsqf.html`.

**Steps:**
- [x] Remove `⏱️ ${pc.start_seconds || 45}s-${pc.end_seconds || 135}s` badge from each PC row.
- [x] Remove `[ 🧠 Viva Exam ]` and `[ 🎬 Open ]` buttons from module headers.
- [x] Add `[ ⚡ Skill Code ]` button on parent NOS header bar (beside `[ 📚 Theory ]`) with `onclick="event.stopPropagation(); openNosSkillModal(...)"`.
- [x] Keep accordion bar click behavior intact (clicking the bar expands/collapses the PCs below).
- [x] Commit changes: `git commit -m "feat(ui): clean drawer clutter and add NOS Skill Code trigger"`.

---

### Task 4: Centered NOS Skill Code Modal (`#nosSkillModal`)

**Files:**
- Modify: `employees_nsqf.html`
- Test: Click `[ ⚡ Skill Code ]` on any NOS and verify modal opens with syntax-styled markdown.

**Steps:**
- [x] Add `#nosSkillModal` HTML markup in `employees_nsqf.html`:
  - Centered modal container with backdrop blur.
  - Header: NOS Code, Title, Qualification name, Scope badge (`X criteria synthesized`).
  - Action buttons: `[ 📋 Copy SKILL.md ]`, `[ ⬇ Download .skill.md ]`, `[ ✕ Close ]`.
  - Content area: Shimmer loader while fetching, syntax-styled `<pre><code>` block for the generated markdown.
- [x] Implement JavaScript functions:
  - `openNosSkillModal(qpCode, nosCode, nosTitle)`: calls `/api/skillpedia/agent-skill?level=nos&qp=...&nos=...` and renders markdown.
  - `closeNosSkillModal()`: hides modal.
  - `copyNosSkillMarkdown()`: copies raw markdown to clipboard with toast confirmation.
  - `downloadNosSkillMarkdown()`: triggers browser Blob download of `[nos_code]-skill.md`.
- [x] Commit changes: `git commit -m "feat(ui): implement centered NOS Skill Code modal with download/copy"`.

---

### Task 5: PC Modal Transformation (YouTube + .md Card + Clean Footer)

**Files:**
- Modify: `employees_nsqf.html`
- Test: Click a PC to verify video on top-left, atomic markdown card on bottom-left, AI on right, and no Viva Exam in footer.

**Steps:**
- [x] In `#pcTiddlerModal` Left Column, insert `#pcMarkdownCard` directly below the video bounds:
  - Header: `📄 ATOMIC SKILL CARD (.MD)` + `[ ⬇ Download Card ]` + `[ 📋 Copy ]`.
  - Pre-styled code container showing the criterion's exact Markdown specification.
- [x] Update `renderPcModalContent(pc, idx, total)`:
  - Fetch or render the atomic `.md` card via `/api/skillpedia/agent-skill?level=pc&qp=...&nos=...&pc=...`.
  - Wire `downloadPcSkillCard()` and `copyPcSkillCard()`.
- [x] In the modal footer:
  - Delete `[ Viva Exam ]` button (`triggerModuleVivaFromPcModal()`).
  - Keep clean navigation: `[ ← Previous ]`, `PC X of Y`, `[ Next → ]`.
- [x] Commit changes: `git commit -m "feat(ui): add atomic markdown card to PC modal and clean footer"`.

---

### Task 6: End-to-End Verification & Git Push

**Files:**
- Test: Full user journey on `http://localhost:3001/employees_nsqf.html`.

**Steps:**
- [x] Verify right drawer loads with 0 layout shift and no timer/exam buttons.
- [x] Click `[ ⚡ Skill Code ]` on NOS: verify centered modal opens, markdown is fetched and saved to `nsqf_nos.skill_markdown`.
- [x] Close and re-click `[ ⚡ Skill Code ]`: verify 0ms instant display from database cache (`is_cached: true`).
- [x] Test `[ ⬇ Download .skill.md ]`: verify downloaded file has valid YAML frontmatter and directives.
- [x] Click a PC: verify YouTube plays, AI explainer loads on right, and atomic `.md` card renders below video.
- [x] Test `[ ⬇ Download Card ]` on PC: verify downloaded atomic `.md` file.
- [x] Verify footer has no Viva Exam button and Next/Prev stepping works smoothly.
- [x] Commit and push changes to git (`origin main`).
