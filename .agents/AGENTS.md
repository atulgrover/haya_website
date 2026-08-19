# Project Workspace Rules

- Always commit and push code changes to git (`origin main`) after completing implementation and verification tasks.

## Project Memory & Context (HAYAGRIVA Platform)

### Core Architecture & Portal Layout
- **Public Marketing & Router Hub**: `index.html` (Central entrance hub introducing the 4 economic pillars with unified navigation header).
- **Targeted Symmetrical Segment Portals**:
  - `employees_nsqf.html` (Employees - NSQF): National Qualification Framework (NSQF) engine with 2,176 NCVET job roles & dynamic PC-based vocational micro-learning reels.
  - `employers_sop.html` (Employers - SOP): National Standard Operating Procedures (SOP) catalog across 41 sectors, station workflows, and corporate domain isolation (`@company.com`).
  - `entrepreneurs_msme.html` (Entrepreneurs - MSME): Turnkey MSME business blueprints, tool & machinery BOMs, day-1 operational playbooks, and bankable project profiles (PMEGP/Mudra).
  - `professionals_apnet.html` (Professionals - APNET): **Agentic Professionals Network** showcasing Desktop IPE binaries, local GGUF models, `.vlt` statutory data vaults, and marketplace report ordering.
- **Interactive Collateral & Utilities**: `brochure.html` (Digital pitch deck), `workshop.html` (Masterclass registration), `handbook.html` (Operational docs viewer), `reel.html` (Video search & reel hub).
- **Logged-In User Portal Dashboard**: `dashboard.html` (Logged-in control panel with tabs: `🔑 License & Payments`, `🖥️ Hayagriva IPE`, `🧠 LLM Models`, `📚 Data Vaults`, `🤖 IBC Agents`, `📊 Marketplace Reports`, `👤 Profile & Settings`).
- **Auth Flow**: `login.html` and `signup.html` backed by `server/routes/auth.js` using PostgreSQL (`server/db.js`), `bcryptjs`, and JWT tokens.
- **Pricing & Licensing**: Ed25519 cryptographic master key generation (`server/routes/license.js`) & dynamic Razorpay checkout (`server/routes/payments.js`).
- **Data Engine**: Local PostgreSQL (`hayadb`) with 2,176 NCVET NSQF Job Roles, 11,420 NOS units, and 207,363 Performance Criteria.
- **Marketplace Reports**: Custom report ordering system backed by `server/routes/reports.js` and `report_orders` PostgreSQL table.
- **Strategic Roadmap**: `roadmap/HAYAGRIVA_PORTAL_ROADMAP.md`.

### Upstream Ground Truth & Data Pipeline Invariants
- **Authoritative Upstream Source (`https://admin.skillindiadigital.gov.in/nosListing`)**:
  - The live administrative portal `https://admin.skillindiadigital.gov.in/nosListing` is the **single authoritative ground truth** for all Qualification Packs (QPs) and National Occupational Standards (NOS) in India.
  - **MANDATORY Stage 0 / Step 1**: Any pipeline audit or batch processing MUST start by reconciling the local `nsqf_qps` table against `admin.skillindiadigital.gov.in/nosListing` and verifying that 100% of corresponding PDFs are downloaded in `data/pdfs/`.
- **Strict Pipeline Stage Progression**:
  - **Stage 0: Upstream Reconciliation**: Reconcile `nsqf_qps` against `https://admin.skillindiadigital.gov.in/nosListing` (detect new QPs or updated versions).
  - **Stage 1: PDF Ingestion & Completeness Audit**: Verify all `curriculum_pdf_url` files are downloaded into `data/pdfs/{cleanCode}.pdf`.
  - **Stage 2: Lossless Markdown (`data/md/*.md`)**: 1:1 lossless digital mirror of PDFs via `nsqf_pdf_to_md.py` (preserving all narrative PCs and assessment tables).
  - **Stage 3: Canonical AST Compilation (`data/json/nsqf/*.json`)**: Extract official assessment rubric AST via `nsqf_md_to_json.js`.
  - **Stage 4: LLM Synthesis & Enrichment**: Bilingual viva quizzes (EN+HI), study takeaways, 10-Chapter SOPs (`data/json/sop/`), 9-Chapter MSME DPRs (`data/json/msme/`).
  - **Stage 5: YouTube Multi-Tier Video Harvesting**: Official API v3 timestamped clips (60-90s).
  - **Stage 6: Sovereign Offline Wiki Export (`nsqf_wiki_exporter.js`)**: 100% offline standalone Tiddloid / Safari PWA data vaults.

### YouTube API Compliance Overhaul & Data Governance (August 2026)
- **Resolved All 4 Findings from ToS Violations Report V.1**:
  - **Policy III.D.1c (Single GCP Project)**: Confirmed single Google Cloud project usage without auxiliary projects.
  - **Policy III.A.2d (API Data Accessed & User Info)**: Updated `privacy.html` Section 4.1 & 4.2 disclosing public video metadata access and confirming **zero collection of private Google user data/viewing histories**.
  - **Policy III.A.2e (Processing & Zero Data Sharing)**: Updated `privacy.html` Section 4.3 disclosing educational mapping and confirming **zero commercial data sharing or selling to third parties/brokers**; added direct link to Google Security Permissions revocation.
  - **Policy III.E.4.a-g (7-Day Rolling Ephemeral Cache & Daily Purge)**: Implemented automated 7-day TTL cache eviction in `server/db.js` (`DELETE FROM youtube_search_cache WHERE cached_at < NOW() - INTERVAL '7 days'`), running on boot and daily timer.
- **Scraper Purge**: Uninstalled `youtube-sr`; refactored `server/utils/videoHarvester.js` to rely 100% exclusively on Official YouTube Data API v3 (`search.list`).
- **Zero Paywalls Disclosures**: Explicitly declared HAYAGRIVA NSQF Skillpedia as a 100% free non-monetized public educational resource in `privacy.html` and `terms.html`.
- **Evidence Bundle (`~/Desktop/YouTube_API_Evidence/`)**: Generated updated high-res PNGs (interactive player modal with 3-question bilingual viva exam) and 3-page consolidated PDF bundle (`HAYAGRIVA_Design_Documents_Complete_Bundle.pdf`).

### Next Session Resumption Plan
1. **YouTube Compliance Email Reply**: Send final response to YouTube API Services Compliance Team with GCP Project ID and Number.
2. **Video Harvester Expansion (`scripts/nsqf_video_harvester.js`)**: Extend harvesting loops to process multi-tier queries (Tier 1 Brand, Tier 2 Trade, Tier 3 Hinglish) for SOP workstations and MSME machine BOMs.
3. **UI Interactive Viva & Micro-Reel Player Integration**: Connect `reel.html`, `employers_sop.html`, and `entrepreneurs_msme.html` to render the timestamped player, 3-question viva quiz drawer, and study takeaway cards.



