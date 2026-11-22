import fs from 'fs';
import path from 'path';
import http from 'http';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log("==================================================");
  console.log("AGENTIC SPACES SPLIT-VIEW RADAR VERIFICATION SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Verify Port 3000 Server Response
  console.log("\n[1] Verifying Port 3000 (Node Gateway)...");
  const nodeHome = await fetchUrl('http://localhost:3000/');
  assert(nodeHome.status === 200, "Port 3000 returns HTTP 200");
  assert(nodeHome.data.includes('class="brand-lockup"'), "Brand lockup class exists");
  assert(!nodeHome.data.includes('brand-title-btn'), "Brand lockup has NO dropdown button (#brand-title-btn)");
  assert(!nodeHome.data.includes('subdomain-dropdown'), "Brand lockup has NO subdomain dropdown");
  assert(nodeHome.data.includes('id="radar-view"'), "Radar view container (#radar-view) exists");
  assert(nodeHome.data.includes('id="sidebar"'), "Sidebar (#sidebar) exists");
  assert(nodeHome.data.includes('id="sidebar-toggle"'), "Sidebar toggle tab (#sidebar-toggle) exists");
  assert(nodeHome.data.includes('id="leaflet-map"'), "Leaflet map container (#leaflet-map) exists");
  assert(nodeHome.data.includes('id="inspector-drawer"'), "Inspector drawer (#inspector-drawer) exists");
  assert(nodeHome.data.includes('id="mode-cafes-btn"'), "Mode cafes button exists");
  assert(nodeHome.data.includes('id="mode-libs-btn"'), "Mode libraries button exists");

  // 2. Verify Port 8080 Server Response
  console.log("\n[2] Verifying Port 8080 (Go Engine)...");
  const goHome = await fetchUrl('http://localhost:8080/');
  assert(goHome.status === 200, "Port 8080 returns HTTP 200");
  assert(goHome.data.includes('Agentic Professionals'), "Brand title rendered");

  // 3. Verify API Endpoints
  console.log("\n[3] Verifying API Endpoints...");
  const spacesRes3000 = await fetchUrl('http://localhost:3000/api/radar/spaces');
  const spaces3000 = JSON.parse(spacesRes3000.data);
  assert(spaces3000.spaces && spaces3000.spaces.length === 16, "Port 3000 /api/radar/spaces returns 16 spaces");

  const cafesRes3000 = await fetchUrl('http://localhost:3000/api/radar/cafes');
  const cafes3000 = JSON.parse(cafesRes3000.data);
  assert(cafes3000.cafes && cafes3000.cafes.length === 8, "Port 3000 /api/radar/cafes returns 8 cafes");

  const libsRes3000 = await fetchUrl('http://localhost:3000/api/radar/libraries');
  const libs3000 = JSON.parse(libsRes3000.data);
  assert(libs3000.libraries && libs3000.libraries.length === 8, "Port 3000 /api/radar/libraries returns 8 libraries");

  const spacesRes8080 = await fetchUrl('http://localhost:8080/api/radar/spaces');
  const spaces8080 = JSON.parse(spacesRes8080.data);
  assert(spaces8080.spaces && spaces8080.spaces.length === 16, "Port 8080 /api/radar/spaces returns 16 spaces");

  // 4. Verify Data Quality
  console.log("\n[4] Verifying Data Field Integrity...");
  const sampleCafe = spaces3000.spaces.find(s => s.type === 'cafe');
  assert(sampleCafe && sampleCafe.wifiSpeed && sampleCafe.proximity && sampleCafe.latitude && sampleCafe.longitude, 
    "Cafe record has Wi-Fi speed, proximity, and coordinates");

  const sampleLib = spaces3000.spaces.find(s => s.type === 'library');
  assert(sampleLib && sampleLib.terminals && sampleLib.aiBooks, 
    "Library record has terminals and AI books data");

  // 5. Verify Megamenus and Cohort Links
  console.log("\n[5] Verifying Megamenus & Cohort Links...");
  assert(nodeHome.data.includes('https://ibc.agenticprofessionals.net'), "Commercial cohort links to live https://ibc.agenticprofessionals.net");
  assert(nodeHome.data.includes('https://bns.agenticprofessionals.net'), "Criminal cohort links to live https://bns.agenticprofessionals.net");
  assert(nodeHome.data.includes('nav-item::after') || nodeHome.data.includes('pointer-events: auto'), "Megamenu hover tunnel styles present");

  console.log("\n==================================================");
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runVerification().catch(err => {
  console.error("Verification suite encountered an error:", err);
  process.exit(1);
});
