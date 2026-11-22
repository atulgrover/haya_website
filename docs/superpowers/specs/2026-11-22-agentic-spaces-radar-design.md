# Agentic Spaces Radar Architecture & Port Specification

**Document Date:** 2026-11-22  
**Target Hosts:** Port 3000 (`Agentic Professionals` Portal), Port 8080 (Go Engine), Render Production (`agenticprofessionals.net`)  
**Source Baseline:** Port 3002 (`IBC Sovereign Restructuring & Distressed Assets Radar` at `ibc.agenticprofessionals.net`)  
**Database:** Supabase PostgreSQL (`rybbbqdwmjzgsdxyrjgt`)

---

## 1. Intent & Purpose

Transform the root portal `Agentic Professionals` (`http://localhost:3000` / `https://agenticprofessionals.net`) into a sovereign split-view radar experience by porting the proven, high-performance radar architecture from Port 3002 (`openibc-s`):

1. **Header Brand Lockup:**
   - On Port 3002, the brand title had a dropdown menu (`#brand-trigger` / `#subdomain-dropdown`).
   - On Port 3000, the brand lockup is a clean institutional header with the Unicorn SVG logo and "Agentic Professionals" text — **without any dropdown**.
2. **Top Megamenus:**
   - Retain the approved top megamenu hierarchy:
     - `agentic skills` → NSQF skills & Skillpedia
     - `agentic cohorts` → Direct live links to `https://ibc.agenticprofessionals.net` (Commercial), `https://bns.agenticprofessionals.net` (Criminal), and CPC (Civil)
     - `agentic spaces` → Active radar tab indicator
     - `agentic events` → Professional events & Social celebrations
     - Right Tray: `answers`, `hayagriva`, and `sign in`
   - Menus have safe hover tunnels (`padding-top: 10px`) and persistent click support so menus never prematurely close.
3. **Split-View Radar (Viewport Height `calc(100vh - 60px)`):**
   - Directly copied from 3002's layout and styles:
     - **Left Sidebar:** Toggle pills between **☕ Work-From-Cafes** and **📚 AI Libraries**, search input with instant clear, city filtering, and live count indicator.
     - **Sidebar Collapse Tab `[ < ]`:** Collapses and restores the left sidebar with keyboard shortcuts (`[` and `\`).
     - **Right Map Canvas:** Full Leaflet interactive map with custom coffee and book pin markers, radius pulses, popups, and zoom controls.
     - **Inspector Drawer:** Slide-out panel from the right displaying full workspace details (Wi-Fi bandwidth, power outlets, quiet zones, coffee/donut roasts or AI book collections & GPU terminals, Google Maps directions, and reservation CTAs).
     - **Mobile View Pill:** Bottom floating switcher toggling between map and card list.
4. **Supabase PostgreSQL Data Layer:**
   - Table `agentic_spaces` with typed schema, check constraints, and performance indexes.
   - Dual-layer backend (Go + Node) querying PostgreSQL with instant fallback to static seeds if offline.

---

## 2. Database Schema (`agentic_spaces`)

In Supabase PostgreSQL (project `rybbbqdwmjzgsdxyrjgt`):

```sql
CREATE TABLE IF NOT EXISTS agentic_spaces (
    id VARCHAR(50) PRIMARY KEY,
    space_code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cafe', 'library')),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    location TEXT NOT NULL,
    proximity VARCHAR(255),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    wifi_speed VARCHAR(50) DEFAULT '300+ Mbps',
    power_sockets VARCHAR(100) DEFAULT 'At every workstation',
    noise_level VARCHAR(50) DEFAULT 'Quiet ambient focus',
    specialty TEXT,
    terminals VARCHAR(100),
    ai_books TEXT,
    opening_hours VARCHAR(100) DEFAULT '08:00 AM – 10:00 PM',
    directions_url TEXT,
    booking_url TEXT,
    is_published BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_agentic_spaces_type_city 
ON agentic_spaces (type, city) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_agentic_spaces_published 
ON agentic_spaces (is_published);
```

### Curated Seed Spaces (8 Cafes & 8 AI Libraries):
- **Cafes:**
  1. Blue Tokai Coffee Roasters — Saket District Court, Delhi NCR (350 Mbps, quiet study alcove)
  2. Starbucks Reserve — BKC / NCLT Benches 1–5, Mumbai (400 Mbps, meeting chambers)
  3. Third Wave Coffee — Vidhana Soudha & High Court, Bengaluru (300 Mbps, single-origin roasts)
  4. Roastery Coffee House — Banjara Hills / High Court, Hyderabad (300 Mbps, tranquil courtyard)
  5. Blue Tokai — Park Street / Calcutta High Court, Kolkata (300 Mbps, quiet reading lounge)
  6. Sector 7 Social & Work Cafe — Sector 17 & High Court, Chandigarh (350 Mbps, dedicated workstations)
  7. One Degree Cafe & Roastery — Kalyani Nagar / District Court, Pune (300 Mbps, artisan pour-overs)
  8. Mocha Bodakdev — SG Highway / Gujarat High Court, Ahmedabad (350 Mbps, quiet work zone)

- **AI Libraries:**
  1. National Cyber & Legal AI Terminals — Saket Court Institutional Area, Delhi NCR (Dual 4K displays, agentic LLM corpus)
  2. Mumbai Legal Tech & AI Reading Room — Fort Heritage Precinct, Mumbai (8 GPU dev terminals, BNS/IBC vector datasets)
  3. NLSIU AI & Computational Law Commons — Nagarbhavi, Bengaluru (12 dev workstations, Agentic NSQF reference library)
  4. NALSAR Sovereign Agent Lab & Library — Justice City, Hyderabad (Agent evaluation sandbox, statutory texts)
  5. NUJS AI Statutory Informatics Center — Salt Lake, Kolkata (High-throughput workstations, legal ontology archives)
  6. Punjab & Haryana Bar Digital AI Library — Capitol Complex, Chandigarh (Cyber law workstations, local inference harnesses)
  7. ILS Law AI & Empirical Research Desk — Law College Road, Pune (Dedicated terminal bank, open models corpus)
  8. GNLU Autonomous Agentics Archive — Gandhinagar / Ahmedabad (Research workstations, cross-border restructurings)

---

## 3. Backend API Contracts

Endpoints provided by both Go (`internal/home/router.go`) and Node (`Home/server.js`):

### 1. `GET /api/radar/spaces`
Query params: `?type=cafe` or `?type=library` (or omit for both).  
Response:
```json
{
  "spaces": [
    {
      "id": "cafe-bt-saket",
      "spaceCode": "SPACE-CF-001",
      "type": "cafe",
      "name": "Blue Tokai Coffee Roasters",
      "city": "Delhi NCR",
      "location": "Saidulajab, Saket, New Delhi",
      "proximity": "350 meters from Saket District Court",
      "latitude": 28.5204,
      "longitude": 77.2015,
      "wifiSpeed": "350 Mbps",
      "powerSockets": "At every booth",
      "noiseLevel": "Quiet ambient focus",
      "specialty": "Cold Brew & Sourdough Croissants",
      "openingHours": "07:30 AM – 10:30 PM",
      "directionsUrl": "https://maps.google.com/?q=28.5204,77.2015",
      "bookingUrl": "#book"
    }
  ]
}
```

### 2. `GET /api/radar/cafes`
Convenience alias returning `{ "cafes": [...] }`.

### 3. `GET /api/radar/libraries`
Convenience alias returning `{ "libraries": [...] }`.

---

## 4. Frontend Architecture (Port from 3002)

1. **Header (`.site-header`):**
   - Left: `<a href="/" class="brand-link"><svg class="unicorn-icon">...</svg><span class="brand-title">Agentic Professionals</span></a>` (NO dropdown).
   - Center: Nav list with `.nav-item` megamenus:
     - `#nav-skills`
     - `#nav-cohorts` (linking to `https://ibc.agenticprofessionals.net` and `https://bns.agenticprofessionals.net`)
     - `#nav-spaces` (active pill `.pill-active`)
     - `#nav-events`
   - Right: Actions tray with `answers`, `hayagriva`, and `sign in`.
2. **Main Canvas (`#main-canvas`):**
   - Full height `calc(100vh - 60px)`, `position: relative`, `overflow: hidden`.
   - Contains `#radar-view.mobile-mode-list`.
3. **Sidebar (`#sidebar`):**
   - Mode Switcher: `.mode-switcher` with `#mode-cafes-btn` and `#mode-libs-btn`.
   - Search Box: `#search-box-container` with `#search-input` and `#search-clear-btn`.
   - Filter Row: `#filter-row` with `#sidebar-city-select` and `#reset-filters-btn`.
   - Stats Bar: Live count badge and active city scope.
   - Card List: `#card-list` rendering space cards with 3002's layout:
     - Type tag (`☕ CAFE` or `📚 AI LIBRARY`), city badge, bookmark pin.
     - Bold space title.
     - Proximity subtitle (e.g. `📍 350m from Saket District Court`).
     - Facilities badges (Wi-Fi speed, noise level, power sockets).
4. **Sidebar Toggle Tab (`#sidebar-toggle`):**
   - Button with SVG arrow that slides sidebar out and in with CSS transforms.
5. **Map Canvas (`.map-canvas`):**
   - Container `#leaflet-map` initialized with CartoDB Voyager or Positron tiles.
   - Markers generated with `L.divIcon` displaying styled pins with pulsating rings.
   - Mobile Pin Preview (`#mobile-pin-preview`).
6. **Inspector Drawer (`#inspector-drawer`):**
   - Slide-out right panel (desktop) or bottom-sheet (mobile).
   - Detailed dossier with space specifications, Google Maps navigation button, and seat reservation trigger.
7. **Mobile View Switcher Pill (`#mobile-view-pill-container`):**
   - Sticky bottom pill to toggle between card list and map canvas on mobile viewports.

---

## 5. Verification & Quality Gates
- PostgreSQL migration and seed scripts tested and executed directly on Supabase.
- Go backend routes tested and compiled.
- Node backend routes tested with HTTP GET calls.
- Browser subagent verifies visual layout, inspector drawer interactions, pin clicks, sidebar collapse, and megamenu hover stability.
