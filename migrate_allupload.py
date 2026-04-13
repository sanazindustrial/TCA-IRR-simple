#!/usr/bin/env python3
"""
Migration script: Create the allupload table and verify it works.
Run: py -3.12 migrate_allupload.py
"""

import asyncio
import asyncpg
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

DB_CONFIG = {
    "host": "tca-irr-server.postgres.database.azure.com",
    "port": 5432,
    "database": "tca_platform",
    "user": "tcairrserver",
    "password": "Tc@1rr53rv5r",
    "command_timeout": 60,
}


async def migrate():
    conn = await asyncpg.connect(**DB_CONFIG, ssl="require")
    logger.info("Connected to Azure PostgreSQL")

    # 1. Execute the schema SQL
    schema_file = Path(__file__).parent / "schema" / "allupload.sql"
    sql = schema_file.read_text(encoding="utf-8")
    await conn.execute(sql)
    logger.info("allupload table created (or already exists)")

    # 2. Verify: describe the table
    cols = await conn.fetch(
        """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'allupload'
        ORDER BY ordinal_position
        """
    )
    logger.info(f"allupload table has {len(cols)} columns:")
    for c in cols:
        logger.info(f"  {c['column_name']:25s} {c['data_type']:20s} nullable={c['is_nullable']}  default={c['column_default']}")

    # 3. Count existing rows
    count = await conn.fetchval("SELECT COUNT(*) FROM allupload")
    logger.info(f"Current row count: {count}")

    await conn.close()
    logger.info("Migration complete.")


if __name__ == "__main__":
    asyncio.run(migrate())
