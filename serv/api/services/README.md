# Business Logic Layer - Services

This folder contains the **business logic layer** for the FocusGuard API. Each service module handles specific domain operations and orchestrates interactions between the database (ORM models) and API routes.

## Architecture Overview

```
Routes (HTTP) → Services (Business Logic) → Models (Database)
```

- **Routes**: Handle HTTP requests/responses, validation, authentication
- **Services**: Implement business rules, calculations, data transformations
- **Models**: Database operations via SQLAlchemy ORM

---

## 📁 Service Modules

### 1. `auth_service.py` - Authentication & Authorization

Handles user authentication, registration, and JWT token management.

#### Functions:

**`register_user(db, registration)`**
- Creates new user account with hashed password
- Validates username (3-50 chars, alphanumeric), email (RFC 5322), password strength
- Checks for duplicate username/email
- Initializes user with level 1, 0 XP
- Creates associated `UserStats` record (1-to-1 relationship)
- **Returns**: User object
- **Raises**: `DuplicateUserException`, `ValidationException`

**`authenticate_user(db, login)`**
- Authenticates user via username/email + password
- Supports login with either username or email
- Uses bcrypt for password verification
- **Returns**: User object if credentials valid
- **Raises**: `InvalidCredentialsException`

**`create_tokens(user)`**
- Generates JWT access token (15 min expiry) and refresh token (7 days)
- Includes user ID and username in token payload
- Uses HS256 algorithm with secret key from config
- **Returns**: `{"access_token": str, "refresh_token": str}`

**`get_user_by_id(db, user_id)`**
- Retrieves user by UUID
- **Returns**: User object
- **Raises**: `UserNotFoundException`

---

### 2. `user_service.py` - User Management

Manages user profiles, account updates, and account operations.

#### Functions:

**`get_user_profile(db, user_id)`**
- Fetches complete user profile by ID
- **Returns**: User object with all fields
- **Raises**: `UserNotFoundException`

**`update_user_profile(db, user_id, update_data)`**
- Updates username and/or email
- Validates new values before updating
- Prevents duplicate username/email conflicts with other users
- **Returns**: Updated user object
- **Raises**: `UserNotFoundException`, `DuplicateUserException`

**`change_password(db, user_id, password_data)`**
- Changes user password with current password verification
- Validates password strength for new password
- Hashes new password with bcrypt (cost 12)
- **Returns**: None (commits to DB)
- **Raises**: `UserNotFoundException`, `InvalidCredentialsException`

**`delete_user_account(db, user_id)`**
- Permanently deletes user account
- **Cascade deletes**: All sessions, gardens, and stats (FK constraints)
- **Returns**: None
- **Raises**: `UserNotFoundException`

**`get_public_user_profile(db, user_id)`**
- Retrieves user profile for public display (leaderboards, etc.)
- Same as `get_user_profile` but intended for public endpoints
- Response schema should exclude sensitive data (email, password_hash)
- **Returns**: User object

---

### 3. `session_service.py` - Focus Session Management

Handles focus session lifecycle, XP/level calculations, and user stats updates.

#### Functions:

**`create_session(db, user_id, session_data)`**
- Creates new focus session for user
- Sets `completed=False`, `blink_rate=None` initially
- Verifies user exists before creation
- **Returns**: Created session object
- **Raises**: `UserNotFoundException`

**`get_session(db, session_id, user_id=None)`**
- Retrieves session by ID
- Optionally verifies ownership if `user_id` provided
- **Returns**: Session object
- **Raises**: `SessionNotFoundException`, `ForbiddenException`

**`update_session(db, session_id, user_id, update_data)`**
- Updates session fields (duration, blink_rate, etc.)
- Verifies user owns the session
- **Returns**: Updated session object
- **Raises**: `SessionNotFoundException`, `ForbiddenException`

**`complete_session(db, session_id, user_id, blink_rate=None)`**
- Marks session as completed
- Updates user stats (total sessions, focus minutes, streak)
- Awards XP and recalculates user level
- **XP Formula**: `10 XP per minute` of focus time
- **Level Formula**: `level = floor(total_xp / 250) + 1`
- **Returns**: Completed session object

**`list_user_sessions(db, user_id, skip=0, limit=20, completed_only=False)`**
- Lists user's sessions with pagination
- Orders by most recent first (`created_at DESC`)
- Optional filter for completed sessions only
- **Returns**: `(sessions_list, total_count)`

**`get_active_session(db, user_id)`**
- Finds user's currently active (incomplete) session
- **Returns**: Session object or `None`

**`delete_session(db, session_id, user_id)`**
- Deletes session after ownership verification
- **Returns**: None
- **Raises**: `SessionNotFoundException`, `ForbiddenException`

#### Internal Helpers:

**`_update_user_stats_on_completion(db, user_id, session)`**
- Updates `UserStats`: total_sessions, total_focus_min, streaks
- Simplified streak logic (increments current_streak)
- TODO: Implement proper consecutive-day streak calculation

**`_award_xp(db, user_id, duration_minutes)`**
- Awards XP based on session duration
- Recalculates user level automatically
- Updates `User.xp_points` and `User.lvl`

---

### 4. `garden_service.py` - Virtual Garden Management

Manages the gamification garden system linked to focus sessions.

#### Functions:

**`create_garden_entry(db, user_id, garden_data)`**
- Creates garden entry for a completed session
- Enforces 1-to-1 relationship (one garden per session)
- Verifies user owns the session
- **Returns**: Created garden object
- **Raises**: `SessionNotFoundException`, `ForbiddenException`, `ValidationException`

**`get_garden_entry(db, garden_id, user_id=None)`**
- Retrieves garden entry by ID
- Optionally verifies ownership
- **Returns**: Garden object
- **Raises**: `GardenNotFoundException`, `UnauthorizedAccessException`

**`update_garden_entry(db, garden_id, user_id, update_data)`**
- Updates garden fields (plant_num, plant_type, growth_stage, total_plants)
- All fields must be >= 0 (database constraint)
- **Returns**: Updated garden object

**`list_user_garden(db, user_id, skip=0, limit=50)`**
- Lists all user's garden entries with pagination
- Orders by most recent (`created_at DESC`)
- **Returns**: `(garden_entries_list, total_count)`

**`get_garden_statistics(db, user_id)`**
- Aggregates garden statistics for user
- Calculates:
  - `total_plants`: Sum of all plants grown
  - `plants_by_type`: Count per plant type (19 types available)
  - `average_growth_stage`: Mean growth stage across all gardens
  - `highest_plant_num`: Maximum plant number achieved
- **Returns**: Statistics dictionary

**`delete_garden_entry(db, garden_id, user_id)`**
- Deletes garden entry after ownership verification
- **Returns**: None

---

### 5. `stats_service.py` - Statistics & Leaderboards

Provides analytics, trends, and competitive features.

#### Functions:

**`get_user_stats(db, user_id)`**
- Retrieves user's statistics record
- **Returns**: UserStats object (total_focus_min, total_sessions, streaks)
- **Raises**: `UserNotFoundException`

**`get_daily_stats(db, user_id, days=7)`**
- Aggregates session data by day for the past N days
- Groups sessions by date, calculates totals
- Fills missing dates with zeros for complete timeline
- **Returns**: List of `{"date": "YYYY-MM-DD", "sessions": int, "total_minutes": int}`

**`get_user_trends(db, user_id)`**
- Analyzes user behavior over last 30 days
- Calculates:
  - `average_session_length`: Mean minutes per session
  - `total_sessions_30d`: Count of sessions in last 30 days
  - `total_minutes_30d`: Total focus time in last 30 days
  - `most_productive_hour`: Hour of day (0-23) with most sessions
- **Returns**: Trends dictionary

**`get_leaderboard(db, metric="xp", limit=10)`**
- Generates top N users by selected metric
- **Metrics**:
  - `"xp"`: Ranked by `User.xp_points` (descending)
  - `"focus_time"`: Ranked by `UserStats.total_focus_min` (descending)
  - `"streak"`: Ranked by `UserStats.current_streak` (descending)
- **Returns**: List of leaderboard entries with rank, username, stats

**`get_user_rank(db, user_id, metric="xp")`**
- Calculates user's global rank for a specific metric
- Counts users with better stats + 1
- **Returns**: `{"rank": int, "metric": str}`
- **Raises**: `UserNotFoundException`

---

## 🎮 Gamification System

### XP & Leveling

```python
# XP Award (per session completion)
xp_earned = duration_minutes * 10

# Level Calculation
level = (total_xp // 250) + 1
```

**Examples:**
- 25-minute session → 250 XP
- Level 1: 0-249 XP
- Level 2: 250-499 XP
- Level 5: 1000-1249 XP
- Level 10: 2250-2499 XP

### Streaks

- **Current Streak**: Consecutive sessions/days (simplified: increments on each completion)
- **Best Streak**: All-time highest streak
- TODO: Implement proper day-based streak logic (reset if no session in 24h)

### Garden System

- **Plant Types**: 19 varieties (enum in schemas/garden.py)
- **Growth Stages**: 0-5 (configurable per implementation)
- **1-to-1 Relationship**: Each session can have one garden entry
- **Total Plants**: Cumulative count across all sessions

---

## 🔒 Security & Authorization

All services include:
- **Ownership Verification**: Users can only access/modify their own data
- **Input Validation**: Via Pydantic schemas + custom validators
- **Password Security**: bcrypt hashing (cost 12)
- **Exception Handling**: Consistent custom exceptions

### Common Exceptions:

| Exception | HTTP Code | Use Case |
|-----------|-----------|----------|
| `UserNotFoundException` | 404 | User ID not found |
| `SessionNotFoundException` | 404 | Session ID not found |
| `GardenNotFoundException` | 404 | Garden ID not found |
| `DuplicateUserException` | 409 | Username/email already exists |
| `InvalidCredentialsException` | 401 | Wrong password or user not found |
| `ForbiddenException` | 403 | User doesn't own resource |
| `ValidationException` | 422 | Input validation failed |

---

## 📊 Database Transactions

All service functions use SQLAlchemy's async session management:

```python
# Pattern for write operations
async def create_resource(db: AsyncSession, ...):
    new_resource = Model(...)
    db.add(new_resource)
    await db.commit()
    await db.refresh(new_resource)
    return new_resource

# Pattern for read operations
async def get_resource(db: AsyncSession, ...):
    result = await db.execute(
        select(Model).where(Model.id == resource_id)
    )
    return result.scalar_one_or_none()
```

- **Atomic Operations**: Each function commits its own transaction
- **Auto Rollback**: Database errors trigger automatic rollback via middleware
- **Lazy Loading**: Relationships loaded on access (async query required)

---

## 🚀 Usage Example

```python
from api.services import auth_service, session_service
from api.database import AsyncSessionLocal

async def example():
    async with AsyncSessionLocal() as db:
        # Register user
        user = await auth_service.register_user(
            db,
            RegisterRequest(username="alice", email="alice@example.com", password="SecurePass123")
        )
        
        # Create session
        session = await session_service.create_session(
            db,
            user.id,
            SessionCreate(duration_minutes=30)
        )
        
        # Complete session (awards 300 XP)
        completed = await session_service.complete_session(
            db,
            session.id,
            user.id,
            blink_rate=15.5
        )
        
        # User now has 300 XP, level 2
```

---

## 📝 Notes

- All functions are **async** (use `await`)
- Database session (`db`) must be passed to all functions
- Functions return ORM models (convert to Pydantic schemas in routes)
- Pagination uses `skip` (offset) and `limit` patterns
- Timestamps use UTC timezone (`datetime.now(timezone.utc)`)

---

## 🔄 Next Steps

After services, implement:
1. **Routes** (`api/routes/`) - FastAPI endpoints calling these services
2. **Main App** (`main.py`) - FastAPI app with route registration
3. **Tests** - Unit tests for each service function
4. **Frontend Integration** - Connect React dashboard to API endpoints
