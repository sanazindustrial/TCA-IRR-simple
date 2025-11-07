"""
Improved database configuration and connection management
"""

import asyncpg
import asyncio
import logging
from typing import Optional, Dict, Any, AsyncGenerator
from contextlib import asynccontextmanager

from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Enhanced database connection manager with health checks and retry logic"""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self._is_connected = False

    async def connect(self) -> None:
        """Initialize database connection pool"""
        if self.pool:
            logger.warning("Database pool already initialized")
            return

        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                logger.info(
                    f"Creating database pool (attempt {attempt + 1}/{max_retries})..."
                )

                self.pool = await asyncpg.create_pool(
                    host=settings.postgres_host,
                    port=settings.postgres_port,
                    database=settings.postgres_db,
                    user=settings.postgres_user,
                    password=settings.postgres_password,
                    min_size=settings.db_pool_min_size,
                    max_size=settings.db_pool_max_size,
                    max_queries=settings.db_pool_max_queries,
                    max_inactive_connection_lifetime=settings.
                    db_pool_max_inactive_time,
                    command_timeout=60,
                    server_settings={"jit": "off"
                                     }  # Better performance for small queries
                )

                # Test the connection
                async with self.pool.acquire() as conn:
                    await conn.execute("SELECT 1")

                self._is_connected = True
                logger.info("Database connection pool created successfully")
                return

            except Exception as e:
                logger.error(
                    f"Database connection attempt {attempt + 1} failed: {e}")

                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error("All database connection attempts failed")
                    raise ConnectionError(
                        f"Failed to connect to database after {max_retries} attempts"
                    )

    async def disconnect(self) -> None:
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            self._is_connected = False
            logger.info("Database connection pool closed")

    @asynccontextmanager
    async def get_connection(self) -> AsyncGenerator[asyncpg.Connection, None]:
        """Get a database connection from the pool"""
        if not self.pool or not self._is_connected:
            raise ConnectionError("Database not connected")

        async with self.pool.acquire() as connection:
            try:
                yield connection
            except Exception as e:
                logger.error(f"Database operation failed: {e}")
                raise

    @asynccontextmanager
    async def get_transaction(
            self) -> AsyncGenerator[asyncpg.Connection, None]:
        """Get a database connection with transaction support"""
        async with self.get_connection() as conn:
            async with conn.transaction():
                yield conn

    async def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive database health check"""
        if not self.pool or not self._is_connected:
            return {"status": "unhealthy", "error": "No connection pool"}

        try:
            async with self.get_connection() as conn:
                # Basic connectivity check
                await conn.fetchval("SELECT 1")

                # Check database version
                version = await conn.fetchval("SELECT version()")

                # Check table existence
                table_count = await conn.fetchval("""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """)

                # Check active connections
                active_connections = await conn.fetchval("""
                    SELECT COUNT(*) 
                    FROM pg_stat_activity 
                    WHERE state = 'active'
                """)

                return {
                    "status": "healthy",
                    "database": settings.postgres_db,
                    "host": settings.postgres_host,
                    "version": version,
                    "table_count": table_count,
                    "pool_size": self.pool.get_size(),
                    "pool_max_size": self.pool.get_max_size(),
                    "active_connections": active_connections
                }

        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "database": settings.postgres_db,
                "host": settings.postgres_host
            }

    async def execute_query(self,
                            query: str,
                            *args,
                            fetch_one: bool = False,
                            fetch_all: bool = False):
        """Execute a database query with proper error handling"""
        try:
            async with self.get_connection() as conn:
                if fetch_one:
                    return await conn.fetchrow(query, *args)
                elif fetch_all:
                    return await conn.fetch(query, *args)
                else:
                    return await conn.execute(query, *args)
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise

    async def execute_transaction(self, queries: list):
        """Execute multiple queries in a transaction"""
        try:
            async with self.get_transaction() as conn:
                results = []
                for query, args in queries:
                    result = await conn.execute(query, *args)
                    results.append(result)
                return results
        except Exception as e:
            logger.error(f"Transaction failed: {e}")
            raise


# Global database manager instance
db_manager = DatabaseManager()


# Dependency injection functions
async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """Get database connection (for FastAPI dependency injection)"""
    async with db_manager.get_connection() as conn:
        yield conn


async def get_db_transaction() -> AsyncGenerator[asyncpg.Connection, None]:
    """Get database transaction (for FastAPI dependency injection)"""
    async with db_manager.get_transaction() as conn:
        yield conn