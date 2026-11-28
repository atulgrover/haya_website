# Agentic Professionals — Subdomain Header & Agentic Architecture
**Date:** 2026-11-27  
**Status:** Approved Architectural Model (Option B: Master Brand Breadcrumb + Dynamic Practice Hub)  
**Target Subdomains:** `ibc.agenticprofessionals.net` (Port 3002), `bns.agenticprofessionals.net` (Port 3003)

---

## 1. Executive Summary & Design System

The master platform is **Agentic Professionals** (`agenticprofessionals.net`). To remind users at all times that they are operating within the Agentic Professionals universe while exploring specialized practice hubs:
- **Left Master Brand Breadcrumb:** Features the unicorn icon and `agentic professionals` brand link, followed by a subtle slash divider `/`, and the interactive domain practice hub button (`ibc . resoluters ⌄`, `ibc . investors ⌄`, etc.).
- **Center Navigation:** 
  1. **Dynamic Objective Radar:** Automatically adapts its title to the selected stakeholder persona (`acquisition radar`, `recovery radar`, `mandate radar`, `valuation radar`, `exposure radar`).
  2. **Process Agents ⌄:** Heavy data room ingestion & Hayagriva sovereign desktop client.
  3. **Forensic Agents ⌄:** PUFE transaction audit & Calnode verified practitioner consultation.
  4. **Advisory Agents:** Instant statutory opinions & LightRAG Knowledge Graph Forum.
- **Right Tray:** Clean shopping-cart icon (`🛒`) for dossiers & reports, and contextual `sign in` (or round avatar `(AD)` when authenticated).

---

## 2. The Header Architecture (Visual Blueprint)

### For Persona: `resoluters` (formerly `professionals`)
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄] agentic professionals / ibc . resoluters ⌄    mandate radar        process agents ⌄     forensic agents ⌄    advisory agents  🛒  sign in │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### For Persona: `investors`
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄] agentic professionals / ibc . investors ⌄     acquisition radar    process agents ⌄     forensic agents ⌄    advisory agents  🛒  sign in │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### For Persona: `creditors`
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄] agentic professionals / ibc . creditors ⌄     recovery radar       process agents ⌄     forensic agents ⌄    advisory agents  🛒  sign in │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 5-Stakeholder Dynamic Mapping Matrix

| Stakeholder in Dropdown | Subdomain Label in Header | Tab 1: Dynamic Radar | Tab 2: Process Agents | Tab 3: Forensic Agents | Tab 4: Advisory Agents |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`investors`** | **`ibc . investors ⌄`** | `acquisition radar` | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` |
| **`creditors`** | **`ibc . creditors ⌄`** | `recovery radar` | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` |
| **`resoluters`** *(Insolvency Professionals)* | **`ibc . resoluters ⌄`** | `mandate radar` | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` |
| **`valuers`** | **`ibc . valuers ⌄`** | `valuation radar` | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` |
| **`guarantors`** | **`ibc . guarantors ⌄`** | `exposure radar` | `process agents ⌄` | `forensic agents ⌄` | `advisory agents` |

---

## 4. Interaction & Canvas Behavior

### 4.1 Master Breadcrumb Navigation
- Clicking `[🦄] agentic professionals` navigates to the root portal (`https://agenticprofessionals.net`).
- Clicking `ibc . resoluters ⌄` opens the popover dropdown directly underneath to switch between `creditors`, `resoluters`, `valuers`, `investors`, and `guarantors`.

### 4.2 Dynamic Radar & Agent Tiers
- **Tab 1 (Dynamic Radar):** Opens the 16-bench spatial map canvas with persona-tailored filters and asset cards.
- **Tab 2 (Process Agents ⌄):** Megamenu with Hayagriva Sovereign Desktop App download.
- **Tab 3 (Forensic Agents ⌄):** Megamenu with PUFE audit tracks and Calnode practitioner booking.
- **Tab 4 (Advisory Agents):** Opens the 3-panel LightRAG statutory forum canvas.
- **Right Tray:** Cart icon (`🛒`) opens the reports catalog; `sign in` opens contextual JIT authentication.

---

## 5. Root Gateway Header Architecture (`agenticprofessionals.net` / Port 3000 & 8080)

### Visual Blueprint
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🦄] agentic professionals    spaces ⌄    groups ⌄    events ⌄    skills ⌄    resources ⌄    🛒    sign in │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### The 5 Pillars & Actions Tray
1. **`[🦄] agentic professionals`:** Sovereign master brand logo (`font-family: 'Inter'`, `18px`, `font-weight: 700`, `letter-spacing: -0.4px`, `#0f172a`).
2. **`spaces ⌄` (Megamenu):** Dual-column spatial directory housing **coworking cafes** (8 partner cafes with 300+ Mbps fiber), **coworking libraries** (8 silent AI research sanctuaries with 4K workstations), and the **desk reservation dock**.
3. **`groups ⌄` (Megamenu):** Insolvency (IBC), criminal forensics (BNS), and upcoming cohort intake sprints.
4. **`events ⌄` (Megamenu):** Coding hackathons, sovereign symposiums, mindful acoustic evenings, and event proposals.
5. **`skills ⌄` (Megamenu):** 2,176 NSQF approved roles, 13,000+ process SOPs, and MSME project blueprints.
6. **`resources ⌄` (Flyout):** Sovereign knowledge & software hub housing **forum** (Statutory LightRAG Answers) and **desktop app** (PageIndex Harness Docs with embedded macOS `.dmg` download CTA on the right rail).
7. **`🛒` (Right Tray):** Synchronized purchased dossiers & reports cart.
8. **`sign in` (Right Tray):** Direct one-click practitioner gateway; transitions to user avatar `(AP)` upon authentication.
