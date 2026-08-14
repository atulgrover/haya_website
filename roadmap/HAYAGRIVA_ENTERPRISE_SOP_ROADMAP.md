# HAYAGRIVA Enterprise SOP & 4-Pillar Persona Roadmap

**Document Version:** 2.3  
**Date Updated:** August 15, 2026  
**Status:** Approved Strategic Architecture for Quad-Portal Ecosystem with Immutable National SOP Benchmark & Bespoke Enterprise Services

---

## 1. Executive Vision: The 4-Pillar Persona Architecture

The HAYAGRIVA platform provides four tailored, purpose-built portals serving distinct stakeholders in the skilling and professional ecosystem:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           THE 4-PILLAR HAYAGRIVA PORTAL HUB                              │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [1] 🎓 STUDENTS (NSQF)        ──► students.html   ──► 2,176 NSQF Job Roles & Certs      │
│  [2] 🏢 EMPLOYERS (SOPs)       ──► employers.html  ──► Immutable National SOP Benchmarks │
│  [3] 👤 EMPLOYEES (On-The-Fly) ──► employees.html  ──► Custom 11-Reel AI Generator       │
│  [4] ⚖️ PROFESSIONALS (IDE)    ──► professionals.html ──► Desktop IPE & Offline LLMs    │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Breakdown of the 4 Persona Portals

### 1. 🎓 Students Portal (`students.html`) — National Qualification Framework (NSQF)
* **Target Audience:** College students, vocational trainees, ITI learners, job seekers.
* **Visual Aesthetic:** **Studio Ghibli Hand-Painted Gouache & Watercolor** (Warm, sunlit, hopeful, inspiring craft mastery).
* **Core Functionality:**
  * Browse 38+ Industry Sectors & 2,176 National Qualification Packs (NQPs).
  * 11-to-48 step educational micro-learning reels.
  * Dual-language (English + Hindi) video demonstrations.
  * Digital NSQF Skill Badges & Mastery Certifications upon 100% completion.

---

### 2. 🏢 Employers Portal (`employers.html`) — Immutable National Standard Operating Procedures (SOPs)
* **Target Audience:** Business owners, Hotel General Managers, Restaurant Operators, Plant Supervisors, Hospital Administrators, Store Managers.
* **Visual Aesthetic:** **Shin-Hanga Architectural Precision & Modern Line Art** (Clean geometric lines, dramatic cinematic lighting, executive authority).
* **Governance Model:** **100% Fixed & Immutable Reference Standard (Admin-Controlled Only)**.
  * Just like the NSQF curriculum, the National SOP Benchmark catalog is read-only for public employers and can only be modified by HAYAGRIVA Admins.
  * Pre-synthesized from statutory NSQF standards with zero employer setup required.
  * **Exact 1:1 Sector Grid Alignment:** Identical 38+ Sector Cards as the student portal (neither more nor less).
  * **Human-Friendly Semantic Action Slugs:** Clean readable URLs (e.g. `reel.html?sop=fine-dining-table-setup`).
  * **Actionable SOP Reel Player:** Each SOP launches a fast, step-by-step practical video reel with:
    1. Operational Standard Time Limit (e.g. `⏱️ 4 min SOP`).
    2. Number of Critical Action Steps (e.g. `6 Steps`).
    3. Mandatory Hygiene & Safety Verification.
    4. Interactive Onboarding Checklist with supervisor audit logs.
  * **Zero Additional Video Harvesting Needed:** Automatically reuses the existing 207,000 harvested dual-language video catalog.

---

### 3. 👤 Employees Portal (`employees.html`) — On-The-Fly Custom 11-Reel AI Builder
* **Target Audience:** Working professionals, corporate domain users (`@company.com`), team leads.
* **Core Functionality:**
  * **On-the-Fly Custom 11-Reel Generator:** Type any custom corporate topic or workflow (e.g. *"Internal ERP Shift Handoff"* or *"Cold-Calling Script for SaaS"*) and generate an instant 11-video learning reel on demand.
  * Enterprise Skill Matrix & Individual Employee Competency Mapping.
  * Corporate domain data isolation.

---

### 4. ⚖️ Professionals Portal (`professionals.html`) — Desktop Insolvency Professional Entity (IPE)
* **Target Audience:** Insolvency Professionals (IPs), NCLT Advocates, Corporate Restructuring Advisors, Resolution Applicants.
* **Core Functionality:**
  * Native Desktop IPE Application binaries for macOS (Apple Silicon / Intel) and Windows.
  * Local Offline GGUF AI Models (DeepSeek-R1, Llama 3.3, Qwen 2.5 32B).
  * Air-Gapped Encrypted Statutory Data Vaults (`.vlt`) for IBC cases.
  * 13 Autonomous Statutory AI Agents (Claim Verification, CIRP Compliance, Liquidation Cascade).

---

## 3. Bespoke Enterprise Custom SOP Services (High-Margin B2B Model)

For large corporate clients (*Taj Hotels, Tata Motors, Marriott, Apollo Hospitals, Reliance*):
* **Custom Proprietary Ingestion**: The enterprise provides their internal training manuals, brand guidelines, and proprietary operational videos.
* **Private Isolated Domain Vault**: HAYAGRIVA ingests the client's internal documents into a private encrypted workspace keyed to their domain (e.g. `@tajhotels.com`).
* **Bespoke Brand Reels**: The client's employees see their own brand-specific SOP reels, turn-down standards, and custom uniform rules without polluting the public National Benchmark catalog.

---

## 4. NSQF ➔ Enterprise SOP Data Transformation Mapping

The underlying data is **100% sourced from the existing NSQF tables**, but transformed into dedicated enterprise tables with specialized operational columns:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         NSQF ➔ ENTERPRISE TABLE TRANSFORMATION                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [NSQF STATUTORY SOURCE]                            [ENTERPRISE OPERATIONAL TARGET]      │
│  nsqf_qps (Job Roles)           ══════════════►     Sector & Job Role Scope              │
│  nsqf_modules (Curriculum Unit) ══════════════►     enterprise_sops (Master SOP)         │
│  nsqf_pcs (Performance Criteria)═════════════►     enterprise_sop_steps (Action Steps)  │
│  youtube_search_cache           ══════════════►     Video Streams (Reused 0ms)           │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Direct Field Mapping Specification:

| Source (NSQF Tables) | Target (Enterprise Tables) | Transformation Logic / Applied Enhancement |
| :--- | :--- | :--- |
| `nsqf_modules.module_title` | `enterprise_sops.sop_title` | Converted to action standard (e.g. *"Table Setup & Cutlery Standard"*). |
| `nsqf_modules.module_title` | `enterprise_sops.slug` | Converted to kebab-case URL slug (e.g. `fine-dining-table-setup`). |
| `nsqf_qps.sector` | `enterprise_sops.sector` | 1:1 Identity match with 38 statutory sectors. |
| `nsqf_pcs.pc_intent` | `enterprise_sop_steps.action_headline` | 5–8 word action verb headline for quick reading on mobile. |
| `nsqf_pcs.pc_description` | `enterprise_sop_steps.procedure_text` | Detailed standard operational instructions. |
| `nsqf_pcs.video_id` / `_hi` | `enterprise_sop_steps.video_id` / `_hi` | 1:1 Video binding without additional harvesting. |
| `nsqf_pcs.duration_seconds` | `enterprise_sops.target_duration_seconds` | $\sum(\text{step durations})$ = Total benchmark execution time. |
| `nsqf_pcs.pc_description` | `enterprise_sop_steps.is_mandatory_safety` | `TRUE` if text contains `safety`, `ppe`, `esd`, `hygiene`, or `hazard`. |
| `nsqf_pcs.tool_keywords` | `enterprise_sops.tools_required` | Extracted tool keywords (e.g. *Multimeter, Lint-free cloth*). |

---

## 5. Dual Japanese Visual Identity & Sector Card Specification

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           THE DUAL VISUAL IDENTITY MATRIX                                │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  🎓 STUDENTS (students.html)                       🏢 EMPLOYERS (employers.html)         │
│  "The Inspiring Journey of Craft Mastery"          "The Architectural Precision of SOPs" │
│                                                                                          │
│  🎨 Studio Ghibli Hand-Painted Gouache             🎨 Shin-Hanga / Precision Line Art    │
│  • Directory: `assets/sectors/students/`           • Directory: `assets/sectors/employers/`
│  • Warm sunlit lighting, vibrant watercolors       • Clean geometric lines, dramatic light
│  • Hopeful trainees mastering crafts               • Spotless 5-star operations & plants │
│  • Fluffy clouds, lush environments, cozy tools    • High-contrast shadows, clean setups │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Enterprise-Ready PostgreSQL Database Schema (`hayadb`)

```sql
-- 1. MASTER SOP SPECIFICATION TABLE (Immutable National Benchmark)
CREATE TABLE IF NOT EXISTS enterprise_sops (
    id SERIAL PRIMARY KEY,
    sop_code VARCHAR(50) UNIQUE NOT NULL,            -- e.g. 'SOP-HOSP-001'
    slug VARCHAR(120) UNIQUE NOT NULL,               -- e.g. 'fine-dining-table-setup'
    qp_code VARCHAR(50) NOT NULL,                    -- Links to source NSQF QP ('THC/Q0301')
    nos_code VARCHAR(50) NOT NULL,                   -- Links to source NOS ('THC/N0301')
    sector VARCHAR(100) NOT NULL,                     -- 1:1 match with nsqf_qps.sector
    sop_title TEXT NOT NULL,                          -- 'Fine Dining Table Setup & Cutlery Alignment Standard'
    sop_title_hi TEXT,                                -- '5-स्टार टेबल लिनेन और कटलरी अलाइनमेंट मानक'
    workstation_name TEXT,                            -- 'Dining Room Side Station'
    objective TEXT NOT NULL,                          -- Operational outcome statement
    target_duration_seconds INT DEFAULT 300,          -- Benchmark execution time (e.g. 5 mins)
    total_steps INT DEFAULT 6,
    tools_required TEXT,                              -- 'Lint-free cloth, Molleton pad, Cruet set'
    ppe_requirements TEXT,                            -- 'Service gloves, Apron'
    compliance_standard VARCHAR(100) DEFAULT 'ISO 9001 / Industry Standard',
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROCEDURAL ACTION STEPS & DUAL VIDEO BINDINGS
CREATE TABLE IF NOT EXISTS enterprise_sop_steps (
    id SERIAL PRIMARY KEY,
    sop_code VARCHAR(50) NOT NULL REFERENCES enterprise_sops(sop_code) ON DELETE CASCADE,
    step_number INT NOT NULL,                         -- 1, 2, 3, 4, 5...
    pc_id VARCHAR(50),                                -- Original NSQF PC code ('PC1.')
    action_headline TEXT NOT NULL,                    -- English 5-8 word action headline
    action_headline_hi TEXT,                          -- Hindi action headline
    procedure_text TEXT NOT NULL,                     -- Detailed standard operating instructions
    procedure_text_hi TEXT,
    video_id VARCHAR(30) NOT NULL,                    -- Harvested English YouTube video ID
    video_id_hi VARCHAR(30),                          -- Harvested Hindi YouTube video ID
    channel_title TEXT,                               -- Channel attribution
    channel_title_hi TEXT,
    duration_seconds INT DEFAULT 180,
    is_mandatory_safety BOOLEAN DEFAULT FALSE,        -- 🔴 Safety & Compliance flag
    critical_control_point TEXT,                      -- Defect warning: 'Never touch blade with fingers'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sop_code, step_number)
);

-- 3. CORPORATE DOMAIN ISOLATION & BESPOKE CLIENT OVERRIDES
CREATE TABLE IF NOT EXISTS enterprise_sop_assignments (
    id SERIAL PRIMARY KEY,
    company_domain VARCHAR(100) NOT NULL,             -- e.g. 'tajhotels.com', 'marriott.com'
    sop_code VARCHAR(50) NOT NULL REFERENCES enterprise_sops(sop_code) ON DELETE CASCADE,
    department VARCHAR(100),                          -- e.g. 'Food & Beverage Service'
    assigned_by INT,                                  -- Manager User ID
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_domain, sop_code)
);

-- 4. LIVE AUDIT LOG & COMPLIANCE VERIFICATION
CREATE TABLE IF NOT EXISTS enterprise_sop_executions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,                             -- Employee User ID
    company_domain VARCHAR(100),                      -- '@company.com'
    sop_code VARCHAR(50) NOT NULL REFERENCES enterprise_sops(sop_code),
    step_number INT NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',           -- 'completed', 'verified', 'flagged'
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    supervisor_verified_by INT,                       -- Shift Supervisor User ID
    UNIQUE(user_id, sop_code, step_number, completed_at)
);
```

---

## 7. Universal Navigation Header Update

```html
<nav class="portal-nav-bar">
  <a href="index.html" class="nav-brand">HAYAGRIVA</a>
  <div class="nav-links">
    <a href="students.html" class="nav-link">🎓 Students (NSQF)</a>
    <a href="employers.html" class="nav-link">🏢 Employers (SOPs)</a>
    <a href="employees.html" class="nav-link">👤 Employees (AI Custom)</a>
    <a href="professionals.html" class="nav-link">⚖️ Professionals (IDE)</a>
  </div>
  <div class="nav-auth">
    <a href="login.html" class="nav-btn">Sign In</a>
  </div>
</nav>
```

---

## 8. Implementation Plan & Execution Phases

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            ENTERPRISE SOP IMPLEMENTATION PHASES                          │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  PHASE 1: Database Schema & Auto-Transformation Engine                                   │
│  • Add `enterprise_sops` and `enterprise_sop_steps` DDL in `server/db.js`.               │
│  • Build `scripts/nsqf_auto_sop_generator.js` to transform NSQF data into SOPs.          │
│  • Filter out soft-skill NOS (`N9901–N9999`) to maintain strict technical focus.         │
│  • Export portable `.md` files to `data/sops/{sector}/{slug}.md`.                        │
│                                                                                          │
│  PHASE 2: Bespoke Sector Asset Generation                                                │
│  • Generate Studio Ghibli illustrations in `assets/sectors/students/` (38 sectors).      │
│  • Generate Shin-Hanga Architectural illustrations in `assets/sectors/employers/` (38).  │
│                                                                                          │
│  PHASE 3: Employers Portal Frontend (`employers.html`)                                   │
│  • Build Sector Selection Grid with Shin-Hanga cards (1:1 with students.html sectors).   │
│  • Render Ready-Made SOP Cards with time standards, step counts, and language badges.    │
│                                                                                          │
│  PHASE 4: SOP Reel Mode in `reel.html`                                                   │
│  • Support `?sop=fine-dining-table-setup` with procedure headlines & compliance check.   │
│                                                                                          │
│  PHASE 5: Universal Navigation Synchronization                                           │
│  • Update header nav across `index.html`, `students.html`, `employers.html`,             │
│    `employees.html`, `professionals.html`, and `dashboard.html`.                         │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---
*Saved and synchronized in `roadmap/HAYAGRIVA_ENTERPRISE_SOP_ROADMAP.md`.*
