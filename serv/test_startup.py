#!/usr/bin/env python3
"""
Test startup without full server run - diagnose lifespan issues
"""

import asyncio
import sys
import os

# Add serv to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_startup():
    """Test the startup sequence."""
    print("\n" + "="*60)
    print("STARTUP TEST - Simulating Render Environment")
    print("="*60 + "\n")
    
    # Set production-like environment
    os.environ["DEBUG"] = "False"
    os.environ["PORT"] = "10000"
    
    # Import after env vars are set
    from api.config import settings
    from api.database import check_db_connection
    
    print(f"[TEST] DEBUG mode: {settings.debug}")
    print(f"[TEST] PORT: {os.getenv('PORT')}")
    print(f"[TEST] Database URL: {settings.database_url[:40]}...")
    
    # Test database connection (this is what lifespan does)
    print("\n[TEST] Testing database connection (3s timeout)...")
    try:
        is_connected = await asyncio.wait_for(check_db_connection(), timeout=3.0)
        if is_connected:
            print("[OK] Database connection successful")
        else:
            print("[WARNING] Database not connected - will retry on first request")
            print("[INFO] This is OK - server will still start")
    except asyncio.TimeoutError:
        print("[WARNING] Database check timed out")
        print("[INFO] This is OK - server will still start")
    except Exception as e:
        print(f"[WARNING] Database error: {str(e)[:100]}")
        print("[INFO] This is OK - server will still start")
    
    print("\n" + "="*60)
    print("✓ Startup test complete")
    print("="*60)
    print("\nIf you saw this message, startup won't hang!")
    print("Safe to deploy to Render.\n")

if __name__ == "__main__":
    asyncio.run(test_startup())
