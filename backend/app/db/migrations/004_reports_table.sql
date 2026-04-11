-- Migration: 004_reports_table
-- Description: Create reports table for storing evaluation reports with versioning support

-- Reports table for evaluation reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL DEFAULT 'Triage' CHECK (report_type IN ('Triage', 'Due Diligence', 'Full Assessment')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed')),
    approval_status VARCHAR(30) DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected', 'Due Diligence', 'Invested')),
    
    -- Scoring
    overall_score DECIMAL(4, 2) CHECK (overall_score >= 0 AND overall_score <= 10),
    tca_score DECIMAL(4, 2) CHECK (tca_score >= 0 AND tca_score <= 10),
    confidence DECIMAL(5, 2) CHECK (confidence >= 0 AND confidence <= 100),
    recommendation VARCHAR(30) CHECK (recommendation IN ('Recommend', 'Hold', 'Reject', 'Invest')),
    
    -- Module scores (stored as JSONB for flexibility)
    module_scores JSONB,
    
    -- Settings version reference
    settings_version_id INTEGER REFERENCES module_settings_versions(id),
    simulation_run_id INTEGER REFERENCES simulation_runs(id),
    
    -- Analysis data snapshot
    analysis_data JSONB,
    
    -- Missing sections (if any)
    missing_sections TEXT[],
    
    -- User information
    created_by INTEGER REFERENCES users(id),
    reviewed_by INTEGER REFERENCES users(id),
    reviewer_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_company_name ON reports(company_name);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_approval_status ON reports(approval_status);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_settings_version ON reports(settings_version_id);

-- Apply updated_at trigger
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reports_updated_at') THEN
        CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Report versions table for tracking changes to reports
CREATE TABLE IF NOT EXISTS report_versions (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    
    -- Snapshot of scores at this version
    overall_score DECIMAL(4, 2),
    tca_score DECIMAL(4, 2),
    confidence DECIMAL(5, 2),
    module_scores JSONB,
    
    -- Change tracking
    change_reason TEXT,
    changed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_versions_report_id ON report_versions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_versions_version ON report_versions(report_id, version_number);
