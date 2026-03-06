-- ===============================================
-- TCA IRR Platform Database Schema - Azure PostgreSQL Compatible
-- ===============================================

-- ===============================================
-- 1. ENUMS AND TYPES
-- ===============================================

-- User roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Reviewer', 'User', 'AI Adopter', 'Analyst', 'Investment Manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Evaluation status enum
DO $$ BEGIN
    CREATE TYPE evaluation_status AS ENUM ('Draft', 'In Review', 'Completed', 'Approved', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Request status enum
DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('Pending', 'In Progress', 'Completed', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===============================================
-- 2. CORE TABLES (NO FOREIGN KEYS YET)
-- ===============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'User',
    avatar_url VARCHAR(1024),
    status VARCHAR(20) DEFAULT 'Active',
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional profile fields
    department VARCHAR(100),
    job_title VARCHAR(100),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Security fields
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    
    -- Audit fields (no FK constraint yet)
    created_by UUID,
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User quotas table
CREATE TABLE IF NOT EXISTS user_quotas (
    quota_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    monthly_evaluations INTEGER DEFAULT 50,
    current_usage INTEGER DEFAULT 0,
    reset_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(512),
    industry VARCHAR(100),
    sector VARCHAR(100),
    stage VARCHAR(50),
    founded_year INTEGER,
    employee_count INTEGER,
    headquarters VARCHAR(255),
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Business metrics
    revenue DECIMAL(15,2),
    burn_rate DECIMAL(15,2),
    runway_months INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Company founders table
CREATE TABLE IF NOT EXISTS company_founders (
    founder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    background TEXT,
    linkedin_url VARCHAR(512),
    email VARCHAR(255),
    equity_percentage DECIMAL(5,2),
    
    -- Experience metrics
    years_experience INTEGER,
    previous_exits BOOLEAN DEFAULT FALSE,
    domain_expertise TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status evaluation_status DEFAULT 'Draft',
    
    -- TCA Scorecard components
    team_score DECIMAL(4,2),
    customer_score DECIMAL(4,2),
    asset_score DECIMAL(4,2),
    overall_score DECIMAL(4,2),
    
    -- Analysis results (stored as JSONB)
    team_assessment JSONB,
    founder_fit_analysis JSONB,
    macro_trend_alignment JSONB,
    benchmark_comparison JSONB,
    comprehensive_analysis JSONB,
    gap_analysis JSONB,
    risk_flags_and_mitigation JSONB,
    strategic_fit_matrix JSONB,
    growth_classifier JSONB,
    
    -- Meta information
    version INTEGER DEFAULT 1,
    ai_confidence_score DECIMAL(4,2),
    processing_time_seconds INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Full-text search
    search_vector TSVECTOR
);

-- Evaluation modules table
CREATE TABLE IF NOT EXISTS evaluation_modules (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    module_config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'Pending',
    result JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App requests table
CREATE TABLE IF NOT EXISTS app_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID,
    request_type VARCHAR(50) NOT NULL,
    status request_status DEFAULT 'Pending',
    priority VARCHAR(20) DEFAULT 'Medium',
    
    -- Request details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements JSONB,
    attachments TEXT[],
    
    -- Assignment and review
    reviewer_id UUID,
    assigned_to UUID,
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    
    -- Dates
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Request comments table
CREATE TABLE IF NOT EXISTS request_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industry benchmarks table
CREATE TABLE IF NOT EXISTS industry_benchmarks (
    benchmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry VARCHAR(100) NOT NULL,
    sector VARCHAR(100),
    stage VARCHAR(50),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    percentile_25 DECIMAL(15,4),
    percentile_50 DECIMAL(15,4),
    percentile_75 DECIMAL(15,4),
    percentile_90 DECIMAL(15,4),
    sample_size INTEGER,
    data_source VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Report templates table
CREATE TABLE IF NOT EXISTS report_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Generated reports table
CREATE TABLE IF NOT EXISTS generated_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL,
    template_id UUID,
    user_id UUID NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_content JSONB NOT NULL,
    file_path VARCHAR(1024),
    file_format VARCHAR(20) DEFAULT 'PDF',
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'Generated',
    file_size_bytes BIGINT,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    request_data JSONB,
    context JSONB,
    severity VARCHAR(20) DEFAULT 'ERROR',
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 3. CREATE INDEXES
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_stage ON companies(stage);

CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_company_id ON evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_search ON evaluations USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_app_requests_user_id ON app_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_app_requests_status ON app_requests(status);
CREATE INDEX IF NOT EXISTS idx_app_requests_created_at ON app_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ===============================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- ===============================================

-- User-related foreign keys
ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE user_quotas ADD CONSTRAINT fk_user_quotas_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Company-related foreign keys
ALTER TABLE companies ADD CONSTRAINT fk_companies_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id);

ALTER TABLE company_founders ADD CONSTRAINT fk_company_founders_company_id 
FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE;

-- Evaluation-related foreign keys
ALTER TABLE evaluations ADD CONSTRAINT fk_evaluations_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE evaluations ADD CONSTRAINT fk_evaluations_company_id 
FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE;

ALTER TABLE evaluation_modules ADD CONSTRAINT fk_evaluation_modules_evaluation_id 
FOREIGN KEY (evaluation_id) REFERENCES evaluations(evaluation_id) ON DELETE CASCADE;

-- Request-related foreign keys
ALTER TABLE app_requests ADD CONSTRAINT fk_app_requests_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE app_requests ADD CONSTRAINT fk_app_requests_company_id 
FOREIGN KEY (company_id) REFERENCES companies(company_id);

ALTER TABLE app_requests ADD CONSTRAINT fk_app_requests_reviewer_id 
FOREIGN KEY (reviewer_id) REFERENCES users(user_id);

ALTER TABLE app_requests ADD CONSTRAINT fk_app_requests_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES users(user_id);

ALTER TABLE request_comments ADD CONSTRAINT fk_request_comments_request_id 
FOREIGN KEY (request_id) REFERENCES app_requests(request_id) ON DELETE CASCADE;

ALTER TABLE request_comments ADD CONSTRAINT fk_request_comments_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- System-related foreign keys
ALTER TABLE system_config ADD CONSTRAINT fk_system_config_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id);

ALTER TABLE report_templates ADD CONSTRAINT fk_report_templates_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id);

ALTER TABLE generated_reports ADD CONSTRAINT fk_generated_reports_evaluation_id 
FOREIGN KEY (evaluation_id) REFERENCES evaluations(evaluation_id) ON DELETE CASCADE;

ALTER TABLE generated_reports ADD CONSTRAINT fk_generated_reports_template_id 
FOREIGN KEY (template_id) REFERENCES report_templates(template_id);

ALTER TABLE generated_reports ADD CONSTRAINT fk_generated_reports_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Audit-related foreign keys
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE error_logs ADD CONSTRAINT fk_error_logs_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Self-referencing foreign key for users
ALTER TABLE users ADD CONSTRAINT fk_users_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id);

-- ===============================================
-- 5. CREATE SAMPLE DATA
-- ===============================================

-- Insert default system admin user (password: admin123)
INSERT INTO users (user_id, full_name, email, password_hash, role, email_verified, status) 
VALUES (
    gen_random_uuid(),
    'System Administrator',
    'admin@tcairr.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.s5.e.6',
    'Admin',
    TRUE,
    'Active'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample user (password: user123)
INSERT INTO users (user_id, full_name, email, password_hash, role, email_verified, status) 
VALUES (
    gen_random_uuid(),
    'John Doe',
    'user@tcairr.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.s5.e.6',
    'User',
    TRUE,
    'Active'
) ON CONFLICT (email) DO NOTHING;

-- Insert basic system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
    ('app_name', '"TCA IRR Platform"', 'Application name'),
    ('app_version', '"1.0.0"', 'Current application version'),
    ('max_evaluations_per_user', '50', 'Maximum evaluations per user per month'),
    ('ai_confidence_threshold', '0.8', 'Minimum AI confidence score for auto-approval')
ON CONFLICT (config_key) DO NOTHING;

-- Insert sample industry benchmarks
INSERT INTO industry_benchmarks (industry, sector, stage, metric_name, metric_value, percentile_25, percentile_50, percentile_75, percentile_90, sample_size, data_source)
VALUES 
    ('Technology', 'SaaS', 'Series A', 'ARR Growth Rate', 200.0, 150.0, 200.0, 300.0, 500.0, 1000, 'SaaS Metrics Report 2024'),
    ('Technology', 'SaaS', 'Series A', 'Monthly Churn Rate', 5.0, 3.0, 5.0, 8.0, 12.0, 1000, 'SaaS Metrics Report 2024'),
    ('Financial Services', 'FinTech', 'Series A', 'Transaction Volume Growth', 300.0, 200.0, 300.0, 450.0, 600.0, 500, 'FinTech Report 2024'),
    ('Financial Services', 'FinTech', 'Series A', 'User Acquisition Rate', 1000.0, 500.0, 1000.0, 1500.0, 2500.0, 500, 'FinTech Report 2024')
ON CONFLICT DO NOTHING;