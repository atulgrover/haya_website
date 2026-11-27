# Agentic Professionals — Subdomain Header & Agentic Architecture
**Date:** 2026-11-27  
**Status:** Approved Architectural Model (Option B: Dynamic Radar + 3 Agent Tiers)  
**Target Subdomains:** `ibc.agenticprofessionals.net` (Port 3002), `bns.agenticprofessionals.net` (Port 3003)

---

## 1. Executive Summary & Design System

The platform **Agentic Professionals** (`agenticprofessionals.net`) deploys domain-specific, autonomous computational agents for institutional restructuring, legal compliance, and turnaround professionals.

To bridge visual spatial surveillance (the 16-Bench Radar) with autonomous execution:
- **Tab 1: Dynamic Objective Radar** — Changes its label and data feed dynamically according to the selected stakeholder persona on the left (`acquisition radar`, `recovery radar`, `mandate radar`, `valuation radar`, `exposure radar`).
- **Tab 2: Process Agents ⌄** — Autonomous data room parsing, CIRP statutory compliance verification, and Tree-of-Tokens indexing $\rightarrow$ Download Hayagriva Desktop sovereign client.
- **Tab 3: Forensic Agents ⌄** — PUFE transaction audits (Sections 43, 45, 49, 50, 66 IBC) $\rightarrow$ Book Calnode Consultation with certified IPs and Forensic CAs.
- **Tab 4: Advisory Agents** — Instant statutory legal opinions, regulations, and tribunal precedents synthesized via the **LightRAG Knowledge Graph Forum**.
- **Right Tray: Cart Icon & Contextual Profile** — Clean shopping-cart icon (`🛒`) for purchased reports & dossiers; contextual `sign in` (or round `(AD)` avatar when authenticated).

---

## 2. The Header Architecture (Visual Blueprint)

### For Persona: `investors`
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄 IBC - investors ⌄]     acquisition radar     process agents ⌄     forensic agents ⌄     advisory agents               🛒   sign in │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### For Persona: `creditors`
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄 IBC - creditors ⌄]     recovery radar        process agents ⌄     forensic agents ⌄     advisory agents               🛒   sign in │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### For Persona: `professionals`
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄 IBC - professionals ⌄] mandate radar         process agents ⌄     forensic agents ⌄     advisory agents               🛒   sign in │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 5-Stakeholder Dynamic Mapping Matrix

| Stakeholder in Left Popover | Tab 1: Dynamic Radar (Discovery) | Tab 2: Process Agents (Computation) | Tab 3: Forensic Agents (Verification) | Tab 4: Advisory Agents (Interpretation) | Primary Monetization / Action Loop |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`[IBC - investors ⌄]`** | **`acquisition radar`** | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` | • **Purchase Due Diligence Dossiers**<br>• Download Hayagriva Desktop<br>• Book Calnode Consultation |
| **`[IBC - creditors ⌄]`** | **`recovery radar`** | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` | • **Purchase Claims Recovery Audit**<br>• CoC Voting Compliance<br>• Book Sec 66 Fraud Audit |
| **`[IBC - professionals ⌄]`** | **`mandate radar`** | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` | • **Publish / Access EOI Dossiers**<br>• 1,000-page Paper-book Indexing<br>• Book Peer Compliance Review |
| **`[IBC - valuers ⌄]`** | **`valuation radar`** | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` | • **Asset Liquidation Benchmarks**<br>• Financial Model Verification<br>• Book Industry Specialist |
| **`[IBC - guarantors ⌄]`** | **`exposure radar`** | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` | • **Sec 94/95 Insolvency Defense**<br>• Guarantee Ringfencing Audit<br>• Book Senior Advocate |

---

## 4. Interaction & Canvas Behavior

### 4.1 Tab 1: Dynamic Radar (`#nav-opportunities`)
- **Direct Canvas Link:** Immediately activates the **16-Bench Leaflet Radar Map** & asset sidebar list.
- **Dynamic Content:** Updates markers, filters (benches, regimes, sectors), and sidebar cards according to the active stakeholder.
- **Action:** Clicking any asset or dossier in the sidebar/inspector drawer offers **Purchase Statutory Report** via Razorpay.

### 4.2 Tab 2: `process agents ⌄` (`#megamenu-intelligence`)
- **740px Flyout Panel:**
  - **Left Column:** Data Room Ingestion, Resolution Compliance Validation, CIRP Filing Generator.
  - **Right Column (Action Dock):** Unified **"Download Hayagriva Desktop"** card (macOS Apple Silicon/Intel & Windows binaries for local sovereign confidential processing).

### 4.3 Tab 3: `forensic agents ⌄` (`#megamenu-consultations`)
- **740px Flyout Panel:**
  - **Left Column:** PUFE Transaction Audit (Sections 43, 45, 49, 50, 66 IBC), Avoidance Dockets, Valuation Parity Scoring.
  - **Right Column (Action Dock):** Unified **"Book Consultation"** card powered by Calnode (live briefing booking with verified Insolvency Professionals & Forensic CAs).

### 4.4 Tab 4: `advisory agents` (`#nav-answers-btn`)
- **Direct Canvas Switch:** Switches the main canvas from the Radar to the **3-Panel LightRAG Statutory Forum View** (Statute Navigation on left, Live Q&A Stream in center, Semantic Context / Citations on right).
- **Action:** Features the instant "Ask a Question to the Statutory Graph" input.

### 4.5 Right Dock: Cart Icon & Contextual Auth
- **Cart Button (`#nav-catalog-btn`):** Clean Lucide cart icon (`🛒`) that toggles the statutory reports catalog / purchased dossiers view.
- **Logged Out:** Minimal, high-aesthetic `sign in` text link. Any attempt to purchase reports, download Hayagriva tokens, book consultations, or submit forum questions launches the Just-In-Time (JIT) authentication modal.
- **Logged In:** Displays circular user initials avatar `(AD)` and display name with dropdown:
  1. `user console`
  2. `purchased reports` *(from Radar / Cart)*
  3. `hayagriva license / tokens` *(from Process Agents)*
  4. `scheduled consultations` *(from Forensic Agents)*
  5. `my queries & answers` *(from Advisory Agents)*
  6. `log out`
