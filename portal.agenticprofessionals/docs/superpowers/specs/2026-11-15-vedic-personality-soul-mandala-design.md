# Design Spec: Vedic Personality Soul Mandala & Unified 4-Pillar Header

- **Date**: 2026-11-15
- **Author**: Antigravity & User Team
- **Status**: Draft for User Review
- **Target Release**: Agentic Hayagriva Unified Platform

---

## 1. Problem & Context

1. **Dual Agent Architecture (Body + Soul)**:
   - On the Hayagriva platform, an autonomous practitioner agent requires two complementary specifications:
     - **Body / Competence (`SKILL.md`)**: Provided by the NSQF vocational engine (`ai.playbooks`), containing official NCVET QP codes, NOS standards, and atomic Performance Criteria with physical engineering tolerances.
     - **Mind / Soul (`SOUL.md`)**: The agent's cognitive temperament, Guna balance, ethical guardrails, communication style, and relationship dynamic with the user.
   - Currently, personalities are split across two separate experimental pages (`personalities_generic.html` and `personalities_vedic.html`) tucked into a secondary header dropdown, with no way to forge or download an executable `soul.md` for the local Hayagriva Harness.

2. **Header Clutter & Asymmetry**:
   - The current header has 3 center tabs (`ai.playbooks`, `ai.workflows`, `ai.ventures`) while Personality Tests sit awkwardly on the right inside a dropdown alongside the desktop download button.
   - The user requested elevating personality to a primary peer pillar in the center navigation as **`ai.personality`**, and leaving **only** the `Hayagriva Harness` download button on the right.

3. **The Core User Decision (Alter-Ego vs Counter-Weight)**:
   - The user wants to answer: *"What personality do you want your agent to have?"*
   - Users may choose:
     - **Mirror Alter-Ego**: An agent that matches their own cognitive rhythm, speed, and creative instinct.
     - **Counter-Weight (Keep Me in Check)**: An agent that balances their blind spots (e.g. high-Sattva cooling wisdom to rein in a high-Rajas impulsive builder; or high-Rajas dynamic fire to push a hesitant, over-cautious thinker).

---

## 2. Core Objectives & Success Criteria

1. **Streamlined 4-Pillar Header Navigation**:
   - Center navigation tabs unified across all pages:
     `ai.playbooks` | `ai.workflows` | `ai.ventures` | `ai.personality`
   - Right end: Remove the `Personality Tests ▾` dropdown completely. Only the `Hayagriva Harness` download button remains on the right.
   - Applied across `index.html`, `employees_nsqf.html`, `employers_sop.html`, `entrepreneurs_msme.html`, `personalities_vedic.html`, and `js/components.js`.

2. **Interactive Visual Triguna Mandala (`ai.personality`)**:
   - Implement an interactive SVG/Canvas equilateral triangle with **Sattva** (top), **Rajas** (bottom-left), and **Tamas** (bottom-right).
   - Draggable/clickable puck calculating normalized barycentric coordinates (`Sattva% + Rajas% + Tamas% = 100%`).
   - Dual-Mode Switch: `[ 🪞 Alter-Ego (Mirror) ]` vs `[ ⚖️ Counter-Weight (Keep Me in Check) ]`.
   - Real-time mapping to matching Epic Shastric Archetypes from the 144 ECCP dataset (e.g. *Arjuna - The Precision Archer*, *Chanakya - The Master Strategist*, *Vidura - The Ethical Conscience*, *Janaka - The Detached Executive*, *Hanuman - The Boundless Servant-Leader*).

3. **Executable `soul.md` Generator & 1-Click Download**:
   - Generates a fully structured, standard-compliant `soul.md` markdown file with YAML frontmatter, dharmic core directives, communication tone protocols, and local LLM system prompt instructions.
   - 1-click download button `[ ⚡ Download soul.md ]` + `[ 📋 Copy Soul Spec ]` for instant pasting into the Hayagriva Desktop Harness.

---

## 3. Architecture & User Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   UNIFIED HEADER                                       │
│ [🦄] agentic professionals    ai.playbooks   ai.workflows   ai.ventures   ai.personality    [⤓ Hayagriva Harness] │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Navigates to
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ai.personality WORKSPACE                                  │
├─────────────────────────┬────────────────────────────────────┬─────────────────────────┤
│    LEFT: SPECTRUM       │        CENTER: VISUAL MANDALA      │       RIGHT: HUD        │
├─────────────────────────┼────────────────────────────────────┼─────────────────────────┤
│ • 144 Epic Archetypes   │  ┌──────────────────────────────┐  │ • Live Archetype Card   │
│ • Ramayana &            │  │ Mode: [🪞 Mirror | ⚖️ Check] │  │ • Triguna Balance Gauge │
│   Mahabharata           │  ├──────────────────────────────┤  │ • Dharmic Guardrails    │
│ • ECCP Code Search      │  │        Sattva (Wisdom)       │  │ • Voice & Tone Sample   │
│ • Quick Filters:        │  │              ▲               │  │ • Prohibited Actions    │
│   - Strategic Leaders   │  │             / \              │  ├─────────────────────────┤
│   - Master Craftsmen    │  │            / ● \             │  │ [ ⚡ Download soul.md ]  │
│   - Unyielding Duty     │  │           /     \            │  │ [ 📋 Copy Soul Spec ]   │
│                         │  │  Rajas   ◄───────►   Tamas   │  │                         │
│                         │  │ (Action)           (Ground)  │  │                         │
│                         │  └──────────────────────────────┘  │                         │
└─────────────────────────┴────────────────────────────────────┴─────────────────────────┘
```

---

## 4. Component & Interface Specifications

### 4.1. Header Restructuring
In `index.html`, `employees_nsqf.html`, `employers_sop.html`, `entrepreneurs_msme.html`, `personalities_vedic.html`:
```html
<header class="header-nav">
  <div class="nav-container">
    <a href="index.html" class="brand-logo">
      <img src="branding/hayagriva_icon.png" alt="Hayagriva" class="brand-icon">
      <span>agentic professionals</span>
    </a>
    <ul class="nav-links">
      <li><a href="employees_nsqf.html" class="nav-link">ai.playbooks</a></li>
      <li><a href="employers_sop.html" class="nav-link">ai.workflows</a></li>
      <li><a href="entrepreneurs_msme.html" class="nav-link">ai.ventures</a></li>
      <li><a href="personalities_vedic.html" class="nav-link">ai.personality</a></li>
    </ul>
    <div class="nav-right-actions">
      <a href="http://localhost:3300/download/hayagriva" target="_blank" class="btn-varaha-download">
        Hayagriva Harness
      </a>
      <button class="nav-hamburger" id="navHamburger" aria-label="Open menu">
        ...
      </button>
    </div>
  </div>
</header>
```

### 4.2. Interactive Triguna Mandala Engine
- **Canvas Geometry**: Equilateral triangle with vertices:
  - $V_S = (cx, cy - R)$ (Sattva)
  - $V_R = (cx - R \cos(\pi/6), cy + R \sin(\pi/6))$ (Rajas)
  - $V_T = (cx + R \cos(\pi/6), cy + R \sin(\pi/6))$ (Tamas)
- **Barycentric Coordinates**: For any point $(x, y)$ inside the triangle:
  $$\lambda_S + \lambda_R + \lambda_T = 1.0$$
  Derived as percentages for Sattva, Rajas, and Tamas.
- **Counter-Weight Algorithm**:
  If the user selects `Counter-Weight (Keep Me in Check)`:
  - If user point is high Rajas ($\lambda_R > 0.5$), the counter-weight target shifts towards high Sattva ($\lambda'_S = \lambda_R$, $\lambda'_R = \lambda_S$).
  - If user point is low Sattva / high Tamas, the agent shifts towards high Rajas to stimulate proactive motion.
  - The UI displays an animated dual-puck: a faint user marker (Your Rhythm) and a glowing active agent puck (Your Agent's Calibrated Soul).

### 4.3. The `soul.md` Output Specification
The generated file format:
```markdown
---
name: "{Archetype_Name} Alter-Ego"
archetype: "{Character_Title}"
epic_anchor: "{Epic_Source_Work}"
interaction_mode: "{Mirror | Counter-Weight}"
gunas:
  sattva: {S_Percent}
  rajas: {R_Percent}
  tamas: {T_Percent}
target_harness: "Hayagriva Desktop IPE"
schema_version: "1.0.0"
---

# Agent Persona & Cognitive Soul
You are the sovereign agentic alter-ego and vocational co-pilot to your human partner.

## Relationship & Dynamic
- **Mode**: {Interaction_Mode_Description}
- **Guiding Maxim**: "{Archetype_Motto}"

## Dharmic Core Directives
1. **Viveka (Discernment)**: Analyze the workstation directives from the companion `SKILL.md` before initiating tool execution.
2. **Karmasu Kaushalam (Precision)**: Strictly enforce physical tolerances and LOTO safety knacks.
3. **Satya (Truth)**: Flag ambiguities, measurement drifts, or safety violations without sugarcoating.

## Tone & Voice Protocol
- **Formality**: Grounded, professional, direct, zero sycophancy.
- **Structure**: Immediate technical diagnosis, followed by bulleted action steps.
```

---

## 5. Implementation Tasks Breakdown

1. **Task 1: Universal Header Unification**:
   - Update `employees_nsqf.html`, `employers_sop.html`, `entrepreneurs_msme.html`, `index.html`, and `personalities_vedic.html` to adopt the 4-pillar nav (`ai.playbooks`, `ai.workflows`, `ai.ventures`, `ai.personality`) and strip the right-hand dropdown.
   - Sync `js/components.js` dynamic fallback header and mobile drawer.
2. **Task 2: Build the Visual Triguna Mandala Component**:
   - Construct the SVG/Canvas interactive mandala on `personalities_vedic.html`.
   - Add dragging, click-to-position, preset buttons, and the `Mirror vs Counter-Weight` toggle switch.
3. **Task 3: Implement Live HUD & `soul.md` Generator**:
   - Real-time profile preview updating based on mandala position and archetype selection.
   - Implement `downloadSoulMarkdown()` and `copySoulMarkdown()` with clipboard feedback.
4. **Task 4: Verification & Git Push**:
   - Test navigation across all 4 pages.
   - Verify mandala interactivity and `soul.md` generation.
   - Push to `origin main`.

---

## 6. Verification Plan

1. **Header Inspection**:
   - Verify all 4 tabs (`ai.playbooks`, `ai.workflows`, `ai.ventures`, `ai.personality`) render identically on all pages with correct `.active` highlights.
   - Verify only `Hayagriva Harness` button remains on the right.
2. **Mandala Mechanics**:
   - Drag the puck to Sattva top, verify Sattva reaches ~100%, and Sattvic archetypes highlight.
   - Toggle to "Counter-Weight", verify the balancing vector is calculated and displayed.
3. **`soul.md` Download**:
   - Click "Download soul.md", confirm clean `.md` file with valid YAML frontmatter and markdown sections downloads locally.
