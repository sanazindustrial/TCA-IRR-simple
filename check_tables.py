import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect(
        host='tca-irr-server.postgres.database.azure.com',
        port=5432,
        user='tcairrserver',
        password='Tc@1rr53rv5r',
        database='tca_platform',
        ssl='require'
    )
    # List all tables
    tables = await conn.fetch(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    )
    print("All tables:")
    for t in tables:
        print(f"  {t['table_name']}")
    
    # Check user_settings columns
    for tbl in ['user_settings', 'report_quotas']:
        cols = await conn.fetch(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position",
            tbl
        )
        if cols:
            print(f"\n{tbl} columns:")
            for c in cols:
                print(f"  {c['column_name']}: {c['data_type']}")
        else:
            print(f"\n{tbl}: TABLE NOT FOUND")
    
    await conn.close()

asyncio.run(check())
