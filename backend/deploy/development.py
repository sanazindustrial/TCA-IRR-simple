#!/usr/bin/env python3
"""
Development server startup script for TCA Investment Analysis Platform
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def setup_development_environment():
    """Setup development environment"""
    logger.info("Setting up development environment...")

    # Set environment variable
    os.environ["ENVIRONMENT"] = "development"

    # Load development environment file
    env_file = Path(".env.development")
    if env_file.exists():
        logger.info("Loading development environment variables")
        try:
            from dotenv import load_dotenv
            load_dotenv(".env.development")
        except ImportError:
            logger.warning("python-dotenv not available")
    else:
        logger.warning(".env.development file not found")

    logger.info("Development environment setup completed")


def install_dev_dependencies():
    """Install development dependencies"""
    logger.info("Installing development dependencies...")

    try:
        # Install requirements
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True)

        # Install development tools
        dev_packages = ["black", "flake8", "pytest", "pytest-asyncio", "mypy"]

        subprocess.run([sys.executable, "-m", "pip", "install"] + dev_packages,
                       check=True)

        logger.info("Development dependencies installed")
        return True

    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        return False


def run_development_server():
    """Run development server with hot reload"""
    logger.info("Starting development server...")

    try:
        # Start with hot reload
        cmd = [
            sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1",
            "--port", "8000", "--reload", "--reload-dir", "app", "--log-level",
            "debug"
        ]

        logger.info("Starting development server with hot reload...")
        logger.info("Server will be available at http://127.0.0.1:8000")
        logger.info("API documentation at http://127.0.0.1:8000/docs")

        subprocess.run(cmd, check=True)

    except subprocess.CalledProcessError as e:
        logger.error(f"Development server startup failed: {e}")
        return False
    except KeyboardInterrupt:
        logger.info("Development server shutdown")
        return True


def main():
    """Main development function"""
    logger.info("Starting TCA Platform development server...")

    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir.parent)

    try:
        # Setup environment
        setup_development_environment()

        # Install dependencies
        if not install_dev_dependencies():
            logger.error("Dependency installation failed")
            sys.exit(1)

        # Run development server
        run_development_server()

    except Exception as e:
        logger.error(f"Development startup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()