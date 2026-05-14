-- Migration 010: Dashboard schema sync for production drift
-- Ensures columns required by dashboard/evaluation paths exist.

ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS industry VARCHAR(100);

ALTER TABLE IF EXISTS evaluations ADD COLUMN IF NOT EXISTS evaluation_type VARCHAR(50);
ALTER TABLE IF EXISTS evaluations ADD COLUMN IF NOT EXISTS company_id INTEGER;

ALTER TABLE IF EXISTS evaluations_simple ADD COLUMN IF NOT EXISTS evaluation_type VARCHAR(50);
ALTER TABLE IF EXISTS evaluations_simple ADD COLUMN IF NOT EXISTS company_id INTEGER;

ALTER TABLE IF EXISTS company_analyses ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Backfill missing company_id values where a company name match is available.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'evaluations'
          AND column_name = 'company_name'
    ) THEN
        UPDATE evaluations e
        SET company_id = c.id
        FROM companies c
        WHERE e.company_id IS NULL
          AND e.company_name IS NOT NULL
          AND LOWER(TRIM(e.company_name)) = LOWER(TRIM(COALESCE(c.company_name, c.name)));
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'evaluations_simple'
          AND column_name = 'company_name'
    ) THEN
        UPDATE evaluations_simple e
        SET company_id = c.id
        FROM companies c
        WHERE e.company_id IS NULL
          AND e.company_name IS NOT NULL
          AND LOWER(TRIM(e.company_name)) = LOWER(TRIM(COALESCE(c.company_name, c.name)));
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'company_analyses'
          AND column_name = 'company_name'
    ) THEN
        UPDATE company_analyses a
        SET company_id = c.id
        FROM companies c
        WHERE a.company_id IS NULL
          AND a.company_name IS NOT NULL
          AND LOWER(TRIM(a.company_name)) = LOWER(TRIM(COALESCE(c.company_name, c.name)));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evaluations_company_id ON evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_simple_company_id ON evaluations_simple(company_id);
CREATE INDEX IF NOT EXISTS idx_company_analyses_company_id ON company_analyses(company_id);
