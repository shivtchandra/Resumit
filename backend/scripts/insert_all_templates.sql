-- SQL to insert/update templates for all categories
-- REPLACE 'YOUR_PROJECT_REF' with your actual project reference (btcildrnwthlwmvmhrmc)

-- 1. Software Engineer (Mid-Level)
INSERT INTO templates (name, role, experience_level, ats_compatibility, ats_success_rate, historical_score, preview_image_url, file_url, sections)
VALUES (
    'Software Engineer - ATS Optimized',
    'software-engineer',
    'mid',
    ARRAY['workday', 'taleo', 'greenhouse', 'icims'],
    1.0,
    98,
    'https://btcildrnwthlwmvmhrmc.supabase.co/storage/v1/object/public/templates/software_engineer_mid.pdf',
    'https://btcildrnwthlwmvmhrmc.supabase.co/storage/v1/object/public/templates/software_engineer_mid.pdf',
    '[
        {"name": "contact", "heading": "Contact Information", "order": 0, "guidance": "Name, Email, Phone, LinkedIn", "placeholder": "John Doe | john@email.com..."},
        {"name": "summary", "heading": "Professional Summary", "order": 1, "guidance": "Brief overview of skills and experience", "placeholder": "Software Engineer with 5+ years..."},
        {"name": "experience", "heading": "Professional Experience", "order": 2, "guidance": "Reverse chronological work history", "placeholder": "Senior Software Engineer..."},
        {"name": "education", "heading": "Education", "order": 3, "guidance": "Degrees and certifications", "placeholder": "B.S. Computer Science..."},
        {"name": "skills", "heading": "Technical Skills", "order": 4, "guidance": "List of technical skills", "placeholder": "Python, JavaScript, SQL..."}
    ]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
    preview_image_url = EXCLUDED.preview_image_url,
    file_url = EXCLUDED.file_url;

-- 2. Data Scientist (Senior)
INSERT INTO templates (name, role, experience_level, ats_compatibility, ats_success_rate, historical_score, preview_image_url, file_url, sections)
VALUES (
    'Data Scientist - Professional',
    'data-scientist',
    'senior',
    ARRAY['workday', 'greenhouse', 'lever'],
    1.0,
    99,
    'https://btcildrnwthlwmvmhrmc.supabase.co/storage/v1/object/public/templates/data_scientist_senior.pdf',
    'https://btcildrnwthlwmvmhrmc.supabase.co/storage/v1/object/public/templates/data_scientist_senior.pdf',
    '[
        {"name": "contact", "heading": "Contact Information", "order": 0, "guidance": "Name, Email, Phone, LinkedIn", "placeholder": "Jane Smith | jane@email.com..."},
        {"name": "summary", "heading": "Professional Summary", "order": 1, "guidance": "Focus on ML/AI impact", "placeholder": "Senior Data Scientist with 7+ years..."},
        {"name": "experience", "heading": "Professional Experience", "order": 2, "guidance": "Quantifiable achievements", "placeholder": "Senior Data Scientist..."},
        {"name": "education", "heading": "Education", "order": 3, "guidance": "Advanced degrees", "placeholder": "M.S. Data Science..."},
        {"name": "skills", "heading": "Technical Skills", "order": 4, "guidance": "ML frameworks and languages", "placeholder": "Python, R, TensorFlow..."}
    ]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
    preview_image_url = EXCLUDED.preview_image_url,
    file_url = EXCLUDED.file_url;

-- 3. Product Manager (Mid-Level)
INSERT INTO templates (name, role, experience_level, ats_compatibility, ats_success_rate, historical_score, preview_image_url, file_url, sections)
VALUES (
    'Product Manager - Universal',
    'product-manager',
    'mid',
    ARRAY['workday', 'taleo', 'greenhouse'],
    1.0,
    97,
    'https://btcildrnwthlwmvmhrmc.supabase.co/storage/v1/object/public/templates/product_manager_mid.pdf',
    'https://btcildrnwthlwmvmhrmc.supabase.co/storage/v1/object/public/templates/product_manager_mid.pdf',
    '[
        {"name": "contact", "heading": "Contact Information", "order": 0, "guidance": "Name, Email, Phone, LinkedIn", "placeholder": "Alex Johnson | alex@email.com..."},
        {"name": "summary", "heading": "Professional Summary", "order": 1, "guidance": "Product strategy focus", "placeholder": "Product Manager with 6+ years..."},
        {"name": "experience", "heading": "Professional Experience", "order": 2, "guidance": "Product launches and metrics", "placeholder": "Senior Product Manager..."},
        {"name": "education", "heading": "Education", "order": 3, "guidance": "Degrees", "placeholder": "B.B.A. Business..."},
        {"name": "skills", "heading": "Skills", "order": 4, "guidance": "Tools and methodologies", "placeholder": "Jira, Figma, Agile..."}
    ]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
    preview_image_url = EXCLUDED.preview_image_url,
    file_url = EXCLUDED.file_url;

-- 4. Designer (Mid-Level) - NEW!
INSERT INTO templates (name, role, experience_level, ats_compatibility, ats_success_rate, historical_score, preview_image_url, file_url, sections)
VALUES (
    'UX/UI Designer - ATS Readable',
    'designer',
    'mid',
    ARRAY['workday', 'greenhouse', 'lever', 'icims'],
    1.0,
    96,
    'https://btcildrnwthlwmvmhrmc.supabase.co/storage/v1/object/public/templates/designer_ux_mid.pdf',
    'https://btcildrnwthlwmvmhrmc.supabase.co/storage/v1/object/public/templates/designer_ux_mid.pdf',
    '[
        {"name": "contact", "heading": "Contact Information", "order": 0, "guidance": "Name, Email, Phone, Portfolio Link", "placeholder": "Sarah Lee | sarah@email.com..."},
        {"name": "summary", "heading": "Professional Summary", "order": 1, "guidance": "Design philosophy and impact", "placeholder": "UX/UI Designer with 5 years..."},
        {"name": "experience", "heading": "Professional Experience", "order": 2, "guidance": "Design projects and outcomes", "placeholder": "Senior UX Designer..."},
        {"name": "education", "heading": "Education", "order": 3, "guidance": "Design degrees", "placeholder": "B.F.A. Interaction Design..."},
        {"name": "skills", "heading": "Skills", "order": 4, "guidance": "Design tools and code", "placeholder": "Figma, Sketch, HTML/CSS..."}
    ]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
    preview_image_url = EXCLUDED.preview_image_url,
    file_url = EXCLUDED.file_url;
