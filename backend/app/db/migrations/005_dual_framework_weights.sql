-- Migration: Add Dual Framework Weights (General + MedTech) to TCA Categories
-- This enables different weight configurations for General Tech vs MedTech/Life Sciences

-- Add MedTech weight column to TCA category settings
ALTER TABLE tca_category_settings 
ADD COLUMN IF NOT EXISTS medtech_weight DECIMAL(5,2) DEFAULT 8.33;

-- Add MedTech active flag to TCA category settings
ALTER TABLE tca_category_settings 
ADD COLUMN IF NOT EXISTS is_medtech_active BOOLEAN DEFAULT TRUE;

-- Update existing category weights with proper MedTech weights
UPDATE tca_category_settings SET medtech_weight = 15.0, is_medtech_active = TRUE WHERE category_name = 'Leadership';
UPDATE tca_category_settings SET medtech_weight = 15.0, is_medtech_active = TRUE WHERE category_name = 'Product-Market Fit';
UPDATE tca_category_settings SET medtech_weight = 10.0, is_medtech_active = TRUE WHERE category_name = 'Team Strength';
UPDATE tca_category_settings SET medtech_weight = 10.0, is_medtech_active = TRUE WHERE category_name = 'Technology & IP';
UPDATE tca_category_settings SET medtech_weight = 10.0, is_medtech_active = TRUE WHERE category_name = 'Business Model & Financials';
UPDATE tca_category_settings SET medtech_weight = 5.0, is_medtech_active = TRUE WHERE category_name = 'Go-to-Market Strategy';
UPDATE tca_category_settings SET medtech_weight = 5.0, is_medtech_active = TRUE WHERE category_name = 'Competition & Moat';
UPDATE tca_category_settings SET medtech_weight = 5.0, is_medtech_active = TRUE WHERE category_name = 'Market Potential';
UPDATE tca_category_settings SET medtech_weight = 5.0, is_medtech_active = TRUE WHERE category_name = 'Traction';
UPDATE tca_category_settings SET medtech_weight = 0.0, is_medtech_active = FALSE WHERE category_name = 'Scalability';
UPDATE tca_category_settings SET medtech_weight = 0.0, is_medtech_active = FALSE WHERE category_name = 'Risk Assessment';
UPDATE tca_category_settings SET medtech_weight = 0.0, is_medtech_active = FALSE WHERE category_name = 'Exit Potential';

-- Insert Regulatory category for MedTech (not applicable for General Tech)
INSERT INTO tca_category_settings (version_id, category_name, category_order, weight, medtech_weight, is_active, is_medtech_active, description)
SELECT 
    1, 
    'Regulatory', 
    12, 
    0.0,
    15.0,
    FALSE,
    TRUE,
    'Regulatory compliance and approval pathway for MedTech companies'
WHERE NOT EXISTS (
    SELECT 1 FROM tca_category_settings WHERE category_name = 'Regulatory' AND version_id = 1
);

-- Add framework type to risk domains table if exists
ALTER TABLE risk_domains 
ADD COLUMN IF NOT EXISTS tech_weight DECIMAL(5,2) DEFAULT 10.0;

ALTER TABLE risk_domains 
ADD COLUMN IF NOT EXISTS med_weight DECIMAL(5,2) DEFAULT 10.0;

-- Create risk domains table if not exists with dual weights
CREATE TABLE IF NOT EXISTS ssd_risk_domains (
    id SERIAL PRIMARY KEY,
    domain_name VARCHAR(100) NOT NULL,
    tech_weight DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    med_weight DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    is_enabled BOOLEAN DEFAULT TRUE,
    domain_order INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default SSD risk domains with dual weights (matching frontend config)
INSERT INTO ssd_risk_domains (domain_name, tech_weight, med_weight, is_enabled, domain_order) VALUES
('Regulatory / Compliance', 5.0, 15.0, TRUE, 1),
('Clinical / Safety / Product Safety', 5.0, 15.0, TRUE, 2),
('Liability / Legal Exposure', 5.0, 10.0, TRUE, 3),
('Technical Execution Risk', 12.0, 8.0, TRUE, 4),
('Market Risk', 10.0, 8.0, TRUE, 5),
('Go-To-Market (GTM) Risk', 10.0, 5.0, TRUE, 6),
('Financial Risk', 10.0, 10.0, TRUE, 7),
('Team / Execution Risk', 8.0, 8.0, TRUE, 8),
('IP / Defensibility Risk', 8.0, 10.0, TRUE, 9),
('Data Privacy / Governance', 7.0, 5.0, TRUE, 10),
('Security / Cyber Risk', 7.0, 5.0, TRUE, 11),
('Operational / Supply Chain', 5.0, 6.0, TRUE, 12),
('Ethical / Societal Risk', 4.0, 3.0, TRUE, 13),
('Adoption / Customer Retention Risk', 4.0, 2.0, TRUE, 14)
ON CONFLICT DO NOTHING;

-- Create risk penalty table for SSD
CREATE TABLE IF NOT EXISTS ssd_risk_penalties (
    id SERIAL PRIMARY KEY,
    flag_id VARCHAR(20) NOT NULL UNIQUE,
    flag_label VARCHAR(50) NOT NULL,
    tech_penalty DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    med_penalty DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default risk penalties
INSERT INTO ssd_risk_penalties (flag_id, flag_label, tech_penalty, med_penalty) VALUES
('green', '🟢 Green', 0.0, 0.0),
('yellow', '🟡 Yellow', -0.5, -1.0),
('red', '🔴 Red', -3.0, -6.0)
ON CONFLICT DO NOTHING;

-- Add normalization_key to configs for frontend compatibility
ALTER TABLE tca_category_settings 
ADD COLUMN IF NOT EXISTS normalization_key VARCHAR(50);

-- Update normalization keys for TCA categories
UPDATE tca_category_settings SET normalization_key = 'leadership' WHERE category_name = 'Leadership';
UPDATE tca_category_settings SET normalization_key = 'pmf' WHERE category_name = 'Product-Market Fit';
UPDATE tca_category_settings SET normalization_key = 'team' WHERE category_name = 'Team Strength';
UPDATE tca_category_settings SET normalization_key = 'tech' WHERE category_name = 'Technology & IP';
UPDATE tca_category_settings SET normalization_key = 'financials' WHERE category_name = 'Business Model & Financials';
UPDATE tca_category_settings SET normalization_key = 'gtm' WHERE category_name = 'Go-to-Market Strategy';
UPDATE tca_category_settings SET normalization_key = 'competition' WHERE category_name = 'Competition & Moat';
UPDATE tca_category_settings SET normalization_key = 'market' WHERE category_name = 'Market Potential';
UPDATE tca_category_settings SET normalization_key = 'traction' WHERE category_name = 'Traction';
UPDATE tca_category_settings SET normalization_key = 'scalability' WHERE category_name = 'Scalability';
UPDATE tca_category_settings SET normalization_key = 'risk' WHERE category_name = 'Risk Assessment';
UPDATE tca_category_settings SET normalization_key = 'regulatory' WHERE category_name = 'Regulatory';
UPDATE tca_category_settings SET normalization_key = 'exit' WHERE category_name = 'Exit Potential';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ssd_risk_domains_enabled ON ssd_risk_domains(is_enabled);
CREATE INDEX IF NOT EXISTS idx_tca_category_normalization ON tca_category_settings(normalization_key);
