#!/usr/bin/env python3
"""
Azure PostgreSQL Connection Test and Database Setup
Tests connection to Azure PostgreSQL and initializes the database
"""

import asyncio
import logging
import os
from pathlib import Path
import sys

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.StreamHandler(),
                        logging.FileHandler('azure_db_test.log')
                    ])
logger = logging.getLogger(__name__)


async def test_azure_connection():
    """Test connection to Azure PostgreSQL"""
    logger.info("=== Azure PostgreSQL Connection Test ===")

    try:
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()

        # Import database configuration
        from database_config import db_manager, db_config

        logger.info(
            f"Testing connection to: {db_config.host}:{db_config.port}")
        logger.info(f"Database: {db_config.database}")
        logger.info(f"User: {db_config.user}")
        logger.info(f"SSL Mode: {db_config.ssl_mode}")

        # Test connection
        logger.info("Creating connection pool...")
        await db_manager.create_pool()

        # Perform health check
        logger.info("Performing health check...")
        health = await db_manager.health_check()

        if health['status'] == 'healthy':
            logger.info("✅ SUCCESS: Connected to Azure PostgreSQL")
            logger.info(f"   Version: {health['version']}")
            logger.info(f"   Tables: {health['table_count']}")
            logger.info(f"   Pool Size: {health['pool_size']}")
            logger.info(
                f"   Available Connections: {health['pool_available']}")

            # Test basic queries
            logger.info("Testing basic database operations...")
            async with db_manager.get_connection() as conn:

                # Test 1: Basic query
                result = await conn.fetchval(
                    "SELECT 'Azure PostgreSQL Connected!' as message")
                logger.info(f"   Test Query Result: {result}")

                # Test 2: Check extensions
                extensions = await conn.fetch(
                    "SELECT extname FROM pg_extension ORDER BY extname")
                logger.info(
                    f"   Available Extensions: {[ext['extname'] for ext in extensions]}"
                )

                # Test 3: Check database size
                db_size = await conn.fetchval("""
                    SELECT pg_size_pretty(pg_database_size(current_database()))
                """)
                logger.info(f"   Database Size: {db_size}")

                # Test 4: Check current user and permissions
                current_user = await conn.fetchval("SELECT current_user")
                logger.info(f"   Connected as: {current_user}")

            return True

        else:
            logger.error("❌ FAILED: Database health check failed")
            logger.error(f"   Error: {health.get('error', 'Unknown error')}")
            return False

    except Exception as e:
        logger.error(f"❌ FAILED: Connection test failed: {e}")
        logger.error(
            "   Check your Azure PostgreSQL credentials and network connectivity"
        )
        return False

    finally:
        try:
            await db_manager.close_pool()
        except:
            pass


async def initialize_database():
    """Initialize database schema and sample data"""
    logger.info("=== Database Initialization ===")

    try:
        from init_db import init_database
        logger.info("Initializing database schema...")
        await init_database()
        logger.info("✅ Database initialization completed successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False


async def verify_tables():
    """Verify that all required tables exist"""
    logger.info("=== Table Verification ===")

    try:
        from database_config import db_manager, get_table_info

        await db_manager.create_pool()
        table_info = await get_table_info()

        if 'error' in table_info:
            logger.error(f"❌ Failed to get table info: {table_info['error']}")
            return False

        logger.info(f"Found {table_info['total_tables']} tables:")
        for table in table_info['tables']:
            logger.info(
                f"   • {table['table_name']} ({table['column_count']} columns)"
            )

        # Check for required tables
        required_tables = [
            'users', 'evaluations', 'app_requests', 'companies', 'founders'
        ]
        existing_tables = [t['table_name'] for t in table_info['tables']]

        missing_tables = [
            t for t in required_tables if t not in existing_tables
        ]
        if missing_tables:
            logger.warning(f"⚠️  Missing required tables: {missing_tables}")
        else:
            logger.info("✅ All required tables found")

        return len(missing_tables) == 0

    except Exception as e:
        logger.error(f"❌ Table verification failed: {e}")
        return False

    finally:
        try:
            await db_manager.close_pool()
        except:
            pass


async def test_sample_operations():
    """Test sample database operations"""
    logger.info("=== Sample Operations Test ===")

    try:
        from database_config import db_manager
        await db_manager.create_pool()

        async with db_manager.get_connection() as conn:

            # Test 1: Check if admin user exists
            admin_count = await conn.fetchval(
                "SELECT COUNT(*) FROM users WHERE role = 'Admin'")
            logger.info(f"   Admin users found: {admin_count}")

            # Test 2: Check evaluation statistics
            eval_stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_evaluations,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
                FROM evaluations
            """)
            if eval_stats:
                logger.info(
                    f"   Evaluations - Total: {eval_stats['total_evaluations']}, "
                    f"Completed: {eval_stats['completed']}, Pending: {eval_stats['pending']}"
                )

            # Test 3: Check industry benchmarks
            benchmark_count = await conn.fetchval(
                "SELECT COUNT(*) FROM industry_benchmarks")
            logger.info(f"   Industry benchmarks: {benchmark_count}")

        logger.info("✅ Sample operations completed successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Sample operations failed: {e}")
        return False

    finally:
        try:
            await db_manager.close_pool()
        except:
            pass


async def main():
    """Main test function"""
    logger.info("Starting Azure PostgreSQL Database Test Suite")
    logger.info("=" * 60)

    results = {}

    # Test 1: Connection
    results['connection'] = await test_azure_connection()

    if results['connection']:
        # Test 2: Initialize database
        results['initialization'] = await initialize_database()

        # Test 3: Verify tables
        results['tables'] = await verify_tables()

        # Test 4: Sample operations
        results['operations'] = await test_sample_operations()
    else:
        logger.error("Skipping remaining tests due to connection failure")
        results['initialization'] = False
        results['tables'] = False
        results['operations'] = False

    # Summary
    logger.info("=" * 60)
    logger.info("TEST SUMMARY:")
    logger.info(
        f"   Connection Test: {'✅ PASS' if results['connection'] else '❌ FAIL'}"
    )
    logger.info(
        f"   Initialization:  {'✅ PASS' if results['initialization'] else '❌ FAIL'}"
    )
    logger.info(
        f"   Table Verification: {'✅ PASS' if results['tables'] else '❌ FAIL'}"
    )
    logger.info(
        f"   Sample Operations: {'✅ PASS' if results['operations'] else '❌ FAIL'}"
    )

    overall_success = all(results.values())

    if overall_success:
        logger.info("🎉 ALL TESTS PASSED - Azure PostgreSQL is ready!")
        logger.info(
            "You can now start the backend server with: python main.py")
    else:
        logger.error("❌ SOME TESTS FAILED - Please check the errors above")

    return overall_success


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Test suite failed: {e}")
        sys.exit(1)