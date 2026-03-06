"""
Database Schema Migration Script for Azure Production
Fixes schema mismatch between code (uses id, is_active, username) 
and Azure schema (has user_id, status, full_name)
"""

import asyncio
import asyncpg
import os
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database connection settings
DATABASE_URL = os.environ.get('DATABASE_URL', '')

# Parse connection details from DATABASE_URL or use individual env vars
if not DATABASE_URL:
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'tca_platform')
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    DB_SSL = os.environ.get('DB_SSL', 'require')
    
    if DB_PASSWORD:
        DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode={DB_SSL}"


async def get_table_columns(conn, table_name: str) -> set:
    """Get all column names for a table"""
    result = await conn.fetch("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
    """, table_name)
    return {row['column_name'] for row in result}


async def migrate_users_table(conn):
    """
    Migrate users table to be compatible with both old schema (user_id, status, full_name)
    and new code (id, is_active, username)
    """
    logger.info("Checking users table schema...")
    
    columns = await get_table_columns(conn, 'users')
    logger.info(f"Current users columns: {columns}")
    
    migrations = []
    
    # Check if we have user_id but not id - add id as alias
    if 'user_id' in columns and 'id' not in columns:
        # Add id column that references user_id via a generated column or view
        # PostgreSQL doesn't support column aliases, so we need a different approach
        # Option 1: Create a view
        # Option 2: Add a trigger that syncs id and user_id
        # Option 3: Rename user_id to id
        # Best option: Create id column and populate from user_id, then keep in sync
        
        logger.info("Adding 'id' column as alias for 'user_id'...")
        try:
            # Check if id column exists first
            await conn.execute("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;
            """)
            # Copy user_id values to id
            await conn.execute("""
                UPDATE users SET id = user_id WHERE id IS NULL;
            """)
            # Make id NOT NULL (may fail if empty table, that's ok)
            try:
                await conn.execute("""
                    ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
                """)
            except Exception as e:
                logger.warning(f"Could not set id default: {e}")
            migrations.append("Added 'id' column")
        except Exception as e:
            logger.error(f"Error adding id column: {e}")
    
    # Check if we have status but not is_active - add is_active
    if 'status' in columns and 'is_active' not in columns:
        logger.info("Adding 'is_active' column derived from 'status'...")
        try:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
            """)
            # Set is_active based on status
            await conn.execute("""
                UPDATE users SET is_active = (status = 'Active' OR status IS NULL);
            """)
            migrations.append("Added 'is_active' column")
        except Exception as e:
            logger.error(f"Error adding is_active column: {e}")
    
    # If we have neither status nor is_active, add is_active
    if 'status' not in columns and 'is_active' not in columns:
        logger.info("Adding 'is_active' column (neither status nor is_active exists)...")
        try:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
            """)
            migrations.append("Added 'is_active' column")
        except Exception as e:
            logger.error(f"Error adding is_active column: {e}")
    
    # Check if we have full_name but not username - add username
    if 'full_name' in columns and 'username' not in columns:
        logger.info("Adding 'username' column derived from 'full_name'...")
        try:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
            """)
            # Set username based on full_name or email prefix
            await conn.execute("""
                UPDATE users SET username = COALESCE(
                    full_name, 
                    SPLIT_PART(email, '@', 1)
                ) WHERE username IS NULL;
            """)
            migrations.append("Added 'username' column")
        except Exception as e:
            logger.error(f"Error adding username column: {e}")
    
    # If neither exists, add username
    if 'full_name' not in columns and 'username' not in columns:
        logger.info("Adding 'username' column (neither full_name nor username exists)...")
        try:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
            """)
            await conn.execute("""
                UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;
            """)
            migrations.append("Added 'username' column")
        except Exception as e:
            logger.error(f"Error adding username column: {e}")
    
    # Add status column if it's missing (for backward compatibility)
    if 'status' not in columns:
        logger.info("Adding 'status' column for backward compatibility...")
        try:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
            """)
            # Sync with is_active if it exists
            if 'is_active' in columns or 'is_active' in [m for m in migrations if 'is_active' in m]:
                await conn.execute("""
                    UPDATE users SET status = CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END;
                """)
            migrations.append("Added 'status' column")
        except Exception as e:
            logger.error(f"Error adding status column: {e}")
    
    # Verify final schema
    final_columns = await get_table_columns(conn, 'users')
    logger.info(f"Final users columns: {final_columns}")
    
    required_columns = {'id', 'is_active', 'username', 'email', 'password_hash'}
    missing = required_columns - final_columns
    
    if missing:
        logger.error(f"Still missing required columns: {missing}")
        return False
    
    logger.info(f"Migration complete. Applied: {migrations}")
    return True


async def create_sync_trigger(conn):
    """
    Create triggers to keep id/user_id and is_active/status in sync
    """
    logger.info("Creating sync triggers...")
    
    try:
        # Trigger to sync id <-> user_id
        await conn.execute("""
            CREATE OR REPLACE FUNCTION sync_user_ids()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.id IS NULL AND NEW.user_id IS NOT NULL THEN
                    NEW.id := NEW.user_id;
                ELSIF NEW.user_id IS NULL AND NEW.id IS NOT NULL THEN
                    NEW.user_id := NEW.id;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        
        await conn.execute("""
            DROP TRIGGER IF EXISTS trigger_sync_user_ids ON users;
        """)
        
        await conn.execute("""
            CREATE TRIGGER trigger_sync_user_ids
            BEFORE INSERT OR UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION sync_user_ids();
        """)
        
        # Trigger to sync is_active <-> status  
        await conn.execute("""
            CREATE OR REPLACE FUNCTION sync_user_status()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.is_active IS NOT NULL AND NEW.status IS NULL THEN
                    NEW.status := CASE WHEN NEW.is_active THEN 'Active' ELSE 'Inactive' END;
                ELSIF NEW.status IS NOT NULL AND NEW.is_active IS NULL THEN
                    NEW.is_active := (NEW.status = 'Active');
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        
        await conn.execute("""
            DROP TRIGGER IF EXISTS trigger_sync_user_status ON users;
        """)
        
        await conn.execute("""
            CREATE TRIGGER trigger_sync_user_status
            BEFORE INSERT OR UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION sync_user_status();
        """)
        
        logger.info("Sync triggers created successfully")
        return True
    except Exception as e:
        logger.error(f"Error creating triggers: {e}")
        return False


async def run_migration():
    """Main migration function"""
    logger.info("=" * 60)
    logger.info("TCA-IRR Database Schema Migration")
    logger.info(f"Started at: {datetime.now().isoformat()}")
    logger.info("=" * 60)
    
    if not DATABASE_URL:
        logger.error("No database connection configured!")
        logger.error("Set DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME")
        return False
    
    # Mask password in log
    safe_url = DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'configured'
    logger.info(f"Connecting to: {safe_url}")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        logger.info("Connected to database successfully")
        
        # Check if users table exists
        result = await conn.fetchrow("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'users'
            );
        """)
        
        if not result['exists']:
            logger.error("Users table does not exist! Run init_db first.")
            await conn.close()
            return False
        
        # Run migrations
        success = await migrate_users_table(conn)
        
        if success:
            # Create sync triggers
            await create_sync_trigger(conn)
            logger.info("=" * 60)
            logger.info("Migration completed successfully!")
            logger.info("=" * 60)
        else:
            logger.error("Migration failed!")
        
        await conn.close()
        return success
        
    except Exception as e:
        logger.error(f"Migration error: {e}")
        return False


if __name__ == "__main__":
    result = asyncio.run(run_migration())
    exit(0 if result else 1)
