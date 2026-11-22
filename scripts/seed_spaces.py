#!/usr/bin/env python3
"""
Seed script for Supabase PostgreSQL table: agentic_spaces
Seeds 8 Work-from-Cafes and 8 AI Libraries across Indian metros.
"""

import os
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres.rybbbqdwmjzgsdxyrjgt:08BOFwyfwWuCjHdT@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
)

SPACES = [
    # ─── 8 WORK-FROM-CAFES ───
    {
        "id": "cafe-bt-saket",
        "space_code": "SPACE-CF-001",
        "type": "cafe",
        "name": "Blue Tokai Coffee Roasters — Saket",
        "city": "Delhi NCR",
        "state": "Delhi",
        "location": "Saidulajab, Saket, New Delhi 110030",
        "proximity": "350 meters from Saket District Court",
        "latitude": 28.520400,
        "longitude": 77.201500,
        "wifi_speed": "350 Mbps",
        "power_sockets": "Every table & private booth",
        "noise_level": "Quiet ambient focus",
        "specialty": "Cold Brew, Pour-overs, Sourdough Croissants & Artisan Donuts",
        "terminals": None,
        "ai_books": None,
        "opening_hours": "07:30 AM – 10:30 PM",
        "directions_url": "https://maps.google.com/?q=28.5204,77.2015",
        "booking_url": "#reserve-cafe"
    },
    {
        "id": "cafe-sb-bkc",
        "space_code": "SPACE-CF-002",
        "type": "cafe",
        "name": "Starbucks Reserve — BKC",
        "city": "Mumbai",
        "state": "Maharashtra",
        "location": "G Block BKC, Bandra Kurla Complex, Mumbai 400051",
        "proximity": "400 meters from NCLT Mumbai Benches 1–5",
        "latitude": 19.066000,
        "longitude": 72.868500,
        "wifi_speed": "400 Mbps",
        "power_sockets": "Dual universal sockets at every lounge seat",
        "noise_level": "Executive corporate hum",
        "specialty": "Micro-lot Reserve Espresso, Nitro Cold Brew & Fresh Bagels",
        "terminals": None,
        "ai_books": None,
        "opening_hours": "07:00 AM – 11:00 PM",
        "directions_url": "https://maps.google.com/?q=19.0660,72.8685",
        "booking_url": "#reserve-cafe"
    },
    {
        "id": "cafe-tw-vidhana",
        "space_code": "SPACE-CF-003",
        "type": "cafe",
        "name": "Third Wave Coffee Roasters — Cunningham",
        "city": "Bengaluru",
        "state": "Karnataka",
        "location": "Cunningham Road, Vasanth Nagar, Bengaluru 560052",
        "proximity": "Direct Metro access to Karnataka High Court (Vidhana Soudha)",
        "latitude": 12.986600,
        "longitude": 77.597500,
        "wifi_speed": "300 Mbps",
        "power_sockets": "Under-desk power strip with USB-C PD",
        "noise_level": "Quiet focus zone",
        "specialty": "Single-origin pour-overs, Cinnamon Cruffins & Chocochip Pancakes",
        "terminals": None,
        "ai_books": None,
        "opening_hours": "08:00 AM – 11:30 PM",
        "directions_url": "https://maps.google.com/?q=12.9866,77.5975",
        "booking_url": "#reserve-cafe"
    },
    {
        "id": "cafe-roastery-hyd",
        "space_code": "SPACE-CF-004",
        "type": "cafe",
        "name": "Roastery Coffee House — Banjara Hills",
        "city": "Hyderabad",
        "state": "Telangana",
        "location": "Road No. 14, Banjara Hills, Hyderabad 500034",
        "proximity": "15 min drive from Telangana High Court & NCLT Hyderabad",
        "latitude": 17.415600,
        "longitude": 78.434700,
        "wifi_speed": "300 Mbps",
        "power_sockets": "Garden patio & interior study booths with dedicated outlets",
        "noise_level": "Serene courtyard library atmosphere",
        "specialty": "Monsooned Malabar, Cascara Artisanal Brews & Baked Cheesecakes",
        "terminals": None,
        "ai_books": None,
        "opening_hours": "08:00 AM – 11:00 PM",
        "directions_url": "https://maps.google.com/?q=17.4156,78.4347",
        "booking_url": "#reserve-cafe"
    },
    {
        "id": "cafe-bt-parkst",
        "space_code": "SPACE-CF-005",
        "type": "cafe",
        "name": "Blue Tokai Coffee Roasters — Park Street",
        "city": "Kolkata",
        "state": "West Bengal",
        "location": "Park Street Heritage Zone, Kolkata 700016",
        "proximity": "1.2 km from Calcutta High Court & City Civil Court",
        "latitude": 22.551000,
        "longitude": 88.352400,
        "wifi_speed": "300 Mbps",
        "power_sockets": "Work counters equipped with universal plug points",
        "noise_level": "Tranquil reading lounge",
        "specialty": "French Press, Sea Salt Hot Chocolate & Artisanal Brioche Donuts",
        "terminals": None,
        "ai_books": None,
        "opening_hours": "08:00 AM – 10:30 PM",
        "directions_url": "https://maps.google.com/?q=22.5510,88.3524",
        "booking_url": "#reserve-cafe"
    },
    {
        "id": "cafe-sec7-chd",
        "space_code": "SPACE-CF-006",
        "type": "cafe",
        "name": "Sector 7 Social & Work Cafe",
        "city": "Chandigarh",
        "state": "Punjab & Haryana",
        "location": "Madhya Marg, Sector 7-C, Chandigarh 160019",
        "proximity": "2.5 km from Punjab & Haryana High Court (Sector 1)",
        "latitude": 30.730200,
        "longitude": 76.804100,
        "wifi_speed": "350 Mbps",
        "power_sockets": "Executive work tables with high-power AC outlets",
        "noise_level": "Daytime quiet co-working mode",
        "specialty": "Espresso Tonic, Avocado Brioche & Fresh Doughnuts",
        "terminals": None,
        "ai_books": None,
        "opening_hours": "09:00 AM – 11:00 PM",
        "directions_url": "https://maps.google.com/?q=30.7302,76.8041",
        "booking_url": "#reserve-cafe"
    },
    {
        "id": "cafe-onedegree-pune",
        "space_code": "SPACE-CF-007",
        "type": "cafe",
        "name": "One Degree Coffee Roasters — Kalyani Nagar",
        "city": "Pune",
        "state": "Maharashtra",
        "location": "East Avenue, Kalyani Nagar, Pune 411006",
        "proximity": "10 min drive from Shivaji Nagar District & Sessions Court",
        "latitude": 18.548200,
        "longitude": 73.902200,
        "wifi_speed": "300 Mbps",
        "power_sockets": "Every desk and communal table",
        "noise_level": "Quiet focus alcove",
        "specialty": "Aeropress Special Reserve, Blueberry Glazed Donuts & Quiches",
        "terminals": None,
        "ai_books": None,
        "opening_hours": "08:00 AM – 10:00 PM",
        "directions_url": "https://maps.google.com/?q=18.5482,73.9022",
        "booking_url": "#reserve-cafe"
    },
    {
        "id": "cafe-mocha-ahmedabad",
        "space_code": "SPACE-CF-008",
        "type": "cafe",
        "name": "Mocha Work Cafe — Bodakdev",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "location": "Sindhu Bhavan Marg, Bodakdev, Ahmedabad 380054",
        "proximity": "Direct corridor to Gujarat High Court (Sola)",
        "latitude": 23.039600,
        "longitude": 72.508500,
        "wifi_speed": "350 Mbps",
        "power_sockets": "Dedicated laptop power bank at all booths",
        "noise_level": "Spacious quiet zone",
        "specialty": "Affogato, Chocolate Mud Cake, Cinnamon Buns & Filter Roasts",
        "terminals": None,
        "ai_books": None,
        "opening_hours": "09:00 AM – 11:30 PM",
        "directions_url": "https://maps.google.com/?q=23.0396,72.5085",
        "booking_url": "#reserve-cafe"
    },

    # ─── 8 AI LIBRARIES WITH COMPUTERS & AI BOOKS ───
    {
        "id": "lib-delhi-ai",
        "space_code": "SPACE-LB-001",
        "type": "library",
        "name": "National Cyber & Legal AI Terminals — Saket",
        "city": "Delhi NCR",
        "state": "Delhi",
        "location": "Institutional Area, Saket District Court Precinct, New Delhi 110017",
        "proximity": "Adjacent to Saket Lawyers Chambers & Bar Library",
        "latitude": 28.524500,
        "longitude": 77.206200,
        "wifi_speed": "1 Gbps Dedicated Fiber",
        "power_sockets": "Dual surge-protected power rails & UPS backup",
        "noise_level": "Silent research sanctuary (<30 dB)",
        "specialty": "Full Corpus of Agentic LLMs, Constitutional AI & Statutory NLP",
        "terminals": "10 High-Performance Workstations with Dual 4K Displays & Dev Containers",
        "ai_books": "Reinforcement Learning (Sutton & Barto), Modern Agent Architectures, Constitutional AI Standards, BNS 2023 Digital Commentary",
        "opening_hours": "08:00 AM – 09:00 PM",
        "directions_url": "https://maps.google.com/?q=28.5245,77.2062",
        "booking_url": "#reserve-library"
    },
    {
        "id": "lib-mumbai-fort",
        "space_code": "SPACE-LB-002",
        "type": "library",
        "name": "Mumbai Legal Tech & AI Reading Room — Fort",
        "city": "Mumbai",
        "state": "Maharashtra",
        "location": "High Court Annexe, Fort Heritage Precinct, Mumbai 400032",
        "proximity": "Walking distance to Bombay High Court & City Civil Court",
        "latitude": 18.930400,
        "longitude": 72.831700,
        "wifi_speed": "1 Gbps Fiber",
        "power_sockets": "Desktop terminals with USB-C PD & Ethernet drops",
        "noise_level": "Strict silent study zone",
        "specialty": "BNS, IBC & CPC Vector Embeddings & Offline Precedent Retrieval",
        "terminals": "8 GPU-enabled Workstations (RTX 4090) for local LLM inference experiments",
        "ai_books": "Deep Learning (Goodfellow), Pattern Recognition & Machine Learning, Agentic Workflows for Legal Discovery, Supreme Court AI Benchmarks",
        "opening_hours": "08:30 AM – 08:30 PM",
        "directions_url": "https://maps.google.com/?q=18.9304,72.8317",
        "booking_url": "#reserve-library"
    },
    {
        "id": "lib-nlsiu-blr",
        "space_code": "SPACE-LB-003",
        "type": "library",
        "name": "NLSIU AI & Computational Law Commons",
        "city": "Bengaluru",
        "state": "Karnataka",
        "location": "Nagarbhavi Academic Campus, Bengaluru 560072",
        "proximity": "National Law School of India University Central Library",
        "latitude": 12.955800,
        "longitude": 77.512600,
        "wifi_speed": "1 Gbps NKN Campus Network",
        "power_sockets": "Integrated carrel power modules with surge suppressors",
        "noise_level": "Deep academic silence",
        "specialty": "Skillpedia NSQF Level 7.0 & Level 8.0 Agentic Curriculum Reserve",
        "terminals": "12 Dual-Monitor Linux Workstations pre-loaded with Python SDK & LightRAG",
        "ai_books": "Artificial Intelligence: A Modern Approach (Russell & Norvig), Multi-Agent Systems (Wooldridge), Generative AI for Sovereign Governance",
        "opening_hours": "08:00 AM – Midnight",
        "directions_url": "https://maps.google.com/?q=12.9558,77.5126",
        "booking_url": "#reserve-library"
    },
    {
        "id": "lib-nalsar-hyd",
        "space_code": "SPACE-LB-004",
        "type": "library",
        "name": "NALSAR Sovereign Agent Lab & Law Library",
        "city": "Hyderabad",
        "state": "Telangana",
        "location": "Justice City, Shameerpet, Hyderabad 500101",
        "proximity": "NALSAR Law University Digital Informatics Center",
        "latitude": 17.595600,
        "longitude": 78.572400,
        "wifi_speed": "1 Gbps High-Speed Academic Link",
        "power_sockets": "Every study desk with universal dual outlets",
        "noise_level": "Quiet focus repository",
        "specialty": "Judicial Precedents Graph, Section 29A IBC Automations & BNS Cyber Datasets",
        "terminals": "10 High-spec Terminals with JupyterLab, HuggingFace Local Models & LangChain",
        "ai_books": "Foundations of Large Language Models, Prompt Engineering & Autonomous Agents, Insolvency Law & Restructuring Precedents (2016–2026)",
        "opening_hours": "09:00 AM – 10:00 PM",
        "directions_url": "https://maps.google.com/?q=17.5956,78.5724",
        "booking_url": "#reserve-library"
    },
    {
        "id": "lib-nujs-kolkata",
        "space_code": "SPACE-LB-005",
        "type": "library",
        "name": "WBNUJS AI Statutory Informatics Center",
        "city": "Kolkata",
        "state": "West Bengal",
        "location": "12 LB Block, Sector III, Salt Lake City, Kolkata 700098",
        "proximity": "National University of Juridical Sciences (Salt Lake)",
        "latitude": 22.570100,
        "longitude": 88.406700,
        "wifi_speed": "1 Gbps Optical Fiber",
        "power_sockets": "Built-in desk power strips & wireless phone charging pads",
        "noise_level": "Silent research hall",
        "specialty": "Commercial Drafting AI Corpora, Cross-Border Insolvency & Forensics",
        "terminals": "8 Development Terminals with Git, Docker & Sovereign Knowledge Graphs",
        "ai_books": "Designing Data-Intensive Applications, Machine Learning Engineering, Admiralty & Company Law Precedents Compendium",
        "opening_hours": "08:30 AM – 09:30 PM",
        "directions_url": "https://maps.google.com/?q=22.5701,88.4067",
        "booking_url": "#reserve-library"
    },
    {
        "id": "lib-chd-bar",
        "space_code": "SPACE-LB-006",
        "type": "library",
        "name": "Punjab & Haryana High Court Bar AI Library",
        "city": "Chandigarh",
        "state": "Punjab & Haryana",
        "location": "Capitol Complex, Sector 1, Chandigarh 160001",
        "proximity": "High Court Bar Association Heritage Building",
        "latitude": 30.758900,
        "longitude": 76.804900,
        "wifi_speed": "500 Mbps Dedicated Legal Network",
        "power_sockets": "Individual carrels with 3-pin universal sockets",
        "noise_level": "Chambers silent study environment",
        "specialty": "Criminal Jurisprudence (BNS 2023) & Criminal Procedure (BNSS 2023) AI Corpus",
        "terminals": "6 Dedicated Legal Research Workstations with All India Reporter & SCC Online AI",
        "ai_books": "Speech and Language Processing (Jurafsky), Probabilistic Graphical Models, Penal Code to BNS Comparative Concordance",
        "opening_hours": "09:00 AM – 07:00 PM",
        "directions_url": "https://maps.google.com/?q=30.7589,76.8049",
        "booking_url": "#reserve-library"
    },
    {
        "id": "lib-ils-pune",
        "space_code": "SPACE-LB-007",
        "type": "library",
        "name": "ILS Law College AI & Empirical Research Desk",
        "city": "Pune",
        "state": "Maharashtra",
        "location": "Law College Road, Shivajinagar, Pune 411004",
        "proximity": "ILS Law College Campus Library",
        "latitude": 18.517300,
        "longitude": 73.829300,
        "wifi_speed": "500 Mbps Campus Fiber",
        "power_sockets": "Power at all reading desks with surge protection",
        "noise_level": "Scholarly quiet zone",
        "specialty": "Legal Knowledge Engineering & Statutory Ontologies",
        "terminals": "8 Dual-Screen Workstations with VS Code, Ollama & Python LLM harnesses",
        "ai_books": "Hands-On Machine Learning with Scikit-Learn, Keras and TensorFlow, Deep Learning for NLP, Corporate Debt Restructuring Cases",
        "opening_hours": "08:00 AM – 08:00 PM",
        "directions_url": "https://maps.google.com/?q=18.5173,73.8293",
        "booking_url": "#reserve-library"
    },
    {
        "id": "lib-gnlu-ahmedabad",
        "space_code": "SPACE-LB-008",
        "type": "library",
        "name": "GNLU Autonomous Agentics & Legal AI Archive",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "location": "Attalika Avenue, Knowledge Corridor, Koba, Gandhinagar 382426",
        "proximity": "Gujarat National Law University Research Block",
        "latitude": 23.161000,
        "longitude": 72.636900,
        "wifi_speed": "1 Gbps Optical Backbone",
        "power_sockets": "Power carrels with modular surge-protected blocks",
        "noise_level": "Ultra-silent study sanctum",
        "specialty": "Cross-Border Trade Law, AI Governance & Maritime Dispute Resolution",
        "terminals": "10 Workstations configured for multi-agent legal simulations & mock arbitrations",
        "ai_books": "Reinforcement Learning from Human Feedback, Building Systems with the ChatGPT API, Law & Autonomous Systems Treatise",
        "opening_hours": "08:00 AM – 11:00 PM",
        "directions_url": "https://maps.google.com/?q=23.1610,72.6369",
        "booking_url": "#reserve-library"
    }
]

def main():
    print("Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
    cur = conn.cursor()

    # 1. Create table if not exists
    create_table_sql = """
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

    CREATE INDEX IF NOT EXISTS idx_agentic_spaces_type_city 
    ON agentic_spaces (type, city) 
    WHERE is_published = true;

    CREATE INDEX IF NOT EXISTS idx_agentic_spaces_published 
    ON agentic_spaces (is_published);
    """
    cur.execute(create_table_sql)
    conn.commit()
    print("Table agentic_spaces verified.")

    # 2. Upsert spaces
    upsert_sql = """
    INSERT INTO agentic_spaces (
        id, space_code, type, name, city, state, location, proximity,
        latitude, longitude, wifi_speed, power_sockets, noise_level,
        specialty, terminals, ai_books, opening_hours, directions_url, booking_url,
        is_published
    ) VALUES %s
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        location = EXCLUDED.location,
        proximity = EXCLUDED.proximity,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        wifi_speed = EXCLUDED.wifi_speed,
        power_sockets = EXCLUDED.power_sockets,
        noise_level = EXCLUDED.noise_level,
        specialty = EXCLUDED.specialty,
        terminals = EXCLUDED.terminals,
        ai_books = EXCLUDED.ai_books,
        opening_hours = EXCLUDED.opening_hours,
        directions_url = EXCLUDED.directions_url,
        booking_url = EXCLUDED.booking_url,
        is_published = EXCLUDED.is_published;
    """

    records = [
        (
            s["id"], s["space_code"], s["type"], s["name"], s["city"], s["state"],
            s["location"], s["proximity"], s["latitude"], s["longitude"],
            s["wifi_speed"], s["power_sockets"], s["noise_level"], s["specialty"],
            s["terminals"], s["ai_books"], s["opening_hours"], s["directions_url"],
            s["booking_url"], True
        )
        for s in SPACES
    ]

    execute_values(cur, upsert_sql, records)
    conn.commit()
    print(f"Upserted {len(records)} records into agentic_spaces.")

    # 3. Verification query
    cur.execute("SELECT type, COUNT(*) FROM agentic_spaces GROUP BY type ORDER BY type;")
    rows = cur.fetchall()
    print("Verified Space Counts in PostgreSQL:")
    for r in rows:
        print(f"  • {r[0]}: {r[1]} rows")

    cur.close()
    conn.close()
    print("Migration & Seeding completed successfully!")

if __name__ == "__main__":
    main()
