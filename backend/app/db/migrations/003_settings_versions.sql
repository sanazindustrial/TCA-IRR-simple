-- Migration: Settings Versioning for Module Configuration
-- This allows tracking all setting changes, reviewing different versions, and running simulations with specific settings

-- Table to store module settings versions
CREATE TABLE IF NOT EXISTS module_settings_versions (
    id SERIAL PRIMARY KEY,
    version_number INT NOT NULL,
    version_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Table to store the actual settings for each version
CREATE TABLE IF NOT EXISTS module_settings (
    id SERIAL PRIMARY KEY,
    version_id INT REFERENCES module_settings_versions(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL, -- tca, risk, macro, benchmark, growth, gap, founderFit, team, strategicFit
    module_name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    is_enabled BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 1,
    settings JSONB DEFAULT '{}',
    thresholds JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(version_id, module_id)
);

-- Table to store TCA category settings (12 categories)
CREATE TABLE IF NOT EXISTS tca_category_settings (
    id SERIAL PRIMARY KEY,
    version_id INT REFERENCES module_settings_versions(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    category_order INT NOT NULL,
    weight DECIMAL(5,2) NOT NULL DEFAULT 8.33, -- 100/12 = 8.33% each
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    factors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(version_id, category_name)
);

-- Table to store simulation runs using specific settings versions
CREATE TABLE IF NOT EXISTS simulation_runs (
    id SERIAL PRIMARY KEY,
    settings_version_id INT REFERENCES module_settings_versions(id),
    user_id INT REFERENCES users(id),
    company_name VARCHAR(255),
    analysis_id INT,
    
    -- Results
    tca_score DECIMAL(5,2),
    module_scores JSONB DEFAULT '{}', -- Stores individual module scores
    simulation_data JSONB DEFAULT '{}',
    
    -- Timestamp
    run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_module_settings_version ON module_settings(version_id);
CREATE INDEX IF NOT EXISTS idx_tca_settings_version ON tca_category_settings(version_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_version ON simulation_runs(settings_version_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_user ON simulation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_versions_active ON module_settings_versions(is_active);

-- Insert default version with 9 modules and 12 TCA categories
INSERT INTO module_settings_versions (version_number, version_name, description, is_active)
VALUES (1, 'Default Configuration v1.0', 'Initial system default settings for all 9 modules', TRUE)
ON CONFLICT DO NOTHING;

-- Insert default module settings (9 modules)
INSERT INTO module_settings (version_id, module_id, module_name, weight, is_enabled, priority) VALUES
(1, 'tca', 'TCA Scorecard', 20.00, TRUE, 1),
(1, 'risk', 'Risk Assessment', 15.00, TRUE, 2),
(1, 'macro', 'Macro Trend Analysis', 10.00, TRUE, 3),
(1, 'benchmark', 'Benchmark Comparison', 10.00, TRUE, 4),
(1, 'growth', 'Growth Classification', 10.00, TRUE, 5),
(1, 'gap', 'Gap Analysis', 10.00, TRUE, 6),
(1, 'founderFit', 'Founder Fit Analysis', 10.00, TRUE, 7),
(1, 'team', 'Team Assessment', 10.00, TRUE, 8),
(1, 'strategicFit', 'Strategic Fit Matrix', 5.00, TRUE, 9)
ON CONFLICT DO NOTHING;

-- Insert default TCA category settings (12 categories)
INSERT INTO tca_category_settings (version_id, category_name, category_order, weight, is_active, description) VALUES
(1, 'Leadership', 1, 20.00, TRUE, 'Founder experience and leadership track record'),
(1, 'Product-Market Fit', 2, 20.00, TRUE, 'Market validation, customer feedback, and product traction'),
(1, 'Team Strength', 3, 10.00, TRUE, 'Team experience, technical skills, and domain expertise'),
(1, 'Technology & IP', 4, 10.00, TRUE, 'Tech innovation, IP portfolio, and technical moat'),
(1, 'Business Model & Financials', 5, 10.00, TRUE, 'Revenue model, financial metrics, and burn rate'),
(1, 'Go-to-Market Strategy', 6, 10.00, TRUE, 'Sales strategy, marketing approach, and customer acquisition'),
(1, 'Competition & Moat', 7, 5.00, TRUE, 'Competitive advantage and market differentiation'),
(1, 'Market Potential', 8, 5.00, TRUE, 'Market size, growth rate, and market timing'),
(1, 'Traction', 9, 5.00, TRUE, 'Customer growth, revenue growth, and partnerships'),
(1, 'Scalability', 10, 2.50, TRUE, 'Technical and business scalability'),
(1, 'Risk Assessment', 11, 2.50, TRUE, 'Identified risks and mitigation strategies'),
(1, 'Exit Potential', 12, 0.00, TRUE, 'Acquisition targets and IPO potential')
ON CONFLICT DO NOTHING;
