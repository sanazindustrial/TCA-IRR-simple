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
    for tbl in ['user_quotas']:
        cols = await conn.fetch(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position",
            tbl
        )
        if cols:
            print(f"{tbl} columns:")
            for c in cols:
                print(f"  {c['column_name']}: {c['data_type']}")
    await conn.close()

asyncio.run(check())
