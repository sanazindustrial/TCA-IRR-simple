"""Check actual database schema for users table"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_schema():
    database_url = os.getenv('DATABASE_URL')
    print(f"Connecting to: {database_url[:50]}...")
    
    conn = await asyncpg.connect(database_url)
    
    # Get users table columns
    result = await conn.fetch('''
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
    ''')
    print('\n=== USERS TABLE COLUMNS ===')
    for row in result:
        print(f"  {row['column_name']}: {row['data_type']} (nullable: {row['is_nullable']})")
    
    # Check app_requests table
    result = await conn.fetch('''
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'app_requests'
        ORDER BY ordinal_position
    ''')
    print('\n=== APP_REQUESTS TABLE COLUMNS ===')
    for row in result:
        print(f"  {row['column_name']}: {row['data_type']}")
    
    # Check evaluations table
    result = await conn.fetch('''
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'evaluations'
        ORDER BY ordinal_position
    ''')
    print('\n=== EVALUATIONS TABLE COLUMNS ===')
    for row in result:
        print(f"  {row['column_name']}: {row['data_type']}")
    
    # Check SSD-related tables
    result = await conn.fetch('''
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'ssd_requests'
        ORDER BY ordinal_position
    ''')
    print('\n=== SSD_REQUESTS TABLE COLUMNS ===')
    if result:
        for row in result:
            print(f"  {row['column_name']}: {row['data_type']}")
    else:
        print("  [TABLE NOT FOUND]")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_schema())
