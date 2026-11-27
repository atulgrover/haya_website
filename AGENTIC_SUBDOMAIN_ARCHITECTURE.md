# Agentic Professionals — Subdomain Header & Agentic Architecture
**Date:** 2026-11-27  
**Status:** Approved Architectural Model (Option B: Dynamic Radar + Agent Tiers)  
**Target Subdomains:** `ibc.agenticprofessionals.net` (Port 3002), `bns.agenticprofessionals.net` (Port 3003)

---

## 1. Executive Summary & Design System

The platform **Agentic Professionals** (`agenticprofessionals.net`) deploys domain-specific, autonomous computational agents for institutional restructuring, legal compliance, and turnaround professionals.

To bridge visual spatial surveillance (the 16-Bench Radar) with autonomous execution, the center navigation adopts **Option B**:
- **Tab 1: Dynamic Objective Radar** — Changes its label and data feed dynamically according to the selected stakeholder persona on the left (`acquisition radar`, `recovery radar`, `mandate radar`, `valuation radar`, `exposure radar`).
- **Tabs 2, 3, 4: The 3 Core Autonomous Agent Tiers** — Remain rock-solid and stable across all personas (`process agents ⌄`, `forensic agents ⌄`, `query agents`), adapting their internal payloads to the persona.
- **Right Tray: Contextual JIT Auth & Sovereign Profile** — Minimal `sign in` when logged out; round `(AD)` avatar with dropdown when logged in.

---

## 2. The Header Architecture (Visual Blueprint)

### For Persona: `investors`
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄 IBC - investors ⌄]     acquisition radar     process agents ⌄     forensic agents ⌄     query agents                  (AD) admin ⌄ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### For Persona: `creditors`
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄 IBC - creditors ⌄]     recovery radar        process agents ⌄     forensic agents ⌄     query agents                  (AD) admin ⌄ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### For Persona: `professionals`
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄 IBC - professionals ⌄] mandate radar         process agents ⌄     forensic agents ⌄     query agents                  (AD) admin ⌄ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 5-Stakeholder Dynamic Mapping Matrix

| Stakeholder in Left Popover | Tab 1: Dynamic Radar (Discovery) | Tab 2: Process Agents (Computation) | Tab 3: Forensic Agents (Verification) | Tab 4: Query Agents (Precedents) | Primary Monetization / Action Loop |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`[IBC - investors ⌄]`** | **`acquisition radar`** | `process agents ⌄` | `forensic agents ⌄` | `query agents` | • **Purchase Due Diligence Dossiers**<br>• Download Hayagriva Desktop<br>• Book Calnode Consultation |
| **`[IBC - creditors ⌄]`** | **`recovery radar`** | `process agents ⌄` | `forensic agents ⌄` | `query agents` | • **Purchase Claims Recovery Audit**<br>• CoC Voting Compliance<br>• Book Sec 66 Fraud Audit |
| **`[IBC - professionals ⌄]`** | **`mandate radar`** | `process agents ⌄` | `forensic agents ⌄` | `query agents` | • **Publish / Access EOI Dossiers**<br>• 1,000-page Paper-book Indexing<br>• Book Peer Compliance Review |
| **`[IBC - valuers ⌄]`** | **`valuation radar`** | `process agents ⌄` | `forensic agents ⌄` | `query agents` | • **Asset Liquidation Benchmarks**<br>• Financial Model Verification<br>• Book Industry Specialist |
| **`[IBC - guarantors ⌄]`** | **`exposure radar`** | `process agents ⌄` | `forensic agents ⌄` | `query agents` | • **Sec 94/95 Insolvency Defense**<br>• Guarantee Ringfencing Audit<br>• Book Senior Advocate |

---

## 4. Interaction & Canvas Behavior

### 4.1 Tab 1: Dynamic Radar (`#nav-radar-btn`)
- **Direct Canvas Link:** Immediately activates the **16-Bench Leaflet Radar Map** & asset sidebar list.
- **Dynamic Content:** Updates markers, filters (benches, regimes, sectors), and sidebar cards according to the active stakeholder.
- **Action:** Clicking any asset or dossier in the sidebar/inspector drawer offers **Purchase Statutory Report** via Razorpay.

### 4.2 Tab 2: `process agents ⌄` (`#megamenu-process`)
- **740px Flyout Panel:**
  - **Left Column:** Data Room Ingestion, Resolution Compliance Validation, CIRP Filing Generator.
  - **Right Column (Action Dock):** Unified **"Download Hayagriva Desktop"** card (macOS Apple Silicon/Intel & Windows binaries for local sovereign confidential processing).

### 4.3 Tab 3: `forensic agents ⌄` (`#megamenu-forensic`)
- **740px Flyout Panel:**
  - **Left Column:** PUFE Transaction Audit (Sections 43, 45, 49, 50, 66 IBC), Avoidance Dockets, Valuation Parity Scoring.
  - **Right Column (Action Dock):** Unified **"Book Consultation"** card powered by Calnode (live briefing booking with verified Insolvency Professionals & Forensic CAs).

### 4.4 Tab 4: `query agents` (`#nav-query-btn`)
- **Direct Canvas Switch:** Switches the main canvas from the Radar to the **3-Panel LightRAG Statutory Answers View** (Statute Navigation on left, Live Q&A Stream in center, Semantic Context / Citations on right).
- **Action:** Features the instant "Ask a Question to the Statutory Graph" input.

### 4.5 Right Dock: Contextual Auth & User Workspace
- **Logged Out:** Minimal, high-aesthetic `sign in` text link. Any attempt to purchase reports, download Hayagriva tokens, book consultations, or submit forum questions launches the Just-In-Time (JIT) authentication modal.
- **Logged In:** Displays circular user initials avatar `(AD)` and display name with dropdown:
  1. `user console`
  2. `purchased reports` *(from Radar)*
  3. `hayagriva license / tokens` *(from Process Agents)*
  4. `scheduled consultations` *(from Forensic Agents)*
  5. `my queries & answers` *(from Query Agents)*
  6. `log out`

---

## 5. Technical Implementation Checklist
1. **HTML:** Update `agenticprofessionals-net/public/ibc/index.html` and `AgenticProfessionals/ibc.agenticprofessionals/apps/website/public/index.html` (and respective BNS files) to reflect the new 4-item center nav IDs and labels.
2. **JavaScript (`radar.js`):**
   - Bind `stakeholderRadarMap` to update Tab 1's text (`acquisition radar`, `recovery radar`, `mandate radar`, etc.) on `#subdomain-dropdown` clicks.
   - Bind Tab 1 (`#nav-radar-btn`) to open Radar canvas.
   - Bind Tab 4 (`#nav-query-btn`) to switch to LightRAG forum canvas.
   - Remove redundant `reports` button from actions tray.
   - Wire JIT triggers for auth.
3. **CSS (`style.css`):** Ensure consistent institutional `.menu-card` typography, clean hover transitions, and no icon clutter.
4. **Verification:** Test across ports 3002 (IBC), 3003 (BNS), and 8080 (Multi-Host Gateway).
