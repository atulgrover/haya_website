# Project Workspace Rules

- Always commit and push code changes to git (`origin main`) after completing implementation and verification tasks.

## Project Memory & Context (HAYAGRIVA Platform)

### Core Architecture & Portal Layout
- **Public Marketing & Router Hub**: `index.html` (Central entrance hub introducing platform capabilities for Students, Employees, and Professionals with navigation header to dedicated segment portals).
- **Targeted Segment Portals**:
  - `students.html`: National Qualification Framework (NSQF) engine with 2,176 NCVET job roles & 11-step micro-learning reels.
  - `employees.html`: Enterprise skill matrix, corporate domain isolation (`@company.com`), SOP reel builder, and PC checklists.
  - `professionals.html`: Insolvency Professional & Legal Practitioner hub showcasing Desktop IPE binaries, local GGUF models, `.vlt` statutory data vaults, and marketplace report ordering.
- **Interactive Collateral & Utilities**: `brochure.html` (Digital pitch deck), `workshop.html` (Masterclass registration), `handbook.html` (Operational docs viewer), `reel.html` (Video search & reel hub).
- **Logged-In User Portal Dashboard**: `dashboard.html` (Logged-in control panel with tabs: `🔑 License & Payments`, `🖥️ Hayagriva IPE`, `🧠 LLM Models`, `📚 Data Vaults`, `🤖 IBC Agents`, `📊 Marketplace Reports`, `👤 Profile & Settings`).
- **Auth Flow**: `login.html` and `signup.html` backed by `server/routes/auth.js` using SQLite (`server/db.js`), `bcryptjs`, and JWT tokens.
- **Pricing & Licensing**: Ed25519 cryptographic master key generation (`server/routes/license.js`) & dynamic Razorpay checkout (`server/routes/payments.js`).
- **Data Engine**: Local SQLite (WAL mode) with Turso Cloud SQLite fallback (`@libsql/client`) and pre-seeded 2,176 NCVET NSQF Job Roles.
- **Marketplace Reports**: Custom report ordering system backed by `server/routes/reports.js` and `report_orders` SQLite table.
- **Strategic Roadmap**: `roadmap/HAYAGRIVA_PORTAL_ROADMAP.md`.

### NSQF Data Pipeline Invariants & Memory
- **PDF → Markdown (`nsqf_pdf_to_md.py`) is Lossless & Complete**: 
  - It is **100% expected, intentional, and correct** for Markdown (`data/md/*.md`) to contain duplicate Performance Criteria (`PC1`, `PC2`, etc.) — once as bullet text in the syllabus/narrative section, and again as rows in the Assessment Criteria Table.
  - **Rule**: NEVER attempt to deduplicate or strip out the narrative PCs from the Markdown files or the Python converter. The `.md` file is the raw digital mirror of the complete PDF.
- **MD → JSON (`nsqf_md_to_json.js`) is the Assessment Compiler**:
  - The JSON compiler strictly extracts Performance Criteria from the **Assessment Criteria Tables** (with theory/practical marks) to form the canonical examination rubric, while extracting `KU` (Knowledge) & `GS` (Skills) from the narrative.
  - Downstream pipelines (Pass 1 DB ingest & Pass 2 Intent synthesis) consume the clean, deduplicated JSON AST (`data/json/*.json`).


