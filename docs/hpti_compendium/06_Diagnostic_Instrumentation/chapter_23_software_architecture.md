# Chapter 23: Sovereign Local-First Software Architecture

> *“ātma-rakṣā sarvadā kāryā | gopayej jñānam ātmanaḥ ||”*  
> — **Chanakya Rajaniti**  
> *(Protection of the self must always be maintained; one must guard the sanctity of one's own inner knowledge.)*

---

## 1. Introduction: The Crisis of Psychometric Surveillance

In the modern digital economy, personality testing has become a multi-billion-dollar corporate surveillance tool. When an unsuspecting user takes a commercial personality test on a centralized web platform, their psychological vulnerabilities, emotional instabilities, cognitive biases, and moral stances are harvested, monetized, and sold:
- Advertisers weaponize psychological profiles to target predatory commercial campaigns.
- Predatory hiring platforms use black-box algorithms to screen out candidates without accountability.
- Insurance conglomerates harvest mental health risk profiles to deny coverage.

The **HPTI software architecture** is built on a non-negotiable ethical foundation: **Absolute Local-First Data Sovereignty**.

An individual's spiritual ontology (*Prakriti*), mental tendencies (*Gunas*), and psychological reflections belong exclusively to the individual. In this chapter, we document the software architecture of the HPTI engine, including its local-first client architecture, draggable 3-panel IDE docking system, and sovereign REST API.

---

## 2. The Local-First Architectural Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HPTI LOCAL-FIRST CLIENT ENGINE                       │
│                     (Browser / Device Boundary)                        │
├────────────────────────────────────────────────────────────────────────┤
│ • Local Storage & IndexedDB (Zero Cloud Persistence Required)          │
│ • Real-Time Client-Side Vector Computation                             │
│ • Sovereign JSON Export & Cryptographic Dossier Printing               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Zero-Knowledge REST API)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   HAYAGRIVA SOVEREIGN BACKEND                          │
│               (Node.js • Express • PostgreSQL / SQLite)                │
├────────────────────────────────────────────────────────────────────────┤
│ • Archetype & Scenario Repository (/api/personalities)                 │
│ • Shastric Corpus Vector Index & RAG Embeddings                        │
│ • Zero User Profiling / Zero Tracking Telemetry                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 3-Panel IDE Docking Engine (`js/ide-docking.js`)

To provide an elite, professional workspace reminiscent of modern developer IDEs (such as VS Code or Antigravity), the HPTI web portal implements the **Haya IDE Docking Engine**.

### 3.1 Architectural Layout
The workspace is split into three synchronized panes:
1. **Left Panel (`#panelLeft`)**: The *Epic Archetypes Catalog* with real-time text search, corpus filters (Ramayana vs. Mahabharata), and Guna/Varna dropdowns.
2. **Center Panel (`#panelCenter`)**: The *Diagnostic Testing Workspace* with interactive scenario cards, quick preset fill buttons, and live progress indicators.
3. **Right Panel (`#panelRight`)**: The *Archetypal Inspector & Dossier Studio* containing live vector dials, shloka citations, NCVET career mappings, and embedded RAG chat.

### 3.2 Draggable Splitters & Persistent State
Unlike brittle CSS grid templates, `ide-docking.js` utilizes dynamic mouse/touch drag listeners attached to divider handles (`#leftResizer` and `#rightResizer`):

```javascript
// Initialization Configuration
window.HayaIdeDocking.init({
  storagePrefix: 'haya_personalities_',
  containerId: 'ideContainer',
  leftPanelId: 'panelLeft',
  rightPanelId: 'panelRight',
  leftResizerId: 'leftResizer',
  rightResizerId: 'rightResizer',
  restoreLeftBtnId: 'btnRestoreLeft',
  minLeftWidth: 200,
  maxLeftWidth: 460,
  defaultLeftWidth: 280,
  minRightWidth: 320,
  maxRightWidth: 780,
  defaultRightWidth: 460
});
```

- **Collapsible Left Sidebar**: Clicking the **◀** button collapses `#panelLeft` to `0px` and unhides the floating restore button (`#btnRestoreLeft` — *Show Epic Archetypes (Cmd+B)*).
- **Maximizable Right Inspector**: Clicking the **⤢** button expands the dossier across the screen for in-depth reading, printing, or client debriefing.
- **State Persistence**: Panel widths and collapse states are cached in `localStorage`, preserving the user's custom layout across browser reloads.

---

## 4. The Sovereign REST API Architecture

The backend routes are mounted cleanly under `/api/personalities` in `server/routes/personalities.js`:

```
GET  /api/personalities/archetypes  --> Returns the curated list of Epic Archetypes
GET  /api/personalities/questions   --> Returns the calibrated situational judgment scenarios
POST /api/personalities/evaluate    --> Processes answers; calculates ECCP code & matched archetype
POST /api/personalities/chat        --> Embedded RAG endpoint for on-demand Vedic counseling
```

### 4.1 Evaluation Payload & Zero-Knowledge Processing
The evaluation request transmits only raw option codes, returning the calculated match without storing user identity:

```json
// Request to POST /api/personalities/evaluate
{
  "answers": {
    "q1": "R", "q2": "R", "q3": "R",
    "q4": "K", "q5": "D", "q6": "A",
    "q7": "K", "q8": "D", "q9": "D"
  }
}

// Response
{
  "success": true,
  "eccp_code": "RR-AM-K-D",
  "matched_archetype": {
    "id": "arjuna",
    "name": "Arjuna (The Master of Focused Action)",
    "epic": "Mahabharata",
    "eccp_code": "SR-BM-K-D",
    "sector": "Defense, Aerospace & High-Stakes Management",
    "aligned_ncvet_careers": [
      "Chief Technology Officer / R&D Systems Lead (NSQF Level 9)",
      "Strategic Operations Commander (NSQF Level 8)",
      "Advanced Aerospace Systems Engineer (NSQF Level 7)"
    ]
  }
}
```

In the next chapter, we investigate the artificial intelligence layer that brings the ancient texts to life: **Chapter 24: Embedded Vedic RAG Architecture & Shastric Grounding**.
