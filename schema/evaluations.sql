-- schema/evaluations.sql

-- Table to store information about the companies being evaluated
CREATE TABLE companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sector VARCHAR(100), -- E.g., 'General Tech/SaaS', 'MedTech/Biotech'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(name);

-- Table to store each analysis/evaluation run
CREATE TABLE evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- The user who initiated the evaluation
    framework VARCHAR(50) NOT NULL, -- 'general' or 'medtech'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    recommendation VARCHAR(50), -- 'Recommend', 'Hold', 'Reject'
    composite_score NUMERIC(5, 2), -- The final calculated score
    analysis_results JSONB, -- To store the complete ComprehensiveAnalysisOutput object
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_evaluations_company_id ON evaluations(company_id);
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluations_results_gin ON evaluations USING GIN (analysis_results);

-- Table to store documents associated with an evaluation
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    document_type VARCHAR(20) NOT NULL, -- 'file_upload', 'url_import', 'text_input'
    source_name VARCHAR(255) NOT NULL, -- e.g., file name or URL
    storage_path VARCHAR(1024), -- e.g., path in Azure Blob Storage
    raw_text_content TEXT, -- For direct text inputs
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_evaluation_id ON documents(evaluation_id);

COMMENT ON TABLE companies IS 'Stores basic information about each startup or company being evaluated.';
COMMENT ON TABLE evaluations IS 'The central table for tracking each analysis run, linking users, companies, and results.';
COMMENT ON COLUMN evaluations.analysis_results IS 'Stores the entire JSON output from the comprehensive AI analysis.';
COMMENT ON TABLE documents IS 'Tracks all source documents (files, URLs, text) submitted for an evaluation.';
