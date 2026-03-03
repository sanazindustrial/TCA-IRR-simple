import asyncio, asyncpg

async def check():
    conn = await asyncpg.connect(
        'postgresql://tcairrserver:Tc%401rr53rv5r@tca-irr-server.postgres.database.azure.com:5432/tca_platform',
        ssl='require'
    )
    cols = await conn.fetch("""
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'app_requests'
        ORDER BY ordinal_position
    """)
    for c in cols:
        print(dict(c))
    await conn.close()

asyncio.run(check())
