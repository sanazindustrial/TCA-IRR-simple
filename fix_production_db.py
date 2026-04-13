"""
Quick fix: Add status column to production database
Run this locally to fix the "column status does not exist" error
while deployment is being fixed.
"""

import psycopg2

# Production database connection
DB_CONFIG = {
    'host': 'tca-irr-server.postgres.database.azure.com',
    'port': 5432,
    'database': 'tca_platform',
    'user': 'tcairrserver',
    'password': 'Tc@1rr53rv5r',
    'sslmode': 'require'
}

def add_status_column():
    print("Connecting to production database...")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connected successfully!")
        
        # Check current columns
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public'
        """)
        column_names = {row[0] for row in cur.fetchall()}
        print(f"Current users columns: {column_names}")
        
        # Add status column if missing
        if 'status' not in column_names:
            print("Adding 'status' column...")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active'")
            conn.commit()
            print("Added 'status' column!")
            
            # Sync status with is_active if both exist
            if 'is_active' in column_names:
                print("Syncing status values from is_active...")
                cur.execute("UPDATE users SET status = CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END")
                conn.commit()
                print("Status values synced!")
        else:
            print("'status' column already exists.")
        
        # Verify final schema
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public'
        """)
        print(f"Final users columns: {[row[0] for row in cur.fetchall()]}")
        
        # Test a simple query
        cur.execute("SELECT COUNT(*) FROM users")
        user_count = cur.fetchone()[0]
        print(f"Total users in database: {user_count}")
        
        conn.close()
        print("\nMigration complete! Login should work now.")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    success = add_status_column()
    exit(0 if success else 1)
