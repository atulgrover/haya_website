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

