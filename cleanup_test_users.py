import asyncio
import asyncpg

async def cleanup():
    conn = await asyncpg.connect(
        host='tca-irr-server.postgres.database.azure.com',
        port=5432,
        user='tcairrserver',
        password='Tc@1rr53rv5r',
        database='tca_platform',
        ssl='require'
    )
    result = await conn.execute(
        "DELETE FROM users WHERE email LIKE 'qa_%@tcairr-test.com' OR email LIKE 'qatest_%@test.com'"
    )
    print('Deleted test users:', result)
    await conn.close()

asyncio.run(cleanup())
