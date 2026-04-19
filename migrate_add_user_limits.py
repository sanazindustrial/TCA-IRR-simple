"""Add missing columns triage_report_limit and dd_report_limit to users table"""
import asyncio
import asyncpg
import os

POSTGRES_HOST = "tca-irr-server.postgres.database.azure.com"
POSTGRES_USER = "tcairrserver"
POSTGRES_PASSWORD = "Tc@1rr53rv5r"
POSTGRES_DB = "tca_platform"


async def add_columns():
    conn = await asyncpg.connect(
        host=POSTGRES_HOST,
        port=5432,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        ssl=True
    )
    try:
        # Check existing columns
        rows = await conn.fetch("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        """)
        existing = [r['column_name'] for r in rows]
        print("Existing users columns:", existing)

        # Add triage_report_limit if missing
        if 'triage_report_limit' not in existing:
            await conn.execute("ALTER TABLE users ADD COLUMN triage_report_limit INTEGER DEFAULT NULL")
            print("Added: triage_report_limit")
        else:
            print("Already exists: triage_report_limit")

        # Add dd_report_limit if missing
        if 'dd_report_limit' not in existing:
            await conn.execute("ALTER TABLE users ADD COLUMN dd_report_limit INTEGER DEFAULT NULL")
            print("Added: dd_report_limit")
        else:
            print("Already exists: dd_report_limit")

        print("\nDone. Verifying...")
        rows = await conn.fetch("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        """)
        for r in rows:
            print(f"  {r['column_name']}: {r['data_type']}")
    finally:
        await conn.close()


asyncio.run(add_columns())
