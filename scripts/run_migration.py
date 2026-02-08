#!/usr/bin/env python
"""
Database Migration Runner
Run database migrations for FocusGuard schema updates.
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()


async def run_migration():
    """Apply migration: Add duration_minutes and blink_rate to sessions"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        print("Set it in .env file or export it:")
        print("  export DATABASE_URL='postgresql://user:pass@localhost:5432/focusguard_db'")
        return
    
    # Replace asyncpg driver prefix if using SQLAlchemy format
    if database_url.startswith('postgresql+asyncpg://'):
        database_url = database_url.replace('postgresql+asyncpg://', 'postgresql://')
    
    conn = await asyncpg.connect(database_url)
    
    try:
        print("🔄 Running migration 007...")
        
        # Add duration_minutes column
        await conn.execute(
            'ALTER TABLE sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER'
        )
        print("✅ Added duration_minutes column")
        
        # Add blink_rate column
        await conn.execute(
            'ALTER TABLE sessions ADD COLUMN IF NOT EXISTS blink_rate FLOAT'
        )
        print("✅ Added blink_rate column")
        
        # Set default duration for existing sessions
        result = await conn.execute(
            'UPDATE sessions SET duration_minutes = 25 WHERE duration_minutes IS NULL'
        )
        print(f"✅ Updated {result.split()[-1]} existing sessions with default duration")
        
        print("✅ Migration complete!")
    finally:
        await conn.close()


if __name__ == '__main__':
    asyncio.run(run_migration())
