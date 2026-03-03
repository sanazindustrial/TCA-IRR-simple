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
    for tbl in ['app_requests', 'evaluations']:
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
