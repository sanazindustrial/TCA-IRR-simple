#!/usr/bin/env python3
"""
Test the existing database structure and verify it works with our backend.
"""

import asyncio
import asyncpg
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    "host": "tca-irr-server.postgres.database.azure.com",
    "port": 5432,
    "database": "tca_platform",
    "user": "tcairrserver",
    "password": "Tc@1rr53rv5r",
    "command_timeout": 60
}


async def test_existing_schema():
    """Test the existing database schema"""
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        logger.info("Connected to Azure PostgreSQL successfully")

        # Check users table structure
        users_sql = """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
        """

        users_columns = await conn.fetch(users_sql)
        if users_columns:
            logger.info("Users table structure:")
            for col in users_columns:
                logger.info(
                    f"  - {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})"
                )
        else:
            logger.warning("Users table not found or empty")

        # Check existing users
        user_count_sql = "SELECT COUNT(*) as count FROM users;"
        try:
            user_result = await conn.fetchrow(user_count_sql)
            logger.info(f"Existing users count: {user_result['count']}")

            if user_result['count'] == 0:
                # Insert test users
                insert_users_sql = """
                INSERT INTO users (full_name, email, password_hash, role, email_verified, status, created_at) 
                VALUES 
                    ('System Administrator', 'admin@tcairr.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.s5.e.6', 'Admin', TRUE, 'Active', NOW()),
                    ('John Doe', 'user@tcairr.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.s5.e.6', 'User', TRUE, 'Active', NOW())
                ON CONFLICT (email) DO NOTHING;
                """
                await conn.execute(insert_users_sql)
                logger.info("✅ Test users inserted")
            else:
                logger.info("Users already exist")
        except Exception as e:
            logger.warning(f"Could not check/insert users: {e}")

        # Check companies table
        try:
            companies_sql = "SELECT COUNT(*) as count FROM companies;"
            company_result = await conn.fetchrow(companies_sql)
            logger.info(f"Existing companies count: {company_result['count']}")

            if company_result['count'] == 0:
                # Insert a test company
                insert_company_sql = """
                INSERT INTO companies (name, description, website, industry, sector, stage, created_at)
                VALUES ('TechCorp Inc', 'A sample technology company for testing', 'https://techcorp.example.com', 'Technology', 'Software', 'Series A', NOW());
                """
                await conn.execute(insert_company_sql)
                logger.info("✅ Test company inserted")
        except Exception as e:
            logger.warning(f"Could not check/insert companies: {e}")

        # Check evaluations table
        try:
            evaluations_sql = "SELECT COUNT(*) as count FROM evaluations;"
            eval_result = await conn.fetchrow(evaluations_sql)
            logger.info(f"Existing evaluations count: {eval_result['count']}")
        except Exception as e:
            logger.warning(f"Could not check evaluations: {e}")

        # Test a simple query that our backend would use
        try:
            test_auth_sql = """
            SELECT user_id, full_name, email, role, status 
            FROM users 
            WHERE email = 'admin@tcairr.com' AND status = 'Active'
            LIMIT 1;
            """
            auth_result = await conn.fetchrow(test_auth_sql)
            if auth_result:
                logger.info("✅ Authentication test query successful")
                logger.info(
                    f"   Found user: {auth_result['full_name']} ({auth_result['role']})"
                )
            else:
                logger.warning(
                    "❌ Authentication test query returned no results")
        except Exception as e:
            logger.error(f"❌ Authentication test query failed: {e}")

        return True

    except Exception as e:
        logger.error(f"Database test failed: {str(e)}")
        return False

    finally:
        if 'conn' in locals():
            await conn.close()
            logger.info("Database connection closed")


if __name__ == "__main__":
    success = asyncio.run(test_existing_schema())
    if success:
        logger.info("🎉 Database appears to be ready for the backend!")
        logger.info("✅ You can now try running: python main.py")
    else:
        logger.error("❌ Database test failed")
        exit(1)