"""
Database initialization script for TCA Investment Analysis Platform
Creates tables and initial data for production use.
"""

import asyncio
import asyncpg
import logging
from datetime import datetime, timezone
import sys
import os

# Add backend to Python path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_path)

from app.core.config import settings
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

# SQL Schema Definitions
SCHEMA_SQL = """
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'analyst', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sector VARCHAR(100),
    website VARCHAR(255),
    founded_year INTEGER,
    employee_count INTEGER,
    funding_stage VARCHAR(50),
    location VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    results JSONB,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    recommendation TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    investor_name VARCHAR(200),
    amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    investment_type VARCHAR(50),
    investment_date DATE,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_analyses_company_id ON analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_by ON analyses(created_by);
CREATE INDEX IF NOT EXISTS idx_investments_company_id ON investments(company_id);
CREATE INDEX IF NOT EXISTS idx_investments_created_by ON investments(created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
        CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_analyses_updated_at') THEN
        CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_investments_updated_at') THEN
        CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
"""

SAMPLE_DATA_SQL = """
-- Insert default admin user (password: admin123456)
INSERT INTO users (username, email, password, full_name, role, is_active) 
VALUES (
    'admin', 
    'admin@tcaplatform.com', 
    $1, 
    'System Administrator', 
    'admin', 
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert sample analyst user (password: analyst123)
INSERT INTO users (username, email, password, full_name, role, is_active) 
VALUES (
    'analyst1', 
    'analyst1@tcaplatform.com', 
    $2, 
    'Senior Analyst', 
    'analyst', 
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert sample companies
INSERT INTO companies (name, description, sector, website, founded_year, employee_count, funding_stage, location, created_by) 
VALUES 
    ('TechCorp Inc', 'AI-driven business solutions', 'Technology', 'https://techcorp.example.com', 2020, 50, 'Series A', 'San Francisco, CA', 1),
    ('DataFlow Systems', 'Cloud-based data analytics platform', 'Technology', 'https://dataflow.example.com', 2019, 25, 'Seed', 'Austin, TX', 1),
    ('GreenEnergy Solutions', 'Renewable energy technology', 'Energy', 'https://greenenergy.example.com', 2021, 75, 'Series B', 'Portland, OR', 1)
ON CONFLICT DO NOTHING;
"""


async def connect_to_database():
    """Connect to the PostgreSQL database"""
    try:
        connection = await asyncpg.connect(
            host=settings.postgres_host,
            port=settings.postgres_port,
            database=settings.postgres_db,
            user=settings.postgres_user,
            password=settings.postgres_password,
            ssl="require"
            if settings.postgres_ssl_mode == "require" else "disable")
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


async def create_database_schema(connection):
    """Create database tables and indexes"""
    try:
        logger.info("Creating database schema...")
        await connection.execute(SCHEMA_SQL)
        logger.info("✅ Database schema created successfully")
    except Exception as e:
        logger.error(f"Failed to create schema: {e}")
        raise


async def insert_sample_data(connection):
    """Insert initial sample data"""
    try:
        logger.info("Inserting sample data...")

        # Hash passwords for sample users
        admin_password = get_password_hash("admin123456")
        analyst_password = get_password_hash("analyst123")

        await connection.execute(SAMPLE_DATA_SQL, admin_password,
                                 analyst_password)
        logger.info("✅ Sample data inserted successfully")
    except Exception as e:
        logger.error(f"Failed to insert sample data: {e}")
        raise


async def verify_database_setup(connection):
    """Verify that the database is set up correctly"""
    try:
        logger.info("Verifying database setup...")

        # Check if tables exist
        tables = await connection.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)

        expected_tables = {'users', 'companies', 'analyses', 'investments'}
        actual_tables = {table['table_name'] for table in tables}

        if expected_tables.issubset(actual_tables):
            logger.info("✅ All required tables exist")
        else:
            missing_tables = expected_tables - actual_tables
            logger.error(f"❌ Missing tables: {missing_tables}")
            return False

        # Check sample data
        user_count = await connection.fetchval("SELECT COUNT(*) FROM users")
        company_count = await connection.fetchval(
            "SELECT COUNT(*) FROM companies")

        logger.info(f"✅ Database verification complete:")
        logger.info(f"   - Users: {user_count}")
        logger.info(f"   - Companies: {company_count}")

        return True

    except Exception as e:
        logger.error(f"Database verification failed: {e}")
        return False


async def main():
    """Main database initialization function"""
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(levelname)s - %(message)s')

    logger.info("🚀 Starting TCA Platform Database Initialization")
    logger.info(
        f"Connecting to: {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"
    )

    connection = None
    try:
        # Connect to database
        connection = await connect_to_database()
        logger.info("✅ Connected to database successfully")

        # Create schema
        await create_database_schema(connection)

        # Insert sample data
        await insert_sample_data(connection)

        # Verify setup
        success = await verify_database_setup(connection)

        if success:
            logger.info("🎉 Database initialization completed successfully!")
            logger.info("Default login credentials:")
            logger.info("  Admin: admin / admin123456")
            logger.info("  Analyst: analyst1 / analyst123")
        else:
            logger.error("❌ Database initialization failed verification")
            sys.exit(1)

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        sys.exit(1)
    finally:
        if connection:
            await connection.close()
            logger.info("Database connection closed")


if __name__ == "__main__":
    asyncio.run(main())
