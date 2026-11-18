# Phased Plan: Rename Port 3001 to Skills and Wire 4-Dock Navigation in Port 3004

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

This implementation plan covers:
1. Renaming `portal.agenticprofessionals` to `skills.agenticprofessionals` on Port 3001, updating all federated configurations, tests, and deployment blueprints.
2. Restructuring Port 3004 (`aicafe.agenticprofessionals`) navigation: replacing generic `Wellness` and `Nutrition` tabs with **`Skills`** (connecting to Port 3001) and **`Franchise`** (interactive map of physical AI Cafe locations), while integrating **`Groups`** (connecting to IBC on Port 3002 and BNS on Port 3003) and **`Events`** (built-in cohort ticketing).

---

## Proposed File Changes

### Subsystem 1: Port 3001 Renaming (`portal` → `skills`)
- Directory move: `portal.agenticprofessionals/` → `skills.agenticprofessionals/`
- Root [`render.yaml`](file:///Users/atulgrover/Desktop/AgenticProfessionals/render.yaml): Update `rootDir` and service name.
- Root [`tests/federation_health.sh`](file:///Users/atulgrover/Desktop/AgenticProfessionals/tests/federation_health.sh): Update endpoint labels.
- Root [`tests/test_federation.js`](file:///Users/atulgrover/Desktop/AgenticProfessionals/tests/test_federation.js): Update labels and test definitions.
- [`skills.agenticprofessionals/package.json`](file:///Users/atulgrover/Desktop/AgenticProfessionals/portal.agenticprofessionals/package.json): Update package name to `skills-agenticprofessionals`.
- [`skills.agenticprofessionals/server/server.js`](file:///Users/atulgrover/Desktop/AgenticProfessionals/portal.agenticprofessionals/server/server.js): Update banner logs to reflect Sovereign Skills Academy.
- [`skills.agenticprofessionals/tests/unit/header_structure.test.js`](file:///Users/atulgrover/Desktop/AgenticProfessionals/portal.agenticprofessionals/tests/unit/header_structure.test.js): Ensure test paths reflect new directory name.

### Subsystem 2: Port 3004 Navigation Pivot (`aicafe.agenticprofessionals`)
- [`aicafe.agenticprofessionals/types.ts`](file:///Users/atulgrover/Desktop/AgenticProfessionals/aicafe.agenticprofessionals/types.ts): Update `Tab` enum to `DASHBOARD`, `SKILLS`, `FRANCHISE`, `GROUPS`, `EVENTS`.
- [`aicafe.agenticprofessionals/components/TribeIcons.tsx`](file:///Users/atulgrover/Desktop/AgenticProfessionals/aicafe.agenticprofessionals/components/TribeIcons.tsx): Add icons for `SkillsIcon` (GraduationCap/BookOpen) and `FranchiseIcon` (Store/MapPin).
- **New Component** [`aicafe.agenticprofessionals/views/SkillsView.tsx`](file:///Users/atulgrover/Desktop/AgenticProfessionals/aicafe.agenticprofessionals/views/SkillsView.tsx):
  - Displays the 3 sovereign tracks: **Employees (NSQF)**, **Employers (SOP)**, **Entrepreneurs (MSME)**.
  - Embeds deep-links and quick cards connecting directly to Port 3001 (`http://localhost:3001/employees`, `/employers`, `/entrepreneurs`, `/reports`).
- **New Component** [`aicafe.agenticprofessionals/views/FranchiseMapView.tsx`](file:///Users/atulgrover/Desktop/AgenticProfessionals/aicafe.agenticprofessionals/views/FranchiseMapView.tsx):
  - Leaflet-powered map displaying physical franchised AI Cafe hubs (Tricity Chandigarh, Delhi NCR, Bangalore, Mumbai).
  - Branch cards displaying amenities (high-speed WiFi, cohort workshop pods, specialty coffee, pod booking).
  - Quick action: "Own an AI Cafe Franchise" drawer/modal linking to [FranchiseView.tsx](file:///Users/atulgrover/Desktop/AgenticProfessionals/aicafe.agenticprofessionals/views/FranchiseView.tsx).
- [`aicafe.agenticprofessionals/views/GroupsView.tsx`](file:///Users/atulgrover/Desktop/AgenticProfessionals/aicafe.agenticprofessionals/views/GroupsView.tsx):
  - Wire featured cards connecting directly to the sovereign practice hubs:
    1. **IBC Practice Hub (Port 3002)**: Corporate insolvency, NCLT orders, CIRP tools.
    2. **BNS Criminal Law Hub (Port 3003)**: Bharatiya Nyaya Sanhita, police stations radar.
    3. Community discussions & local cohorts.
- [`aicafe.agenticprofessionals/App.tsx`](file:///Users/atulgrover/Desktop/AgenticProfessionals/aicafe.agenticprofessionals/App.tsx):
  - Update 4-dock bottom bar items: `SKILLS`, `FRANCHISE`, `GROUPS`, `EVENTS`.
  - Wire view routing switch cases to render `SkillsView` and `FranchiseMapView`.

---

## Phase 1: Rename Port 3001 to `skills.agenticprofessionals`

### Task 1: Rename directory and update package metadata
- [ ] Stop running daemon Task 1541 (Port 3001) using `manage_task: kill`.
- [ ] Rename `portal.agenticprofessionals/` to `skills.agenticprofessionals/`:
  ```bash
  mv portal.agenticprofessionals skills.agenticprofessionals
  ```
- [ ] In `skills.agenticprofessionals/package.json`, update `"name": "skills-agenticprofessionals"` and description.
- [ ] In `skills.agenticprofessionals/server/server.js`, update startup banner:
  ```js
  console.log('🎓 Sovereign Skills Academy running at http://localhost:' + PORT);
  ```

### Task 2: Update root federation references and blueprints
- [ ] In `render.yaml`, update Service 1:
  - `name: skills-agenticprofessionals`
  - `rootDir: skills.agenticprofessionals`
- [ ] In `tests/federation_health.sh`, update section header:
  `1. Sovereign Skills Academy (Port 3001)`
- [ ] In `tests/test_federation.js`, update endpoint names from `Portal (3001)` to `Skills (3001)`.
- [ ] Update root `.gitignore` to maintain clean tracking.

### Task 3: Restart Port 3001 daemon and verify unit tests
- [ ] Start daemon process from `skills.agenticprofessionals`:
  ```bash
  cd skills.agenticprofessionals && node server/server.js
  ```
- [ ] Run unit test suite:
  ```bash
  cd skills.agenticprofessionals && npm run test:unit
  ```
  **Verification**: 34 unit tests pass with 0 errors.

---

## Phase 2: Restructure Port 3004 Navigation (Skills, Franchise, Groups, Events)

### Task 4: Update Types and Tab Enum
- [ ] In `aicafe.agenticprofessionals/types.ts`:
  Update `Tab` enum:
  ```typescript
  export enum Tab {
    DASHBOARD = 'Dashboard',
    SKILLS = 'Skills',
    FRANCHISE = 'Franchise',
    GROUPS = 'Groups',
    EVENTS = 'Events',
  }
  ```
- [ ] In `aicafe.agenticprofessionals/components/TribeIcons.tsx`:
  - Add `SkillsIcon` (Graduation cap / Book open).
  - Add `FranchiseIcon` (Storefront / Location pin).

### Task 5: Build `SkillsView.tsx` (Port 3001 Bridge)
- [ ] Create `aicafe.agenticprofessionals/views/SkillsView.tsx`:
  - Header: "Sovereign Skills & Qualifications".
  - Track cards:
    - **employees**: NSQF Qualification Packs, Job Roles, Video Guides (`http://localhost:3001/employees`).
    - **employers**: Standard Operating Procedures, Statutory Compliance (`http://localhost:3001/employers`).
    - **entrepreneurs**: MSME Business Intelligence Reports (`http://localhost:3001/entrepreneurs`).
    - **reports**: Vedic Personality Assessments (`http://localhost:3001/reports`).
  - Search bar to query skills & qualifications with instant deep-linking.

### Task 6: Build `FranchiseMapView.tsx` (Physical AI Cafe Network)
- [ ] Create `aicafe.agenticprofessionals/views/FranchiseMapView.tsx`:
  - Header: "AI Cafe Franchise Network".
  - Leaflet map centering on active & upcoming physical cafes (Chandigarh, Delhi NCR, Bangalore).
  - Cafe cards with address, amenities (High-Speed Fiber, Autonomous Agent Pods, Specialty Coffee, Meeting Rooms).
  - Prominent CTA button: "Apply for an AI Cafe Franchise →" triggering `FranchiseView`.

### Task 7: Update `GroupsView.tsx` (Port 3002 & 3003 Bridge)
- [ ] Update `aicafe.agenticprofessionals/views/GroupsView.tsx`:
  - Add featured banner cards at the top for sovereign practice groups:
    - **IBC Corporate Restructuring Tribe**: Direct link to Port 3002 (`http://localhost:3002`).
    - **BNS Criminal Justice Tribe**: Direct link to Port 3003 (`http://localhost:3003`).
  - Retain local cohort community discussion circles below.

### Task 8: Update `App.tsx` Navigation Bar & Routing
- [ ] In `aicafe.agenticprofessionals/App.tsx`:
  - Update `renderActiveView()` switch to render:
    - `case Tab.SKILLS: return <SkillsView onNavigate={...} />;`
    - `case Tab.FRANCHISE: return <FranchiseMapView onOpenFranchiseForm={() => setCurrentView('FRANCHISE')} />;`
    - `case Tab.GROUPS: return <GroupsView ... />;`
    - `case Tab.EVENTS: return <EventsView ... />;`
  - Update 4-dock bottom bar buttons to render:
    - 🎓 **SKILLS**
    - 📍 **FRANCHISE**
    - 👥 **GROUPS**
    - 📅 **EVENTS**
  - Update Dashboard quick-action shortcuts to match the 4 new docks.

---

## Phase 3: Verification & Integration Testing

### Task 9: Build and Runtime Verification of Port 3004
- [ ] Run build test:
  ```bash
  cd aicafe.agenticprofessionals && npm run build
  ```
  **Verification**: Zero TypeScript or Vite bundling errors.
- [ ] Restart Port 3004 background daemon.
- [ ] Verify hot-reload on [http://localhost:3004](http://localhost:3004).

### Task 10: Quad-Hub Federation Health Check
- [ ] Verify all 4 endpoints respond 200 OK:
  - Port 3001 (`skills.agenticprofessionals`): [http://localhost:3001/](http://localhost:3001/)
  - Port 3002 (`ibc.agenticprofessionals`): [http://localhost:3002/](http://localhost:3002/)
  - Port 3003 (`bns.agenticprofessionals`): [http://localhost:3003/](http://localhost:3003/)
  - Port 3004 (`aicafe.agenticprofessionals`): [http://localhost:3004/](http://localhost:3004/)
- [ ] Run `node tests/test_federation.js` (or updated federation test script).

### Task 11: Git Commit & Documentation
- [ ] Stage and commit changes to `main`.
- [ ] Update documentation and handoff state.
