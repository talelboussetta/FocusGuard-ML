# FocusGuard REST API

## Overview

The FocusGuard REST API is the backend service that connects the React dashboard to the PostgreSQL database. It provides secure endpoints for user authentication, focus session management, virtual garden tracking, and analytics.

**Architecture**: RESTful API following MVC (Model-View-Controller) pattern
**Framework**: FastAPI (Python) - High-performance, async-capable, with automatic OpenAPI documentation
**Database**: PostgreSQL via asyncpg/SQLAlchemy
**Authentication**: JWT (JSON Web Tokens) with refresh token rotation

---

## Project Structure

```
api/
├── README.md                    # This file - API documentation and planning
├── __init__.py                  # Package initialization
├── main.py                      # FastAPI application entry point
├── config.py                    # Configuration management (env vars, database URL)
├── database.py                  # Database connection and session management
│
├── routes/                      # API endpoint definitions (controllers)
│   ├── __init__.py
│   ├── auth.py                  # Authentication endpoints (login, register, logout)
│   ├── users.py                 # User profile management
│   ├── sessions.py              # Focus session CRUD operations
│   ├── garden.py                # Virtual garden/plant management
│   ├── stats.py                 # User statistics and analytics
│   └── leaderboard.py           # Leaderboard and rankings
│
├── services/                    # Business logic layer
│   ├── __init__.py
│   ├── auth_service.py          # Authentication logic (password hashing, JWT)
│   ├── user_service.py          # User business logic
│   ├── session_service.py       # Session management logic
│   ├── garden_service.py        # Garden/gamification logic
│   └── stats_service.py         # Statistics calculation and aggregation
│
├── schemas/                     # Pydantic models for request/response validation
│   ├── __init__.py
│   ├── auth.py                  # Login, Register, Token schemas
│   ├── user.py                  # User input/output schemas
│   ├── session.py               # Session schemas
│   ├── garden.py                # Garden schemas
│   └── stats.py                 # Statistics schemas
│
├── middleware/                  # Custom middleware
│   ├── __init__.py
│   ├── auth_middleware.py       # JWT validation, current user injection
│   ├── cors_middleware.py       # CORS configuration
│   ├── error_handler.py         # Global error handling
│   └── rate_limiter.py          # Rate limiting for API protection
│
└── utils/                       # Utility functions
    ├── __init__.py
    ├── jwt_handler.py           # JWT creation and validation
    ├── password.py              # Password hashing (bcrypt)
    ├── validators.py            # Custom validation functions
    └── exceptions.py            # Custom exception classes
```

---

## API Endpoints

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create a new user account | ❌ |
| POST | `/auth/login` | Login and receive access token | ❌ |
| POST | `/auth/logout` | Invalidate refresh token | ✅ |
| POST | `/auth/refresh` | Get new access token using refresh token | ✅ |
| GET | `/auth/me` | Get current authenticated user | ✅ |

**Authentication Flow**:
1. User registers → Password hashed with bcrypt → User created in DB
2. User logs in → Credentials validated → JWT access token (15 min) + refresh token (7 days) returned
3. Frontend stores tokens (access in memory, refresh in httpOnly cookie)
4. Frontend includes access token in `Authorization: Bearer <token>` header
5. Token expires → Frontend uses refresh token to get new access token
6. User logs out → Refresh token invalidated (blacklisted or removed from DB)

---

### User Endpoints (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | ✅ |
| PUT | `/users/me` | Update current user profile | ✅ |
| PATCH | `/users/me/password` | Change user password | ✅ |
| DELETE | `/users/me` | Delete user account (cascade delete) | ✅ |
| GET | `/users/{user_id}` | Get public user profile (username, level, XP) | ✅ |

**Request/Response Examples**:

```json
// GET /users/me Response
{
  "id": "a1111111-1111-1111-1111-111111111111",
  "username": "alice_focus",
  "email": "alice@focusguard.com",
  "lvl": 5,
  "xp_points": 1250,
  "created_at": "2026-01-10T08:30:00Z",
  "updated_at": "2026-01-18T14:22:00Z"
}

// PUT /users/me Request
{
  "username": "alice_the_focused",
  "email": "alice.new@focusguard.com"
}
```

---

### Session Endpoints (`/api/sessions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/sessions` | Create a new focus session | ✅ |
| GET | `/sessions` | Get all sessions for current user | ✅ |
| GET | `/sessions/{session_id}` | Get specific session details | ✅ |
| PATCH | `/sessions/{session_id}` | Update session (mark complete) | ✅ |
| DELETE | `/sessions/{session_id}` | Delete a session | ✅ |
| GET | `/sessions/active` | Get current active session | ✅ |

**Request/Response Examples**:

```json
// POST /sessions Request
{
  "duration_min": 25  // Optional: for planning
}

// POST /sessions Response
{
  "id": "session-uuid",
  "user_id": "user-uuid",
  "completed": false,
  "created_at": "2026-01-18T15:00:00Z"
}

// PATCH /sessions/{session_id} Request
{
  "completed": true
}
```

---

### Garden Endpoints (`/api/garden`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/garden` | Create garden entry for session | ✅ |
| GET | `/garden` | Get all garden entries for user | ✅ |
| GET | `/garden/{garden_id}` | Get specific garden entry | ✅ |
| PATCH | `/garden/{garden_id}` | Update garden (growth stage) | ✅ |
| DELETE | `/garden/{garden_id}` | Delete garden entry | ✅ |
| GET | `/garden/session/{session_id}` | Get garden for specific session | ✅ |

**Request/Response Examples**:

```json
// POST /garden Request
{
  "session_id": "session-uuid",
  "plant_type": "Rose",
  "growth_stage": 0,
  "plant_num": 1
}

// GET /garden Response
{
  "gardens": [
    {
      "id": "garden-uuid",
      "user_id": "user-uuid",
      "session_id": "session-uuid",
      "plant_num": 1,
      "plant_type": "Rose",
      "growth_stage": 5,
      "total_plants": 3,
      "created_at": "2026-01-15T10:00:00Z"
    },
    // ... more entries
  ],
  "total": 3
}
```

---

### Statistics Endpoints (`/api/stats`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats/me` | Get current user statistics | ✅ |
| GET | `/stats/summary` | Get summary stats (total users, sessions, etc.) | ✅ |
| GET | `/stats/daily/{days}` | Get daily focus data for last N days | ✅ |
| GET | `/stats/trends` | Get trends (weekly, monthly) | ✅ |

**Request/Response Examples**:

```json
// GET /stats/me Response
{
  "user_id": "user-uuid",
  "total_focus_min": 1250,
  "total_sessions": 15,
  "current_streak": 5,
  "best_streak": 8,
  "updated_at": "2026-01-18T14:30:00Z"
}

// GET /stats/daily/7 Response
{
  "daily_stats": [
    {
      "date": "2026-01-18",
      "focus_min": 120,
      "sessions_completed": 3
    },
    {
      "date": "2026-01-17",
      "focus_min": 80,
      "sessions_completed": 2
    },
    // ... 5 more days
  ]
}
```

---

### Leaderboard Endpoints (`/api/leaderboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/leaderboard/xp` | Top users by XP points | ✅ |
| GET | `/leaderboard/focus-time` | Top users by total focus time | ✅ |
| GET | `/leaderboard/streak` | Top users by best streak | ✅ |
| GET | `/leaderboard/sessions` | Top users by total sessions | ✅ |

**Request/Response Examples**:

```json
// GET /leaderboard/xp?limit=10 Response
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "user-uuid",
      "username": "eve_learn",
      "lvl": 10,
      "xp_points": 5000
    },
    {
      "rank": 2,
      "user_id": "user-uuid-2",
      "username": "charlie_dev",
      "lvl": 8,
      "xp_points": 3200
    },
    // ... more users
  ],
  "current_user_rank": 5,
  "total_users": 100
}
```

---

## Database Integration

### Connection Management

```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Async database engine
engine = create_async_engine(
    "postgresql+asyncpg://user:password@localhost:5432/focusguard_db",
    echo=True,  # Log SQL queries (disable in production)
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Dependency for FastAPI routes
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

### ORM Models

Use SQLAlchemy ORM models that match the database schema:

- `models/user.py` → `users` table
- `models/session.py` → `sessions` table
- `models/garden.py` → `garden` table
- `models/user_stats.py` → `user_stats` table

**Benefits**:
- Type safety with IDE autocomplete
- Automatic query generation
- Relationship loading (joins)
- Migration support (Alembic)

---

## Authentication & Security

### JWT Token Structure

**Access Token** (short-lived, 15 minutes):
```json
{
  "sub": "user-uuid",           // Subject (user ID)
  "username": "alice_focus",
  "type": "access",
  "exp": 1737213600,            // Expiration timestamp
  "iat": 1737212700             // Issued at timestamp
}
```

**Refresh Token** (long-lived, 7 days):
```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "exp": 1737817500,
  "iat": 1737212700,
  "jti": "unique-token-id"      // JWT ID for revocation
}
```

### Security Best Practices

1. **Password Hashing**: Use bcrypt with cost factor 12
2. **Token Storage**: 
   - Access token in memory (React state/context)
   - Refresh token in httpOnly, secure, sameSite cookie
3. **CORS**: Restrict to frontend domain only
4. **Rate Limiting**: Limit login attempts (5 per 15 minutes)
5. **Input Validation**: Pydantic schemas validate all input
6. **SQL Injection**: SQLAlchemy ORM prevents SQL injection
7. **HTTPS Only**: Enforce HTTPS in production

---

## Request/Response Flow

### Typical Request Lifecycle

```
1. Client (React) sends HTTP request
   ↓
2. CORS Middleware validates origin
   ↓
3. Rate Limiter checks request count
   ↓
4. Auth Middleware validates JWT token
   ↓
5. Route handler receives request
   ↓
6. Pydantic schema validates input
   ↓
7. Service layer executes business logic
   ↓
8. Database query via SQLAlchemy
   ↓
9. Response formatted via Pydantic schema
   ↓
10. Error Handler catches exceptions
    ↓
11. JSON response sent to client
```

---

## Error Handling

### Standard Error Responses

All errors follow a consistent format:

```json
{
  "detail": {
    "message": "User not found",
    "error_code": "USER_NOT_FOUND",
    "status_code": 404,
    "timestamp": "2026-01-18T15:30:00Z"
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Resource created |
| 204 | Success with no content |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate username/email) |
| 422 | Unprocessable entity (Pydantic validation) |
| 429 | Too many requests (rate limit) |
| 500 | Internal server error |

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://talel_admin:password@localhost:5432/focusguard_db

# JWT
JWT_SECRET_KEY=your-super-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

---

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

---

## Development Workflow

### 1. Install Dependencies

```bash
cd serv
pip install -r requirements.txt
```

Required packages:
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `sqlalchemy` - ORM
- `asyncpg` - Async PostgreSQL driver
- `pydantic` - Data validation
- `python-jose[cryptography]` - JWT handling
- `passlib[bcrypt]` - Password hashing
- `python-multipart` - Form data parsing
- `python-dotenv` - Environment variable management

### 2. Start Development Server

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Test Endpoints

Use the interactive docs at `http://localhost:8000/docs` or tools like:
- Postman
- Insomnia
- curl
- httpie

### 4. Run Tests

```bash
pytest test/
```

---

## Frontend Integration

### React Service Example

```typescript
// services/api.ts
const API_BASE_URL = 'http://localhost:8000/api';

export const apiClient = {
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',  // Include cookies
    });
    return response.json();
  },
  
  async getSessions(token: string) {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
};
```

---

## Next Steps

1. ✅ **Database Schema**: Completed (001-007.sql)
2. ⏳ **API Implementation**: Next phase
   - Set up FastAPI project structure
   - Implement authentication endpoints
   - Implement CRUD endpoints for users, sessions, garden, stats
   - Add JWT middleware
   - Add error handling
3. ⏳ **Testing**: Unit and integration tests
4. ⏳ **Frontend Integration**: Connect React dashboard to API
5. ⏳ **Deployment**: Docker containerization, CI/CD

---

## Additional Features (Future)

- **WebSocket Support**: Real-time session updates
- **File Upload**: User profile pictures
- **Email Verification**: Account activation
- **Password Reset**: Forgot password flow
- **OAuth**: Google/GitHub login
- **API Versioning**: `/api/v1/`, `/api/v2/`
- **GraphQL**: Alternative to REST
- **Caching**: Redis for session data
- **Background Tasks**: Celery for async jobs

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [REST API Design Guide](https://restfulapi.net/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
