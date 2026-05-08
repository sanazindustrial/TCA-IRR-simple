import psycopg2

conn = psycopg2.connect(host='tca-irr-server.postgres.database.azure.com',
                        database='tca_platform',
                        user='tcairrserver',
                        password='Tc@1rr53rv5r',
                        sslmode='require')
cur = conn.cursor()

print("Fixing audit_logs table schema to match backend code...")

# Add missing columns if they don't exist
alter_statements = [
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS event_type VARCHAR(100)",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS username VARCHAR(255)",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action_details JSONB"
]

for stmt in alter_statements:
    try:
        cur.execute(stmt)
        print(f"  Executed: {stmt}")
    except Exception as e:
        print(f"  Warning: {e}")

conn.commit()
print("\nTable schema updated!")

# Verify the new schema
cur.execute("""
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    ORDER BY ordinal_position
""")
columns = cur.fetchall()
print("\nUpdated audit_logs table schema:")
for col in columns:
    print(f"  {col[0]}: {col[1]} (nullable: {col[2]})")

cur.close()
conn.close()
