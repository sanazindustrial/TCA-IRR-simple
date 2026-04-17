#!/usr/bin/env python3
"""Run database migration 005 for dual framework weights"""
import os
import asyncio
import asyncpg
import ssl

# Database connection parameters (separate to avoid URL encoding issues with @ in password)
DB_HOST = 'tca-irr-server.postgres.database.azure.com'
DB_PORT = 5432
DB_NAME = 'tca_platform'
DB_USER = 'tcairrserver'
DB_PASSWORD = 'Tc@1rr53rv5r'

async def run_migration():
    """Run migration 005"""
    migration_path = os.path.join(os.path.dirname(__file__), 'app', 'db', 'migrations', '005_dual_framework_weights.sql')
    
    if not os.path.exists(migration_path):
        print(f"Migration file not found: {migration_path}")
        return False
    
    with open(migration_path, 'r') as f:
        sql = f.read()

    print(f"Connecting to database {DB_NAME} at {DB_HOST}...")
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    conn = await asyncpg.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        ssl=ssl_context
    )

    try:
        print("Running migration 005: Dual Framework Weights...")
        
        # Split SQL into statements (handle multi-statement files)
        statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]
        
        success_count = 0
        for i, stmt in enumerate(statements):
            if not stmt or stmt.startswith('--'):
                continue
            try:
                await conn.execute(stmt)
                success_count += 1
            except Exception as e:
                # Skip errors for IF NOT EXISTS / ON CONFLICT
                if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                    print(f"  Statement {i+1}: Skipped (already exists)")
                else:
                    print(f"  Statement {i+1}: Error - {e}")
        
        print(f"\nMigration completed: {success_count} statements executed successfully")
        
        # Verify migration
        print("\nVerifying migration...")
        
        # Check for new columns
        columns = await conn.fetch("""
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = 'tca_category_settings'
            AND column_name IN ('medtech_weight', 'is_medtech_active', 'normalization_key')
        """)
        print(f"  TCA category settings columns: {[c['column_name'] for c in columns]}")

        # Check for new tables
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('ssd_risk_domains', 'ssd_risk_penalties')
        """)
        print(f"  New tables created: {[t['table_name'] for t in tables]}")
        
        # Check risk domains
        try:
            risk_domains = await conn.fetchval("SELECT COUNT(*) FROM ssd_risk_domains")
            print(f"  SSD risk domains count: {risk_domains}")
        except:
            print("  SSD risk domains table check skipped")
        
        return True
    except Exception as e:
        print(f"Migration error: {e}")
        return False
    finally:
        await conn.close()

if __name__ == "__main__":
    success = asyncio.run(run_migration())
    exit(0 if success else 1)
