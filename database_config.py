"""
Database configuration and connection manager for Azure PostgreSQL
"""

import asyncpg
import os
import logging
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
import ssl

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """Database configuration manager for Azure PostgreSQL"""

    def __init__(self):
        # Azure PostgreSQL connection parameters
        self.host = os.getenv("POSTGRES_HOST",
                              "tca-irr-server.postgres.database.azure.com")
        self.port = int(os.getenv("POSTGRES_PORT", "5432"))
        self.database = os.getenv("POSTGRES_DB", "tca_platform")
        self.user = os.getenv("POSTGRES_USER", "tcairrserver")
        self.password = os.getenv("POSTGRES_PASSWORD", "Tc@1rr53rv5r")

        # SSL configuration for Azure PostgreSQL
        self.ssl_mode = os.getenv("POSTGRES_SSL_MODE", "require")

        # Connection pool settings
        self.min_pool_size = int(os.getenv("DB_POOL_MIN_SIZE", "5"))
        self.max_pool_size = int(os.getenv("DB_POOL_MAX_SIZE", "20"))
        self.max_queries = int(os.getenv("DB_POOL_MAX_QUERIES", "50000"))
        self.max_inactive_connection_lifetime = float(
            os.getenv("DB_POOL_MAX_INACTIVE_TIME", "300"))

        # Construct database URL
        self.database_url = self._construct_database_url()

    def _construct_database_url(self) -> str:
        """Construct the database URL with proper SSL settings for Azure"""
        url = f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"

        # Add SSL mode for Azure PostgreSQL
        if self.ssl_mode:
            url += f"?sslmode={self.ssl_mode}"

        return url

    def get_connection_params(self) -> Dict[str, Any]:
        """Get asyncpg connection parameters"""
        params = {
            "host": self.host,
            "port": self.port,
            "database": self.database,
            "user": self.user,
            "password": self.password,
            "command_timeout": 60,
        }

        # Let asyncpg handle SSL automatically for Azure PostgreSQL
        # This works better than manual SSL configuration

        return params

    def get_pool_params(self) -> Dict[str, Any]:
        """Get connection pool parameters"""
        return {
            **self.get_connection_params(),
            "min_size": self.min_pool_size,
            "max_size": self.max_pool_size,
            "max_queries": self.max_queries,
            "max_inactive_connection_lifetime":
            self.max_inactive_connection_lifetime,
            "command_timeout": 60,
            "server_settings": {
                "jit":
                "off"  # Disable JIT for better performance on small queries
            }
        }


class DatabaseManager:
    """Database connection manager with health checks and retry logic"""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.pool: Optional[asyncpg.Pool] = None

    async def create_pool(self) -> asyncpg.Pool:
        """Create database connection pool with retry logic"""
        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                logger.info(
                    f"Creating database pool (attempt {attempt + 1}/{max_retries})..."
                )

                pool = await asyncpg.create_pool(
                    **self.config.get_pool_params())

                # Test the connection
                async with pool.acquire() as conn:
                    await conn.execute("SELECT 1")

                logger.info("Database connection pool created successfully")
                self.pool = pool
                return pool

            except Exception as e:
                logger.error(
                    f"Database connection attempt {attempt + 1} failed: {e}")

                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error("All database connection attempts failed")
                    raise

    async def close_pool(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")

    async def health_check(self) -> Dict[str, Any]:
        """Perform database health check"""
        if not self.pool:
            return {"status": "unhealthy", "error": "No connection pool"}

        try:
            async with self.pool.acquire() as conn:
                # Basic connectivity check
                result = await conn.fetchval("SELECT 1")

                # Check database version
                version = await conn.fetchval("SELECT version()")

                # Check table existence
                table_count = await conn.fetchval("""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """)

                return {
                    "status": "healthy",
                    "database": self.config.database,
                    "host": self.config.host,
                    "version": version,
                    "table_count": table_count,
                    "pool_size": self.pool.get_size(),
                    "pool_max_size": self.pool.get_max_size()
                }

        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "database": self.config.database,
                "host": self.config.host
            }

    @asynccontextmanager
    async def get_connection(self):
        """Get a database connection from the pool"""
        if not self.pool:
            raise Exception("Database pool not initialized")

        async with self.pool.acquire() as connection:
            yield connection


# Global database manager instance
db_config = DatabaseConfig()
db_manager = DatabaseManager(db_config)


# Convenience function for getting connections
async def get_db_connection():
    """Get database connection (for dependency injection)"""
    async with db_manager.get_connection() as conn:
        yield conn


# Database utilities
async def execute_sql_file(file_path: str,
                           connection: Optional[asyncpg.Connection] = None):
    """Execute SQL file with proper error handling"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()

        if connection:
            await connection.execute(sql_content)
        else:
            async with db_manager.get_connection() as conn:
                await conn.execute(sql_content)

        logger.info(f"Successfully executed SQL file: {file_path}")

    except Exception as e:
        logger.error(f"Failed to execute SQL file {file_path}: {e}")
        raise


async def check_table_exists(table_name: str) -> bool:
    """Check if a table exists in the database"""
    try:
        async with db_manager.get_connection() as conn:
            result = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            """, table_name)
            return result
    except Exception:
        return False


async def get_table_info() -> Dict[str, Any]:
    """Get information about database tables"""
    try:
        async with db_manager.get_connection() as conn:
            tables = await conn.fetch("""
                SELECT 
                    table_name,
                    (SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
                FROM information_schema.tables t
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)

            return {
                "total_tables": len(tables),
                "tables": [dict(table) for table in tables]
            }
    except Exception as e:
        logger.error(f"Failed to get table info: {e}")
        return {"error": str(e)}