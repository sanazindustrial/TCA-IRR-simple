import asyncio, asyncpg

async def check():
    conn = await asyncpg.connect(
        'postgresql://tcairrserver:Tc%401rr53rv5r@tca-irr-server.postgres.database.azure.com:5432/tca_platform',
        ssl='require'
    )
    # Check role column definition
    cols = await conn.fetch("""
        SELECT column_name, data_type, character_maximum_length, udt_name, 
               column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    """)
    print("Role column:", [dict(c) for c in cols])
    
    # Check for any CHECK constraints on role
    constraints = await conn.fetch("""
        SELECT conname, pg_get_constraintdef(c.oid) 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE t.relname = 'users' AND c.contype = 'c'
    """)
    print("Check constraints:", [dict(c) for c in constraints])
    
    # Check if role is an ENUM type
    enums = await conn.fetch("""
        SELECT e.enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = (
            SELECT udt_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        )
    """)
    print("Enum values:", [dict(e) for e in enums])
    
    await conn.close()

asyncio.run(check())
