import asyncio, asyncpg

async def check():
    conn = await asyncpg.connect(
        'postgresql://tcairrserver:Tc%401rr53rv5r@tca-irr-server.postgres.database.azure.com:5432/tca_platform',
        ssl='require'
    )
    r = await conn.fetch("SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='request_status' ORDER BY e.enumsortorder")
    print([x['enumlabel'] for x in r])
    await conn.close()

asyncio.run(check())
