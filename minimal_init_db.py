#!/usr/bin/env python3
"""
Minimal Database Setup for TCA IRR Platform
Creates only essential tables for quick backend launch.
"""

import asyncio
import asyncpg
import logging

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


async def create_minimal_schema():
    """Create minimal database schema for quick launch"""
    logger.info("Connecting to Azure PostgreSQL database...")

    try:
        # Connect to the database
        conn = await asyncpg.connect(**DB_CONFIG)
        logger.info("Connected to Azure PostgreSQL successfully")

        # Create minimal schema
        schema_sql = """
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

        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role user_role NOT NULL DEFAULT 'User',
            status VARCHAR(20) DEFAULT 'Active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            email_verified BOOLEAN DEFAULT FALSE,
            last_login TIMESTAMPTZ,
            login_count INTEGER DEFAULT 0
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
            
            -- Analysis results
            analysis_results JSONB DEFAULT '{}',
            
            -- Timestamps
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            completed_at TIMESTAMPTZ
        );

        -- App requests table
        CREATE TABLE IF NOT EXISTS app_requests (
            request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            company_id UUID,
            request_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'Pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create basic indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
        CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);

        -- Insert sample admin user (password: admin123)
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

        -- Insert sample company
        INSERT INTO companies (name, description, website, industry, sector, stage)
        VALUES (
            'TechCorp Inc',
            'A sample technology company for testing',
            'https://techcorp.example.com',
            'Technology',
            'Software',
            'Series A'
        );
        """

        logger.info("Creating minimal database schema...")
        await conn.execute(schema_sql)
        logger.info("✅ Database schema created successfully")

        # Verify the setup
        verify_sql = """
        SELECT 
            (SELECT COUNT(*) FROM users) as user_count,
            (SELECT COUNT(*) FROM companies) as company_count,
            (SELECT COUNT(*) FROM evaluations) as evaluation_count;
        """

        result = await conn.fetchrow(verify_sql)
        logger.info(f"✅ Database verification:")
        logger.info(f"  - Users: {result['user_count']}")
        logger.info(f"  - Companies: {result['company_count']}")
        logger.info(f"  - Evaluations: {result['evaluation_count']}")

        # List created tables
        tables_sql = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
        """

        tables = await conn.fetch(tables_sql)
        table_names = [table['table_name'] for table in tables]
        logger.info(f"✅ Created tables: {table_names}")

        return True

    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False

    finally:
        if 'conn' in locals():
            await conn.close()
            logger.info("Database connection closed")


if __name__ == "__main__":
    success = asyncio.run(create_minimal_schema())
    if success:
        logger.info("🎉 Minimal database schema is ready!")
        logger.info("✅ You can now launch the backend with: python main.py")
        logger.info("📧 Login credentials:")
        logger.info("   - Admin: admin@tcairr.com / admin123")
        logger.info("   - User:  user@tcairr.com / user123")
    else:
        logger.error("❌ Database initialization failed")
        exit(1)