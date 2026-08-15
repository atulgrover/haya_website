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

### NSQF Data Pipeline Invariants & Memory
- **PDF → Markdown (`nsqf_pdf_to_md.py`) is Lossless & Complete**: 
  - It is **100% expected, intentional, and correct** for Markdown (`data/md/*.md`) to contain duplicate Performance Criteria (`PC1`, `PC2`, etc.) — once as bullet text in the syllabus/narrative section, and again as rows in the Assessment Criteria Table.
  - **Rule**: NEVER attempt to deduplicate or strip out the narrative PCs from the Markdown files or the Python converter. The `.md` file is the raw digital mirror of the complete PDF.
- **MD → JSON (`nsqf_md_to_json.js`) is the Assessment Compiler**:
  - The JSON compiler strictly extracts Performance Criteria from the **Assessment Criteria Tables** (with theory/practical marks) to form the canonical examination rubric, while extracting `KU` (Knowledge) & `GS` (Skills) from the narrative.
  - Downstream pipelines (Pass 1 DB ingest & Pass 2 Intent synthesis) consume the clean, deduplicated JSON AST (`data/json/*.json`).


