import asyncio, asyncpg

async def cleanup():
    conn = await asyncpg.connect(
        'postgresql://tcairrserver:Tc%401rr53rv5r@tca-irr-server.postgres.database.azure.com:5432/tca_platform',
        ssl='require'
    )
    rows = await conn.fetch(
        "SELECT id, username, email FROM users WHERE username LIKE '%QA%' OR username LIKE '%Test%' OR username LIKE '%Debug%' OR email LIKE '%test.com%'"
    )
    for r in rows:
        print(dict(r))
    result = await conn.execute(
        "DELETE FROM users WHERE username LIKE '%QA%' OR username LIKE '%Test%' OR username LIKE '%Debug%' OR email LIKE '%test.com%'"
    )
    print(f'Deleted: {result}')
    await conn.close()

asyncio.run(cleanup())
