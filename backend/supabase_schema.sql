-- ATS Emulator V2 Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    filename TEXT NOT NULL,
    file_size_bytes INTEGER,
    friendliness_score INTEGER CHECK (friendliness_score >= 0 AND friendliness_score <= 100),
    match_score FLOAT CHECK (match_score >= 0 AND match_score <= 100),
    result_json JSONB,
    resume_text TEXT,
    session_id UUID
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior')),
    ats_vendors TEXT[] DEFAULT ARRAY['workday', 'taleo', 'greenhouse', 'icims'],
    ats_success_rate FLOAT DEFAULT 1.0 CHECK (ats_success_rate >= 0 AND ats_success_rate <= 1.0),
    historical_score INTEGER DEFAULT 100,
    file_url TEXT,
    preview_image_url TEXT,
    description TEXT,
    sections TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (for tracking usage without auth)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_count INTEGER DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_templates_role ON templates(role);
CREATE INDEX IF NOT EXISTS idx_templates_experience_level ON templates(experience_level);
CREATE INDEX IF NOT EXISTS idx_templates_ats_vendors ON templates USING GIN(ats_vendors);

-- Create storage buckets (run these in Supabase Storage UI or via API)
-- Bucket: resumes (30-day auto-delete)
-- Bucket: templates (permanent)
-- Bucket: exports (7-day auto-delete)

-- Insert sample templates
INSERT INTO templates (id, name, role, experience_level, ats_vendors, ats_success_rate, historical_score, description) VALUES
('software_engineer_clean', 'Software Engineer - Clean', 'software-engineer', 'mid', ARRAY['workday', 'taleo', 'greenhouse'], 1.0, 95, 'Clean, ATS-friendly template for mid-level software engineers'),
('data_scientist_pro', 'Data Scientist - Professional', 'data-scientist', 'senior', ARRAY['workday', 'taleo', 'icims'], 1.0, 92, 'Professional template optimized for senior data science roles'),
('product_manager_universal', 'Product Manager - Universal', 'product-manager', 'mid', ARRAY['workday', 'taleo', 'greenhouse', 'icims'], 1.0, 98, 'Universal template compatible with all major ATS systems'),
('devops_technical', 'DevOps Engineer - Technical', 'devops', 'senior', ARRAY['workday', 'greenhouse'], 1.0, 90, 'Technical template for senior DevOps positions'),
('designer_creative', 'UX/UI Designer - Creative', 'designer', 'mid', ARRAY['workday', 'taleo', 'greenhouse', 'icims'], 1.0, 94, 'Creative yet ATS-safe template for design roles'),
('software_engineer_entry', 'Software Engineer - Entry Level', 'software-engineer', 'entry', ARRAY['workday', 'taleo', 'greenhouse', 'icims'], 1.0, 96, 'Perfect for new graduates and bootcamp grads')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (optional, for future auth)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, restrict later with auth)
CREATE POLICY "Allow all on analyses" ON analyses FOR ALL USING (true);
CREATE POLICY "Allow all on templates" ON templates FOR ALL USING (true);
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true);
