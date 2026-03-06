"""
Test Database Configuration and Management

This module provides a comprehensive testing database setup that can switch between:
1. Mock database (for fast unit tests)
2. Real PostgreSQL test database (for integration tests)
3. Production database (for end-to-end tests)

Usage:
    # For unit tests with mock data
    test_db = TestDatabase(mode="mock")
    
    # For integration tests with real PostgreSQL
    test_db = TestDatabase(mode="test")
    
    # For end-to-end tests with production setup
    test_db = TestDatabase(mode="production")
"""

import asyncio
import os
import logging
import asyncpg
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from contextlib import asynccontextmanager
import bcrypt
from datetime import datetime, timezone
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TestConfig:
    """Test database configuration settings"""
    host: str
    port: int
    database: str
    user: str
    password: str
    ssl_mode: str = "prefer"
    pool_min_size: int = 1
    pool_max_size: int = 5


class MockDatabase:
    """
    Enhanced mock database for unit testing with comprehensive test data
    """

    def __init__(self):
        self.users = {}
        self.companies = {}
        self.analyses = {}
        self.investments = {}
        self.sessions = {}
        self._setup_mock_data()

    def _setup_mock_data(self):
        """Initialize comprehensive mock data for testing"""

        # Mock users with proper bcrypt hashes
        admin_password = bcrypt.hashpw("admin123456".encode('utf-8'),
                                       bcrypt.gensalt()).decode('utf-8')
        test_password = bcrypt.hashpw("test123456".encode('utf-8'),
                                      bcrypt.gensalt()).decode('utf-8')

        self.users = {
            1: {
                "id": 1,
                "username": "admin",
                "email": "admin@tcaplatform.com",
                "password_hash": admin_password,
                "full_name": "Admin User",
                "role": "admin",
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "last_login": datetime.now(timezone.utc)
            },
            2: {
                "id": 2,
                "username": "testuser",
                "email": "test@example.com",
                "password_hash": test_password,
                "full_name": "Test User",
                "role": "analyst",
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "last_login": datetime.now(timezone.utc)
            }
        }

        # Mock companies
        self.companies = {
            1: {
                "id": 1,
                "name": "TechStart Inc",
                "description": "AI-powered fintech startup",
                "industry": "Financial Technology",
                "stage": "Series A",
                "founded_year": 2020,
                "employee_count": 25,
                "location": "San Francisco, CA",
                "website": "https://techstart.com",
                "funding_raised": 5000000,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            2: {
                "id": 2,
                "name": "GreenTech Solutions",
                "description": "Sustainable energy solutions",
                "industry": "Clean Technology",
                "stage": "Seed",
                "founded_year": 2022,
                "employee_count": 12,
                "location": "Austin, TX",
                "website": "https://greentech.solutions",
                "funding_raised": 1200000,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        }

        # Mock analyses
        self.analyses = {
            1: {
                "id":
                1,
                "company_id":
                1,
                "analyst_id":
                1,
                "analysis_type":
                "comprehensive",
                "status":
                "completed",
                "results": {
                    "overall_score": 8.5,
                    "risk_level": "medium",
                    "growth_potential": "high",
                    "market_fit": "strong",
                    "financial_health": "good"
                },
                "recommendations": [
                    "Strong market position with clear competitive advantages",
                    "Consider expanding to European markets",
                    "Monitor cash burn rate closely"
                ],
                "created_at":
                datetime.now(timezone.utc),
                "updated_at":
                datetime.now(timezone.utc)
            }
        }

        # Mock investments
        self.investments = {
            1: {
                "id": 1,
                "company_id": 1,
                "investor_id": 1,
                "amount": 2000000,
                "investment_type": "equity",
                "investment_date": datetime.now(timezone.utc),
                "ownership_percentage": 15.5,
                "valuation": 12900000,
                "status": "active",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        }

    async def fetch_user_by_username(
            self, username: str) -> Optional[Dict[str, Any]]:
        """Fetch user by username"""
        for user in self.users.values():
            if user["username"] == username:
                return user
        return None

    async def fetch_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Fetch user by ID"""
        return self.users.get(user_id)

    async def fetch_companies(self,
                              limit: int = 100,
                              offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch companies with pagination"""
        companies_list = list(self.companies.values())
        return companies_list[offset:offset + limit]

    async def fetch_company_by_id(self,
                                  company_id: int) -> Optional[Dict[str, Any]]:
        """Fetch company by ID"""
        return self.companies.get(company_id)

    async def fetch_analyses(self,
                             limit: int = 100,
                             offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch analyses with pagination"""
        analyses_list = list(self.analyses.values())
        return analyses_list[offset:offset + limit]

    async def fetch_analysis_by_id(
            self, analysis_id: int) -> Optional[Dict[str, Any]]:
        """Fetch analysis by ID"""
        return self.analyses.get(analysis_id)

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        new_id = max(self.users.keys()) + 1 if self.users else 1
        user_data["id"] = new_id
        user_data["created_at"] = datetime.now(timezone.utc)
        self.users[new_id] = user_data
        return user_data

    async def create_company(self, company_data: Dict[str,
                                                      Any]) -> Dict[str, Any]:
        """Create a new company"""
        new_id = max(self.companies.keys()) + 1 if self.companies else 1
        company_data["id"] = new_id
        company_data["created_at"] = datetime.now(timezone.utc)
        company_data["updated_at"] = datetime.now(timezone.utc)
        self.companies[new_id] = company_data
        return company_data

    async def health_check(self) -> Dict[str, str]:
        """Mock health check"""
        return {
            "status": "healthy",
            "database": "mock",
            "connection": "active"
        }


class TestDatabase:
    """
    Comprehensive test database manager that supports multiple test modes
    """

    def __init__(self, mode: str = "mock"):
        """
        Initialize test database
        
        Args:
            mode: "mock" for unit tests, "test" for integration tests, "production" for e2e tests
        """
        self.mode = mode
        self.pool = None
        self.mock_db = None

        if mode == "mock":
            self.mock_db = MockDatabase()
        elif mode == "test":
            self.config = TestConfig(
                host=os.getenv("TEST_POSTGRES_HOST", "localhost"),
                port=int(os.getenv("TEST_POSTGRES_PORT", "5432")),
                database=os.getenv("TEST_POSTGRES_DB", "tca_platform_test"),
                user=os.getenv("TEST_POSTGRES_USER", "tca_test_user"),
                password=os.getenv("TEST_POSTGRES_PASSWORD",
                                   "tca_test_password"),
                ssl_mode=os.getenv("TEST_POSTGRES_SSL_MODE", "prefer"))
        elif mode == "production":
            self.config = TestConfig(
                host=os.getenv("POSTGRES_HOST",
                               "tca-irr-server.postgres.database.azure.com"),
                port=int(os.getenv("POSTGRES_PORT", "5432")),
                database=os.getenv("POSTGRES_DB", "tca_platform"),
                user=os.getenv("POSTGRES_USER", "tcairrserver"),
                password=os.getenv("POSTGRES_PASSWORD", ""),
                ssl_mode=os.getenv("POSTGRES_SSL_MODE", "require"))
        else:
            raise ValueError(
                f"Invalid mode: {mode}. Must be 'mock', 'test', or 'production'"
            )

    async def connect(self):
        """Establish database connection"""
        if self.mode == "mock":
            logger.info("Using mock database for testing")
            return

        try:
            self.pool = await asyncpg.create_pool(
                host=self.config.host,
                port=self.config.port,
                database=self.config.database,
                user=self.config.user,
                password=self.config.password,
                ssl=self.config.ssl_mode,
                min_size=self.config.pool_min_size,
                max_size=self.config.pool_max_size,
                command_timeout=30)
            logger.info(
                f"Connected to {self.mode} database: {self.config.host}:{self.config.port}/{self.config.database}"
            )

            # Initialize test database schema if needed
            if self.mode == "test":
                await self._initialize_test_schema()

        except Exception as e:
            logger.error(f"Failed to connect to {self.mode} database: {e}")
            raise

    async def disconnect(self):
        """Close database connection"""
        if self.pool:
            await self.pool.close()
            logger.info(f"Disconnected from {self.mode} database")

    async def _initialize_test_schema(self):
        """Initialize test database schema"""
        schema_sql = """
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            role VARCHAR(20) DEFAULT 'user',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE
        );
        
        -- Companies table
        CREATE TABLE IF NOT EXISTS companies (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            industry VARCHAR(100),
            stage VARCHAR(50),
            founded_year INTEGER,
            employee_count INTEGER,
            location VARCHAR(255),
            website VARCHAR(255),
            funding_raised BIGINT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Analyses table
        CREATE TABLE IF NOT EXISTS analyses (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id),
            analyst_id INTEGER REFERENCES users(id),
            analysis_type VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            results JSONB,
            recommendations TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Investments table
        CREATE TABLE IF NOT EXISTS investments (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id),
            investor_id INTEGER REFERENCES users(id),
            amount BIGINT NOT NULL,
            investment_type VARCHAR(50),
            investment_date TIMESTAMP WITH TIME ZONE,
            ownership_percentage DECIMAL(5,2),
            valuation BIGINT,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
        CREATE INDEX IF NOT EXISTS idx_analyses_company_id ON analyses(company_id);
        CREATE INDEX IF NOT EXISTS idx_investments_company_id ON investments(company_id);
        """

        async with self.pool.acquire() as connection:
            await connection.execute(schema_sql)
            logger.info("Test database schema initialized")

    @asynccontextmanager
    async def get_connection(self):
        """Get database connection context manager"""
        if self.mode == "mock":
            yield self.mock_db
        else:
            async with self.pool.acquire() as connection:
                yield connection

    async def cleanup_test_data(self):
        """Clean up test data (for test database only)"""
        if self.mode != "test":
            return

        cleanup_sql = """
        TRUNCATE TABLE investments RESTART IDENTITY CASCADE;
        TRUNCATE TABLE analyses RESTART IDENTITY CASCADE;
        TRUNCATE TABLE companies RESTART IDENTITY CASCADE;
        TRUNCATE TABLE users RESTART IDENTITY CASCADE;
        """

        async with self.pool.acquire() as connection:
            await connection.execute(cleanup_sql)
            logger.info("Test data cleaned up")

    async def seed_test_data(self):
        """Seed test database with sample data"""
        if self.mode == "mock":
            # Mock database is already seeded
            return

        # Hash passwords for test users
        admin_password = bcrypt.hashpw("admin123456".encode('utf-8'),
                                       bcrypt.gensalt()).decode('utf-8')
        test_password = bcrypt.hashpw("test123456".encode('utf-8'),
                                      bcrypt.gensalt()).decode('utf-8')

        seed_sql = """
        -- Insert test users
        INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
        ('admin', 'admin@tcaplatform.com', $1, 'Admin User', 'admin', true),
        ('testuser', 'test@example.com', $2, 'Test User', 'analyst', true);
        
        -- Insert test companies
        INSERT INTO companies (name, description, industry, stage, founded_year, employee_count, location, website, funding_raised) VALUES
        ('TechStart Inc', 'AI-powered fintech startup', 'Financial Technology', 'Series A', 2020, 25, 'San Francisco, CA', 'https://techstart.com', 5000000),
        ('GreenTech Solutions', 'Sustainable energy solutions', 'Clean Technology', 'Seed', 2022, 12, 'Austin, TX', 'https://greentech.solutions', 1200000);
        
        -- Insert test analyses
        INSERT INTO analyses (company_id, analyst_id, analysis_type, status, results, recommendations) VALUES
        (1, 1, 'comprehensive', 'completed', 
         '{"overall_score": 8.5, "risk_level": "medium", "growth_potential": "high", "market_fit": "strong", "financial_health": "good"}',
         ARRAY['Strong market position with clear competitive advantages', 'Consider expanding to European markets', 'Monitor cash burn rate closely']);
        
        -- Insert test investments
        INSERT INTO investments (company_id, investor_id, amount, investment_type, investment_date, ownership_percentage, valuation, status) VALUES
        (1, 1, 2000000, 'equity', CURRENT_TIMESTAMP, 15.5, 12900000, 'active');
        """

        async with self.pool.acquire() as connection:
            await connection.execute(seed_sql, admin_password, test_password)
            logger.info("Test data seeded successfully")

    async def health_check(self) -> Dict[str, str]:
        """Database health check"""
        if self.mode == "mock":
            return await self.mock_db.health_check()

        try:
            async with self.pool.acquire() as connection:
                await connection.execute("SELECT 1")
                return {
                    "status": "healthy",
                    "database": self.mode,
                    "connection": "active",
                    "host": self.config.host,
                    "database_name": self.config.database
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "database": self.mode,
                "connection": "failed",
                "error": str(e)
            }


# Test database factory function
async def create_test_database(mode: str = "mock") -> TestDatabase:
    """
    Factory function to create and initialize test database
    
    Args:
        mode: "mock", "test", or "production"
    
    Returns:
        Initialized TestDatabase instance
    """
    db = TestDatabase(mode=mode)
    await db.connect()

    if mode == "test":
        await db.cleanup_test_data()
        await db.seed_test_data()

    return db


# Context manager for test database lifecycle
@asynccontextmanager
async def test_database_context(mode: str = "mock"):
    """
    Context manager for test database lifecycle
    
    Usage:
        async with test_database_context("test") as db:
            # Use database
            async with db.get_connection() as conn:
                result = await conn.fetch("SELECT * FROM users")
    """
    db = await create_test_database(mode)
    try:
        yield db
    finally:
        await db.disconnect()


if __name__ == "__main__":
    """
    Test script to verify database configurations
    """

    async def test_all_modes():
        """Test all database modes"""

        # Test mock database
        print("Testing mock database...")
        async with test_database_context("mock") as mock_db:
            health = await mock_db.health_check()
            print(f"Mock DB Health: {health}")

            async with mock_db.get_connection() as conn:
                user = await conn.fetch_user_by_username("admin")
                print(
                    f"Mock user found: {user['username'] if user else 'None'}")

        # Test real test database (if configured)
        print("\nTesting test database...")
        try:
            async with test_database_context("test") as test_db:
                health = await test_db.health_check()
                print(f"Test DB Health: {health}")

                async with test_db.get_connection() as conn:
                    users = await conn.fetch(
                        "SELECT username FROM users LIMIT 5")
                    print(
                        f"Test users: {[user['username'] for user in users]}")
        except Exception as e:
            print(f"Test database not available: {e}")

        # Test production database (if configured)
        print("\nTesting production database...")
        try:
            async with test_database_context("production") as prod_db:
                health = await prod_db.health_check()
                print(f"Production DB Health: {health}")
        except Exception as e:
            print(f"Production database not available: {e}")

    # Run tests
    asyncio.run(test_all_modes())