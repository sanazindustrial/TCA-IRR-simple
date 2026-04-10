#!/usr/bin/env python3
"""
Check current database state and clean up if needed.
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


async def check_and_clean_database():
    """Check database state and clean up if needed"""
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        logger.info("Connected to Azure PostgreSQL successfully")

        # Check existing tables
        tables_sql = """
        SELECT table_name, table_schema
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
        """

        tables = await conn.fetch(tables_sql)
        if tables:
            logger.info("Existing tables found:")
            for table in tables:
                logger.info(f"  - {table['table_name']}")

            # Check if we should drop and recreate
            response = input(
                "Do you want to drop all existing tables and start fresh? (y/N): "
            )
            if response.lower() == 'y':
                # Drop all tables
                for table in tables:
                    drop_sql = f'DROP TABLE IF EXISTS "{table["table_name"]}" CASCADE;'
                    await conn.execute(drop_sql)
                    logger.info(f"Dropped table: {table['table_name']}")

                # Also drop custom types
                await conn.execute('DROP TYPE IF EXISTS user_role CASCADE;')
                await conn.execute(
                    'DROP TYPE IF EXISTS evaluation_status CASCADE;')
                await conn.execute(
                    'DROP TYPE IF EXISTS request_status CASCADE;')
                logger.info("Dropped custom types")

                logger.info("✅ All tables and types dropped successfully")
            else:
                logger.info("Keeping existing tables")
        else:
            logger.info("No existing tables found")

        # Check for any remaining objects
        remaining_sql = """
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public';
        """
        remaining = await conn.fetch(remaining_sql)
        logger.info(f"Tables after cleanup: {len(remaining)}")

    except Exception as e:
        logger.error(f"Error: {str(e)}")

    finally:
        if 'conn' in locals():
            await conn.close()
            logger.info("Database connection closed")


if __name__ == "__main__":
    asyncio.run(check_and_clean_database())