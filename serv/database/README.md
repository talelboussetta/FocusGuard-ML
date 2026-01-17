# FocusGuard Database

This directory contains database-related files for the FocusGuard application.

## Structure

- `init/` - SQL scripts that run automatically when the PostgreSQL container is first created
  - `01_create_tables.sql` - Creates all database tables and indexes
  - `02_seed_data.sql` - Inserts initial/seed data (achievements, etc.)

## Database Schema

### Tables

1. **users** - User account information
2. **user_profiles** - Extended user profile data and preferences
3. **focus_sessions** - Individual focus session records
4. **session_metrics** - Detailed metrics for each session (blink rate, distractions, etc.)
5. **daily_stats** - Aggregated daily statistics per user
6. **achievements** - Available achievements/badges
7. **user_achievements** - Tracks which users earned which achievements
8. **garden_items** - Gamification elements (virtual plants, decorations)

## Getting Started

1. Make sure Docker is installed and running
2. Copy `.env.example` to `.env` and update credentials
3. Run `docker-compose up -d` from the project root
4. The database will be automatically initialized with the schema

## Connecting to the Database

**From your Python backend:**
```python
DATABASE_URL = "postgresql://focusguard_user:focusguard_dev_password_123@localhost:5432/focusguard_db"
```

**Using psql:**
```bash
psql -h localhost -U focusguard_user -d focusguard_db
```

**Using DBeaver (Recommended GUI Tool):**
1. Open DBeaver and click "New Database Connection"
2. Select "PostgreSQL"
3. Enter connection details:
   - **Host:** localhost
   - **Port:** 5432
   - **Database:** focusguard_db
   - **Username:** focusguard_user
   - **Password:** focusguard_dev_password_123 (or check your .env file)
4. Click "Test Connection" to verify
5. Click "Finish" to save the connection
6. You can now browse tables, run queries, and manage the database graphically

**Using pgAdmin (if enabled):**
- Navigate to http://localhost:5050
- Login with credentials from .env file

## Management Commands

**Start the database:**
```bash
docker-compose up -d postgres
```

**Stop the database:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f postgres
```

**Access PostgreSQL shell:**
```bash
docker-compose exec postgres psql -U focusguard_user -d focusguard_db
```

**Backup database:**
```bash
docker-compose exec postgres pg_dump -U focusguard_user focusguard_db > backup.sql
```

**Restore database:**
```bash
docker-compose exec -T postgres psql -U focusguard_user -d focusguard_db < backup.sql
```

## Notes

- The `init/` scripts only run on first container creation
- To re-run init scripts, you need to delete the volume: `docker-compose down -v`
- Always backup your data before running destructive operations
