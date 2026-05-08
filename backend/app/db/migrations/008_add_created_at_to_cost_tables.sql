-- Migration 008: Add created_at column to cost_usage and cost_summary tables
ALTER TABLE cost_usage ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE cost_summary ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
