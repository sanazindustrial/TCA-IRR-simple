#!/usr/bin/env python3
"""Run database migrations with proper SQL parsing"""
import os
import asyncio
import asyncpg
import ssl

DB_HOST = 'tca-irr-server.postgres.database.azure.com'
DB_PORT = 5432
DB_NAME = 'tca_platform'
DB_USER = 'tcairrserver'
DB_PASSWORD = 'Tc@1rr53rv5r'

def parse_sql_statements(sql_content):
    """Parse SQL content into individual statements, handling multi-line correctly"""
    lines = []
    for line in sql_content.split('\n'):
        if '--' in line:
            line = line.split('--')[0]
        lines.append(line)
    
    content = '\n'.join(lines)
    statements = []
    current_stmt = []
    paren_depth = 0
    
    for char in content:
        if char == '(':
            paren_depth += 1
        elif char == ')':
            paren_depth -= 1
        
        if char == ';' and paren_depth == 0:
            stmt = ''.join(current_stmt).strip()
            if stmt:
                statements.append(stmt)
            current_stmt = []
        else:
            current_stmt.append(char)
    
    final_stmt = ''.join(current_stmt).strip()
    if final_stmt:
        statements.append(final_stmt)
    
    return [s for s in statements if s and not s.isspace()]

async def run_migrations():
    """Run migrations 003 and 005"""
    
    base_path = os.path.join(os.path.dirname(__file__), 'app', 'db', 'migrations')
    migrations = [
        ('003_settings_versions.sql', 'Settings Versions'),
        ('005_dual_framework_weights.sql', 'Dual Framework Weights'),
    ]
    
    print(f"Connecting to {DB_NAME} at {DB_HOST}...")
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    conn = await asyncpg.connect(
        host=DB_HOST, port=DB_PORT, database=DB_NAME,
        user=DB_USER, password=DB_PASSWORD, ssl=ssl_context
    )
    
    try:
        for filename, name in migrations:
            migration_path = os.path.join(base_path, filename)
            
            if not os.path.exists(migration_path):
                print(f"Migration not found: {migration_path}")
                continue
            
            with open(migration_path, 'r') as f:
                sql = f.read()
            
            print(f"\n{'='*60}")
            print(f"Running: {name}")
            print(f"{'='*60}")
            
            statements = parse_sql_statements(sql)
            print(f"Statements: {len(statements)}")
            
            ok, skip, err = 0, 0, 0
            
            for i, stmt in enumerate(statements):
                try:
                    preview = stmt[:60].replace('\n', ' ')
                    await conn.execute(stmt)
                    ok += 1
                    print(f"  [{i+1}] OK: {preview}...")
                except Exception as e:
                    msg = str(e).lower()
                    if 'already exists' in msg or 'duplicate' in msg:
                        skip += 1
                    else:
                        err += 1
                        print(f"  [{i+1}] ERR: {str(e)[:80]}")
            
            print(f"Done: OK={ok}, Skip={skip}, Err={err}")
        
        print(f"\n{'='*60}")
        print("Verifying...")
        print(f"{'='*60}")
        
        tables = await conn.fetch(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
        )
        print(f"Tables ({len(tables)}): {[r['table_name'] for r in tables]}")
        
        for t in ['tca_category_settings', 'ssd_risk_domains', 'ssd_risk_penalties', 'module_settings_versions']:
            try:
                cnt = await conn.fetchval(f"SELECT COUNT(*) FROM {t}")
                print(f"{t}: {cnt} rows")
            except:
                print(f"{t}: NOT FOUND")
        
    finally:
        await conn.close()
    
    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(run_migrations())
