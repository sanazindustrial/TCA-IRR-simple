#!/usr/bin/env python3
"""
Production deployment script for TCA Investment Analysis Platform
"""

import os
import sys
import subprocess
import logging
import time
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def check_requirements():
    """Check if all deployment requirements are met"""
    logger.info("Checking deployment requirements...")

    # Check Python version
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        return False

    # Check for required files
    required_files = [".env.production", "requirements.txt", "main.py"]

    for file in required_files:
        if not Path(file).exists():
            logger.error(f"Required file missing: {file}")
            return False

    logger.info("All requirements met")
    return True


def setup_environment():
    """Setup production environment"""
    logger.info("Setting up production environment...")

    # Set environment variable
    os.environ["ENVIRONMENT"] = "production"

    # Load production environment file
    env_file = Path(".env.production")
    if env_file.exists():
        logger.info("Loading production environment variables")
        # In production, use python-dotenv to load variables
        try:
            from dotenv import load_dotenv
            load_dotenv(".env.production")
        except ImportError:
            logger.warning(
                "python-dotenv not available, ensure environment variables are set"
            )

    logger.info("Environment setup completed")


def install_dependencies():
    """Install production dependencies"""
    logger.info("Installing dependencies...")

    try:
        # Upgrade pip
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--upgrade", "pip"],
            check=True)

        # Install requirements
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True)

        logger.info("Dependencies installed successfully")
        return True

    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        return False


def initialize_database():
    """Initialize database for production"""
    logger.info("Initializing database...")

    try:
        # Run database initialization
        subprocess.run([sys.executable, "scripts/init_database.py"],
                       check=True)
        logger.info("Database initialized successfully")
        return True

    except subprocess.CalledProcessError as e:
        logger.error(f"Database initialization failed: {e}")
        return False


def run_health_checks():
    """Run pre-deployment health checks"""
    logger.info("Running health checks...")

    try:
        # Import and run health checks
        sys.path.insert(0, str(Path.cwd()))

        from app.core import settings
        from app.db import db_manager
        from app.services import ai_client

        # Check database connection
        import asyncio

        async def check_db():
            await db_manager.connect()
            health = await db_manager.health_check()
            await db_manager.disconnect()
            return health.get("status") == "healthy"

        db_healthy = asyncio.run(check_db())
        if not db_healthy:
            logger.error("Database health check failed")
            return False

        # Check AI service (optional)
        async def check_ai():
            health = await ai_client.health_check()
            return health.get("status") == "healthy"

        ai_healthy = asyncio.run(check_ai())
        if not ai_healthy:
            logger.warning(
                "AI service health check failed - continuing deployment")

        logger.info("Health checks completed")
        return True

    except Exception as e:
        logger.error(f"Health checks failed: {e}")
        return False


def deploy_application():
    """Deploy the application"""
    logger.info("Deploying application...")

    # Get configuration
    port = os.getenv("PORT", "8000")
    workers = os.getenv("WORKERS", "4")

    logger.info(f"Starting application on port {port} with {workers} workers")

    try:
        # Start the application using uvicorn
        cmd = [
            sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0",
            "--port", port, "--workers", workers, "--log-level", "info",
            "--access-log", "--no-reload"
        ]

        logger.info(f"Executing: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)

    except subprocess.CalledProcessError as e:
        logger.error(f"Application startup failed: {e}")
        return False
    except KeyboardInterrupt:
        logger.info("Application shutdown requested")
        return True


def main():
    """Main deployment function"""
    logger.info("Starting TCA Platform production deployment...")

    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir.parent)

    try:
        # Check requirements
        if not check_requirements():
            logger.error("Requirements check failed")
            sys.exit(1)

        # Setup environment
        setup_environment()

        # Install dependencies
        if not install_dependencies():
            logger.error("Dependency installation failed")
            sys.exit(1)

        # Initialize database
        if not initialize_database():
            logger.error("Database initialization failed")
            sys.exit(1)

        # Run health checks
        if not run_health_checks():
            logger.error("Health checks failed")
            sys.exit(1)

        # Deploy application
        logger.info("All checks passed. Deploying application...")
        deploy_application()

    except Exception as e:
        logger.error(f"Deployment failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()