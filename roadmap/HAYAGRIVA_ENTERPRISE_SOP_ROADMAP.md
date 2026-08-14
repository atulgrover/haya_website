# HAYAGRIVA Enterprise SOP & 4-Pillar Persona Roadmap

**Document Version:** 1.0  
**Date Created:** August 15, 2026  
**Status:** Approved Strategic Architecture for Quad-Portal Ecosystem

---

## 1. Executive Vision: The 4-Pillar Persona Architecture

The HAYAGRIVA platform provides four tailored, purpose-built portals serving distinct stakeholders in the skilling and professional ecosystem:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           THE 4-PILLAR HAYAGRIVA PORTAL HUB                              │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [1] 🎓 STUDENTS (NSQF)        ──► students.html   ──► 2,176 NSQF Job Roles & Certs      │
│  [2] 🏢 EMPLOYERS (SOPs)       ──► employers.html  ──► Ready-Made Industry SOP Reels    │
│  [3] 👤 EMPLOYEES (On-The-Fly) ──► employees.html  ──► Custom 11-Reel AI Generator       │
│  [4] ⚖️ PROFESSIONALS (IDE)    ──► professionals.html ──► Desktop IPE & Offline LLMs    │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Breakdown of the 4 Persona Portals

### 1. 🎓 Students Portal (`students.html`) — National Qualification Framework (NSQF)
* **Target Audience:** College students, vocational trainees, ITI learners, job seekers.
* **Core Functionality:**
  * Browse 38+ Industry Sectors & 2,176 National Qualification Packs (NQPs).
  * 11-to-48 step educational micro-learning reels.
  * Dual-language (English + Hindi) video demonstrations.
  * Digital NSQF Skill Badges & Mastery Certifications upon 100% completion.

---

### 2. 🏢 Employers Portal (`employers.html`) — Ready-Made Industry Standard Operating Procedures (SOPs)
* **Target Audience:** Business owners, Hotel General Managers, Restaurant Operators, Plant Supervisors, Hospital Administrators, Store Managers.
* **Core Problem Solved:** Eliminates 150-page PDF manual binders and removes the need for managers to manually write SOP training guides.
* **Core Functionality:**
  * **Zero-Setup Pre-Generated SOP Catalog:** Direct access to thousands of ready-made workplace SOPs synthesized automatically by AI from statutory NSQF standards.
  * **Sector Grid Navigation:** (Hospitality, Electronics Repair, Automotive Garage, Healthcare Nursing, Retail Store, Manufacturing & Logistics).
  * **Actionable SOP Reel Player:** Each SOP launches a fast, step-by-step practical video reel (`reel.html?sop=SOP-TH-01`) with:
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

## 3. Database Schema & Architecture for `employers.html` (SOPs)

### PostgreSQL Schema (`hayadb`):

```sql
-- Table: nsqf_sops (Ready-Made Industry SOPs)
CREATE TABLE IF NOT EXISTS nsqf_sops (
    id SERIAL PRIMARY KEY,
    sop_code VARCHAR(50) UNIQUE NOT NULL,         -- e.g. 'SOP-HOSP-01'
    qp_code TEXT NOT NULL,                         -- Links to base NSQF QP (e.g. 'THC/Q0301')
    nos_code TEXT NOT NULL,                        -- Links to base NOS (e.g. 'THC/N0301')
    sector VARCHAR(100) NOT NULL,                  -- e.g. 'Tourism & Hospitality'
    sop_title TEXT NOT NULL,                       -- e.g. 'Fine Dining Table Setup & Cutlery Alignment'
    sop_title_hi TEXT,                             -- e.g. 'डाइनिंग टेबल सेटअप और कटलरी अलाइनमेंट'
    sop_objective TEXT,                            -- Core operational outcome
    target_duration_seconds INT DEFAULT 300,       -- Benchmark completion time (e.g. 5 mins)
    total_steps INT DEFAULT 6,
    pipeline_status VARCHAR(50) DEFAULT 'ready',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: nsqf_sop_steps (Step-by-step SOP Actions)
CREATE TABLE IF NOT EXISTS nsqf_sop_steps (
    id SERIAL PRIMARY KEY,
    sop_code VARCHAR(50) NOT NULL REFERENCES nsqf_sops(sop_code) ON DELETE CASCADE,
    step_number INT NOT NULL,
    pc_id TEXT,                                    -- Source NSQF PC reference
    step_action TEXT NOT NULL,                     -- Action verb headline
    step_action_hi TEXT,
    step_description TEXT,
    video_id TEXT NOT NULL,                        -- Reused from nsqf_pcs
    video_id_hi TEXT,
    channel_title TEXT,
    duration_seconds INT DEFAULT 180,
    is_mandatory_safety INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sop_code, step_number)
);
```

---

## 4. Hospitality/Restaurant Real-World SOP Catalog Example

| SOP Code | Sector | SOP Title | Target Time | Key Operational Steps | Reused Video Streams |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **SOP-TH-01** | Hospitality | **5-Star Table Linen & Cutlery Alignment** | 4 min | 6 Steps | 🇬🇧 English + 🇮🇳 Hindi |
| **SOP-TH-02** | Hospitality | **Pre-Shift Side Station Mise-en-Place & Glass Polishing** | 5 min | 5 Steps | 🇬🇧 English + 🇮🇳 Hindi |
| **SOP-TH-03** | Hospitality | **Guest Greeting, Seating & 30-Second Water Service** | 3 min | 4 Steps | 🇬🇧 English + 🇮🇳 Hindi |
| **SOP-TH-04** | Hospitality | **POS Order Taking & Food Allergy Protocol** | 4 min | 5 Steps | 🇬🇧 English + 🇮🇳 Hindi |
| **SOP-TH-05** | Hospitality | **Silver Food Service & Crumbing Technique** | 5 min | 6 Steps | 🇬🇧 English + 🇮🇳 Hindi |
| **SOP-TH-06** | Hospitality | **Guest Room Bed Making & Duvet Tuck Protocol** | 6 min | 8 Steps | 🇬🇧 English + 🇮🇳 Hindi |
| **SOP-TH-07** | Hospitality | **Bathroom Sanitization & Amenities Restocking** | 8 min | 7 Steps | 🇬🇧 English + 🇮🇳 Hindi |

---

## 5. Global Navigation Header Update

The universal navigation header across all portal pages will be standardized:

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

## 6. Implementation Roadmap

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            ENTERPRISE SOP IMPLEMENTATION PHASES                          │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  PHASE 1: Database Schema & Auto-Synthesis Script                                        │
│  • Create `nsqf_sops` and `nsqf_sop_steps` tables in `hayadb`.                           │
│  • Build `scripts/nsqf_auto_sop_generator.js` to map NOS modules to ready-made SOPs.    │
│                                                                                          │
│  PHASE 2: Employers Portal Frontend (`employers.html`)                                   │
│  • Build Sector Selection Grid (Hospitality, Electronics, Auto, Healthcare, Retail).     │
│  • Render Ready-Made SOP Cards with time standards, step counts, and language badges.    │
│                                                                                          │
│  PHASE 3: SOP Reel Mode in `reel.html`                                                   │
│  • Support `?sop=SOP-TH-01` query parameter for operational compliance viewing.          │
│  • Display SOP Procedure Headlines and Digital Shift Checklist.                          │
│                                                                                          │
│  PHASE 4: Universal Navigation Synchronization                                           │
│  • Update header nav across `index.html`, `students.html`, `employers.html`,             │
│    `employees.html`, `professionals.html`, and `dashboard.html`.                         │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---
*Saved and synchronized in `roadmap/HAYAGRIVA_ENTERPRISE_SOP_ROADMAP.md`.*
