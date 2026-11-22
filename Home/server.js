#!/usr/bin/env node
/**
 * Agentic Professionals Root Gateway (Home)
 * Sovereign Dual-Tract Launchpad on Port 3000
 * Runtime: Pure Node.js (Zero external dependencies)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// Curated 16 Agentic Spaces (8 Cafes & 8 Libraries)
const SPACES = [
  // ─── 8 WORK-FROM-CAFES ───
  {
    id: "cafe-bt-saket",
    spaceCode: "SPACE-CF-001",
    type: "cafe",
    name: "Blue Tokai Coffee Roasters — Saket",
    city: "Delhi NCR",
    state: "Delhi",
    location: "Saidulajab, Saket, New Delhi 110030",
    proximity: "350 meters from Saket District Court",
    latitude: 28.520400,
    longitude: 77.201500,
    wifiSpeed: "350 Mbps",
    powerSockets: "Every table & private booth",
    noiseLevel: "Quiet ambient focus",
    specialty: "Cold Brew, Pour-overs, Sourdough Croissants & Artisan Donuts",
    openingHours: "07:30 AM – 10:30 PM",
    directionsUrl: "https://maps.google.com/?q=28.5204,77.2015",
    bookingUrl: "#reserve-cafe"
  },
  {
    id: "cafe-sb-bkc",
    spaceCode: "SPACE-CF-002",
    type: "cafe",
    name: "Starbucks Reserve — BKC",
    city: "Mumbai",
    state: "Maharashtra",
    location: "G Block BKC, Bandra Kurla Complex, Mumbai 400051",
    proximity: "400 meters from NCLT Mumbai Benches 1–5",
    latitude: 19.066000,
    longitude: 72.868500,
    wifiSpeed: "400 Mbps",
    powerSockets: "Dual universal sockets at every lounge seat",
    noiseLevel: "Executive corporate hum",
    specialty: "Micro-lot Reserve Espresso, Nitro Cold Brew & Fresh Bagels",
    openingHours: "07:00 AM – 11:00 PM",
    directionsUrl: "https://maps.google.com/?q=19.0660,72.8685",
    bookingUrl: "#reserve-cafe"
  },
  {
    id: "cafe-tw-vidhana",
    spaceCode: "SPACE-CF-003",
    type: "cafe",
    name: "Third Wave Coffee Roasters — Cunningham",
    city: "Bengaluru",
    state: "Karnataka",
    location: "Cunningham Road, Vasanth Nagar, Bengaluru 560052",
    proximity: "Direct Metro access to Karnataka High Court (Vidhana Soudha)",
    latitude: 12.986600,
    longitude: 77.597500,
    wifiSpeed: "300 Mbps",
    powerSockets: "Under-desk power strip with USB-C PD",
    noiseLevel: "Quiet focus zone",
    specialty: "Single-origin pour-overs, Cinnamon Cruffins & Chocochip Pancakes",
    openingHours: "08:00 AM – 11:30 PM",
    directionsUrl: "https://maps.google.com/?q=12.9866,77.5975",
    bookingUrl: "#reserve-cafe"
  },
  {
    id: "cafe-roastery-hyd",
    spaceCode: "SPACE-CF-004",
    type: "cafe",
    name: "Roastery Coffee House — Banjara Hills",
    city: "Hyderabad",
    state: "Telangana",
    location: "Road No. 14, Banjara Hills, Hyderabad 500034",
    proximity: "15 min drive from Telangana High Court & NCLT Hyderabad",
    latitude: 17.415600,
    longitude: 78.434700,
    wifiSpeed: "300 Mbps",
    powerSockets: "Garden patio & interior study booths with dedicated outlets",
    noiseLevel: "Serene courtyard library atmosphere",
    specialty: "Monsooned Malabar, Cascara Artisanal Brews & Baked Cheesecakes",
    openingHours: "08:00 AM – 11:00 PM",
    directionsUrl: "https://maps.google.com/?q=17.4156,78.4347",
    bookingUrl: "#reserve-cafe"
  },
  {
    id: "cafe-bt-parkst",
    spaceCode: "SPACE-CF-005",
    type: "cafe",
    name: "Blue Tokai Coffee Roasters — Park Street",
    city: "Kolkata",
    state: "West Bengal",
    location: "Park Street Heritage Zone, Kolkata 700016",
    proximity: "1.2 km from Calcutta High Court & City Civil Court",
    latitude: 22.551000,
    longitude: 88.352400,
    wifiSpeed: "300 Mbps",
    powerSockets: "Work counters equipped with universal plug points",
    noiseLevel: "Tranquil reading lounge",
    specialty: "French Press, Sea Salt Hot Chocolate & Artisanal Brioche Donuts",
    openingHours: "08:00 AM – 10:30 PM",
    directionsUrl: "https://maps.google.com/?q=22.5510,88.3524",
    bookingUrl: "#reserve-cafe"
  },
  {
    id: "cafe-sec7-chd",
    spaceCode: "SPACE-CF-006",
    type: "cafe",
    name: "Sector 7 Social & Work Cafe",
    city: "Chandigarh",
    state: "Punjab & Haryana",
    location: "Madhya Marg, Sector 7-C, Chandigarh 160019",
    proximity: "2.5 km from Punjab & Haryana High Court (Sector 1)",
    latitude: 30.730200,
    longitude: 76.804100,
    wifiSpeed: "350 Mbps",
    powerSockets: "Executive work tables with high-power AC outlets",
    noiseLevel: "Daytime quiet co-working mode",
    specialty: "Espresso Tonic, Avocado Brioche & Fresh Doughnuts",
    openingHours: "09:00 AM – 11:00 PM",
    directionsUrl: "https://maps.google.com/?q=30.7302,76.8041",
    bookingUrl: "#reserve-cafe"
  },
  {
    id: "cafe-onedegree-pune",
    spaceCode: "SPACE-CF-007",
    type: "cafe",
    name: "One Degree Coffee Roasters — Kalyani Nagar",
    city: "Pune",
    state: "Maharashtra",
    location: "East Avenue, Kalyani Nagar, Pune 411006",
    proximity: "10 min drive from Shivaji Nagar District & Sessions Court",
    latitude: 18.548200,
    longitude: 73.902200,
    wifiSpeed: "300 Mbps",
    powerSockets: "Every desk and communal table",
    noiseLevel: "Quiet focus alcove",
    specialty: "Aeropress Special Reserve, Blueberry Glazed Donuts & Quiches",
    openingHours: "08:00 AM – 10:00 PM",
    directionsUrl: "https://maps.google.com/?q=18.5482,73.9022",
    bookingUrl: "#reserve-cafe"
  },
  {
    id: "cafe-mocha-ahmedabad",
    spaceCode: "SPACE-CF-008",
    type: "cafe",
    name: "Mocha Work Cafe — Bodakdev",
    city: "Ahmedabad",
    state: "Gujarat",
    location: "Sindhu Bhavan Marg, Bodakdev, Ahmedabad 380054",
    proximity: "Direct corridor to Gujarat High Court (Sola)",
    latitude: 23.039600,
    longitude: 72.508500,
    wifiSpeed: "350 Mbps",
    powerSockets: "Dedicated laptop power bank at all booths",
    noiseLevel: "Spacious quiet zone",
    specialty: "Affogato, Chocolate Mud Cake, Cinnamon Buns & Filter Roasts",
    openingHours: "09:00 AM – 11:30 PM",
    directionsUrl: "https://maps.google.com/?q=23.0396,72.5085",
    bookingUrl: "#reserve-cafe"
  },

  // ─── 8 AI LIBRARIES WITH COMPUTERS & AI BOOKS ───
  {
    id: "lib-delhi-ai",
    spaceCode: "SPACE-LB-001",
    type: "library",
    name: "National Cyber & Legal AI Terminals — Saket",
    city: "Delhi NCR",
    state: "Delhi",
    location: "Institutional Area, Saket District Court Precinct, New Delhi 110017",
    proximity: "Adjacent to Saket Lawyers Chambers & Bar Library",
    latitude: 28.524500,
    longitude: 77.206200,
    wifiSpeed: "1 Gbps Dedicated Fiber",
    powerSockets: "Dual surge-protected power rails & UPS backup",
    noiseLevel: "Silent research sanctuary (<30 dB)",
    specialty: "Full Corpus of Agentic LLMs, Constitutional AI & Statutory NLP",
    terminals: "10 High-Performance Workstations with Dual 4K Displays & Dev Containers",
    aiBooks: "Reinforcement Learning (Sutton & Barto), Modern Agent Architectures, Constitutional AI Standards, BNS 2023 Digital Commentary",
    openingHours: "08:00 AM – 09:00 PM",
    directionsUrl: "https://maps.google.com/?q=28.5245,77.2062",
    bookingUrl: "#reserve-library"
  },
  {
    id: "lib-mumbai-fort",
    spaceCode: "SPACE-LB-002",
    type: "library",
    name: "Mumbai Legal Tech & AI Reading Room — Fort",
    city: "Mumbai",
    state: "Maharashtra",
    location: "High Court Annexe, Fort Heritage Precinct, Mumbai 400032",
    proximity: "Walking distance to Bombay High Court & City Civil Court",
    latitude: 18.930400,
    longitude: 72.831700,
    wifiSpeed: "1 Gbps Fiber",
    powerSockets: "Desktop terminals with USB-C PD & Ethernet drops",
    noiseLevel: "Strict silent study zone",
    specialty: "BNS, IBC & CPC Vector Embeddings & Offline Precedent Retrieval",
    terminals: "8 GPU-enabled Workstations (RTX 4090) for local LLM inference experiments",
    aiBooks: "Deep Learning (Goodfellow), Pattern Recognition & Machine Learning, Agentic Workflows for Legal Discovery, Supreme Court AI Benchmarks",
    openingHours: "08:30 AM – 08:30 PM",
    directionsUrl: "https://maps.google.com/?q=18.9304,72.8317",
    bookingUrl: "#reserve-library"
  },
  {
    id: "lib-nlsiu-blr",
    spaceCode: "SPACE-LB-003",
    type: "library",
    name: "NLSIU AI & Computational Law Commons",
    city: "Bengaluru",
    state: "Karnataka",
    location: "Nagarbhavi Academic Campus, Bengaluru 560072",
    proximity: "National Law School of India University Central Library",
    latitude: 12.955800,
    longitude: 77.512600,
    wifiSpeed: "1 Gbps NKN Campus Network",
    powerSockets: "Integrated carrel power modules with surge suppressors",
    noiseLevel: "Deep academic silence",
    specialty: "Skillpedia NSQF Level 7.0 & Level 8.0 Agentic Curriculum Reserve",
    terminals: "12 Dual-Monitor Linux Workstations pre-loaded with Python SDK & LightRAG",
    aiBooks: "Artificial Intelligence: A Modern Approach (Russell & Norvig), Multi-Agent Systems (Wooldridge), Generative AI for Sovereign Governance",
    openingHours: "08:00 AM – Midnight",
    directionsUrl: "https://maps.google.com/?q=12.9558,77.5126",
    bookingUrl: "#reserve-library"
  },
  {
    id: "lib-nalsar-hyd",
    spaceCode: "SPACE-LB-004",
    type: "library",
    name: "NALSAR Sovereign Agent Lab & Law Library",
    city: "Hyderabad",
    state: "Telangana",
    location: "Justice City, Shameerpet, Hyderabad 500101",
    proximity: "NALSAR Law University Digital Informatics Center",
    latitude: 17.595600,
    longitude: 78.572400,
    wifiSpeed: "1 Gbps High-Speed Academic Link",
    powerSockets: "Every study desk with universal dual outlets",
    noiseLevel: "Quiet focus repository",
    specialty: "Judicial Precedents Graph, Section 29A IBC Automations & BNS Cyber Datasets",
    terminals: "10 High-spec Terminals with JupyterLab, HuggingFace Local Models & LangChain",
    aiBooks: "Foundations of Large Language Models, Prompt Engineering & Autonomous Agents, Insolvency Law & Restructuring Precedents (2016–2026)",
    openingHours: "09:00 AM – 10:00 PM",
    directionsUrl: "https://maps.google.com/?q=17.5956,78.5724",
    bookingUrl: "#reserve-library"
  },
  {
    id: "lib-nujs-kolkata",
    spaceCode: "SPACE-LB-005",
    type: "library",
    name: "WBNUJS AI Statutory Informatics Center",
    city: "Kolkata",
    state: "West Bengal",
    location: "12 LB Block, Sector III, Salt Lake City, Kolkata 700098",
    proximity: "National University of Juridical Sciences (Salt Lake)",
    latitude: 22.570100,
    longitude: 88.406700,
    wifiSpeed: "1 Gbps Optical Fiber",
    powerSockets: "Built-in desk power strips & wireless phone charging pads",
    noiseLevel: "Silent research hall",
    specialty: "Commercial Drafting AI Corpora, Cross-Border Insolvency & Forensics",
    terminals: "8 Development Terminals with Git, Docker & Sovereign Knowledge Graphs",
    aiBooks: "Designing Data-Intensive Applications, Machine Learning Engineering, Admiralty & Company Law Precedents Compendium",
    openingHours: "08:30 AM – 09:30 PM",
    directionsUrl: "https://maps.google.com/?q=22.5701,88.4067",
    bookingUrl: "#reserve-library"
  },
  {
    id: "lib-chd-bar",
    spaceCode: "SPACE-LB-006",
    type: "library",
    name: "Punjab & Haryana High Court Bar AI Library",
    city: "Chandigarh",
    state: "Punjab & Haryana",
    location: "Capitol Complex, Sector 1, Chandigarh 160001",
    proximity: "High Court Bar Association Heritage Building",
    latitude: 30.758900,
    longitude: 76.804900,
    wifiSpeed: "500 Mbps Dedicated Legal Network",
    powerSockets: "Individual carrels with 3-pin universal sockets",
    noiseLevel: "Chambers silent study environment",
    specialty: "Criminal Jurisprudence (BNS 2023) & Criminal Procedure (BNSS 2023) AI Corpus",
    terminals: "6 Dedicated Legal Research Workstations with All India Reporter & SCC Online AI",
    aiBooks: "Speech and Language Processing (Jurafsky), Probabilistic Graphical Models, Penal Code to BNS Comparative Concordance",
    openingHours: "09:00 AM – 07:00 PM",
    directionsUrl: "https://maps.google.com/?q=30.7589,76.8049",
    bookingUrl: "#reserve-library"
  },
  {
    id: "lib-ils-pune",
    spaceCode: "SPACE-LB-007",
    type: "library",
    name: "ILS Law College AI & Empirical Research Desk",
    city: "Pune",
    state: "Maharashtra",
    location: "Law College Road, Shivajinagar, Pune 411004",
    proximity: "ILS Law College Campus Library",
    latitude: 18.517300,
    longitude: 73.829300,
    wifiSpeed: "500 Mbps Campus Fiber",
    powerSockets: "Power at all reading desks with surge protection",
    noiseLevel: "Scholarly quiet zone",
    specialty: "Legal Knowledge Engineering & Statutory Ontologies",
    terminals: "8 Dual-Screen Workstations with VS Code, Ollama & Python LLM harnesses",
    aiBooks: "Hands-On Machine Learning with Scikit-Learn, Keras and TensorFlow, Deep Learning for NLP, Corporate Debt Restructuring Cases",
    openingHours: "08:00 AM – 08:00 PM",
    directionsUrl: "https://maps.google.com/?q=18.5173,73.8293",
    bookingUrl: "#reserve-library"
  },
  {
    id: "lib-gnlu-ahmedabad",
    spaceCode: "SPACE-LB-008",
    type: "library",
    name: "GNLU Autonomous Agentics & Legal AI Archive",
    city: "Ahmedabad",
    state: "Gujarat",
    location: "Attalika Avenue, Knowledge Corridor, Koba, Gandhinagar 382426",
    proximity: "Gujarat National Law University Research Block",
    latitude: 23.161000,
    longitude: 72.636900,
    wifiSpeed: "1 Gbps Optical Backbone",
    powerSockets: "Power carrels with modular surge-protected blocks",
    noiseLevel: "Ultra-silent study sanctum",
    specialty: "Cross-Border Trade Law, AI Governance & Maritime Dispute Resolution",
    terminals: "10 Workstations configured for multi-agent legal simulations & mock arbitrations",
    aiBooks: "Reinforcement Learning from Human Feedback, Building Systems with the ChatGPT API, Law & Autonomous Systems Treatise",
    openingHours: "08:00 AM – 11:00 PM",
    directionsUrl: "https://maps.google.com/?q=23.1610,72.6369",
    bookingUrl: "#reserve-library"
  }
];

// Reliable check for listening ports via lsof
function isPortListening(port) {
  try {
    const out = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: 'utf-8', timeout: 500 }).trim();
    return out.length > 0;
  } catch (e) {
    return false;
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const urlPath = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Route: Live Health Status of all Agentic Professionals portals
  if (urlPath === '/api/status') {
    const ibc = isPortListening(3002);
    const bns = isPortListening(3003);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store',
    });
    res.end(
      JSON.stringify({
        home: true,
        ibc: ibc,
        bns: bns,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // API Route: Spaces Radar Endpoints
  if (urlPath === '/api/radar/spaces') {
    const filterType = parsedUrl.searchParams.get('type');
    let filtered = SPACES;
    if (filterType) {
      filtered = SPACES.filter(s => s.type.toLowerCase() === filterType.toLowerCase());
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    });
    res.end(JSON.stringify({ spaces: filtered }));
    return;
  }

  if (urlPath === '/api/radar/cafes') {
    const cafes = SPACES.filter(s => s.type === 'cafe');
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    });
    res.end(JSON.stringify({ cafes: cafes, spaces: cafes }));
    return;
  }

  if (urlPath === '/api/radar/libraries') {
    const libs = SPACES.filter(s => s.type === 'library');
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    });
    res.end(JSON.stringify({ libraries: libs, spaces: libs }));
    return;
  }

  // Serve static files
  let safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] Agentic Professionals Root Gateway listening on port ${PORT}`);
  console.log(`[INFO] Spaces Radar API ready: http://localhost:${PORT}/api/radar/spaces`);
});
