-- Create templates table for ATS Emulator V2
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    ats_vendors TEXT[] NOT NULL DEFAULT '{}',
    ats_success_rate FLOAT NOT NULL DEFAULT 1.0,
    historical_score INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    preview_image_url TEXT,
    file_url TEXT,
    sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on role for faster filtering
CREATE INDEX IF NOT EXISTS idx_templates_role ON public.templates(role);

-- Create index on experience_level for faster filtering
CREATE INDEX IF NOT EXISTS idx_templates_experience_level ON public.templates(experience_level);

-- Create index on historical_score for sorting
CREATE INDEX IF NOT EXISTS idx_templates_historical_score ON public.templates(historical_score DESC);

-- Enable Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.templates
    FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert/update" ON public.templates
    FOR ALL
    USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.templates IS 'ATS-optimized resume templates with section structure and compatibility data';
COMMENT ON COLUMN public.templates.ats_vendors IS 'Array of ATS vendor names this template is compatible with';
COMMENT ON COLUMN public.templates.sections IS 'JSON array of section objects with name, heading, guidance, placeholder, and order';
COMMENT ON COLUMN public.templates.historical_score IS 'Ranking metric for template quality/popularity';
