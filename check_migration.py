import asyncio
import asyncpg

async def check_migration():
    conn = await asyncpg.connect('postgresql://talel_admin:bou6199425@localhost:5432/focusguard_db')
    
    # Check if columns exist
    row = await conn.fetchrow("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name IN ('duration_minutes', 'blink_rate')
    """)
    
    print("Columns in sessions table:")
    columns = await conn.fetch("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sessions'
        ORDER BY ordinal_position
    """)
    for col in columns:
        print(f"  - {col['column_name']}: {col['data_type']}")
    
    # Check sample data
    print("\nSample session data:")
    sessions = await conn.fetch("SELECT id, duration_minutes, blink_rate, created_at FROM sessions LIMIT 3")
    for s in sessions:
        print(f"  - ID: {s['id']}, Duration: {s['duration_minutes']}, Blink: {s['blink_rate']}")
    
    await conn.close()

asyncio.run(check_migration())
