-- =============================================================================
-- AllUpload Table Schema
-- Stores uploaded file metadata, extracted data, and analysis results
-- =============================================================================

-- Drop existing table if needed (for fresh migration)
-- DROP TABLE IF EXISTS allupload CASCADE;

CREATE TABLE IF NOT EXISTS allupload (
    upload_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source information
    user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
    source_type         TEXT NOT NULL DEFAULT 'file',        -- 'file', 'url', 'text'
    
    -- File metadata
    file_name           TEXT NOT NULL,
    file_type           TEXT,                                  -- MIME type (application/pdf, etc.)
    file_size           BIGINT DEFAULT 0,                      -- Size in bytes
    source_url          TEXT,                                   -- Original URL if source_type='url'
    
    -- Extracted content
    extracted_text      TEXT,                                   -- Raw text extracted from document
    extracted_data      JSONB DEFAULT '{}'::JSONB,             -- Structured extracted data (financials, metrics, etc.)
    
    -- Analysis linkage
    analysis_result     JSONB DEFAULT '{}'::JSONB,             -- Analysis result (TCA score, recommendation, etc.)
    analysis_id         TEXT,                                   -- Link to analysis run ID
    company_name        TEXT,                                   -- Company name extracted or associated
    
    -- Processing state
    processing_status   TEXT NOT NULL DEFAULT 'pending',       -- 'pending', 'processing', 'completed', 'failed'
    processing_error    TEXT,                                   -- Error message if processing failed
    
    -- Additional metadata
    upload_metadata     JSONB DEFAULT '{}'::JSONB,             -- Flexible metadata (tags, notes, etc.)
    
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_allupload_user_id ON allupload(user_id);
CREATE INDEX IF NOT EXISTS idx_allupload_source_type ON allupload(source_type);
CREATE INDEX IF NOT EXISTS idx_allupload_processing_status ON allupload(processing_status);
CREATE INDEX IF NOT EXISTS idx_allupload_company_name ON allupload(company_name);
CREATE INDEX IF NOT EXISTS idx_allupload_created_at ON allupload(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_allupload_analysis_id ON allupload(analysis_id);

-- GIN index for JSONB searches
CREATE INDEX IF NOT EXISTS idx_allupload_extracted_data ON allupload USING GIN(extracted_data);
CREATE INDEX IF NOT EXISTS idx_allupload_analysis_result ON allupload USING GIN(analysis_result);
