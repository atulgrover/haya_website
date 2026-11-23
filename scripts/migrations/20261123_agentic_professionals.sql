-- Supabase PostgreSQL Migration: Agentic Professionals
-- Target Schema: public
-- Table: agentic_professionals

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

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_agentic_professionals_role_city 
ON agentic_professionals (role, city);

CREATE INDEX IF NOT EXISTS idx_agentic_professionals_city 
ON agentic_professionals (city);
