#!/usr/bin/env python3
"""
Seed script for Supabase PostgreSQL table: agentic_professionals
Seeds verified professionals and learners across Indian cities.
"""

import os
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres.rybbbqdwmjzgsdxyrjgt:08BOFwyfwWuCjHdT@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
)

PROFESSIONALS = [
    {
        "id": "pro-1",
        "slug": "sanjay-kumar-gupta",
        "name": "Sanjay Kumar Gupta",
        "role": "ip",
        "designation": "Insolvency Professional",
        "reg_no": "IBBI/IPA-002/IP-N00124/2017-2018/10311",
        "firm": "Deloitte Touche Tohmatsu India LLP",
        "bench": "NCLT Ahmedabad",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "latitude": 23.022500,
        "longitude": 72.571400,
        "email": "sgupta.ip@deloitte.com",
        "phone": "+91 79 6671 2000",
        "initials": "SG",
        "is_verified": True,
        "specialization": "Heavy Industrial, Power & Utilities CIRP",
        "bio": "Empaneled Insolvency Professional with extensive resolution experience in heavy manufacturing, energy sector restructuring, and cross-border assets under IBC 2016.",
        "active_mandates": 3
    },
    {
        "id": "pro-2",
        "slug": "anuj-jain",
        "name": "Anuj Jain",
        "role": "ip",
        "designation": "Senior Insolvency Professional",
        "reg_no": "IBBI/IPA-001/IP-P00088/2017-2018/10184",
        "firm": "PricewaterhouseCoopers",
        "bench": "NCLT New Delhi (Principal Bench)",
        "city": "Delhi NCR",
        "state": "Delhi",
        "latitude": 28.613900,
        "longitude": 77.209000,
        "email": "anuj.jain.ip@pwc.com",
        "phone": "+91 11 4115 0000",
        "initials": "AJ",
        "is_verified": True,
        "specialization": "Real Estate & Mega Infrastructure",
        "bio": "Lead Resolution Professional in landmark real estate restructuring matters with multi-lender committee coordination under CIRP regulations.",
        "active_mandates": 2
    },
    {
        "id": "pro-3",
        "slug": "milind-kasodekar",
        "name": "Milind Kasodekar",
        "role": "ip",
        "designation": "Partner - Insolvency & Restructuring",
        "reg_no": "IBBI/IPA-002/IP-N00112/2017-2018/10280",
        "firm": "KPMG India",
        "bench": "NCLT Mumbai (Court-I)",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 18.930400,
        "longitude": 72.831700,
        "email": "mkasodekar.ip@kpmg.com",
        "phone": "+91 22 3090 1000",
        "initials": "MK",
        "is_verified": True,
        "specialization": "EPC Contracting, Ports & Aviation Logistics",
        "bio": "Over 20 years in corporate turnaround and forensic valuation. Registered Insolvency Professional with high liquidation and resolution success rate.",
        "active_mandates": 4
    },
    {
        "id": "pro-4",
        "slug": "adv-radhika-sharma",
        "name": "Adv. Radhika Sharma",
        "role": "advocate",
        "designation": "High Court Senior Advocate",
        "reg_no": "D/1420/2012 (Bar Council of Delhi)",
        "firm": "Sharma & Associates Chambers",
        "bench": "Delhi High Court & Saket District Court",
        "city": "Delhi NCR",
        "state": "Delhi",
        "latitude": 28.520400,
        "longitude": 77.201500,
        "email": "radhika@sharmachambers.in",
        "phone": "+91 11 2651 8840",
        "initials": "RS",
        "is_verified": True,
        "specialization": "Commercial Disputes, BNS Cyber Forensics & IBC Appeals",
        "bio": "Practicing Advocate representing lenders and resolution applicants before NCLAT and the Supreme Court of India. Regular speaker on Agentic NSQF legal standards.",
        "active_mandates": 6
    },
    {
        "id": "pro-5",
        "slug": "dr-vikram-aditya-nair",
        "name": "Dr. Vikram Aditya Nair",
        "role": "cyber_specialist",
        "designation": "Chief Cyber Forensic Analyst & BNS Specialist",
        "reg_no": "DSCI/CE-2021/889",
        "firm": "National Digital Forensics & Cyber Jurisprudence Center",
        "bench": "Cyber Police Cells & High Court of Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "latitude": 12.971600,
        "longitude": 77.594600,
        "email": "vikram.nair@cyberjuris.org",
        "phone": "+91 80 4120 7765",
        "initials": "VN",
        "is_verified": True,
        "specialization": "BNS Section 111 Organized Cyber Crime & Electronic Evidences",
        "bio": "Certified digital forensics expert specializing in Section 65B/BNS 2023 evidentiary compliance, sovereign LLM inference for evidence hashing, and blockchain tracing.",
        "active_mandates": 5
    },
    {
        "id": "pro-6",
        "slug": "adv-kavita-krishnan",
        "name": "Adv. Kavita Krishnan",
        "role": "advocate",
        "designation": "Commercial & Appellate Counsel",
        "reg_no": "KAR/892/2015 (Karnataka Bar Council)",
        "firm": "Apex Law Partners",
        "bench": "High Court of Karnataka (Vidhana Soudha)",
        "city": "Bengaluru",
        "state": "Karnataka",
        "latitude": 12.986600,
        "longitude": 77.597500,
        "email": "kavita@apexlawpartners.com",
        "phone": "+91 80 2221 4450",
        "initials": "KK",
        "is_verified": True,
        "specialization": "Commercial Contracts, CPC Section 89 Mediation & Arbitration",
        "bio": "Senior counsel in cross-border commercial contracts and dispute resolution. Empaneled mediator with over 150 successfully settled commercial disputes.",
        "active_mandates": 4
    },
    {
        "id": "pro-7",
        "slug": "rajesh-subramanian",
        "name": "Rajesh Subramanian",
        "role": "valuer",
        "designation": "Registered Valuer (Securities & Financial Assets)",
        "reg_no": "IBBI/RV/06/2019/11045",
        "firm": "Sundaram & Subramanian Valuation Advisory",
        "bench": "NCLT Hyderabad Bench",
        "city": "Hyderabad",
        "state": "Telangana",
        "latitude": 17.415600,
        "longitude": 78.434700,
        "email": "rajesh.val@ssadvisory.in",
        "phone": "+91 40 2335 9901",
        "initials": "RS",
        "is_verified": True,
        "specialization": "Liquidation Value Audits & Intangible AI Assets",
        "bio": "IBBI-registered valuer with over 80 statutory CIRP valuation reports submitted across NCLT benches. Pioneer in valuing algorithmic models and data pipelines.",
        "active_mandates": 7
    },
    {
        "id": "pro-8",
        "slug": "prof-arundhati-sen",
        "name": "Prof. Arundhati Sen",
        "role": "researcher",
        "designation": "Chair Professor & Computational Law Researcher",
        "reg_no": "NUJS/FAC/2018/042",
        "firm": "WBNUJS Legal Informatics Center",
        "bench": "Calcutta High Court Precinct",
        "city": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.570100,
        "longitude": 88.406700,
        "email": "asen@nujs.edu",
        "phone": "+91 33 2335 7379",
        "initials": "AS",
        "is_verified": True,
        "specialization": "Agentic NSQF Curriculum & Legal Knowledge Graphs",
        "bio": "Principal investigator on legal ontologies, judicial decision prediction models, and statutory graph reasoning frameworks for Indian law.",
        "active_mandates": 2
    },
    {
        "id": "pro-9",
        "slug": "adv-harpreet-singh",
        "name": "Adv. Harpreet Singh",
        "role": "advocate",
        "designation": "Criminal Jurisprudence Counsel",
        "reg_no": "PH/3421/2011",
        "firm": "Capitol Chambers",
        "bench": "Punjab & Haryana High Court",
        "city": "Chandigarh",
        "state": "Punjab & Haryana",
        "latitude": 30.758900,
        "longitude": 76.804900,
        "email": "harpreet@capitolchambers.law",
        "phone": "+91 172 274 0012",
        "initials": "HS",
        "is_verified": True,
        "specialization": "BNS 2023 Statutory Transition & Appellate Defense",
        "bio": "Trial lawyer and author of comparative commentaries between IPC and Bharatiya Nyaya Sanhita (BNS 2023). Regular counsel before the High Court.",
        "active_mandates": 5
    },
    {
        "id": "pro-10",
        "slug": "tanya-mehta",
        "name": "Tanya Mehta",
        "role": "learner",
        "designation": "Agentic AI Apprentice & Law Scholar",
        "reg_no": "NLSIU/LLB-AI/2024/019",
        "firm": "National Law School of India University",
        "bench": "NLSIU AI & Computational Law Commons",
        "city": "Bengaluru",
        "state": "Karnataka",
        "latitude": 12.955800,
        "longitude": 77.512600,
        "email": "tanya.mehta@nlsiu.ac.in",
        "phone": "+91 80 2316 0532",
        "initials": "TM",
        "is_verified": True,
        "specialization": "Prompt Engineering for Legal Discovery & NSQF L7.0",
        "bio": "Graduate researcher in agentic workflows, multi-agent arbitration simulations, and air-gapped legal assistance tools.",
        "active_mandates": 1
    }
]

def main():
    print("Connecting to Supabase PostgreSQL for agentic_professionals...")
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
    cur = conn.cursor()

    # 1. Create table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS agentic_professionals (
        id VARCHAR(50) PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('ip', 'advocate', 'cyber_specialist', 'valuer', 'arbitrator', 'researcher', 'learner')),
        designation VARCHAR(255) NOT NULL,
        reg_no VARCHAR(100),
        firm VARCHAR(255),
        bench VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        latitude NUMERIC(10, 6) NOT NULL,
        longitude NUMERIC(10, 6) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        initials VARCHAR(10),
        is_verified BOOLEAN DEFAULT true NOT NULL,
        specialization TEXT,
        bio TEXT,
        active_mandates INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_agentic_professionals_role_city 
    ON agentic_professionals (role, city);

    CREATE INDEX IF NOT EXISTS idx_agentic_professionals_city 
    ON agentic_professionals (city);
    """
    cur.execute(create_table_sql)
    conn.commit()
    print("Table agentic_professionals verified.")

    # 2. Upsert professionals
    upsert_sql = """
    INSERT INTO agentic_professionals (
        id, slug, name, role, designation, reg_no, firm, bench,
        city, state, latitude, longitude, email, phone, initials,
        is_verified, specialization, bio, active_mandates
    ) VALUES %s
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        designation = EXCLUDED.designation,
        reg_no = EXCLUDED.reg_no,
        firm = EXCLUDED.firm,
        bench = EXCLUDED.bench,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        initials = EXCLUDED.initials,
        is_verified = EXCLUDED.is_verified,
        specialization = EXCLUDED.specialization,
        bio = EXCLUDED.bio,
        active_mandates = EXCLUDED.active_mandates;
    """

    records = [
        (
            p["id"], p["slug"], p["name"], p["role"], p["designation"],
            p["reg_no"], p["firm"], p["bench"], p["city"], p["state"],
            p["latitude"], p["longitude"], p["email"], p["phone"],
            p["initials"], p["is_verified"], p["specialization"],
            p["bio"], p["active_mandates"]
        )
        for p in PROFESSIONALS
    ]

    execute_values(cur, upsert_sql, records)
    conn.commit()
    print(f"Upserted {len(records)} records into agentic_professionals.")

    # Verification query
    cur.execute("SELECT role, COUNT(*) FROM agentic_professionals GROUP BY role ORDER BY role;")
    rows = cur.fetchall()
    print("Verified Professional Counts in PostgreSQL:")
    for r in rows:
        print(f"  • {r[0]}: {r[1]} practitioners")

    cur.close()
    conn.close()
    print("Seeding of agentic_professionals completed successfully!")

if __name__ == "__main__":
    main()
