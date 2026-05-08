import asyncio
import asyncpg

async def check_schema():
    conn = await asyncpg.connect(
        host='tca-irr-server.postgres.database.azure.com',
        port=5432,
        user='tcairrserver',
        password='Tc@1rr53rv5r',
        database='tca_platform',
        ssl='require'
    )
    result = await conn.fetch('''
        SELECT column_name, data_type, is_nullable FROM information_schema.columns 
        WHERE table_name = 'users' ORDER BY ordinal_position
    ''')
    print("Users table columns:")
    for row in result:
        print(f"  {row['column_name']}: {row['data_type']} (nullable: {row['is_nullable']})")
    
    # Also get a sample row to see actual data
    sample = await conn.fetchrow("SELECT * FROM users LIMIT 1")
    if sample:
        print("\nSample row keys:", list(dict(sample).keys()))
    await conn.close()

asyncio.run(check_schema())
