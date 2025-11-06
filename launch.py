#!/usr/bin/env python3
"""
Quick launch script for TCA IRR Backend
Handles environment setup, database initialization, and server startup
"""

import os
import sys
import asyncio
import subprocess
import logging
from pathlib import Path
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def check_requirements():
    """Check if all required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import asyncpg
        import bcrypt
        import jwt
        logger.info("✅ All required packages are installed")
        return True
    except ImportError as e:
        logger.error(f"❌ Missing required package: {e}")
        return False


def install_requirements():
    """Install required packages from requirements.txt"""
    logger.info("📦 Installing required packages...")
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("✅ Packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to install packages: {e}")
        return False


def setup_environment():
    """Setup environment variables"""
    env_file = Path(".env")
    env_example = Path(".env.example")

    if not env_file.exists():
        if env_example.exists():
            logger.info("📝 Creating .env file from .env.example...")
            env_content = env_example.read_text()
            env_file.write_text(env_content)
        else:
            logger.info("📝 Creating default .env file...")
            default_env = """# === Azure PostgreSQL Database Configuration (Production) ===
POSTGRES_HOST=tca-irr-server.postgres.database.azure.com
POSTGRES_PORT=5432
POSTGRES_DB=tca_platform
POSTGRES_USER=tcairrserver
POSTGRES_PASSWORD=Tc@1rr53rv5r

# Constructed Database URL (Azure PostgreSQL)
DATABASE_URL=postgresql://tcairrserver:Tc@1rr53rv5r@tca-irr-server.postgres.database.azure.com:5432/tca_platform?sslmode=require

# JWT Configuration
JWT_SECRET_KEY=TCA-IRR-2024-Production-Secret-Key-Change-Me-32-Chars-Min
JWT_ALGORITHM=HS256

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Development settings
DEBUG=true
LOG_LEVEL=info
"""
            env_file.write_text(default_env)

        logger.info(
            "⚠️  Please update .env file with your actual configuration")
        logger.info("   Especially update DATABASE_URL and JWT_SECRET_KEY")

    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
        logger.info("✅ Environment variables loaded")
    except ImportError:
        logger.warning(
            "⚠️  python-dotenv not available, using system environment")


async def check_database():
    """Check database connection and initialize if needed"""
    try:
        from database_config import db_manager, db_config

        logger.info(
            f"🔌 Checking Azure PostgreSQL connection to {db_config.host}...")

        # Create database pool and perform health check
        await db_manager.create_pool()
        health = await db_manager.health_check()

        if health['status'] == 'healthy':
            logger.info(
                f"✅ Connected to Azure PostgreSQL: {health['version']}")
            logger.info(f"📊 Found {health['table_count']} tables in database")

            # Check if we have the essential tables
            if health['table_count'] < 5:
                logger.info(
                    "🏗️  Insufficient tables found, initializing database...")
                from init_db import init_database
                await init_database()
            else:
                logger.info("✅ Database schema appears complete")
        else:
            logger.error(
                f"❌ Database health check failed: {health.get('error')}")
            return False

        return True

    except Exception as e:
        logger.error(f"❌ Azure PostgreSQL connection failed: {e}")
        logger.info("💡 Please check your Azure PostgreSQL configuration:")
        logger.info("   - Server: tca-irr-server.postgres.database.azure.com")
        logger.info("   - Database: tca_platform")
        logger.info("   - Username: tcairrserver")
        logger.info("   - SSL: Required")
        return False


def start_genkit_server():
    """Start Genkit AI server in background"""
    try:
        logger.info("🤖 Starting Genkit AI server...")
        # Check if genkit is available
        result = subprocess.run(["npm", "run", "genkit:dev"],
                                cwd=Path.cwd(),
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                                text=True,
                                timeout=5)

        if result.returncode == 0:
            logger.info("✅ Genkit server started successfully")
        else:
            logger.warning("⚠️  Genkit server may not be available")
            logger.info("   AI features will be limited without Genkit server")

    except (subprocess.TimeoutExpired, FileNotFoundError):
        logger.warning("⚠️  Could not start Genkit server automatically")
        logger.info("   You can start it manually with: npm run genkit:dev")
    except Exception as e:
        logger.warning(f"⚠️  Genkit server start failed: {e}")


def start_backend_server():
    """Start the FastAPI backend server"""
    logger.info("🚀 Starting TCA IRR Backend server...")

    try:
        import uvicorn

        # Start server
        uvicorn.run("main:app",
                    host="0.0.0.0",
                    port=8000,
                    reload=True,
                    log_level="info",
                    access_log=True)
    except KeyboardInterrupt:
        logger.info("👋 Server shutdown requested")
    except Exception as e:
        logger.error(f"❌ Server startup failed: {e}")
        raise


async def main():
    """Main launch function"""
    logger.info("🎯 TCA IRR Backend Quick Launch")
    logger.info("=" * 50)

    # Step 1: Check and install requirements
    if not check_requirements():
        logger.info("📦 Installing missing packages...")
        if not install_requirements():
            logger.error(
                "❌ Failed to install requirements. Please run manually: pip install -r requirements.txt"
            )
            return False

    # Step 2: Setup environment
    setup_environment()

    # Step 3: Check database
    if not await check_database():
        logger.error(
            "❌ Database setup failed. Please check your PostgreSQL configuration."
        )
        return False

    # Step 4: Start Genkit server (optional)
    start_genkit_server()

    # Give Genkit server a moment to start
    time.sleep(2)

    # Step 5: Start backend server
    logger.info("✅ All checks passed! Starting backend server...")
    logger.info("🌐 Backend API will be available at: http://localhost:8000")
    logger.info("📚 API Documentation: http://localhost:8000/docs")
    logger.info("🎯 Frontend should run on: http://localhost:3000")
    logger.info("")
    logger.info("Press Ctrl+C to stop the server")
    logger.info("=" * 50)

    start_backend_server()
    return True


def print_usage():
    """Print usage instructions"""
    print("""
TCA IRR Backend Quick Launch
============================

Usage:
    python launch.py           # Quick launch with auto-setup
    python launch.py --help    # Show this help
    python launch.py --init    # Initialize database only
    python launch.py --check   # Check system requirements

Before first run:
1. Ensure PostgreSQL is installed and running
2. Update .env file with your database credentials
3. Install Node.js dependencies for the frontend: npm install

The backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs
    """)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--help":
            print_usage()
            sys.exit(0)
        elif sys.argv[1] == "--init":
            from init_db import init_database
            asyncio.run(init_database())
            sys.exit(0)
        elif sys.argv[1] == "--check":
            logger.info("Checking system requirements...")
            if check_requirements():
                logger.info("✅ All requirements satisfied")
            else:
                logger.error("❌ Some requirements missing")
            sys.exit(0)

    # Run main launch
    try:
        success = asyncio.run(main())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        logger.info("\n👋 Goodbye!")
    except Exception as e:
        logger.error(f"❌ Launch failed: {e}")
        sys.exit(1)