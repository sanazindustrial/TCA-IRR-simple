-- ===============================================
-- TCA IRR Platform Database Schema - Complete
-- Azure PostgreSQL Compatible
-- ===============================================

-- Enable UUID extension if not exists
-- Note: Azure PostgreSQL doesn't allow uuid-ossp extension for regular users
-- We'll use gen_random_uuid() which is built into PostgreSQL 13+

-- ===============================================
-- 1. CORE USER MANAGEMENT SYSTEM
-- ===============================================

-- Enum type for user roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Reviewer', 'User', 'AI Adopter', 'Analyst', 'Investment Manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main users table
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
    
    -- Audit fields
    created_by UUID,  -- Will add foreign key constraint later
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    monthly_summary_enabled BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'en',
    dashboard_layout JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}'
);

-- Report quotas table
CREATE TABLE IF NOT EXISTS report_quotas (
    quota_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    triage_reports_limit INTEGER,
    dd_reports_limit INTEGER,
    triage_reports_used INTEGER DEFAULT 0,
    dd_reports_used INTEGER DEFAULT 0,
    cycle_start_date DATE DEFAULT CURRENT_DATE,
    evaluation_limit INTEGER DEFAULT 50,
    evaluations_used INTEGER DEFAULT 0
);

-- ===============================================
-- 2. COMPANY AND INVESTMENT DATA
-- ===============================================

-- Company profiles table
CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    sector VARCHAR(100),
    stage VARCHAR(50), -- 'Seed', 'Series A', 'Series B', etc.
    founded_year INTEGER,
    headquarters VARCHAR(255),
    website_url VARCHAR(500),
    description TEXT,
    employees_count INTEGER,
    
    -- Financial data
    last_valuation DECIMAL(15,2),
    total_funding DECIMAL(15,2),
    revenue_run_rate DECIMAL(15,2),
    burn_rate DECIMAL(15,2),
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    
    -- Additional fields
    logo_url VARCHAR(500),
    pitch_deck_url VARCHAR(500),
    data_room_url VARCHAR(500)
);

-- Founder profiles table
CREATE TABLE IF NOT EXISTS founders (
    founder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    email VARCHAR(255),
    linkedin_url VARCHAR(500),
    background TEXT,
    education VARCHAR(500),
    previous_experience TEXT,
    equity_percentage DECIMAL(5,2),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 3. EVALUATION AND ANALYSIS SYSTEM
-- ===============================================

-- Main evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(company_id),
    company_name VARCHAR(255) NOT NULL,
    evaluation_type VARCHAR(50) DEFAULT 'full_analysis', -- 'triage', 'due_diligence', 'full_analysis'
    
    -- Processing status
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- Data and results
    evaluation_data JSONB,
    results JSONB,
    ai_analysis_results JSONB,
    
    -- Module configuration
    enabled_modules JSONB DEFAULT '{}', -- Which analysis modules are enabled
    module_results JSONB DEFAULT '{}', -- Results from each module
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    
    -- Metadata
    version VARCHAR(20) DEFAULT '1.0',
    request_id UUID, -- Reference to app_requests if applicable
    
    -- Scores and ratings
    overall_score DECIMAL(5,2),
    risk_rating VARCHAR(20), -- 'Low', 'Medium', 'High', 'Critical'
    investment_recommendation VARCHAR(50) -- 'Strong Buy', 'Buy', 'Hold', 'Pass', 'Strong Pass'
);

-- Evaluation modules tracking
CREATE TABLE IF NOT EXISTS evaluation_modules (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL, -- 'tca_scorecard', 'founder_fit', etc.
    module_status VARCHAR(30) DEFAULT 'pending',
    module_results JSONB,
    processing_time_ms INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 4. REQUEST MANAGEMENT SYSTEM
-- ===============================================

-- Enhanced app requests table
CREATE TABLE IF NOT EXISTS app_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    request_type VARCHAR(50) NOT NULL, -- 'feature_request', 'bug_report', 'evaluation_request', etc.
    category VARCHAR(50), -- 'ui_ux', 'ai_analysis', 'data_integration', etc.
    priority VARCHAR(20) DEFAULT 'medium',
    
    -- Request details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    expected_outcome TEXT,
    business_impact VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected', 'completed', 'cancelled'
    
    -- Assignment and review
    reviewer_id UUID REFERENCES users(user_id),
    assigned_to UUID REFERENCES users(user_id),
    
    -- Timing
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    
    -- Resolution
    resolution_notes TEXT,
    resolution_type VARCHAR(50), -- 'implemented', 'wont_fix', 'duplicate', etc.
    
    -- Metadata
    attachments JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    related_evaluation_id UUID REFERENCES evaluations(evaluation_id)
);

-- Request comments/updates
CREATE TABLE IF NOT EXISTS request_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES app_requests(request_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'comment', -- 'comment', 'status_change', 'system'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_internal BOOLEAN DEFAULT FALSE
);

-- ===============================================
-- 5. AI ANALYSIS AND BENCHMARKING
-- ===============================================

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
    data_source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI model configurations
CREATE TABLE IF NOT EXISTS ai_model_configs (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    configuration JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id)
);

-- Analysis templates
CREATE TABLE IF NOT EXISTS analysis_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50), -- 'tca_scorecard', 'risk_analysis', etc.
    template_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id)
);

-- ===============================================
-- 6. REPORTING AND ANALYTICS
-- ===============================================

-- Generated reports table
CREATE TABLE IF NOT EXISTS reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(evaluation_id),
    user_id UUID REFERENCES users(user_id),
    report_type VARCHAR(50) NOT NULL, -- 'executive_summary', 'detailed_analysis', 'comparative'
    report_format VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'docx', 'pptx', 'json'
    
    -- Report content
    report_title VARCHAR(255),
    report_content JSONB,
    file_path VARCHAR(500),
    file_size INTEGER,
    
    -- Status
    status VARCHAR(30) DEFAULT 'generating', -- 'generating', 'completed', 'failed'
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Sharing
    is_shareable BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(255) UNIQUE,
    download_count INTEGER DEFAULT 0
);

-- ===============================================
-- 7. AUDIT AND ACTIVITY LOGS
-- ===============================================

-- System activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- 'evaluation', 'user', 'request', etc.
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
    error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    request_data JSONB,
    context JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 8. INDEXES FOR PERFORMANCE
-- ===============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_stage ON companies(stage);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Evaluation indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_company_id ON evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluations_priority ON evaluations(priority);

-- Request indexes
CREATE INDEX IF NOT EXISTS idx_app_requests_user_id ON app_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_app_requests_status ON app_requests(status);
CREATE INDEX IF NOT EXISTS idx_app_requests_type ON app_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_app_requests_priority ON app_requests(priority);
CREATE INDEX IF NOT EXISTS idx_app_requests_submitted_at ON app_requests(submitted_at);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

-- Benchmark indexes
CREATE INDEX IF NOT EXISTS idx_benchmarks_industry_sector ON industry_benchmarks(industry, sector);
CREATE INDEX IF NOT EXISTS idx_benchmarks_stage ON industry_benchmarks(stage);
CREATE INDEX IF NOT EXISTS idx_benchmarks_metric ON industry_benchmarks(metric_name);

-- ===============================================
-- 9. VIEWS FOR COMMON QUERIES
-- ===============================================

-- Active evaluations with user info
CREATE OR REPLACE VIEW active_evaluations AS
SELECT 
    e.*,
    u.full_name as user_name,
    u.email as user_email,
    c.industry,
    c.sector,
    c.stage
FROM evaluations e
JOIN users u ON e.user_id = u.user_id
LEFT JOIN companies c ON e.company_id = c.company_id
WHERE e.status IN ('pending', 'processing');

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    u.role,
    COUNT(e.evaluation_id) as total_evaluations,
    COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_evaluations,
    COUNT(r.request_id) as total_requests,
    u.created_at as user_since,
    u.last_activity
FROM users u
LEFT JOIN evaluations e ON u.user_id = e.user_id
LEFT JOIN app_requests r ON u.user_id = r.user_id
GROUP BY u.user_id, u.full_name, u.email, u.role, u.created_at, u.last_activity;

-- ===============================================
-- 10. COMMENTS AND DOCUMENTATION
-- ===============================================

COMMENT ON SCHEMA public IS 'TCA IRR Platform - Investment Risk Rating and Analysis System';

COMMENT ON TABLE users IS 'Core user accounts with authentication and profile information';
COMMENT ON TABLE companies IS 'Company profiles and basic information for evaluation';
COMMENT ON TABLE evaluations IS 'Main evaluation requests and AI analysis results';
COMMENT ON TABLE app_requests IS 'User requests for features, support, and system improvements';
COMMENT ON TABLE reports IS 'Generated reports and documents from evaluations';
COMMENT ON TABLE activity_logs IS 'System audit trail and user activity tracking';
COMMENT ON TABLE industry_benchmarks IS 'Industry benchmark data for comparative analysis';

-- ===============================================
-- 11. SAMPLE DATA FUNCTIONS
-- ===============================================

-- Function to create sample industry benchmarks
CREATE OR REPLACE FUNCTION create_sample_benchmarks() RETURNS VOID AS $$
BEGIN
    -- SaaS benchmarks
    INSERT INTO industry_benchmarks (industry, sector, stage, metric_name, metric_value, percentile_25, percentile_50, percentile_75, percentile_90, sample_size, data_source)
    VALUES 
        ('Technology', 'SaaS', 'Series A', 'Revenue Growth Rate', 200.0, 150.0, 200.0, 300.0, 500.0, 1000, 'Industry Survey 2024'),
        ('Technology', 'SaaS', 'Series A', 'Customer Acquisition Cost', 500.0, 300.0, 500.0, 800.0, 1200.0, 1000, 'Industry Survey 2024'),
        ('Technology', 'SaaS', 'Series A', 'Monthly Recurring Revenue', 100000.0, 50000.0, 100000.0, 200000.0, 500000.0, 1000, 'Industry Survey 2024')
    ON CONFLICT DO NOTHING;
    
    -- FinTech benchmarks
    INSERT INTO industry_benchmarks (industry, sector, stage, metric_name, metric_value, percentile_25, percentile_50, percentile_75, percentile_90, sample_size, data_source)
    VALUES 
        ('Financial Services', 'FinTech', 'Series A', 'Transaction Volume Growth', 300.0, 200.0, 300.0, 450.0, 600.0, 500, 'FinTech Report 2024'),
        ('Financial Services', 'FinTech', 'Series A', 'User Acquisition Rate', 1000.0, 500.0, 1000.0, 1500.0, 2500.0, 500, 'FinTech Report 2024')
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute the sample data creation
SELECT create_sample_benchmarks();

-- ===============================================
-- ADD DEFERRED FOREIGN KEY CONSTRAINTS
-- ===============================================

-- Add self-referencing foreign key for users.created_by
ALTER TABLE users ADD CONSTRAINT fk_users_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id);
