"""
Enhanced database initialization with proper schema management
"""

import asyncio
import logging
from pathlib import Path
from typing import List

from app.core import settings
from app.db import db_manager

logger = logging.getLogger(__name__)


class DatabaseInitializer:
    """Database initialization and migration manager"""

    def __init__(self):
        self.schema_dir = Path(__file__).parent.parent.parent / "schema"

    async def initialize_database(self, force_recreate: bool = False):
        """Initialize database with proper schema and data"""
        logger.info("Starting database initialization...")

        try:
            # Connect to database
            await db_manager.connect()

            # Check if database needs initialization
            if not force_recreate and await self._check_existing_schema():
                logger.info("Database already initialized, skipping...")
                return True

            # Create tables
            await self._create_tables()

            # Insert default data
            await self._insert_default_data()

            # Verify installation
            if await self._verify_installation():
                logger.info("Database initialization completed successfully")
                return True
            else:
                logger.error("Database verification failed")
                return False

        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            return False
        finally:
            await db_manager.disconnect()

    async def _check_existing_schema(self) -> bool:
        """Check if the database is already initialized"""
        try:
            async with db_manager.get_connection() as conn:
                # Check for key tables
                result = await conn.fetchval("""
                    SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('users', 'companies', 'analyses', 'investments')
                """)
                return result >= 4
        except Exception:
            return False

    async def _create_tables(self):
        """Create database tables"""
        logger.info("Creating database tables...")

        async with db_manager.get_transaction() as conn:
            # Users table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100),
                    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'reviewer', 'analyst')),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    last_login TIMESTAMP
                );
            """)

            # Companies table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS companies (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    website VARCHAR(255),
                    industry VARCHAR(100),
                    stage VARCHAR(50) CHECK (stage IN ('idea', 'mvp', 'early_stage', 'growth', 'mature', 'scale_up')),
                    location VARCHAR(100),
                    founded_year INTEGER CHECK (founded_year >= 1800 AND founded_year <= 2030),
                    employee_count INTEGER CHECK (employee_count >= 0),
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP
                );
            """)

            # Analyses table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS analyses (
                    id SERIAL PRIMARY KEY,
                    company_id INTEGER REFERENCES companies(id),
                    analysis_type VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
                    parameters JSONB,
                    results JSONB,
                    error_message TEXT,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    completed_at TIMESTAMP
                );
            """)

            # Investments table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS investments (
                    id SERIAL PRIMARY KEY,
                    company_id INTEGER REFERENCES companies(id),
                    investment_type VARCHAR(20) CHECK (investment_type IN ('seed', 'series_a', 'series_b', 'series_c', 'bridge', 'growth', 'debt')),
                    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
                    currency VARCHAR(3) DEFAULT 'USD',
                    valuation DECIMAL(15,2) CHECK (valuation > 0),
                    investor_name VARCHAR(200),
                    investment_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP
                );
            """)

            # TCA Scorecards table for caching
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS tca_scorecards (
                    id SERIAL PRIMARY KEY,
                    company_id INTEGER REFERENCES companies(id),
                    overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
                    technology_score DECIMAL(5,2) CHECK (technology_score >= 0 AND technology_score <= 100),
                    market_score DECIMAL(5,2) CHECK (market_score >= 0 AND market_score <= 100),
                    team_score DECIMAL(5,2) CHECK (team_score >= 0 AND team_score <= 100),
                    financial_score DECIMAL(5,2) CHECK (financial_score >= 0 AND financial_score <= 100),
                    risk_score DECIMAL(5,2) CHECK (risk_score >= 0 AND risk_score <= 100),
                    recommendation TEXT,
                    confidence_level DECIMAL(5,2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
                    key_insights JSONB,
                    risk_factors JSONB,
                    mitigation_strategies JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                );
            """)

            # Create indexes for performance
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_companies_stage ON companies(stage);"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_analyses_company_id ON analyses(company_id);"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_investments_company_id ON investments(company_id);"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_tca_scorecards_company_id ON tca_scorecards(company_id);"
            )

        logger.info("Database tables created successfully")

    async def _insert_default_data(self):
        """Insert default system data"""
        logger.info("Inserting default data...")

        async with db_manager.get_transaction() as conn:
            # Check if admin user exists
            admin_exists = await conn.fetchval(
                "SELECT id FROM users WHERE role = 'admin' LIMIT 1")

            if not admin_exists:
                from app.core import get_password_hash

                # Create default admin user
                await conn.execute(
                    """
                    INSERT INTO users (username, email, password, full_name, role, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, "admin", "admin@tca-platform.com",
                    get_password_hash("admin123"), "System Administrator",
                    "admin", True)
                logger.info("Default admin user created")

        logger.info("Default data inserted successfully")

    async def _verify_installation(self) -> bool:
        """Verify database installation"""
        try:
            async with db_manager.get_connection() as conn:
                # Check table counts
                tables = await conn.fetch("""
                    SELECT table_name, 
                           (SELECT COUNT(*) FROM information_schema.columns 
                            WHERE table_name = t.table_name AND table_schema = 'public') as column_count
                    FROM information_schema.tables t
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """)

                required_tables = {
                    "users", "companies", "analyses", "investments",
                    "tca_scorecards"
                }
                existing_tables = {table['table_name'] for table in tables}

                if not required_tables.issubset(existing_tables):
                    logger.error(
                        f"Missing required tables: {required_tables - existing_tables}"
                    )
                    return False

                # Check admin user
                admin_count = await conn.fetchval(
                    "SELECT COUNT(*) FROM users WHERE role = 'admin'")

                if admin_count == 0:
                    logger.error("No admin user found")
                    return False

                logger.info(
                    f"Verification complete: {len(tables)} tables, {admin_count} admin users"
                )
                return True

        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return False

    async def backup_database(self, backup_path: str = None) -> str:
        """Create a database backup (placeholder for production)"""
        # In production, implement proper backup strategy
        logger.info(
            "Database backup functionality - implement with pg_dump in production"
        )
        return "backup_placeholder"

    async def restore_database(self, backup_path: str):
        """Restore database from backup (placeholder for production)"""
        # In production, implement proper restore strategy
        logger.info(
            "Database restore functionality - implement with pg_restore in production"
        )


async def main():
    """Main initialization function"""
    logging.basicConfig(level=logging.INFO)

    initializer = DatabaseInitializer()
    success = await initializer.initialize_database()

    if success:
        print("✅ Database initialization completed successfully")
    else:
        print("❌ Database initialization failed")
        exit(1)


if __name__ == "__main__":
    asyncio.run(main())