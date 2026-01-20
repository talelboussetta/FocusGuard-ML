#!/usr/bin/env python
"""Run database migration to add duration_minutes and blink_rate columns"""
import asyncio
import asyncpg


async def run_migration():
    """Apply migration 007: Add duration_minutes and blink_rate to sessions"""
    conn = await asyncpg.connect(
        'postgresql://talel_admin:bou6199425@localhost:5432/focusguard_db'
    )
    
    try:
        print("🔄 Running migration...")
        
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
        
        print("🎉 Migration completed successfully!")
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run_migration())
