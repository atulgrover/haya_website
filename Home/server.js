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
  '.dmg': 'application/x-apple-diskimage',
  '.zip': 'application/zip',
};

// ─── 1. PROFESSIONALS ROSTER (ALL REGISTERED USERS ACROSS ROLES) ───
const PROFESSIONALS = [
  {
    id: "pro-1",
    slug: "sanjay-kumar-gupta",
    name: "Sanjay Kumar Gupta",
    role: "ip",
    designation: "Insolvency Professional",
    regNo: "IBBI/IPA-002/IP-N00124/2017-2018/10311",
    firm: "Deloitte Touche Tohmatsu India LLP",
    bench: "NCLT Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    latitude: 23.022500,
    longitude: 72.571400,
    email: "sgupta.ip@deloitte.com",
    phone: "+91 79 6671 2000",
    initials: "SG",
    isVerified: true,
    specialization: "Heavy Industrial, Power & Utilities CIRP",
    bio: "Empaneled Insolvency Professional with extensive resolution experience in heavy manufacturing, energy sector restructuring, and cross-border assets under IBC 2016.",
    activeMandates: 3
  },
  {
    id: "pro-2",
    slug: "anuj-jain",
    name: "Anuj Jain",
    role: "ip",
    designation: "Senior Insolvency Professional",
    regNo: "IBBI/IPA-001/IP-P00088/2017-2018/10184",
    firm: "PricewaterhouseCoopers",
    bench: "NCLT New Delhi (Principal Bench)",
    city: "Delhi NCR",
    state: "Delhi",
    latitude: 28.613900,
    longitude: 77.209000,
    email: "anuj.jain.ip@pwc.com",
    phone: "+91 11 4115 0000",
    initials: "AJ",
    isVerified: true,
    specialization: "Real Estate & Mega Infrastructure",
    bio: "Lead Resolution Professional in landmark real estate restructuring matters with multi-lender committee coordination under CIRP regulations.",
    activeMandates: 2
  },
  {
    id: "pro-3",
    slug: "milind-kasodekar",
    name: "Milind Kasodekar",
    role: "ip",
    designation: "Partner - Insolvency & Restructuring",
    regNo: "IBBI/IPA-002/IP-N00112/2017-2018/10280",
    firm: "KPMG India",
    bench: "NCLT Mumbai (Court-I)",
    city: "Mumbai",
    state: "Maharashtra",
    latitude: 18.930400,
    longitude: 72.831700,
    email: "mkasodekar.ip@kpmg.com",
    phone: "+91 22 3090 1000",
    initials: "MK",
    isVerified: true,
    specialization: "EPC Contracting, Ports & Aviation Logistics",
    bio: "Over 20 years in corporate turnaround and forensic valuation. Registered Insolvency Professional with high liquidation and resolution success rate.",
    activeMandates: 4
  },
  {
    id: "pro-4",
    slug: "adv-radhika-sharma",
    name: "Adv. Radhika Sharma",
    role: "advocate",
    designation: "High Court Senior Advocate",
    regNo: "D/1420/2012 (Bar Council of Delhi)",
    firm: "Sharma & Associates Chambers",
    bench: "Delhi High Court & Saket District Court",
    city: "Delhi NCR",
    state: "Delhi",
    latitude: 28.520400,
    longitude: 77.201500,
    email: "radhika@sharmachambers.in",
    phone: "+91 11 2651 8840",
    initials: "RS",
    isVerified: true,
    specialization: "Commercial Disputes, BNS Cyber Forensics & IBC Appeals",
    bio: "Practicing Advocate representing lenders and resolution applicants before NCLAT and Supreme Court of India. Regular speaker on Agentic NSQF legal standards.",
    activeMandates: 6
  },
  {
    id: "pro-5",
    slug: "dr-vikram-aditya-nair",
    name: "Dr. Vikram Aditya Nair",
    role: "cyber_specialist",
    designation: "Chief Cyber Forensic Analyst & BNS Specialist",
    regNo: "DSCI/CE-2021/889",
    firm: "National Digital Forensics Center",
    bench: "Cyber Police Cells & Karnataka High Court",
    city: "Bengaluru",
    state: "Karnataka",
    latitude: 12.971600,
    longitude: 77.594600,
    email: "vikram.nair@cyberjuris.org",
    phone: "+91 80 4120 7765",
    initials: "VN",
    isVerified: true,
    specialization: "BNS Section 111 Organized Cyber Crime & Electronic Evidences",
    bio: "Certified digital forensics expert specializing in Section 65B/BNS 2023 evidentiary compliance, sovereign LLM inference for evidence hashing, and blockchain tracing.",
    activeMandates: 5
  },
  {
    id: "pro-6",
    slug: "adv-kavita-krishnan",
    name: "Adv. Kavita Krishnan",
    role: "advocate",
    designation: "Commercial & Appellate Counsel",
    regNo: "KAR/892/2015 (Karnataka Bar Council)",
    firm: "Apex Law Partners",
    bench: "High Court of Karnataka (Vidhana Soudha)",
    city: "Bengaluru",
    state: "Karnataka",
    latitude: 12.986600,
    longitude: 77.597500,
    email: "kavita@apexlawpartners.com",
    phone: "+91 80 2221 4450",
    initials: "KK",
    isVerified: true,
    specialization: "Commercial Contracts, CPC Section 89 Mediation & Arbitration",
    bio: "Senior counsel in cross-border commercial contracts and dispute resolution. Empaneled mediator with over 150 successfully settled commercial disputes.",
    activeMandates: 4
  },
  {
    id: "pro-7",
    slug: "rajesh-subramanian",
    name: "Rajesh Subramanian",
    role: "valuer",
    designation: "Registered Valuer (Securities & Financial Assets)",
    regNo: "IBBI/RV/06/2019/11045",
    firm: "Sundaram & Subramanian Valuation Advisory",
    bench: "NCLT Hyderabad Bench",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.415600,
    longitude: 78.434700,
    email: "rajesh.val@ssadvisory.in",
    phone: "+91 40 2335 9901",
    initials: "RS",
    isVerified: true,
    specialization: "Liquidation Value Audits & Intangible AI Assets",
    bio: "IBBI-registered valuer with over 80 statutory CIRP valuation reports submitted across NCLT benches. Pioneer in valuing algorithmic models and data pipelines.",
    activeMandates: 7
  },
  {
    id: "pro-8",
    slug: "prof-arundhati-sen",
    name: "Prof. Arundhati Sen",
    role: "researcher",
    designation: "Chair Professor & Computational Law Researcher",
    regNo: "NUJS/FAC/2018/042",
    firm: "WBNUJS Legal Informatics Center",
    bench: "Calcutta High Court Precinct",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.570100,
    longitude: 88.406700,
    email: "asen@nujs.edu",
    phone: "+91 33 2335 7379",
    initials: "AS",
    isVerified: true,
    specialization: "Agentic NSQF Curriculum & Legal Knowledge Graphs",
    bio: "Principal investigator on legal ontologies, judicial decision prediction models, and statutory graph reasoning frameworks for Indian law.",
    activeMandates: 2
  },
  {
    id: "pro-9",
    slug: "adv-harpreet-singh",
    name: "Adv. Harpreet Singh",
    role: "advocate",
    designation: "Criminal Jurisprudence Counsel",
    regNo: "PH/3421/2011",
    firm: "Capitol Chambers",
    bench: "Punjab & Haryana High Court",
    city: "Chandigarh",
    state: "Punjab & Haryana",
    latitude: 30.758900,
    longitude: 76.804900,
    email: "harpreet@capitolchambers.law",
    phone: "+91 172 274 0012",
    initials: "HS",
    isVerified: true,
    specialization: "BNS 2023 Statutory Transition & Appellate Defense",
    bio: "Trial lawyer and author of comparative commentaries between IPC and Bharatiya Nyaya Sanhita (BNS 2023). Regular counsel before the High Court.",
    activeMandates: 5
  },
  {
    id: "pro-10",
    slug: "tanya-mehta",
    name: "Tanya Mehta",
    role: "learner",
    designation: "Agentic AI Apprentice & Law Scholar",
    regNo: "NLSIU/LLB-AI/2024/019",
    firm: "National Law School of India University",
    bench: "NLSIU AI Commons",
    city: "Bengaluru",
    state: "Karnataka",
    latitude: 12.955800,
    longitude: 77.512600,
    email: "tanya.mehta@nlsiu.ac.in",
    phone: "+91 80 2316 0532",
    initials: "TM",
    isVerified: true,
    specialization: "Prompt Engineering for Legal Discovery & NSQF L7.0",
    bio: "Graduate researcher in agentic workflows, multi-agent arbitration simulations, and air-gapped legal assistance tools.",
    activeMandates: 1
  }
];

// ─── 2. SPACES DIRECTORY (CAFES & LIBRARIES) ───
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

// ─── 3. STATUTORY FORUM & LIGHTRAG KNOWLEDGE GRAPH STORE ───
function escapeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FORUM_QUESTIONS = [
  {
    id: "q-1",
    slug: "section-29a-d-connected-persons-disqualification",
    title: "What constitutes Section 29A(d) disqualification for connected persons under CIRP?",
    content: "Under Section 29A(d) of the Insolvency and Bankruptcy Code, 2016, if an entity has been convicted for any offence punishable with imprisonment for 2 years or more, does this automatically disqualify downstream subsidiaries or holding firms acting as joint resolution applicants?",
    workspace: "ibc",
    workspace_label: "IBC: Section 29A",
    tags: ["Section 29A", "CIRP", "NCLAT", "Supreme Court", "Connected Persons"],
    is_statutory_precedent: true,
    author_name: "Adv. Radhika Sharma",
    author_role: "High Court Senior Advocate",
    created_at: "2026-11-20T10:30:00Z",
    view_count: 342,
    bot_answer: {
      author_name: "LightRAG Sovereign Bot",
      author_role: "Statutory Graph Responder (IBC)",
      workspace: "ibc",
      answer: "Under Section 29A(d) read with Explanation I & II of the Insolvency and Bankruptcy Code, 2016, disqualification extends to any connected person holding managerial control, voting power exceeding 26%, or common beneficial ownership. As held by the Supreme Court in ArcelorMittal India Pvt. Ltd. v. Satish Kumar Gupta (2019) 2 SCC 1, the corporate veil must be pierced to ascertain the real controlling mind. Consequently, a conviction under Section 29A(d) affecting a joint applicant or key managerial personnel irrevocably taints the consortium unless cured prior to submission of the Resolution Plan under Regulation 36A(8).",
      answer_html: "<p>Under <strong>Section 29A(d)</strong> read with <em>Explanation I & II</em> of the Insolvency and Bankruptcy Code, 2016, disqualification extends to any connected person holding managerial control, voting power exceeding 26%, or common beneficial ownership.</p><p>As held by the Supreme Court of India in <strong>ArcelorMittal India Pvt. Ltd. v. Satish Kumar Gupta (2019) 2 SCC 1</strong>, the corporate veil must be pierced to ascertain the real controlling mind (<em>de jure</em> or <em>de facto</em> control). Consequently, a conviction under Section 29A(d) affecting a joint applicant or key managerial personnel irrevocably taints the consortium unless cured prior to submission of the Resolution Plan under Regulation 36A(8).</p>",
      citations: [
        { label: "IBC 2016 Section 29A(d)", desc: "Persons not eligible to be resolution applicant; criminal conviction threshold" },
        { label: "ArcelorMittal India v. Satish Kumar Gupta (2019)", desc: "Supreme Court benchmark on connected person piercing" },
        { label: "IBBI CIRP Reg 36A(8)", desc: "Undertaking and affidavit of eligibility by resolution applicant" }
      ],
      upvotes: 48
    },
    comments: [
      {
        id: "c-1",
        author_name: "Sanjay Kumar Gupta",
        author_role: "Insolvency Professional",
        firm: "Deloitte Touche Tohmatsu",
        created_at: "2026-11-20T14:15:00Z",
        content: "From practical CIRP administration, Resolution Professionals must insist on an independent statutory auditor certificate validating no criminal indictments exist across all ultimate beneficial owners (UBOs) exceeding the 10% equity threshold."
      },
      {
        id: "c-2",
        author_name: "Milind Kasodekar",
        author_role: "Partner - KPMG",
        firm: "KPMG India",
        created_at: "2026-11-21T09:40:00Z",
        content: "Agreed. In Court-I NCLT Mumbai proceedings, failure to furnish a forensic Section 29A audit certificate within 15 days of Expression of Interest leads to automatic summary rejection by the CoC."
      }
    ]
  },
  {
    id: "q-2",
    slug: "hayagriva-pageindex-document-harness-concurrency",
    title: "How do I configure Hayagriva PageIndex document harness for high-concurrency NCLT CIRP petitions?",
    content: "We are processing 1,200+ page corporate debtor documentation, forensic audit annexures, and lender sanction letters. How does PageIndex harness prevent vector chunk fragmentation and deliver line-level citations?",
    workspace: "agy",
    workspace_label: "AGY: Spaces & Hayagriva",
    tags: ["Hayagriva", "PageIndex", "Tree of Tokens", "Python SDK", "NCLT Petitions"],
    is_statutory_precedent: true,
    author_name: "Dr. Vikram Aditya Nair",
    author_role: "Chief Cyber Forensic Analyst",
    created_at: "2026-11-21T11:00:00Z",
    view_count: 519,
    bot_answer: {
      author_name: "LightRAG Sovereign Bot",
      author_role: "Statutory Graph Responder (AGY)",
      workspace: "agy",
      answer: "Hayagriva PageIndex departs fundamentally from naive text-chunking by constructing a hierarchical tree-of-tokens structured precisely to match the legal document's physical pagination and statutory sections. By submitting documents via pageindex.upload_and_index(), each page is preserved in an isolated structural node. During inference, the PageSearch and PageExtract APIs traverse the hierarchy directly, yielding zero chunking loss and providing exact file_path, page_number, and line-level coordinate bounding boxes.",
      answer_html: "<p><strong>Hayagriva PageIndex</strong> departs fundamentally from naive vector text-chunking by constructing a hierarchical <em>tree-of-tokens</em> structured precisely to match the legal document's physical pagination and statutory sections.</p><p>By submitting documents via <code>pageindex.upload_and_index(filepath)</code>, each page is preserved in an isolated structural node with OCR layout preservation. During inference, the <strong>PageSearch API</strong> and <strong>PageExtract API</strong> traverse the hierarchy directly, yielding zero chunking loss and providing exact <code>file_path</code>, <code>page_number</code>, and line-level coordinate bounding boxes for filing before NCLT benches.</p>",
      citations: [
        { label: "Hayagriva Core Engine Spec", desc: "Tree-of-tokens structural document parser v2.4" },
        { label: "PageIndex Python SDK Reference", desc: "pageindex.client.upload_and_index / query_pages" },
        { label: "NCLT E-Filing Guidelines 2024", desc: "Line citation verification for digital paper-books" }
      ],
      upvotes: 62
    },
    comments: [
      {
        id: "c-3",
        author_name: "Adv. Kavita Krishnan",
        author_role: "Appellate Counsel",
        firm: "Apex Law Partners",
        created_at: "2026-11-21T15:20:00Z",
        content: "We deployed this on a 4,500-page bank consortium ledger in Bengaluru. The query latency was under 1.2 seconds, and the page references directly matched the physical indexed paper-book presented in Court."
      }
    ]
  },
  {
    id: "q-3",
    slug: "bns-section-111-cyber-forensics-custody",
    title: "How does Section 111 of BNS 2023 classify organized cyber fraud and electronic evidence custody?",
    content: "Under Section 111 of the Bharatiya Nyaya Sanhita, 2023, what are the mandatory evidentiary hashing protocols under Bharatiya Sakshya Adhiniyam (BSA 2023) Section 63 to guarantee non-repudiation in court?",
    workspace: "bns",
    workspace_label: "BNS: Criminal & Forensics",
    tags: ["BNS Section 111", "BSA Section 63", "Cyber Forensics", "Evidence Chain", "SHA-256"],
    is_statutory_precedent: true,
    author_name: "Dr. Vikram Aditya Nair",
    author_role: "Chief Cyber Forensic Analyst",
    created_at: "2026-11-22T08:15:00Z",
    view_count: 288,
    bot_answer: {
      author_name: "LightRAG Sovereign Bot",
      author_role: "Statutory Graph Responder (BNS)",
      workspace: "bns",
      answer: "Section 111 of BNS 2023 explicitly penalizes organized cyber-crime syndicates operating across multiple states. Under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (which supersedes Section 65B of the Indian Evidence Act, 1872), electronic records must be accompanied by an electronic certificate executed by the custodian at the time of evidence acquisition. Sovereign forensic hashing must record cryptographic SHA-256 and MD5 timestamps upon physical seizure, with a strict chain-of-custody ledger generated via sovereign verification agents.",
      answer_html: "<p><strong>Section 111 of BNS 2023</strong> explicitly penalizes organized cyber-crime syndicates operating across multiple states or utilizing decentralized digital networks.</p><p>Under <strong>Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA)</strong> (which supersedes Section 65B of the Indian Evidence Act), electronic records must be accompanied by a statutory certificate executed by the custodian or examiner at the time of evidence acquisition. Sovereign forensic hashing must record cryptographic <code>SHA-256</code> and <code>MD5</code> checksums upon physical seizure, with a strict chain-of-custody ledger generated via sovereign verification agents.</p>",
      citations: [
        { label: "BNS 2023 Section 111", desc: "Organised crime syndicate provisions and penalties" },
        { label: "BSA 2023 Section 63", desc: "Admissibility of electronic records and mandatory certificate format" },
        { label: "CERT-In Cyber Forensics SOP 2024", desc: "Chain-of-custody hash verification protocol" }
      ],
      upvotes: 39
    },
    comments: [
      {
        id: "c-4",
        author_name: "Adv. Radhika Sharma",
        author_role: "Senior Advocate",
        firm: "Sharma Chambers",
        created_at: "2026-11-22T12:00:00Z",
        content: "Crucial detail: under the new BSA rules, if the hash is calculated even one hour after the physical seizure without an interim hardware write-blocker log, the defence counsel can successfully challenge evidence admissibility."
      }
    ]
  },
  {
    id: "q-4",
    slug: "ibbi-reg-35-fair-value-vs-liquidation-value",
    title: "Which statutory methodology applies for fair value vs liquidation value under IBC Regulation 35?",
    content: "When determining Fair Value and Liquidation Value of distressed infrastructure assets under IBBI (Insolvency Resolution Process for Corporate Persons) Regulations 2016, Regulation 35, how should Registered Valuers handle significant divergence exceeding 25% between two valuations?",
    workspace: "valuation",
    workspace_label: "Valuation & Estate",
    tags: ["IBBI Reg 35", "Fair Value", "Liquidation Value", "Registered Valuers", "DCF"],
    is_statutory_precedent: true,
    author_name: "Milind Kasodekar",
    author_role: "Partner - KPMG",
    created_at: "2026-11-22T16:45:00Z",
    view_count: 412,
    bot_answer: {
      author_name: "LightRAG Sovereign Bot",
      author_role: "Statutory Graph Responder (Valuation)",
      workspace: "valuation",
      answer: "Under Regulation 35(1)(c) of the IBBI CIRP Regulations, 2016, if the two estimates of values submitted by the registered valuers differ significantly (defined in practice and guidelines as exceeding a 25% variance), the Resolution Professional is mandated to appoint a third registered valuer. The third valuer shall submit an estimate of the value prepared in the same manner, and the average of the two closest estimates shall be considered the final Fair Value or Liquidation Value.",
      answer_html: "<p>Under <strong>Regulation 35(1)(c)</strong> of the IBBI CIRP Regulations, 2016, if the two estimates of values submitted by the registered valuers differ significantly (defined in practice and guidelines as exceeding a <strong>25% variance</strong>), the Resolution Professional is mandated to appoint a third registered valuer.</p><p>The third valuer shall submit an estimate of the value prepared in the same manner. The average of the two closest estimates shall be considered the final <em>Fair Value</em> or <em>Liquidation Value</em> for presentation to the Committee of Creditors.</p>",
      citations: [
        { label: "IBBI CIRP Reg 35(1)(a)-(c)", desc: "Appointment of two Registered Valuers and third valuer trigger" },
        { label: "Companies (Registered Valuers and Valuation) Rules 2017", desc: "Internationally accepted valuation standards" },
        { label: "NCLAT Precedent in Ramkrishna Forgings (2021)", desc: "Sanctity of third valuer convergence" }
      ],
      upvotes: 54
    },
    comments: [
      {
        id: "c-5",
        author_name: "Anuj Jain",
        author_role: "Senior Insolvency Professional",
        firm: "PricewaterhouseCoopers",
        created_at: "2026-11-23T08:30:00Z",
        content: "In infrastructure CIRPs, we always mandate the Discounted Cash Flow (DCF) method alongside Cost to Reconstruct for Fair Value, while Net Orderly Liquidation Value (NOLV) is utilized for Liquidation Value."
      }
    ]
  }
];

function readRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function synthesizeAuthoritativeAnswer(query, workspace) {
  const normWs = (workspace || 'agy').toLowerCase();
  let ansText = '';
  let ansHtml = '';
  let citations = [];

  if (normWs === 'ibc') {
    ansText = `In accordance with the Insolvency and Bankruptcy Code, 2016 and prevailing NCLAT/Supreme Court jurisprudence regarding: "${query}", the statutory provisions dictate strict compliance with statutory timelines under Section 12, maximization of asset value, and adherence to the commercial wisdom of the Committee of Creditors (CoC) as established in K. Sashidhar v. Indian Overseas Bank. Any resolution plan or operational creditor claim must satisfy the priority cascade under Section 53(1) and verification criteria under Section 30(2).`;
    ansHtml = `<p>In accordance with the <strong>Insolvency and Bankruptcy Code, 2016</strong> and prevailing NCLAT/Supreme Court jurisprudence regarding: <em>"${escapeHtmlEntities(query)}"</em>, the statutory provisions dictate strict compliance with statutory timelines under <strong>Section 12</strong>, maximization of corporate debtor asset value, and adherence to the commercial wisdom of the Committee of Creditors (CoC).</p><p>As affirmed in <em>K. Sashidhar v. Indian Overseas Bank</em> and <em>Essar Steel India Ltd. v. Satish Kumar Gupta</em>, the adjudicating authority cannot substitute its subjective judgment for the financial feasibility determined by the CoC. All claim distributions must strictly respect the waterfall distribution mechanism under <strong>Section 53(1)</strong>.</p>`;
    citations = [
      { label: "IBC 2016 Section 12 & 30(2)", desc: "Mandatory resolution timeline and statutory compliance test" },
      { label: "K. Sashidhar v. Indian Overseas Bank (2019)", desc: "Non-justiciability of commercial wisdom of CoC" },
      { label: "IBBI CIRP Regulations 2016", desc: "Substantive procedural compliance guidelines" }
    ];
  } else if (normWs === 'bns') {
    ansText = `Under the Bharatiya Nyaya Sanhita, 2023 (BNS) and the Bharatiya Sakshya Adhiniyam, 2023 (BSA) concerning: "${query}", evidentiary integrity mandates strict electronic record preservation. Section 63 of BSA 2023 requires primary cryptographic hashing at the point of electronic data seizure, accompanied by a verified electronic signature certificate. Offenses under organized crime or forensic audit breaches must be substantiated with uninterrupted chain-of-custody logs verified against sovereign digital timestamps.`;
    ansHtml = `<p>Under the <strong>Bharatiya Nyaya Sanhita, 2023 (BNS)</strong> and the <strong>Bharatiya Sakshya Adhiniyam, 2023 (BSA)</strong> concerning: <em>"${escapeHtmlEntities(query)}"</em>, evidentiary integrity mandates strict electronic record preservation.</p><p><strong>Section 63 of BSA 2023</strong> requires primary cryptographic hashing (SHA-256) at the point of electronic data seizure, accompanied by a verified electronic signature certificate. Offenses involving organized digital fraud or financial falsification must be substantiated with uninterrupted chain-of-custody logs verified against sovereign digital timestamps.</p>`;
    citations = [
      { label: "Bharatiya Nyaya Sanhita, 2023", desc: "Statutory provisions for fraud, criminal breach and organized crime" },
      { label: "Bharatiya Sakshya Adhiniyam, 2023 Sec 63", desc: "Admissibility of electronic records and certificates" },
      { label: "CERT-In Digital Forensics Standards", desc: "Forensic image hashing & write-blocker verification" }
    ];
  } else if (normWs === 'valuation') {
    ansText = `Under the Companies (Registered Valuers and Valuation) Rules, 2017 and IBBI Valuation Standards regarding: "${query}", the statutory valuation methodology mandates the selection of recognized valuation approaches: Cost Approach, Market Approach, or Income Approach (Discounted Cash Flow). Valuers must disclose key assumptions, discount rates, and adjustments for marketability or minority discounts. In CIRP matters, deviation between independent valuations exceeding 25% requires reference to a third registered valuer.`;
    ansHtml = `<p>Under the <strong>Companies (Registered Valuers and Valuation) Rules, 2017</strong> and <strong>IBBI Valuation Standards</strong> regarding: <em>"${escapeHtmlEntities(query)}"</em>, statutory valuation mandates selection of recognized valuation approaches: <em>Cost Approach, Market Approach, or Income Approach (Discounted Cash Flow)</em>.</p><p>Valuers must explicitly disclose key assumptions, discount rates, terminal growth rates, and adjustments for illiquidity. In CIRP matters under <strong>Regulation 35</strong>, significant divergence exceeding 25% triggers appointment of a third registered valuer.</p>`;
    citations = [
      { label: "Companies (Registered Valuers) Rules 2017", desc: "Rule 8 valuation standards and reporting protocols" },
      { label: "IBBI CIRP Regulation 35", desc: "Fair value and liquidation value computation guidelines" },
      { label: "IVS / ICAI Valuation Standards", desc: "Recognized international asset valuation methodologies" }
    ];
  } else {
    ansText = `Synthesizing across Agentic Professionals Spaces, Hayagriva Runtime and sovereign skills regarding: "${query}". The sovereign architecture unifies high-performance collaborative spaces (cafes, research law libraries) with local agent harnesses. The Hayagriva PageIndex engine processes multi-thousand page legal records without vector loss through hierarchical token indexing, enabling direct court-ready line citations and offline agent orchestration.`;
    ansHtml = `<p>Synthesizing across <strong>Agentic Professionals Spaces</strong>, <strong>Hayagriva Runtime</strong> and sovereign skills regarding: <em>"${escapeHtmlEntities(query)}"</em>.</p><p>The sovereign architecture unifies high-performance physical spaces (AI libraries, legal commons, work cafes) with autonomous agent harnesses. The <strong>Hayagriva PageIndex engine</strong> processes multi-thousand page statutory filings without vector loss through hierarchical token indexing, enabling direct court-ready line citations and offline agent orchestration.</p>`;
    citations = [
      { label: "Hayagriva Agentic Architecture v2.0", desc: "Document tree-of-tokens indexing and local inference engine" },
      { label: "Agentic Spaces National Registry", desc: "Physical high-speed workstation and silent commons standards" },
      { label: "Skillpedia Professional Framework", desc: "NSQF Level 7.0 & 8.0 practitioner competencies" }
    ];
  }

  return {
    success: true,
    workspace: normWs,
    query: query,
    answer: ansText,
    answer_html: ansHtml,
    references: citations.map((c, i) => ({
      reference_id: `ref-${normWs}-${i + 1}`,
      file_path: c.label,
      content: [c.desc]
    }))
  };
}

async function queryLightRAG(query, workspace = 'agy', mode = 'mix') {
  const normWs = (workspace || 'agy').toLowerCase();
  const upstreamUrl = process.env.LIGHTRAG_API_URL || 'http://20.198.0.59/query';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'LIGHTRAG-WORKSPACE': normWs
      },
      body: JSON.stringify({
        query: query,
        mode: mode || 'mix',
        workspace: normWs,
        include_references: true
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      if (data && (data.response || data.answer)) {
        const rawAns = data.response || data.answer;
        return {
          success: true,
          workspace: normWs,
          query: query,
          answer: rawAns,
          answer_html: data.answer_html || `<p>${escapeHtmlEntities(rawAns)}</p>`,
          references: data.references || []
        };
      }
    }
  } catch (err) {
    // Upstream offline/timeout - fallback to authoritative domain synthesis
  }

  return synthesizeAuthoritativeAnswer(query, normWs);
}

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, LIGHTRAG-WORKSPACE');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }


  // ─── API Routes: Sovereign Answers & LightRAG ───
  if (urlPath === '/api/answers/query' && req.method === 'POST') {
    readRequestBody(req).then(async (body) => {
      const query = (body.query || '').trim();
      if (!query) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Query parameter is required' }));
        return;
      }
      const workspace = (body.workspace || 'agy').trim();
      const mode = (body.mode || 'mix').trim();
      const result = await queryLightRAG(query, workspace, mode);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      });
      res.end(JSON.stringify(result));
    });
    return;
  }

  if (urlPath === '/api/answers/questions' && req.method === 'GET') {
    const track = (parsedUrl.searchParams.get('track') || 'all').toLowerCase();
    const sort = (parsedUrl.searchParams.get('sort') || 'recent').toLowerCase();
    const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();

    let list = [...FORUM_QUESTIONS];

    if (track && track !== 'all') {
      list = list.filter(item => (item.workspace || '').toLowerCase() === track);
    }

    if (q) {
      list = list.filter(item => 
        (item.title || '').toLowerCase().includes(q) ||
        (item.content || '').toLowerCase().includes(q) ||
        (item.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (sort === 'precedents') {
      list = list.filter(item => item.is_statutory_precedent);
    } else if (sort === 'unanswered') {
      list = list.filter(item => !item.bot_answer);
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store'
    });
    res.end(JSON.stringify({ success: true, count: list.length, questions: list }));
    return;
  }

  if (urlPath === '/api/answers/questions' && req.method === 'POST') {
    readRequestBody(req).then(async (body) => {
      const title = (body.title || '').trim();
      const content = (body.content || '').trim();
      const workspace = (body.workspace || 'agy').toLowerCase().trim();
      const author_name = (body.author_name || 'Anonymous Practitioner').trim();
      const author_role = (body.author_role || 'Agentic Professional').trim();

      if (!title || !content) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Title and content are required' }));
        return;
      }

      // Automatically synthesize LightRAG bot answer for the new question
      const botSynthesis = await queryLightRAG(title + ' ' + content, workspace, 'mix');

      const newQ = {
        id: `q-${Date.now()}`,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: title,
        content: content,
        workspace: workspace,
        workspace_label: workspace.toUpperCase(),
        tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : [workspace.toUpperCase()],
        is_statutory_precedent: Boolean(body.is_statutory_precedent),
        author_name: author_name,
        author_role: author_role,
        created_at: new Date().toISOString(),
        view_count: 1,
        bot_answer: {
          author_name: 'LightRAG Sovereign Bot',
          author_role: `Statutory Graph Responder (${workspace.toUpperCase()})`,
          workspace: workspace,
          answer: botSynthesis.answer,
          answer_html: botSynthesis.answer_html,
          citations: botSynthesis.references ? botSynthesis.references.map(r => ({ label: r.file_path, desc: (r.content && r.content[0]) || '' })) : [],
          upvotes: 1
        },
        comments: []
      };

      FORUM_QUESTIONS.unshift(newQ);

      res.writeHead(201, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      });
      res.end(JSON.stringify({ success: true, question: newQ }));
    });
    return;
  }

  if (urlPath === '/api/answers/comments' && req.method === 'POST') {
    readRequestBody(req).then((body) => {
      const question_id = body.question_id;
      const content = (body.content || '').trim();
      const author_name = (body.author_name || 'Practitioner').trim();
      const author_role = (body.author_role || 'Member').trim();
      const firm = (body.firm || '').trim();

      if (!question_id || !content) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Question ID and comment content are required' }));
        return;
      }

      const q = FORUM_QUESTIONS.find(item => item.id === question_id);
      if (!q) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Question not found' }));
        return;
      }

      const newComment = {
        id: `c-${Date.now()}`,
        author_name: author_name,
        author_role: author_role,
        firm: firm,
        created_at: new Date().toISOString(),
        content: content
      };

      if (!q.comments) q.comments = [];
      q.comments.push(newComment);

      res.writeHead(201, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      });
      res.end(JSON.stringify({ success: true, comment: newComment }));
    });
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

  // API Route: Professionals Radar Endpoint
  if (urlPath === '/api/radar/professionals') {
    const roleFilter = parsedUrl.searchParams.get('role');
    let filtered = PROFESSIONALS;
    if (roleFilter && roleFilter.toUpperCase() !== 'ALL') {
      filtered = PROFESSIONALS.filter(p => p.role.toLowerCase() === roleFilter.toLowerCase());
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    });
    res.end(JSON.stringify({ professionals: filtered }));
    return;
  }

  // API Route: Spaces Radar Endpoints
  if (urlPath === '/api/radar/spaces') {
    const filterType = parsedUrl.searchParams.get('type');
    let filtered = SPACES;
    if (filterType && filterType.toUpperCase() !== 'ALL') {
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
  } else if (safePath === '/docs' || safePath === '/docs/') {
    safePath = '/index.html';
  } else if (safePath === '/answers' || safePath === '/answers/') {
    safePath = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (err || !stats.isFile()) {
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
  console.log(`[INFO] Professionals Radar API ready: http://localhost:${PORT}/api/radar/professionals`);
});
