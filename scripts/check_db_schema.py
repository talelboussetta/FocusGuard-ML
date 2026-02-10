"""
Database Schema Diagnostic Script
Checks for missing columns and applies migrations if needed.
"""

import asyncio
import asyncpg
from pathlib import Path
import sys
import os

# Add parent directory to path to import config
sys.path.insert(0, str(Path(__file__).parent.parent / "serv"))
from api.config import settings

async def check_sessions_schema():
    """Check sessions table schema and identify missing columns."""
    
    # Parse DATABASE_URL for asyncpg (remove +asyncpg driver)
    db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    
    print("=" * 60)
    print("FocusGuard Database Schema Diagnostic")
    print("=" * 60)
    print(f"\nConnecting to database...")
    
    try:
        # Connect to database
        conn = await asyncpg.connect(db_url)
        
        # Check if sessions table exists
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'sessions'
            );
        """)
        
        if not table_exists:
            print("❌ ERROR: sessions table does not exist!")
            await conn.close()
            return False
        
        print("✓ sessions table exists")
        
        # Get all columns from sessions table
        columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'sessions'
            ORDER BY ordinal_position;
        """)
        
        print("\nCurrent sessions table columns:")
        print("-" * 60)
        existing_columns = {}
        for col in columns:
            nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
            print(f"  {col['column_name']:<30} {col['data_type']:<20} {nullable}")
            existing_columns[col['column_name']] = col['data_type']
        
        # Check for required columns
        print("\nChecking required columns:")
        print("-" * 60)
        
        required_columns = {
            'duration_minutes': ('integer', '007_add_session_duration.sql'),
            'blink_rate': ('double precision', '007_add_session_duration.sql'),
            'actual_duration_minutes': ('integer', '015_add_actual_duration_to_sessions.sql')
        }
        
        missing_columns = []
        for col_name, (expected_type, migration_file) in required_columns.items():
            if col_name in existing_columns:
                actual_type = existing_columns[col_name]
                if actual_type == expected_type or (expected_type == 'double precision' and actual_type in ['real', 'double precision']):
                    print(f"✓ {col_name:<30} exists ({actual_type})")
                else:
                    print(f"⚠ {col_name:<30} exists but wrong type: {actual_type} (expected {expected_type})")
            else:
                print(f"❌ {col_name:<30} MISSING (from {migration_file})")
                missing_columns.append((col_name, migration_file))
        
        await conn.close()
        
        if missing_columns:
            print("\n" + "=" * 60)
            print("DIAGNOSIS: Missing columns detected!")
            print("=" * 60)
            print("\nThis explains the 500 errors on:")
            print("  - GET /sessions")
            print("  - GET /sessions/active")
            print("  - GET /stats/daily")
            print("\nMissing migrations:")
            for col_name, migration_file in missing_columns:
                print(f"  - {migration_file} (adds {col_name})")
            
            print("\n" + "=" * 60)
            print("SOLUTION: Apply missing migrations")
            print("=" * 60)
            return False
        else:
            print("\n" + "=" * 60)
            print("✓ All required columns present!")
            print("=" * 60)
            print("\nIf you're still seeing 500s, check:")
            print("  1. Server logs for the actual error")
            print("  2. Other tables (users, user_stats, etc.)")
            return True
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


async def apply_migration(migration_file: str):
    """Apply a specific migration file."""
    db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    
    migration_path = Path(__file__).parent.parent / "serv" / "database" / "init" / migration_file
    
    if not migration_path.exists():
        print(f"❌ Migration file not found: {migration_path}")
        return False
    
    print(f"\nApplying {migration_file}...")
    print("-" * 60)
    
    # Read migration SQL
    with open(migration_path, 'r') as f:
        sql = f.read()
    
    print("SQL to execute:")
    print(sql)
    print("-" * 60)
    
    try:
        conn = await asyncpg.connect(db_url)
        await conn.execute(sql)
        await conn.close()
        print(f"✓ Successfully applied {migration_file}")
        return True
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Main diagnostic and repair workflow."""
    # First, check the schema
    schema_ok = await check_sessions_schema()
    
    if not schema_ok:
        print("\n" + "=" * 60)
        print("Would you like to apply missing migrations? (y/n): ", end='')
        choice = input().strip().lower()
        
        if choice == 'y':
            # Apply migrations in order
            migrations_to_apply = [
                '007_add_session_duration.sql',
                '015_add_actual_duration_to_sessions.sql'
            ]
            
            print("\nApplying migrations...")
            for migration in migrations_to_apply:
                success = await apply_migration(migration)
                if not success:
                    print(f"\n⚠ Failed to apply {migration}")
                    print("You may need to apply it manually.")
            
            # Re-check schema
            print("\n" + "=" * 60)
            print("Re-checking schema after migrations...")
            print("=" * 60)
            await check_sessions_schema()
        else:
            print("\nTo apply manually, run:")
            print("  psql $DATABASE_URL -f serv/database/init/007_add_session_duration.sql")
            print("  psql $DATABASE_URL -f serv/database/init/015_add_actual_duration_to_sessions.sql")
    
    print("\n" + "=" * 60)
    print("Diagnostic complete")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
