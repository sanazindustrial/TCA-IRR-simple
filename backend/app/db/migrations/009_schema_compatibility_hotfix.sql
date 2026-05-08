-- Migration 009: Schema compatibility hotfixes for production drift
-- Adds missing columns used by backend queries and normalizes company naming fields.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'companies'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'company_name'
        ) THEN
            ALTER TABLE companies ADD COLUMN company_name VARCHAR(255);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'employees_count'
        ) THEN
            ALTER TABLE companies ADD COLUMN employees_count INTEGER;
        END IF;

        UPDATE companies
        SET company_name = COALESCE(company_name, name)
        WHERE company_name IS NULL;

        UPDATE companies
        SET name = COALESCE(name, company_name)
        WHERE name IS NULL;

        UPDATE companies
        SET employees_count = COALESCE(employees_count, employee_count)
        WHERE employees_count IS NULL;

        UPDATE companies
        SET employee_count = COALESCE(employee_count, employees_count)
        WHERE employee_count IS NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'company_analyses'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'company_analyses' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE company_analyses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'company_analyses' AND column_name = 'company_name'
        ) THEN
            ALTER TABLE company_analyses ADD COLUMN company_name VARCHAR(255);
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'evaluations'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'company_name'
        ) THEN
            ALTER TABLE evaluations ADD COLUMN company_name VARCHAR(255);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE evaluations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'reports'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE reports ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;
END $$;
