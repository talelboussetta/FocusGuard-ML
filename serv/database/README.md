# FocusGuard Database

## Overview

The FocusGuard database is a PostgreSQL-based schema designed to support a focus tracking and gamification application. It stores user profiles, focus sessions, virtual garden progress, and performance statistics.

The schema is designed to be:
- **Clean and maintainable**: Each table is defined in its own SQL file
- **Reproducible**: Can be recreated from scratch by executing SQL files in order
- **Scalable**: Uses UUID primary keys and proper indexing
- **Referentially sound**: Enforces relationships through foreign keys and constraints

## Database Schema

### Table Relationships

```
users (1) ─────────< sessions (*)
  │                      │
  │                      │
  │                      │ (1-to-1)
  │                      │
  │                      ▼
  │                  garden (*)
  │                      │
  └────────────────< ────┘
  │
  │ (1-to-1)
  │
  ▼
user_stats (1)
```

### Tables

#### **users**
Stores user authentication and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Username for login |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| password_hash | TEXT | NOT NULL | Hashed password |
| lvl | INTEGER | NOT NULL, DEFAULT 1, CHECK >= 1 | User level (gamification) |
| xp_points | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Experience points |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Purpose**: Central table for user identity and gamification data.

**Relationships**:
- One user can have many sessions
- One user can have many garden entries
- One user has exactly one user_stats record

---

#### **sessions**
Tracks focus sessions created by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique session identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY → users(id) | Owner of the session |
| completed | BOOLEAN | NOT NULL, DEFAULT FALSE | Completion status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Session creation timestamp |

**Purpose**: Records each focus session attempt by a user.

**Relationships**:
- Many sessions belong to one user
- One session has exactly one garden entry

---

#### **garden**
Stores virtual garden/plant data for gamification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique garden entry identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY → users(id) | Owner of the garden entry |
| session_id | UUID | NOT NULL, UNIQUE, FOREIGN KEY → sessions(id) | Associated session (1-to-1) |
| plant_num | INTEGER | NOT NULL, CHECK >= 0 | Plant number identifier |
| plant_type | VARCHAR(50) | NOT NULL | Type/species of plant |
| growth_stage | INTEGER | NOT NULL, CHECK >= 0 | Current growth stage |
| total_plants | INTEGER | NOT NULL, CHECK >= 0 | Total plants in this entry |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Entry creation timestamp |

**Purpose**: Tracks virtual garden progress tied to focus sessions.

**Relationships**:
- Many garden entries belong to one user
- Each garden entry is tied to exactly one session (enforced by UNIQUE constraint on session_id)

---

#### **user_stats**
Aggregated performance statistics for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PRIMARY KEY, FOREIGN KEY → users(id) | User reference (1-to-1) |
| total_focus_min | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Total focus minutes |
| total_sessions | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Total completed sessions |
| current_streak | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Current consecutive days |
| best_streak | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Best streak ever |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last statistics update |

**Purpose**: Stores aggregated metrics for leaderboards and user progress tracking.

**Relationships**:
- Each user has exactly one user_stats record (1-to-1, enforced by PRIMARY KEY)

---

## Running the SQL Files

The SQL files in `database/init/` must be executed **in numerical order** to properly set up the schema:

1. `001_extensions.sql` - Enable required PostgreSQL extensions
2. `002_users.sql` - Create users table
3. `003_sessions.sql` - Create sessions table
4. `004_garden.sql` - Create garden table
5. `005_user_stats.sql` - Create user_stats table
6. `006_indexes.sql` - Create performance indexes
7. `007_seed_data.sql` - **[OPTIONAL]** Insert dummy data for testing and development

### Seed Data (007_seed_data.sql)

The seed data script creates **5 dummy users** with realistic testing data:

| User | Level | XP | Sessions | Focus Time | Streak |
|------|-------|----|----|-------|--------|
| alice_focus | 5 | 1,250 | 3 completed, 1 incomplete | 180 min | 3 days |
| bob_study | 3 | 450 | 2 completed | 120 min | 2 days |
| charlie_dev | 8 | 3,200 | 5 completed | 300 min | 5 days |
| diana_code | 2 | 180 | 1 completed | 60 min | 1 day |
| eve_learn | 10 | 5,000 | 7 completed | 420 min | 7 days |

**Total**: 17 sessions, 17 garden entries (1-to-1 with completed sessions), 5 user stats records.

**Purpose**:
- Test database relations (foreign keys, cascades, 1-to-1 relationships)
- Visualize data in DBeaver
- Develop and test backend queries without manual data entry
- Demonstrate gamification features (gardens, plants, growth stages)

**Note**: This script uses hardcoded UUIDs for consistency. Do **not** run this in production!

### Method 1: Using DBeaver

1. **Connect to your database**:
   - Open DBeaver
   - Create a new PostgreSQL connection
   - Host: `localhost`
   - Port: `5432` (or your Docker-mapped port)
   - Database: `focusguard` (or your database name)
   - Username/Password: as configured in `docker-compose.yml`

2. **Execute SQL files**:
   - Right-click on your database → **SQL Editor** → **Open SQL Script**
   - Navigate to `database/init/001_extensions.sql`
   - Click **Execute SQL Statement** (Ctrl+Enter)
   - Repeat for files `002` through `006` in order

3. **Verify the schema**:
   - Expand your database in the Database Navigator
   - Verify that all tables (`users`, `sessions`, `garden`, `user_stats`) exist
   - Check constraints and indexes under each table

### Method 2: Using psql in Docker

1. **Access the PostgreSQL container**:
   ```bash
   docker-compose exec postgres psql -U <username> -d <database>
   ```

2. **Execute each SQL file**:
   ```bash
   # From inside the container
   \i /docker-entrypoint-initdb.d/001_extensions.sql
   \i /docker-entrypoint-initdb.d/002_users.sql
   \i /docker-entrypoint-initdb.d/003_sessions.sql
   \i /docker-entrypoint-initdb.d/004_garden.sql
   \i /docker-entrypoint-initdb.d/005_user_stats.sql
   \i /docker-entrypoint-initdb.d/006_indexes.sql
   \i /docker-entrypoint-initdb.d/007_seed_data.sql  # Optional: Add test data
   ```

   **Note**: This assumes your `docker-compose.yml` mounts the `database/init/` folder to `/docker-entrypoint-initdb.d/` in the container.

3. **Verify tables**:
   ```sql
   \dt  -- List all tables
   \d users  -- Describe users table
   \d sessions  -- Describe sessions table
   \d garden  -- Describe garden table
   \d user_stats  -- Describe user_stats table
   ```

### Method 3: Automatic Initialization (Docker)

If your `docker-compose.yml` is configured to automatically run initialization scripts:

1. **Mount the init folder** in your `docker-compose.yml`:
   ```yaml
   services:
     postgres:
       image: postgres:15
       volumes:
         - ./database/init:/docker-entrypoint-initdb.d
       environment:
         POSTGRES_DB: focusguard
         POSTGRES_USER: focusguard_user
         POSTGRES_PASSWORD: yourpassword
   ```

2. **Start fresh** (this will recreate the database):
   ```bash
   docker-compose down -v  # Remove volumes
   docker-compose up -d    # Start fresh - init scripts run automatically
   ```

PostgreSQL will automatically execute all `.sql` files in `/docker-entrypoint-initdb.d/` in **alphabetical order** when the database is first initialized.

---

## Connecting with DBeaver

1. **Download and install** [DBeaver Community Edition](https://dbeaver.io/download/)

2. **Create a new connection**:
   - Click **Database** → **New Database Connection**
   - Select **PostgreSQL**
   - Click **Next**

3. **Configure connection**:
   - **Host**: `localhost` (or `127.0.0.1`)
   - **Port**: `5432` (check your `docker-compose.yml` for the mapped port)
   - **Database**: `focusguard` (or your database name)
   - **Username**: Your PostgreSQL username
   - **Password**: Your PostgreSQL password
   - Click **Test Connection** to verify
   - Click **Finish**

4. **Explore the database**:
   - Expand the connection in the Database Navigator
   - Navigate to: **Databases** → **focusguard** → **Schemas** → **public** → **Tables**
   - View table structures, data, constraints, and indexes

5. **Useful DBeaver features**:
   - **ER Diagram**: Right-click database → **View Diagram** to visualize relationships
   - **Data Editor**: Double-click a table to view/edit data
   - **SQL Editor**: Right-click database → **SQL Editor** → **New SQL Script**

---

## Key Design Decisions

### UUID Primary Keys
- Uses `gen_random_uuid()` from the `pgcrypto` extension
- Provides globally unique identifiers across distributed systems
- Avoids sequential ID guessing for security

### Cascading Deletes
- All foreign keys use `ON DELETE CASCADE`
- Deleting a user automatically deletes their sessions, garden entries, and stats
- Ensures referential integrity without orphaned records

### Check Constraints
- Prevents invalid data (negative XP, negative focus time, etc.)
- Enforces business rules at the database level
- Examples: `lvl >= 1`, `xp_points >= 0`, `total_focus_min >= 0`

### Indexing Strategy
- **Foreign keys**: Indexed to speed up JOINs
- **Leaderboards**: Descending indexes on `xp_points`, `total_focus_min`, etc.
- **Lookups**: Unique constraints on `username` and `email` automatically create indexes
- **Common queries**: Composite index on `(user_id, created_at)` for user session history

### 1-to-1 Relationships
- `users ↔ user_stats`: Enforced by using `user_id` as PRIMARY KEY in `user_stats`
- `sessions ↔ garden`: Enforced by UNIQUE constraint on `garden.session_id`

---

## Future Improvements

### Potential New Tables

1. **achievements**
   - Track user achievements and badges
   - Fields: `id`, `user_id`, `achievement_type`, `unlocked_at`

2. **focus_periods**
   - Break sessions into timed focus periods (e.g., Pomodoro intervals)
   - Fields: `id`, `session_id`, `start_time`, `end_time`, `duration_min`, `distraction_count`

3. **distractions**
   - Log detected distractions during focus sessions
   - Fields: `id`, `session_id`, `timestamp`, `distraction_type`, `severity`

4. **friends / social**
   - Enable friend connections and leaderboards
   - Fields: `user_id`, `friend_user_id`, `status`, `created_at`

5. **daily_goals**
   - User-defined daily focus goals
   - Fields: `id`, `user_id`, `goal_min`, `date`, `achieved`

### Schema Evolution

1. **Migration Tool**: Consider adding a migration framework like:
   - **Flyway** (Java-based, language-agnostic)
   - **Alembic** (Python)
   - **node-pg-migrate** (Node.js)

2. **Soft Deletes**: Add `deleted_at` columns for audit trails instead of hard deletes

3. **Audit Logging**: Create triggers to log all changes to critical tables

4. **Partitioning**: Partition `sessions` and `garden` tables by `created_at` for performance as data grows

5. **Materialized Views**: Create materialized views for complex leaderboard queries

6. **Full-Text Search**: Add `tsvector` columns for searching usernames, plant types, etc.

---

## Troubleshooting

### Common Issues

**Problem**: "relation already exists"
- **Solution**: Tables already exist. Drop them first or use `CREATE TABLE IF NOT EXISTS`

**Problem**: "permission denied"
- **Solution**: Ensure your database user has CREATE privileges

**Problem**: Foreign key constraint violations
- **Solution**: Ensure you execute SQL files in the correct order (001 → 006)

**Problem**: Cannot connect to database
- **Solution**: Verify Docker container is running: `docker-compose ps`

### Useful Commands

```sql
-- Drop all tables (careful! this deletes all data)
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS garden CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- View all tables
\dt

-- View table structure
\d users

-- View indexes
\di

-- View constraints
\d+ users

-- Count rows in each table
SELECT 'users' AS table, COUNT(*) FROM users
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'garden', COUNT(*) FROM garden
UNION ALL
SELECT 'user_stats', COUNT(*) FROM user_stats;
```

---

## Additional Notes

- **No application logic**: This schema contains only data structure, no stored procedures or triggers
- **Backend-agnostic**: Can be used with any backend language (Python, Node.js, Java, etc.)
- **Docker-first**: Designed to run in a containerized PostgreSQL instance
- **Version control**: Keep all SQL files in version control for reproducibility
- **Testing**: Consider creating a separate test database for development

For questions or issues, refer to the PostgreSQL documentation: https://www.postgresql.org/docs/
