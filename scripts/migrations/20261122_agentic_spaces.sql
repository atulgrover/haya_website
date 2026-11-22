-- Supabase PostgreSQL Migration: Agentic Spaces Radar
-- Target Schema: public
-- Table: agentic_spaces

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

-- Indexing for high-speed geospatial and category queries
CREATE INDEX IF NOT EXISTS idx_agentic_spaces_type_city 
ON agentic_spaces (type, city) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_agentic_spaces_published 
ON agentic_spaces (is_published);
