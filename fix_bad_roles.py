"""Find and fix users with invalid role values"""
import asyncio
import asyncpg

POSTGRES_HOST = "tca-irr-server.postgres.database.azure.com"
POSTGRES_USER = "tcairrserver"
POSTGRES_PASSWORD = "Tc@1rr53rv5r"
POSTGRES_DB = "tca_platform"

VALID_ROLES = {"user", "admin", "analyst"}

async def main():
    conn = await asyncpg.connect(
        host=POSTGRES_HOST,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        database=POSTGRES_DB,
        ssl="require"
    )
    try:
        # Find all distinct roles
        roles = await conn.fetch("SELECT DISTINCT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY cnt DESC")
        print("=== All roles in DB ===")
        for r in roles:
            flag = "❌ INVALID" if r['role'] not in VALID_ROLES else "✓ valid"
            print(f"  role={r['role']!r}  count={r['cnt']}  {flag}")

        # Find users with invalid roles
        bad_users = await conn.fetch(
            "SELECT id, username, email, role FROM users WHERE role NOT IN ('user', 'admin', 'analyst')"
        )
        print(f"\n=== Users with invalid roles: {len(bad_users)} ===")
        for u in bad_users:
            print(f"  id={u['id']}  username={u['username']!r}  email={u['email']!r}  role={u['role']!r}")

        if bad_users:
            print("\nFixing: setting invalid roles to 'user'...")
            count = await conn.execute(
                "UPDATE users SET role = 'user' WHERE role NOT IN ('user', 'admin', 'analyst')"
            )
            print(f"Updated: {count}")

            # Verify
            remaining = await conn.fetchval(
                "SELECT COUNT(*) FROM users WHERE role NOT IN ('user', 'admin', 'analyst')"
            )
            print(f"Remaining invalid: {remaining}")
        else:
            print("No bad roles found — checking for NULL roles...")
            null_roles = await conn.fetch("SELECT id, username, email FROM users WHERE role IS NULL")
            print(f"NULL roles: {len(null_roles)}")
            for u in null_roles:
                print(f"  id={u['id']}  {u['username']!r}  {u['email']!r}")
            if null_roles:
                count = await conn.execute("UPDATE users SET role = 'user' WHERE role IS NULL")
                print(f"Fixed NULL roles: {count}")
    finally:
        await conn.close()

asyncio.run(main())
