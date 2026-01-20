from sqlalchemy import create_engine, text

engine = create_engine('postgresql://focusguard:focusguard@localhost:5432/focusguard')

with engine.connect() as conn:
    result = conn.execute(text('SELECT user_id, total_focus_min, total_sessions FROM user_stats LIMIT 5'))
    print("User Stats:")
    for row in result:
        print(f"  User: {row[0]}, Focus: {row[1]} min, Sessions: {row[2]}")
    
    result = conn.execute(text('SELECT id, user_id, completed, duration_minutes FROM sessions ORDER BY created_at DESC LIMIT 5'))
    print("\nRecent Sessions:")
    for row in result:
        print(f"  ID: {row[0][:8]}..., User: {row[1][:8]}..., Completed: {row[2]}, Duration: {row[3]}")
