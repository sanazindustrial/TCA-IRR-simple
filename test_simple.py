#!/usr/bin/env python3
"""
Azure PostgreSQL Connection Test with Direct Parameters
"""

import asyncio
import asyncpg
import ssl


async def test_direct_connection():
    """Test connection using direct parameters instead of connection string"""

    print("=== Direct Parameter Connection Test ===")

    # Connection parameters
    params = {
        "host": "tca-irr-server.postgres.database.azure.com",
        "port": 5432,
        "database": "tca_platform",
        "user": "tcairrserver",
        "password": "Tc@1rr53rv5r"
    }

    print(f"Connecting with parameters:")
    for key, value in params.items():
        if key == "password":
            print(f"  {key}: {'*' * len(value)}")
        else:
            print(f"  {key}: {value}")
    print()

    # Test different SSL configurations
    ssl_configs = [
        {
            "name": "SSL Required (Default Context)",
            "ssl": ssl.create_default_context()
        },
        {
            "name": "SSL Required (No Verification)",
            "ssl": "require"
        },
        {
            "name": "SSL Preferred",
            "ssl": "prefer"
        },
        {
            "name": "SSL Disabled",
            "ssl": False
        },
    ]

    for config in ssl_configs:
        print(f"Testing: {config['name']}")

        try:
            # Add SSL config to parameters
            test_params = params.copy()
            if config['ssl'] is not False:
                test_params['ssl'] = config['ssl']

            print("  Attempting connection...")
            conn = await asyncio.wait_for(asyncpg.connect(**test_params),
                                          timeout=15.0)

            print("  ✅ SUCCESS: Connected!")

            # Test query
            result = await conn.fetchval(
                "SELECT 'Hello from Azure PostgreSQL!' as greeting")
            print(f"  Query result: {result}")

            # Get database info
            db_info = await conn.fetchrow("""
                SELECT 
                    version() as version,
                    current_database() as database,
                    current_user as user,
                    inet_server_addr() as server_ip
            """)

            print(f"  Database: {db_info['database']}")
            print(f"  User: {db_info['user']}")
            print(f"  Server IP: {db_info['server_ip']}")
            print(f"  Version: {db_info['version'][:50]}...")

            await conn.close()
            print("  Connection closed successfully")
            print()
            return True

        except asyncio.TimeoutError:
            print("  ❌ ERROR: Connection timeout")
        except Exception as e:
            print(f"  ❌ ERROR: {e}")

        print()

    return False


async def test_simple_connection():
    """Test the most basic connection possible"""
    print("=== Simple Connection Test ===")

    try:
        print("Attempting basic connection...")

        # Most basic connection - let asyncpg handle SSL automatically
        conn = await asyncpg.connect(
            host="tca-irr-server.postgres.database.azure.com",
            port=5432,
            database="tca_platform",
            user="tcairrserver",
            password="Tc@1rr53rv5r",
            command_timeout=30)

        print("✅ SUCCESS: Basic connection established!")

        # Simple test
        result = await conn.fetchval("SELECT 1 as test")
        print(f"Test query result: {result}")

        await conn.close()
        return True

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


async def main():
    """Main test function"""

    # Test 1: Simple connection
    simple_ok = await test_simple_connection()
    print()

    if not simple_ok:
        # Test 2: Direct parameters with different SSL configs
        direct_ok = await test_direct_connection()

        if not direct_ok:
            print("🔍 DEBUGGING INFORMATION:")
            print()
            print("All connection attempts failed. This could be due to:")
            print("1. Azure PostgreSQL firewall rules")
            print("2. Database doesn't exist")
            print("3. Incorrect credentials")
            print("4. SSL/TLS configuration issues")
            print("5. Network routing problems")
            print()
            print("Please verify:")
            print("- The Azure PostgreSQL server is running")
            print("- Firewall rules allow connections from your IP")
            print("- The database 'tca_platform' exists")
            print("- The user 'tcairrserver' has correct permissions")
    else:
        print("🎉 Azure PostgreSQL connection is working!")


if __name__ == "__main__":
    asyncio.run(main())