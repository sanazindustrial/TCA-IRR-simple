"""
Database initialization and migration script for TCA IRR App
"""

import asyncio
import asyncpg
import os
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration - Azure PostgreSQL with SSL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://tcairrserver:Tc@1rr53rv5r@tca-irr-server.postgres.database.azure.com:5432/tca_platform?sslmode=require"
)


async def init_database():
    """Initialize database with schema and sample data"""
    try:
        # Connect to Azure PostgreSQL database using direct parameters
        logger.info("Connecting to Azure PostgreSQL database...")
        conn = await asyncpg.connect(
            host="tca-irr-server.postgres.database.azure.com",
            port=5432,
            database="tca_platform",
            user="tcairrserver",
            password="Tc@1rr53rv5r",
            command_timeout=60)
        logger.info("Connected to Azure PostgreSQL successfully")

        # Read and execute complete schema
        schema_dir = Path(__file__).parent / "schema"

        # Check if azure_compatible_schema.sql exists, otherwise use complete_schema.sql
        complete_schema_file = schema_dir / "azure_compatible_schema.sql"
        if not complete_schema_file.exists():
            complete_schema_file = schema_dir / "complete_schema.sql"
        if complete_schema_file.exists():
            logger.info("Executing complete database schema...")
            complete_schema = complete_schema_file.read_text()
            await conn.execute(complete_schema)
            logger.info("Complete database schema created successfully")
        else:
            # Fallback to individual schema files
            logger.info("Complete schema not found, using individual files...")

            # Execute users.sql
            users_sql = (schema_dir / "users.sql").read_text()
            await conn.execute(users_sql)
            logger.info("Users schema created successfully")

            # Execute app_requests.sql
            requests_sql = (schema_dir / "app_requests.sql").read_text()
            await conn.execute(requests_sql)
            logger.info("App requests schema created successfully")

            # Execute evaluations.sql
            evaluations_sql = (schema_dir / "evaluations.sql").read_text()
            await conn.execute(evaluations_sql)
            logger.info("Evaluations schema created successfully")

        # Create default admin user if not exists
        admin_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
            "admin@tca-irr.com")

        if not admin_exists:
            import bcrypt
            import uuid

            admin_password = bcrypt.hashpw("TcaAdmin2024!".encode('utf-8'),
                                           bcrypt.gensalt()).decode('utf-8')
            admin_id = uuid.uuid4()

            await conn.execute(
                """
                INSERT INTO users (user_id, full_name, email, password_hash, role, status, department, job_title)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, admin_id, "System Administrator", "admin@tca-irr.com",
                admin_password, "Admin", "Active", "IT",
                "System Administrator")

            # Create user settings for admin
            await conn.execute(
                "INSERT INTO user_settings (user_id, theme, notifications_enabled) VALUES ($1, $2, $3)",
                admin_id, "dark", True)

            # Create report quotas for admin (unlimited)
            await conn.execute(
                "INSERT INTO report_quotas (user_id, evaluation_limit) VALUES ($1, $2)",
                admin_id, 999999)

            logger.info(
                "Admin user created successfully (email: admin@tca-irr.com, password: TcaAdmin2024!)"
            )

        # Create sample test user for development
        test_user_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
            "test@tca-irr.com")

        if not test_user_exists:
            import bcrypt
            import uuid

            test_password = bcrypt.hashpw("TestUser123!".encode('utf-8'),
                                          bcrypt.gensalt()).decode('utf-8')
            test_id = uuid.uuid4()

            await conn.execute(
                """
                INSERT INTO users (user_id, full_name, email, password_hash, role, status, department, job_title)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, test_id, "Test User", "test@tca-irr.com", test_password,
                "User", "Active", "Investment", "Analyst")

            # Create user settings
            await conn.execute(
                "INSERT INTO user_settings (user_id) VALUES ($1)", test_id)

            # Create report quotas
            await conn.execute(
                "INSERT INTO report_quotas (user_id, evaluation_limit, evaluations_used) VALUES ($1, $2, $3)",
                test_id, 50, 0)

            logger.info(
                "Test user created successfully (email: test@tca-irr.com, password: TestUser123!)"
            )

        await conn.close()
        logger.info("Database initialization completed successfully")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def reset_database():
    """Reset database by dropping and recreating all tables"""
    try:
        conn = await asyncpg.connect(
            host="tca-irr-server.postgres.database.azure.com",
            port=5432,
            database="tca_platform",
            user="tcairrserver",
            password="Tc@1rr53rv5r",
            command_timeout=60)

        # Drop all tables in reverse order due to foreign key constraints
        tables_to_drop = [
            "error_logs", "activity_logs", "reports", "analysis_templates",
            "ai_model_configs", "industry_benchmarks", "request_comments",
            "app_requests", "evaluation_modules", "evaluations", "founders",
            "companies", "report_quotas", "user_settings", "users"
        ]

        for table in tables_to_drop:
            await conn.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
            logger.info(f"Dropped table: {table}")

        # Drop views
        await conn.execute("DROP VIEW IF EXISTS user_statistics CASCADE;")
        await conn.execute("DROP VIEW IF EXISTS active_evaluations CASCADE;")

        # Drop types
        await conn.execute("DROP TYPE IF EXISTS user_role CASCADE;")

        # Drop functions
        await conn.execute(
            "DROP FUNCTION IF EXISTS create_sample_benchmarks() CASCADE;")

        logger.info("Dropped existing tables")
        await conn.close()

        # Reinitialize
        await init_database()

    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Database management for TCA IRR App")
    parser.add_argument("--reset",
                        action="store_true",
                        help="Reset database (drops all tables)")
    args = parser.parse_args()

    if args.reset:
        print("⚠️  WARNING: This will delete all existing data!")
        confirm = input(
            "Are you sure you want to reset the database? (yes/no): ")
        if confirm.lower() == 'yes':
            asyncio.run(reset_database())
        else:
            print("Database reset cancelled")
    else:
        asyncio.run(init_database())