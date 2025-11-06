#!/usr/bin/env python3
"""
Simple Database Initialization Script for Azure PostgreSQL
This script creates the TCA IRR database schema step by step.
"""

import asyncio
import asyncpg
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Azure PostgreSQL connection parameters
DB_CONFIG = {
    "host": "tca-irr-server.postgres.database.azure.com",
    "port": 5432,
    "database": "tca_platform",
    "user": "tcairrserver",
    "password": "Tc@1rr53rv5r",
    "command_timeout": 60,
    "server_settings": {
        "application_name": "TCA_IRR_Init",
        "timezone": "UTC"
    }
}


async def execute_sql_batch(conn, sql_batch, description):
    """Execute a batch of SQL statements"""
    try:
        logger.info(f"Executing {description}...")
        await conn.execute(sql_batch)
        logger.info(f"✅ {description} completed successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to execute {description}: {str(e)}")
        return False


async def init_database():
    """Initialize the database with basic schema"""
    logger.info("Connecting to Azure PostgreSQL database...")

    try:
        # Connect to the database
        conn = await asyncpg.connect(**DB_CONFIG)
        logger.info("Connected to Azure PostgreSQL successfully")

        # 1. Create enums first
        enums_sql = """
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
        """

        if not await execute_sql_batch(conn, enums_sql, "Creating enums"):
            return False

        # 2. Create users table (the base table)
        users_sql = """
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
        """

        if not await execute_sql_batch(conn, users_sql,
                                       "Creating users table"):
            return False

        # 3. Create companies table
        companies_sql = """
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
        """

        if not await execute_sql_batch(conn, companies_sql,
                                       "Creating companies table"):
            return False

        # 4. Create evaluations table
        evaluations_sql = """
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
        """

        if not await execute_sql_batch(conn, evaluations_sql,
                                       "Creating evaluations table"):
            return False

        # 5. Create remaining core tables
        other_tables_sql = """
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
        """

        if not await execute_sql_batch(conn, other_tables_sql,
                                       "Creating additional tables"):
            return False

        # 6. Add foreign key constraints
        constraints_sql = """
        -- Add foreign key constraints
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_user_settings_user_id') THEN
                ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user_id 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_user_quotas_user_id') THEN
                ALTER TABLE user_quotas ADD CONSTRAINT fk_user_quotas_user_id 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_companies_created_by') THEN
                ALTER TABLE companies ADD CONSTRAINT fk_companies_created_by 
                FOREIGN KEY (created_by) REFERENCES users(user_id);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_evaluations_user_id') THEN
                ALTER TABLE evaluations ADD CONSTRAINT fk_evaluations_user_id 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_evaluations_company_id') THEN
                ALTER TABLE evaluations ADD CONSTRAINT fk_evaluations_company_id 
                FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_app_requests_user_id') THEN
                ALTER TABLE app_requests ADD CONSTRAINT fk_app_requests_user_id 
                FOREIGN KEY (user_id) REFERENCES users(user_id);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_app_requests_company_id') THEN
                ALTER TABLE app_requests ADD CONSTRAINT fk_app_requests_company_id 
                FOREIGN KEY (company_id) REFERENCES companies(company_id);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_created_by') THEN
                ALTER TABLE users ADD CONSTRAINT fk_users_created_by 
                FOREIGN KEY (created_by) REFERENCES users(user_id);
            END IF;
        END $$;
        """

        if not await execute_sql_batch(conn, constraints_sql,
                                       "Adding foreign key constraints"):
            return False

        # 7. Create indexes
        indexes_sql = """
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
        CREATE INDEX IF NOT EXISTS idx_evaluations_company_id ON evaluations(company_id);
        CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
        """

        if not await execute_sql_batch(conn, indexes_sql, "Creating indexes"):
            return False

        # 8. Insert sample data
        sample_data_sql = """
        -- Insert default system admin user (password: admin123)
        INSERT INTO users (full_name, email, password_hash, role, email_verified, status) 
        VALUES (
            'System Administrator',
            'admin@tcairr.com',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.s5.e.6',
            'Admin',
            TRUE,
            'Active'
        ) ON CONFLICT (email) DO NOTHING;

        -- Insert sample user (password: user123)
        INSERT INTO users (full_name, email, password_hash, role, email_verified, status) 
        VALUES (
            'John Doe',
            'user@tcairr.com',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.s5.e.6',
            'User',
            TRUE,
            'Active'
        ) ON CONFLICT (email) DO NOTHING;
        """

        if not await execute_sql_batch(conn, sample_data_sql,
                                       "Inserting sample data"):
            return False

        # 9. Verify the setup
        verify_sql = "SELECT COUNT(*) as user_count FROM users;"
        result = await conn.fetchrow(verify_sql)
        logger.info(f"✅ Database initialization completed successfully!")
        logger.info(f"✅ Total users in database: {result['user_count']}")

        # Test a sample evaluation creation
        test_sql = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
        """

        tables = await conn.fetch(test_sql)
        logger.info(
            f"✅ Created tables: {[table['table_name'] for table in tables]}")

        return True

    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False

    finally:
        if 'conn' in locals():
            await conn.close()
            logger.info("Database connection closed")


if __name__ == "__main__":
    success = asyncio.run(init_database())
    if success:
        logger.info("🎉 Database is ready for the TCA IRR backend!")
        logger.info("You can now run: python main.py")
    else:
        logger.error("❌ Database initialization failed")
        exit(1)