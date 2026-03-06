#!/usr/bin/env python3
"""
Simple Azure PostgreSQL Connection Test
Tests basic connectivity to the Azure PostgreSQL server
"""

import asyncio
import asyncpg
import sys
import os


async def test_connection():
    """Test basic connection to Azure PostgreSQL"""

    print("=== Azure PostgreSQL Connection Test ===")
    print()

    # Connection parameters
    host = "tca-irr-server.postgres.database.azure.com"
    port = 5432
    database = "tca_platform"
    user = "tcairrserver"
    password = "Tc@1rr53rv5r"

    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Database: {database}")
    print(f"User: {user}")
    print(f"Password: {'*' * len(password)}")
    print()

    # Test different connection methods
    connection_strings = [
        # Method 1: Basic connection string with SSL
        f"postgresql://{user}:{password}@{host}:{port}/{database}?sslmode=require",

        # Method 2: Connection string with SSL disabled (for testing)
        f"postgresql://{user}:{password}@{host}:{port}/{database}?sslmode=disable",

        # Method 3: Connection string with prefer SSL
        f"postgresql://{user}:{password}@{host}:{port}/{database}?sslmode=prefer",
    ]

    for i, conn_str in enumerate(connection_strings, 1):
        print(
            f"Test {i}: {'SSL Required' if 'require' in conn_str else 'SSL Disabled' if 'disable' in conn_str else 'SSL Preferred'}"
        )
        try:
            print("  Connecting...")
            conn = await asyncio.wait_for(asyncpg.connect(conn_str),
                                          timeout=30.0)

            print("  SUCCESS: Connected to Azure PostgreSQL!")

            # Test basic query
            result = await conn.fetchval(
                "SELECT 'Connection Test Successful!' as message")
            print(f"  Query result: {result}")

            # Get server info
            version = await conn.fetchval("SELECT version()")
            print(f"  Server version: {version}")

            # Check current database
            current_db = await conn.fetchval("SELECT current_database()")
            print(f"  Current database: {current_db}")

            await conn.close()
            print("  Connection closed successfully")
            return True

        except asyncio.TimeoutError:
            print("  ERROR: Connection timeout (30 seconds)")
        except Exception as e:
            print(f"  ERROR: {e}")

        print()

    print("All connection attempts failed!")
    return False


async def test_network_connectivity():
    """Test network connectivity to the Azure server"""
    print("=== Network Connectivity Test ===")
    print()

    import socket

    host = "tca-irr-server.postgres.database.azure.com"
    port = 5432

    try:
        print(f"Testing TCP connection to {host}:{port}...")

        # Create socket and test connection
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)

        result = sock.connect_ex((host, port))
        sock.close()

        if result == 0:
            print("SUCCESS: TCP connection established")
            return True
        else:
            print(f"FAILED: TCP connection failed (error code: {result})")
            return False

    except socket.gaierror as e:
        print(f"FAILED: DNS resolution failed - {e}")
        print("This could indicate:")
        print("  - Network connectivity issues")
        print("  - DNS configuration problems")
        print("  - Firewall blocking the connection")
        return False
    except Exception as e:
        print(f"FAILED: Network test failed - {e}")
        return False


def check_environment():
    """Check environment and provide diagnostics"""
    print("=== Environment Check ===")
    print()

    # Check Python version
    print(f"Python version: {sys.version}")

    # Check asyncpg version
    try:
        print(f"asyncpg version: {asyncpg.__version__}")
    except:
        print("asyncpg version: Unknown")

    # Check if we're behind a proxy/firewall
    print()
    print("Network diagnostics:")
    print("  - Check if you're behind a corporate firewall")
    print("  - Verify Azure PostgreSQL firewall rules allow your IP")
    print("  - Ensure port 5432 is not blocked")
    print("  - Check if VPN/proxy is interfering")
    print()


async def main():
    """Main test function"""
    check_environment()

    # Test 1: Network connectivity
    network_ok = await test_network_connectivity()
    print()

    if network_ok:
        # Test 2: Database connection
        db_ok = await test_connection()

        if db_ok:
            print("🎉 SUCCESS: Azure PostgreSQL connection is working!")
        else:
            print("❌ FAILED: Could not connect to Azure PostgreSQL database")
            print()
            print("Possible solutions:")
            print("  1. Check Azure PostgreSQL server firewall rules")
            print("  2. Verify database credentials are correct")
            print("  3. Ensure the database 'tca_platform' exists")
            print("  4. Check if the server is running")
    else:
        print("❌ FAILED: Network connectivity issues")
        print()
        print("Possible solutions:")
        print("  1. Check your internet connection")
        print("  2. Verify the server hostname is correct")
        print("  3. Check firewall/proxy settings")
        print("  4. Try connecting from a different network")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest failed with error: {e}")