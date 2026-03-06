#!/usr/bin/env python3
"""
Production startup script for TCA Investment Analysis Platform
"""

import os
import sys
import logging
import asyncio
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables if not set
os.environ.setdefault("PYTHONPATH", str(backend_dir))


async def check_dependencies():
    """Check if all required services are available"""
    from app.core import settings
    from app.db import db_manager
    from app.services import ai_client

    logger = logging.getLogger(__name__)

    logger.info("Checking dependencies...")

    # Check database
    try:
        await db_manager.connect()
        db_health = await db_manager.health_check()
        if db_health.get("status") != "healthy":
            logger.error(f"Database health check failed: {db_health}")
            return False
        logger.info("Database connection: OK")
        await db_manager.disconnect()
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

    # Check AI service
    try:
        ai_health = await ai_client.health_check()
        if ai_health.get("status") != "healthy":
            logger.warning(f"AI service health check failed: {ai_health}")
            # AI service failure is non-critical for startup
        else:
            logger.info("AI service connection: OK")
    except Exception as e:
        logger.warning(f"AI service connection failed: {e}")
        # Continue startup even if AI service is unavailable

    return True


def run_production_server():
    """Run the production server using Gunicorn"""
    import uvicorn
    from app.core import settings

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    logger = logging.getLogger(__name__)
    logger.info("Starting TCA Investment Analysis Platform...")

    # Check dependencies
    if not asyncio.run(check_dependencies()):
        logger.error("Dependency check failed. Exiting.")
        sys.exit(1)

    # Start the server
    try:
        uvicorn.run("main:app",
                    host="0.0.0.0",
                    port=int(os.getenv("PORT", 8000)),
                    workers=int(os.getenv("WORKERS", 1)),
                    reload=False,
                    access_log=True,
                    log_level="info")
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_production_server()