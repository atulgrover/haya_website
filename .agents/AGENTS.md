# Project Workspace Rules

- Always commit and push code changes to git (`origin main`) after completing implementation and verification tasks.

## Project Memory & Context (HAYAGRIVA Platform)

### Core Architecture & Portal Layout
- **Public Marketing & Router Hub**: `index.html` (Central entrance hub introducing the 4 economic pillars with unified navigation header).
- **Targeted Symmetrical Segment Portals**:
  - `employees_nsqf.html` (Employees - NSQF): National Qualification Framework (NSQF) engine with 2,001 NCVET job roles & dynamic PC-based vocational micro-learning reels.
  - `employers_sop.html` (Employers - SOP): National Standard Operating Procedures (SOP) catalog across 41 sectors, station workflows, and corporate domain isolation (`@company.com`).
  - `entrepreneurs_msme.html` (Entrepreneurs - MSME): Turnkey MSME business blueprints, tool & machinery BOMs, day-1 operational playbooks, and bankable project profiles (PMEGP/Mudra).
  - `professionals_apnet.html` (Professionals - APNET): **Agentic Professionals Network** showcasing Desktop IPE binaries, local GGUF models, `.vlt` statutory data vaults, and marketplace report ordering.
- **Interactive Collateral & Utilities**: `brochure.html` (Digital pitch deck), `workshop.html` (Masterclass registration), `handbook.html` (Operational docs viewer).
- **Logged-In User Portal Dashboard**: `dashboard.html` (Logged-in control panel with tabs: `🔑 License & Payments`, `🖥️ Hayagriva IPE`, `🧠 LLM Models`, `📚 Data Vaults`, `🤖 IBC Agents`, `📊 Marketplace Reports`, `👤 Profile & Settings`).
- **Auth Flow**: `login.html` and `signup.html` backed by `server/routes/auth.js` using PostgreSQL (`server/db.js`), `bcryptjs`, and JWT tokens.
- **Pricing & Licensing**: Ed25519 cryptographic master key generation (`server/routes/license.js`) & dynamic Razorpay checkout (`server/routes/payments.js`).
- **Data Engine**: Local PostgreSQL (`hayadb`) with 2,002 NSQF Job Roles, 10,588 NOS units, 29,378 Modules, 176,727 Performance Criteria, 135,923 Knowledge Units, and 110,101 Generic Skills.
- **Multilingual Indic AI Explainer Engine**: `server/routes/aiExplainer.js` backed by Sarvam AI (`sarvam-105b`) & PostgreSQL write-through cache (`pc_explanations_cache`) supporting 10 Indic languages (`en`, `hi`, `ta`, `te`, `mr`, `bn`, `gu`, `kn`, `ml`, `pa`).
- **Dual-Platform Offline Vaults**: JIT TiddlyWiki `.vlt` compiler (`server/routes/wiki.js`) with phone QR scan + direct laptop/desktop 1-click download.
- **Marketplace Reports**: Custom report ordering system backed by `server/routes/reports.js` and `report_orders` PostgreSQL table.
- **Strategic Roadmap**: `roadmap/HAYAGRIVA_PORTAL_ROADMAP.md`.

---

### Authoritative 7-Stage Pipeline Progression

```
[ Stage 0 ] Upstream Ground Truth   ──► admin.skillindiadigital.gov.in/nosListing (2,002 QPs)
[ Stage 1 ] Lossless PDF Ingestion  ──► data/pdfs/*.pdf → data/md/*.md (01_convert_pdfs_to_markdown.py)
[ Stage 2 ] Canonical AST Compiler  ──► data/json/nsqf/*.json (02_build_canonical_json.js) [100% Coverage, 0 Zero-PC QPs]
[ Stage 3 ] Normalized DB Ingest    ──► hayadb: nsqf_nos, nsqf_modules, nsqf_pcs, nsqf_kus, nsqf_gs (03_sync_json_to_database.js)
[ Stage 4 ] 3-Perspective Vectors   ──► Skill Vectors (EN/HI) + Industrial SOP Directives + MSME Machine BOMs (04_generate_search_intents.js)
[ Stage 5 ] Ephemeral Harvester     ──► On-the-fly YouTube API v3 search with 7-day rolling cache in `youtube_search_cache`
[ Stage 6 ] Sovereign Offline Vault ──► JIT TiddlyWiki `.vlt` compiler (08_export_offline_data_vaults.js)
[ Stage 7 ] Production Neon Sync    ──► 09_push_database_to_cloud.js
```

---

### PostgreSQL Database Metrics (Verified 100% Normalized)

- **`nsqf_qps`**: **2,002** Master Qualifications (Upstream Ground Truth)
- **`nsqf_nos`**: **10,588** National Occupational Standards (`kus` & `gs` JSONB cached)
- **`nsqf_modules`**: **29,378** Workstation Modules
- **`nsqf_pcs`**: **176,727** Atomic Performance Criteria (with `NUMERIC(6,2)` fractional rubric marks)
- **`nsqf_kus`**: **135,923** Dedicated Knowledge Units Table (`id`, `qp_code`, `nos_code`, `ku_code`, `ku_description`)
- **`nsqf_gs`**: **110,101** Dedicated Generic Skills Table (`id`, `qp_code`, `nos_code`, `gs_code`, `gs_description`)
- **`pc_explanations_cache`**: Write-through cache for 250-word multilingual masterclass explanations across 10 Indic languages and 3 perspectives.

---

### Quantitative Intent & Vector Quality Distribution (176,727 Criteria)

- **High-Quality Intent Confidence (>= 80%)**: **97.27%** (171,905 criteria)
- **Medium-Quality Intent Confidence (70–79%)**: **0.81%** (1,437 criteria)
- **Low-Quality Intent Confidence (< 70%)**: **1.92%** (3,385 criteria)
- **Action-Formatted English Search Vector (`how to ...`)**: **100.00%** (176,727 criteria)
- **Contextual Vernacular Hindi Vector (Devanagari Suffixes)**: **100.00%** (176,727 criteria)
- **Industrial SOP Physical Tolerances & Safety Knacks**: **100.00%** (176,727 criteria)
- **MSME Commercial Machine BOMs & Calibrated CAPEX**: **100.00%** (176,727 criteria)

---

### Mandatory Architectural Invariants

1. **NO ARTIFICIAL 9/10 CHAPTER TEXTBOOKS**:
   - We DO NOT create or synthesize artificial 10-Chapter SOP or 9-Chapter DPR textbooks.
   - All data across the 3 Economic Pillars is **100% anchored to the atomic Performance Criterion (`nsqf_pcs`)**:
     1. **🎓 1. Skill Perspective (Employees/Interns)**: `pc_intent` + `contextual_search_query` (EN/HI) + Viva Quiz.
     2. **🏭 2. SOP Perspective (Employers/Plants)**: `sop_intent` + `sop_action_directive` + `sop_parameter_tolerance` + `sop_critical_knack` + `sop_search_query`.
     3. **💼 3. DPR Perspective (Entrepreneurs/MSMEs)**: `dpr_intent` + `machine_name` + `machine_spec` + `machine_capex_cost_inr` + `machine_power_kw` + `dpr_search_query`.

2. **YOUTUBE POLICY III.E.4 (EPHEMERAL CACHE - ZERO PERMANENT STORAGE)**:
   - Video IDs are **never** stored permanently in `nsqf_pcs`.
   - On-the-fly streaming searches via `youtube_search_cache` table with automated 7-day TTL purge (`DELETE FROM youtube_search_cache WHERE cached_at < NOW() - INTERVAL '7 days'`).

---

### 🌅 Tomorrow's Implementation Queue:

1. **⚡ Gzip Compression & PostgreSQL GIN Full-Text Search**:
   - Add Express `compression` middleware (reduces JSON payload from 180 KB to ~25 KB, 85% mobile speedup).
   - Add PostgreSQL `tsvector` generated column + GIN index on `nsqf_pcs` for sub-millisecond full-text queries.
2. **🔊 Native Indic Audio Text-to-Speech (TTS)**:
   - Add zero-cost browser `window.speechSynthesis` audio button in the AI Explainer card for hands-free listening across Indic languages (`hi-IN`, `ta-IN`, etc.).
3. **🖨️ One-Click Printable Shop-Floor SOP Workstation Card**:
   - Add `@media print` clean layout to export a pocket-sized laminated card with QR code, tolerances, and steps.
4. **⭐ LocalStorage Star / Bookmark Deck**:
   - Allow students and operators to star criteria into a personal revision deck.
5. **🔄 Symmetrical Modal Sync**:
   - Sync the 10-language selector and AI Explainer card into `employers_sop.html` and `entrepreneurs_msme.html`.
6. **🧠 Dynamic Viva MCQs from Knowledge Units**:
   - Auto-generate viva quiz questions directly from the 135,923 Knowledge Units in `nsqf_kus`.
7. **🚀 Top-50 QP Pre-Warming Batch Script**:
   - `scripts/10_prewarm_ai_explanations.js` to pre-cache the most popular trades in English and Hindi for instant 0ms responses.
