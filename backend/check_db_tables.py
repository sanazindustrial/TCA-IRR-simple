jn#!/usr/bin/env python3
"""Check database tables"""
import asyncio
import asyncpg
import ssl

DB_HOST = 'tca-irr-server.postgres.database.azure.com'
DB_PORT = 5432
DB_NAME = 'tca_platform'
DB_USER = 'tcairrserver'
DB_PASSWORD = 'Tc@1rr53rv5r'

async def main():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    conn = await asyncpg.connect(
        host=DB_HOST, port=DB_PORT, database=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, ssl=ctx
    )
    
    rows = await conn.fetch(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    )
    
    print(f"Total tables: {len(rows)}")
    print("Tables in database:")
    for r in rows:
        print(f"  - {r['table_name']}")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
