# Hayagriva Portal & IPE Ecosystem — Strategic Product Roadmap (2026–2027)

> **Document Version**: 1.0.0  
> **Status**: Approved for Future Engineering & Product Sprints  
> **Target Platform**: Hayagriva Web Portal & Native Desktop IPE  

---

## 🎯 Executive Summary & Strategic Vision

The **Hayagriva Portal** serves as the central cloud distribution, licensing, and asset hub for the **Hayagriva Insolvency & Legal Professional Development Environment (IPE)**. 

While the current platform reliably delivers desktop binaries, quantized GGUF LLM models, encrypted statutory `.vlt` datasets, and Ed25519 license validation, this roadmap outlines the evolution of Hayagriva into a **category-defining, real-time Legal Tech & Insolvency Intelligence Platform**.

---

## 🏛️ Strategic Pillars & Feature Roadmap

```
+-----------------------------------------------------------------------------------+
|                        HAYAGRIVA PLATFORM ECOSYSTEM                               |
+--------------------------+--------------------------+-----------------------------+
| ⚡ Real-Time Legal Radar | 🤖 Web Agent Sandbox     | 🏢 Enterprise Workspaces    |
| - NCLT/IBBI Order Stream | - Instant PDF Compliance | - Team Seat Management      |
| - Delta Sync (.diff.vlt) | - Try-In-Browser Engine  | - Centralized Vault Sharing |
+--------------------------+--------------------------+-----------------------------+
| 🏪 Creator Marketplace   | 💳 Flexible Haya Wallet  | 🕸️ Knowledge Graph          |
| - Custom Vault Monetization| - Pay-Per-Audit Credits| - Section-to-Precedent Map  |
| - Third-Party Subagents  | - Instant Razorpay Micro | - Visual Regulation Matrix  |
+--------------------------+--------------------------+-----------------------------+
```

---

### Pillar 1: ⚡ Real-Time Legal & Regulatory Radar

#### 1.1 Automated NCLT / NCLAT / IBBI Daily Order Feed
- **Description**: Background ingestion service capturing daily cause lists, bench orders, Supreme Court IBC rulings, and IBBI circulars.
- **Key Features**:
  - Live **"IBC Order Stream"** tab in the user portal.
  - Automated tagging by Corporate Debtor, Advocate, Section, and Bench.
  - Email & WhatsApp digest notifications for tracked cases.

#### 1.2 Desktop Differential Sync Engine (`.diff.vlt`)
- **Description**: Avoid forcing users to re-download multi-gigabyte `.vlt` files daily.
- **Key Features**:
  - Incremental sync protocol serving small delta updates (`.diff.vlt`).
  - Hayagriva Desktop IPE automatically fetches and applies updates silently in the background every morning.

---

### Pillar 2: 🤖 Web Agent Sandbox & Instant PDF Auditor

#### 2.1 Web-Based CIRP & Petition Compliance Checker
- **Description**: Allow prospective and existing users to test AI agent capabilities directly in the web browser without launching the desktop app.
- **Key Features**:
  - Drag-and-drop upload for CIRP Claims (Form C, Form D), Information Memorandums (IM), and Resolution Plans.
  - Instant 1-page **IBC Compliance & Financial Verification Report**.
  - Serves as an immediate high-conversion funnel for upgrade tiers.

---

### Pillar 3: 🏢 Enterprise Multi-Seat Workspaces & SAML/SSO

#### 3.1 Organization & Firm Management Panel
- **Description**: Multi-user licensing designed for Insolvency Professional Entities (IPEs), corporate law firms, and bank stressed-asset departments.
- **Key Features**:
  - **Master License Pool**: Manage 5–50 associate seats under a single corporate subscription.
  - **Shared Firm Vaults**: Securely upload and distribute internal firm precedents across all firm members.
  - **SAML 2.0 / SSO Integration**: Okta, Azure AD, and Google Workspace authentication for enterprise clients.

---

### Pillar 4: 🏪 Marketplace Reports & On-Demand Report Delivery Engine

#### 4.1 On-Demand Marketplace Reports Catalog
- **Description**: Users can order specialized legal, CIRP due diligence, financial audit, and precedent analysis reports directly from a dedicated **Marketplace Reports** tab in the logged-in portal.
- **Report Catalog**:
  - **CIRP Due Diligence & Form Verification Report**: Audits submitted claims and admission orders against IBBI CIRP regulations.
  - **NCLT Bench Precedent Summary Report**: Custom research compiled for specific benches or Corporate Debtors.
  - **Promoter Track Record & PUFE Audit Report**: Analyzes preferential, undervalued, fraudulent, and extortionate transactions.
  - **Liquidation Valuation Benchmark Report**: Cross-references liquidation asset valuations with historical NCLT auctions.

#### 4.2 Automated & Managed Email Delivery Workflow
- **Order Placement**: Users submit an order request (via subscription credits or Razorpay pay-per-report checkout).
- **Processing Status Engine**: Real-time status tracking (`Pending`, `In Analysis`, `Generated & Email Dispatched`, `Completed`).
- **Delivery Channels**:
  - Automatically dispatched to the user's registered email address in high-resolution PDF / DOCX format.
  - Instantly accessible and downloadable inside the user's **"My Ordered Reports"** vault within the Marketplace tab.

---

### Pillar 5: 🏪 Creator Asset & Subagent Marketplace

#### 5.1 Creator Asset Monetization
- **Description**: Enable legal domain experts, insolvency practitioners, and legal-tech developers to author and monetize specialized assets.
- **Key Features**:
  - Support for publishing custom **Data Vaults** (e.g. Maritime Law, Real Estate RERA, Customs/GST) and **IBC Subagents** (e.g. Forensic Audit Agent, Valuation Auditor).
  - Revenue sharing platform with automated Razorpay seller payouts.

---

### Pillar 5: 💳 Flexible Haya Credit System & Micro-Transactions

#### 5.1 Pay-As-You-Go Credit Wallet
- **Description**: Frictionless access for solo practitioners who do not require monthly subscriptions.
- **Key Features**:
  - Prepaid **Haya Credits** balance (e.g., ₹500 for 10 document audits or 5 asset downloads).
  - Instant UPI / QR top-up via Razorpay API.

---

### Pillar 6: 🕸️ Interactive Regulatory Knowledge Graph

#### 6.1 Section ➔ Regulation ➔ Precedent Visual Matrix
- **Description**: Transform static regulatory text into an interactive legal knowledge map.
- **Key Features**:
  - Interactive graph linking Insolvency Code Sections ➔ CIRP Regulations ➔ Landmark SC/NCLAT Precedents.
  - One-click prompt generation and draft template exporting.

---

### Pillar 7: 🏢 Enterprise Custom Skills Subsystem Evolution (Manager-to-Employee Workspaces)

#### Current Architecture (Phase 1: Simplified Manager-to-Employee Skill Sharing):
- **Authoring**: Employer / Manager creates custom 11-reel SOP skill packs via `aiEngine.js` in `employees.html`.
- **Storage Model**: Compact, portable document payload (`schema_json`) stored in `custom_skills` table.
- **Sharing & Discovery**: Skills filtered by corporate email domain (`@company.com`) and accessible to team members via shareable deep-links (`reel.html?skill=ID`).

#### Future Strategic Shift (Phase 2: Enterprise Compliance & Management Engine):
- **Manager Authoring & Targeting Controls**:
  - Employers/Managers set **`is_mandatory`** compliance flags (0 = Optional, 1 = Mandatory Safety/Onboarding Drill) and completion **`due_date`**.
  - Target assignments by **`company_wide`**, **`department`** (e.g. Assembly, Operations, Safety, HR), or **`individual_emails`**.
- **Dedicated Relational Compliance Table (`custom_skill_assignments`)**:
  - Stores `skill_id`, `company_id`, `employee_email_id`, `assigned_by_email`, `status` (`assigned` | `in_progress` | `completed` | `overdue`), `completion_percentage`, `score`, and `completed_at`.
- **Manager Executive Oversight Dashboard**:
  - Real-time team compliance reports, completion metrics, and automated reminders for overdue workforce drills.

---

## 📅 Implementation Phasing & Milestones

| Phase | Timeline | Target Deliverables |
| :--- | :--- | :--- |
| **Phase 1: Web Experience** | Q3 2026 | Web Agent PDF Auditor Sandbox, Updated Nav Labels, Simplified Manager-to-Employee Skill Sharing |
| **Phase 2: Enterprise & Skills** | Q4 2026 | Multi-Seat Firm Workspaces, Manager-to-Employee Compliance Engine (`custom_skill_assignments`), Credit Wallet System |
| **Phase 3: Real-Time Sync** | Q1 2027 | Automated Daily NCLT/IBBI Order Crawlers, `.diff.vlt` Incremental Sync Protocol |
| **Phase 4: Marketplace** | Q2 2027 | Community Asset Creator Marketplace, Developer API Access, Interactive Knowledge Graph |

---

## 🛠️ Infrastructure & Tech Stack Requirements

- **Backend**: Node.js / Express microservices with SQLite / PostgreSQL hybrid.
- **Payment Processing**: Razorpay Checkout SDK & Webhook Listeners.
- **Diff Engine**: Binary delta generator for `.vlt` archive patches.
- **Document Processing**: PDF parsing & OCR extraction pipelines for Web Sandbox.

---

## 🚀 Next-Gen OOB Strategic Horizons: National Industrial & Sovereign Intelligence Super-Platform (2026–2027)

Following the 100% database normalization and 3-perspective vector synthesis across 2,002 NSQF QPs and 176,727 Criteria, these 6 frontier horizons elevate HAYAGRIVA into an unrivaled, sovereign industrial intelligence ecosystem:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             HAYAGRIVA NEXT-GEN OOB HORIZONS                                 │
├──────────────────────────┬──────────────────────────┬───────────────────────────────────────┤
│ 🎙️ 1. Shop-Floor Whisperer│ 📄 2. 1-Click Bankable DPR│ 🛡️ 3. Ed25519 Verifiable Skill Badges │
│ - Hands-free Indic voice │ - PMEGP/Mudra 12-page PDF│ - W3C DID signed cryptocredentials    │
│ - Real-time SOP tolerance│ - Automated DSCR & Cash  │ - Offline mathematical verification   │
├──────────────────────────┼──────────────────────────┼───────────────────────────────────────┤
│ 🏭 4. Plant Compliance Radar│ 📡 5. P2P Mesh Vault Sync │ 👓 6. 3D WebGL Exploded Machinery BOM │
│ - Corporate skill heatmap│ - Zero-data ITI broadcast│ - Interactive 3D assembly models      │
│ - ISO 9001 / OSHA audit  │ - Local Bluetooth/WiFi P2P│ - Component-to-PC spatial alignment  │
└──────────────────────────┴──────────────────────────┴───────────────────────────────────────┘
```

### Horizon 1: 🎙️ The "Shop-Floor Whisperer" (Hands-Free Voice-First Indic Co-Pilot)
- **The Core Problem**: Electricians, CNC lathe machinists, automotive mechanics, and farmers have grease, oil, or high-voltage dielectric PPE gloves on their hands. They cannot type on a keyboard or tap phone screens on the shop floor.
- **The OOB Architecture**:
  - WebRTC / Web Audio low-latency stream connected to Sarvam Voice AI.
  - The technician taps their Bluetooth earpiece/headset and speaks in conversational Hindi, Marathi, or Tamil (*"Bhaiya, CCTV camera ka IR-cut filter install karte waqt kya voltage check karna hai?"*).
  - The voice assistant matches against `nsqf_pcs`, pulls the pre-synthesized `sop_parameter_tolerance` and `sop_critical_knack`, and **speaks back via natural Indic voice in 1.2 seconds**:
    > *"ESD-safe wrist strap pehno. Power supply ko 12V DC aur contact resistance ko 0.05 Ohm ke andar verify karo."*
- **Impact**: Zero touch, 100% hands-free safety compliance on real plant floors.

---

### Horizon 2: 📄 1-Click "Bankable MSME DPR (Detailed Project Report) PDF Generator"
- **The Core Problem**: Indian entrepreneurs wanting to start a small workshop spend **₹15,000 to ₹50,000** hiring accountants to write 30-page project reports for bank loans (PMEGP, Mudra, CGTMSE).
- **The OOB Architecture**:
  - Because `nsqf_pcs` holds complete commercial machine names, specifications, electrical KW loads, and calibrated CAPEX estimates, the server compiles:
    1. **Executive Summary & Market Demand**
    2. **Itemized Machinery Bill of Materials (BOM)** with calibrated electrical KW loads
    3. **PMEGP 3-Way Means of Finance** (5% Promoter Equity + 35% Govt Subsidy + 60% Bank Loan)
    4. **5-Year Projected Cash Flow, DSCR (Debt Service Coverage Ratio), and Break-Even Point**
  - Downloadable as a certified, bank-ready PDF in **1.5 seconds**.

---

### Horizon 3: 🛡️ Sovereign Ed25519 Cryptographic Verifiable Skill Badges (W3C DID)
- **The Core Problem**: Paper training certificates in India are easily forged, and employers cannot easily verify if a candidate actually passed workstation assessments.
- **The OOB Architecture**:
  - When an intern scores $\ge 80\%$ on the Workstation Viva Voce Exam, HAYAGRIVA signs a **W3C Verifiable Credential (`.json-ld`)** using the root Ed25519 private key (`server/utils/license-signer.js`).
  - Embeds a tamper-proof QR code directly into their digital profile or field wiki.
  - Any plant manager on `employers_sop.html` can scan the applicant's badge to verify the cryptographic signature **offline with 100% mathematical certainty**.

---

### Horizon 4: 🏭 Corporate "Skill Gap Radar & Plant Compliance Heatmap"
- **The Core Problem**: Plant HR and HSE safety officers with 500 factory operators struggle to track who is certified on which machine station for ISO 9001 and OSHA safety audits.
- **The OOB Architecture**:
  - Corporate domain multi-tenancy (`@company.com`).
  - Real-time **Plant Workstation Matrix**:
    - 🟢 **Green**: Certified & active on Workstation SOP.
    - 🟡 **Amber**: 90-day refresher quiz due.
    - 🔴 **Red**: Uncertified operator assigned to high-voltage/hazardous station (Critical Safety Flag).
  - 1-Click Export of official **Statutory Safety & SOP Compliance Audit Reports**.

---

### Horizon 5: 📡 Peer-to-Peer (P2P) Offline Mesh Sharing for Rural ITIs
- **The Core Problem**: Rural Industrial Training Institutes (ITIs) in remote areas have erratic broadband or zero cellular coverage.
- **The OOB Architecture**:
  - One instructor downloads a 2.8 MB Trade Field Wiki (`.vlt`) on their phone in the city.
  - In the rural classroom, other students connect via local Wi-Fi Hotspot or Bluetooth WebRTC.
  - The teacher's phone acts as a **local micro-server**, broadcasting the full trade wiki, video notes, and interactive quizzes to all 40 student devices **without using a single byte of mobile data**.

---

### Horizon 6: 👓 Interactive 3D / WebGL "Exploded Machinery BOM & AR Overlay"
- **The Core Problem**: Understanding how complex commercial machines (e.g. BGA Rework Station, CNC EDM, EV Spot Welder) assemble can be hard from pure 2D text.
- **The OOB Architecture**:
  - In the MSME tab, add an interactive **3D WebGL / Three.js wireframe model**.
  - Clicking any machine component highlights its corresponding NCVET Performance Criterion, physical tolerance, and operating knack.

---

## 🎬 NSQF Pipeline — Deferred Roadmap Items

### 📅 Video Staleness Detection (Future: Phase 4C)

> **Status**: Deferred — implement after full 2,001-QP catalog pipeline run completes.

YouTube videos are a **living ecosystem**, not a static library. Videos die due to deletions, copyright strikes, channel terminations, and retroactive region-locks. Once a video dies, students see a black iframe ("Video unavailable").

**The philosophy:** After the initial harvest (Pass 3), video IDs are an *assumption*, not a fact. Assumptions must be periodically re-validated.

**Implementation: `nsqf_video_staleness_check.js`**

```
Usage:
  node scripts/nsqf_video_staleness_check.js --sample=2000    (weekly cron)
  node scripts/nsqf_video_staleness_check.js --all            (monthly full sweep)
```

**Logic:**
1. Query distinct `video_id` + `video_id_hi` from `nsqf_pcs` (deduplicated, ~50K–80K unique IDs)
2. Hit YouTube oEmbed for each: `https://www.youtube.com/oembed?url=...`
3. Dead videos (HTTP 404/401): `UPDATE nsqf_pcs SET video_id = NULL WHERE video_id = $staleId`
   → This makes them eligible for Pass 3 re-harvest on next run
4. Purge `youtube_search_cache` entries older than 90 days
5. Log: total checked, stale count, affected QPs

**Recommended Cron Schedule:**
```cron
# Weekly sample check (Sunday 3 AM IST)
0 3 * * 0 node /path/to/scripts/nsqf_video_staleness_check.js --sample=2000

# Monthly full sweep (1st of month, 2 AM IST)
0 2 1 * * node /path/to/scripts/nsqf_video_staleness_check.js --all
```

**Why not daily?** The death probability curve: Day 1–7 (~3%), Day 8–30 (~1%), Day 91–365 (~0.2%). Checking 200K+ video IDs daily would hammer YouTube with 400K+ oEmbed requests — wasteful and rate-limit risky. Weekly sampling catches channel takedowns fast; monthly full sweeps ensure complete coverage.

