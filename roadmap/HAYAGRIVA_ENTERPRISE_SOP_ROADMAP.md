# HAYAGRIVA Enterprise SOP & 4-Pillar Persona Roadmap

**Document Version:** 2.0  
**Date Updated:** August 15, 2026  
**Status:** Approved Strategic Architecture for Quad-Portal Ecosystem with Dual Japanese Visual Identity

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
* **Visual Aesthetic:** **Studio Ghibli Hand-Painted Gouache & Watercolor** (Warm, sunlit, hopeful, inspiring craft mastery).
* **Core Functionality:**
  * Browse 38+ Industry Sectors & 2,176 National Qualification Packs (NQPs).
  * 11-to-48 step educational micro-learning reels.
  * Dual-language (English + Hindi) video demonstrations.
  * Digital NSQF Skill Badges & Mastery Certifications upon 100% completion.

---

### 2. 🏢 Employers Portal (`employers.html`) — Ready-Made Industry Standard Operating Procedures (SOPs)
* **Target Audience:** Business owners, Hotel General Managers, Restaurant Operators, Plant Supervisors, Hospital Administrators, Store Managers.
* **Visual Aesthetic:** **Shin-Hanga Architectural Precision & Modern Line Art** (Clean geometric lines, dramatic cinematic lighting, executive authority).
* **Core Problem Solved:** Eliminates 150-page PDF manual binders and removes the need for managers to manually write SOP training guides.
* **Core Functionality:**
  * **Zero-Setup Pre-Generated SOP Catalog:** Direct access to thousands of ready-made workplace SOPs synthesized automatically by AI from statutory NSQF standards.
  * **Exact 1:1 Sector Grid Alignment:** Identical 38+ Sector Cards as the student portal (neither more nor less).
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

## 3. Dual Japanese Visual Identity & Sector Card Specification

Instead of generic, low-resolution government or internet stock photos, HAYAGRIVA features **two distinct, bespoke visual languages**:

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

### Visual Prompts & Comparison Matrix Across Benchmark Sectors

| Sector | 🎓 Student Style (Studio Ghibli Watercolor) | 🏢 Employer Style (Shin-Hanga Architectural Precision) |
| :--- | :--- | :--- |
| **🏨 Hospitality & Hotels** | `A young apprentice chef smiling in a sunlit kitchen, garnishing freshly baked artisan bread with morning light streaming through windows, Studio Ghibli aesthetic, lush hand-painted watercolor, anime realism, warm colors.` | `A pristine, elegant 5-star fine-dining restaurant dining room, gleaming cutlery aligned with precision, polished wine glasses, warm glowing lanterns, Shin-Hanga modern Japanese woodblock style, dramatic evening lighting, clean architectural lines.` |
| **📱 Electronics & Hardware** | `A young vocational student repairing a smartphone circuit board at a cozy workbench surrounded by green potted plants, warm brass desk lamp, Studio Ghibli style, soft watercolor textures, gentle dust motes, inspiring atmosphere.` | `A state-of-the-art cleanroom electronics laboratory, isometric precision line art, digital multimeters, oscilloscope screens with cyan waveforms, Shin-Hanga woodblock aesthetic with neon accents, structured architectural perspective.` |
| **🌾 Agriculture & Farming** | `Trainees walking through golden rolling wheat fields under a vibrant blue Ghibli sky with fluffy cumulus clouds, high-tech modern greenhouse in the background, Hayao Miyazaki style, rich green and golden watercolor tones.` | `A high-precision smart-irrigation farm layout, geometric drone flight paths, structured drip-line blueprints, Shin-Hanga style with deep indigo dusk sky and warm amber tractor headlamps, clean composition.` |
| **🚗 Automotive & Garage** | `An apprentice mechanic tuning a motorcycle engine in an open-air workshop with sunlight reflecting off chrome tools, blooming cherry blossoms in the background, Studio Ghibli gouache style, warm nostalgic atmosphere.` | `A spotless automotive diagnostic bay, laser wheel alignment lasers, polished epoxy floor, structured tool shadow board, Shin-Hanga woodblock style, dramatic overhead industrial lighting, precision symmetry.` |
| **🏥 Healthcare & Nursing** | `A compassionate nursing student comforting a patient in a bright, peaceful clinic, soft pastel greens and golden sunlight, Studio Ghibli hand-painted aesthetic, welcoming, gentle, inspiring healthcare scene.` | `A high-standard hospital surgical suite and emergency triage bay, clean structured clinical carts, medical monitors glowing softly in the dark, Shin-Hanga architectural style, serene, sterile, executive clarity.` |

---

## 4. Database Schema & Architecture for `employers.html` (SOPs)

### PostgreSQL Schema (`hayadb`):

```sql
-- Table: nsqf_sops (Ready-Made Industry SOPs)
CREATE TABLE IF NOT EXISTS nsqf_sops (
    id SERIAL PRIMARY KEY,
    sop_code VARCHAR(50) UNIQUE NOT NULL,         -- e.g. 'SOP-HOSP-01'
    qp_code TEXT NOT NULL,                         -- Links to base NSQF QP (e.g. 'THC/Q0301')
    nos_code TEXT NOT NULL,                        -- Links to base NOS (e.g. 'THC/N0301')
    sector VARCHAR(100) NOT NULL,                  -- Exactly matches nsqf_qps.sector
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
│  PHASE 2: Bespoke Sector Asset Generation                                                │
│  • Generate Studio Ghibli illustrations in `assets/sectors/students/` (38 sectors).      │
│  • Generate Shin-Hanga Architectural illustrations in `assets/sectors/employers/` (38).  │
│                                                                                          │
│  PHASE 3: Employers Portal Frontend (`employers.html`)                                   │
│  • Build Sector Selection Grid with Shin-Hanga cards (1:1 with students.html sectors).   │
│  • Render Ready-Made SOP Cards with time standards, step counts, and language badges.    │
│                                                                                          │
│  PHASE 4: SOP Reel Mode in `reel.html`                                                   │
│  • Support `?sop=SOP-TH-01` query parameter for operational compliance viewing.          │
│  • Display SOP Procedure Headlines and Digital Shift Checklist.                          │
│                                                                                          │
│  PHASE 5: Universal Navigation Synchronization                                           │
│  • Update header nav across `index.html`, `students.html`, `employers.html`,             │
│    `employees.html`, `professionals.html`, and `dashboard.html`.                         │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---
*Saved and synchronized in `roadmap/HAYAGRIVA_ENTERPRISE_SOP_ROADMAP.md`.*
