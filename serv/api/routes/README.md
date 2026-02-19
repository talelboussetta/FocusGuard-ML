# REST API Routes - HTTP Endpoints

This folder contains the **HTTP endpoint layer** for the FocusGuard API. Each route module defines FastAPI routers that expose the business logic services as REST API endpoints.

## Architecture Overview

```
Client (React) → Routes (FastAPI) → Services (Business Logic) → Models (Database)
```

- **Routes**: Handle HTTP requests/responses, validation, authentication, rate limiting
- **Services**: Execute business logic and database operations
- **Automatic Features**: OpenAPI docs, request validation, response serialization

---

## 🌐 API Base URL

**Local Development**: `http://localhost:8000`

**API Documentation**:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## 📁 Route Modules

### 1. `auth.py` - Authentication Endpoints

**Prefix**: `/auth`  
**Tag**: Authentication

#### Endpoints

**POST /auth/register** ✨ 201 Created  
Register a new user account.

- **Rate Limit**: 3 requests per minute
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "username": "alice_focus",
    "email": "alice@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response**: `RegisterResponse`
  ```json
  {
    "user": {
      "id": "uuid",
      "username": "alice_focus",
      "email": "alice@example.com",
      "lvl": 1,
      "xp_points": 0,
      "created_at": "2026-01-20T10:00:00Z"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer"
  }
  ```
- **Errors**: 409 (duplicate username/email), 422 (validation error)

---

**POST /auth/login** 🔑  
Authenticate user and receive tokens.

- **Rate Limit**: 5 requests per minute
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "username": "alice_focus",  // or email
    "password": "SecurePass123"
  }
  ```
- **Response**: `LoginResponse` (same as register)
- **Errors**: 401 (invalid credentials)

---

**POST /auth/refresh** 🔄  
Get new access token using refresh token.

- **Rate Limit**: None (60/min default)
- **Authentication**: Not required (uses refresh token)
- **Request Body**:
  ```json
  {
    "refresh_token": "eyJ..."
  }
  ```
- **Response**: `TokenResponse`
  ```json
  {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer"
  }
  ```
- **Errors**: 401 (invalid/expired token)

---

### 2. `users.py` - User Management Endpoints

**Prefix**: `/users`  
**Tag**: Users

#### Endpoints

**GET /users/me** 👤  
Get current authenticated user's profile.

- **Authentication**: Required (JWT Bearer token)
- **Response**: `UserWithStats`
  ```json
  {
    "id": "uuid",
    "username": "alice_focus",
    "email": "alice@example.com",
    "lvl": 5,
    "xp_points": 1250,
    "created_at": "2026-01-01T00:00:00Z",
    "stats": {
      "total_focus_min": 500,
      "total_sessions": 20,
      "current_streak": 5,
      "best_streak": 10,
      "updated_at": "2026-01-20T10:00:00Z"
    }
  }
  ```

---

**PUT /users/me** ✏️  
Update user profile (username and/or email).

- **Rate Limit**: 10 requests per minute
- **Authentication**: Required
- **Request Body**: `UserUpdate`
  ```json
  {
    "username": "new_username",  // optional
    "email": "newemail@example.com"  // optional
  }
  ```
- **Response**: `UserResponse`
- **Errors**: 409 (duplicate), 422 (validation)

---

**PUT /users/me/password** 🔐  
Change user password.

- **Rate Limit**: 5 requests per minute
- **Authentication**: Required
- **Request Body**: `PasswordChange`
  ```json
  {
    "current_password": "OldPass123",
    "new_password": "NewSecurePass456"
  }
  ```
- **Response**: 204 No Content
- **Errors**: 401 (wrong current password), 422 (weak password)

---

**DELETE /users/me** 🗑️  
Permanently delete user account.

- **Rate Limit**: 3 requests per hour
- **Authentication**: Required
- **Response**: 204 No Content
- **Side Effects**: Cascade deletes all sessions, gardens, stats

---

**GET /users/{user_id}** 🔍  
Get public user profile (for leaderboards).

- **Authentication**: Not required
- **Path Parameter**: `user_id` (UUID)
- **Response**: `UserPublic` (excludes email and sensitive data)
  ```json
  {
    "id": "uuid",
    "username": "alice_focus",
    "lvl": 5,
    "xp_points": 1250,
    "created_at": "2026-01-01T00:00:00Z"
  }
  ```

---

### 3. `sessions.py` - Focus Session Endpoints

**Prefix**: `/sessions`  
**Tag**: Sessions

#### Endpoints

**POST /sessions** ✨ 201 Created  
Create a new focus session.

- **Rate Limit**: 30 requests per minute
- **Authentication**: Required
- **Request Body**: `SessionCreate`
  ```json
  {
    "duration_minutes": 25
  }
  ```
- **Response**: `SessionResponse`
  ```json
  {
    "id": 1,
    "user_id": "uuid",
    "duration_minutes": 25,
    "completed": false,
    "blink_rate": null,
    "created_at": "2026-01-20T10:00:00Z"
  }
  ```

---

**GET /sessions** 📋  
List user's focus sessions with pagination.

- **Authentication**: Required
- **Query Parameters**:
  - `skip`: Pagination offset (default: 0)
  - `limit`: Results per page (default: 20, max: 100)
  - `completed_only`: Filter completed sessions (default: false)
- **Response**: `SessionListResponse`
  ```json
  {
    "sessions": [...],
    "total": 50,
    "skip": 0,
    "limit": 20
  }
  ```

---

**GET /sessions/active** 🟢  
Get user's currently active session.

- **Authentication**: Required
- **Response**: `ActiveSessionResponse`
  ```json
  {
    "session": { ... } // or null
  }
  ```

---

**GET /sessions/{session_id}** 🔍  
Get specific session details.

- **Authentication**: Required
- **Path Parameter**: `session_id` (integer)
- **Response**: `SessionResponse`
- **Errors**: 404 (not found), 403 (not owner)

---

**PUT /sessions/{session_id}** ✏️  
Update session details.

- **Rate Limit**: 20 requests per minute
- **Authentication**: Required
- **Request Body**: `SessionUpdate`
  ```json
  {
    "duration_minutes": 30,  // optional
    "completed": true,  // optional
    "blink_rate": 15.5  // optional
  }
  ```
- **Response**: `SessionResponse`

---

**POST /sessions/{session_id}/complete** ✅  
Complete a session (awards XP and updates stats).

- **Rate Limit**: 20 requests per minute
- **Authentication**: Required
- **Query Parameter**: `blink_rate` (optional, float)
- **Response**: `SessionResponse` (with `completed: true`)
- **Side Effects**:
  - Awards 10 XP per minute
  - Recalculates user level
  - Updates total_sessions, total_focus_min
  - Increments streak

---

**DELETE /sessions/{session_id}** 🗑️  
Delete a session.

- **Rate Limit**: 10 requests per minute
- **Authentication**: Required
- **Response**: 204 No Content

---

### 4. `garden.py` - Virtual Garden Endpoints

**Prefix**: `/garden`  
**Tag**: Garden

#### Endpoints

**POST /garden** ✨ 201 Created  
Create garden entry for a session.

- **Rate Limit**: 30 requests per minute
- **Authentication**: Required
- **Request Body**: `GardenCreate`
  ```json
  {
    "session_id": 1,
    "plant_num": 5,
    "plant_type": "ROSE",
    "growth_stage": 3,
    "total_plants": 42
  }
  ```
- **Response**: `GardenResponse`
- **Errors**: 422 (session already has garden)

---

**GET /garden** 🌱  
List user's garden entries with pagination.

- **Authentication**: Required
- **Query Parameters**:
  - `skip`: Default 0
  - `limit`: Default 50, max 100
- **Response**: `GardenListResponse`

---

**GET /garden/stats** 📊  
Get aggregated garden statistics.

- **Authentication**: Required
- **Response**: `GardenStats`
  ```json
  {
    "total_plants": 150,
    "plants_by_type": {
      "ROSE": 25,
      "TULIP": 30,
      "SUNFLOWER": 20
    },
    "average_growth_stage": 3.5,
    "highest_plant_num": 42
  }
  ```

---

**GET /garden/{garden_id}** 🔍  
Get specific garden entry.

- **Authentication**: Required
- **Response**: `GardenResponse`

---

**PUT /garden/{garden_id}** ✏️  
Update garden entry.

- **Rate Limit**: 20 requests per minute
- **Authentication**: Required
- **Request Body**: `GardenUpdate` (all fields optional)
- **Response**: `GardenResponse`

---

**DELETE /garden/{garden_id}** 🗑️  
Delete garden entry.

- **Rate Limit**: 10 requests per minute
- **Authentication**: Required
- **Response**: 204 No Content

---

### 5. `stats.py` - Statistics & Leaderboard Endpoints

**Prefix**: None (direct paths)  
**Tag**: Statistics

#### Endpoints

**GET /stats/me** 📊  
Get current user's statistics.

- **Authentication**: Required
- **Response**: `UserStatsResponse`
  ```json
  {
    "user_id": "uuid",
    "total_focus_min": 500,
    "total_sessions": 20,
    "current_streak": 5,
    "best_streak": 10,
    "updated_at": "2026-01-20T10:00:00Z"
  }
  ```

---

**GET /stats/daily** 📈  
Get daily statistics for past N days.

- **Authentication**: Required
- **Query Parameter**: `days` (default: 7, min: 1, max: 90)
- **Response**: `DailyStatsResponse`
  ```json
  {
    "days": 7,
    "data": [
      {
        "date": "2026-01-14",
        "sessions": 2,
        "total_minutes": 50
      },
      {
        "date": "2026-01-15",
        "sessions": 0,
        "total_minutes": 0
      }
    ]
  }
  ```

---

**GET /stats/trends** 📉  
Get user trends and insights (last 30 days).

- **Authentication**: Required
- **Response**: `TrendsResponse`
  ```json
  {
    "average_session_length": 25.5,
    "total_sessions_30d": 40,
    "total_minutes_30d": 1020,
    "most_productive_hour": 14
  }
  ```

---

**GET /leaderboard** 🏆  
Get global leaderboard rankings.

- **Authentication**: Not required
- **Query Parameters**:
  - `metric`: "xp" | "focus_time" | "streak" (default: "xp")
  - `limit`: Default 10, max 100
- **Response**: `LeaderboardResponse`
  ```json
  {
    "metric": "xp",
    "limit": 10,
    "entries": [
      {
        "rank": 1,
        "user_id": "uuid",
        "username": "eve_learn",
        "lvl": 10,
        "xp_points": 5000,
        "total_focus_min": 2000,
        "current_streak": 15
      }
    ]
  }
  ```

---

**GET /leaderboard/me** 🎯  
Get current user's rank on leaderboard.

- **Authentication**: Required
- **Query Parameter**: `metric` ("xp" | "focus_time" | "streak")
- **Response**: `UserRankResponse`
  ```json
  {
    "rank": 42,
    "metric": "xp"
  }
  ```

---

## 🔒 Authentication

All authenticated endpoints require a JWT Bearer token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Lifecycle**:
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry

**Getting Tokens**:
1. Register or login to receive tokens
2. Include access token in all authenticated requests
3. Use refresh token to get new access token when expired

---

## ⚡ Rate Limiting

| Endpoint | Rate Limit | Scope |
|----------|------------|-------|
| POST /auth/register | 3/minute | Per IP |
| POST /auth/login | 5/minute | Per IP |
| PUT /users/me/password | 5/minute | Per IP |
| DELETE /users/me | 3/hour | Per IP |
| Most other endpoints | 60/minute | Per IP |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642680000
```

---

## 📝 Request/Response Format

### Content Type
All endpoints accept and return `application/json`.

### Success Responses

| Status Code | Meaning | Usage |
|-------------|---------|-------|
| 200 OK | Success with body | GET, PUT requests |
| 201 Created | Resource created | POST requests |
| 204 No Content | Success without body | DELETE, password change |

### Error Responses

All errors follow this format:
```json
{
  "message": "Human-readable error message",
  "error_code": "ERROR_CODE",
  "status_code": 404,
  "timestamp": "2026-01-20T10:00:00Z",
  "details": { ... }  // optional
}
```

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Invalid request format |
| 401 | UNAUTHORIZED | Missing/invalid authentication |
| 401 | INVALID_CREDENTIALS | Wrong username/password |
| 401 | TOKEN_EXPIRED | JWT token expired |
| 403 | FORBIDDEN | No permission to access resource |
| 404 | USER_NOT_FOUND | User doesn't exist |
| 404 | SESSION_NOT_FOUND | Session doesn't exist |
| 404 | GARDEN_NOT_FOUND | Garden entry doesn't exist |
| 409 | DUPLICATE_USER | Username/email already taken |
| 422 | VALIDATION_ERROR | Input validation failed |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error |

---

## 🎮 Example API Workflows

### User Registration & First Session

```bash
# 1. Register
POST /auth/register
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "SecurePass123"
}
# Response: access_token, refresh_token

# 2. Create session
POST /sessions
Authorization: Bearer {access_token}
{
  "duration_minutes": 25
}
# Response: session with id=1, completed=false

# 3. Complete session
POST /sessions/1/complete?blink_rate=15.2
Authorization: Bearer {access_token}
# Response: session completed, user now has 250 XP, level 2

# 4. Check stats
GET /stats/me
Authorization: Bearer {access_token}
# Response: total_sessions=1, total_focus_min=25
```

### Garden Management

```bash
# 1. Create garden for session
POST /garden
Authorization: Bearer {access_token}
{
  "session_id": 1,
  "plant_num": 1,
  "plant_type": "ROSE",
  "growth_stage": 1,
  "total_plants": 1
}

# 2. View all gardens
GET /garden?skip=0&limit=10
Authorization: Bearer {access_token}

# 3. Get statistics
GET /garden/stats
Authorization: Bearer {access_token}
# Response: total_plants, plants_by_type, etc.
```

### Leaderboard & Rankings

```bash
# 1. View top 10 by XP
GET /leaderboard?metric=xp&limit=10
# No auth required

# 2. Check your rank
GET /leaderboard/me?metric=xp
Authorization: Bearer {access_token}
# Response: {"rank": 42, "metric": "xp"}

# 3. View top by streak
GET /leaderboard?metric=streak&limit=5
```

---

## 🧪 Testing with Swagger UI

1. Start the API server: `uvicorn main:app --reload`
2. Navigate to `http://localhost:8000/docs`
3. Click "Authorize" button (top right)
4. Enter Bearer token: `Bearer {your_access_token}`
5. Try endpoints interactively

**Tips**:
- Use `/auth/register` or `/auth/login` first to get token
- Copy `access_token` from response
- Paste in Authorize dialog
- All authenticated endpoints will now work

---

## 🔧 Development Notes

### Adding New Endpoints

```python
from fastapi import APIRouter, Depends
from ..middleware.auth_middleware import get_current_user_id
from ..middleware.rate_limiter import limiter

router = APIRouter(prefix="/feature", tags=["Feature"])

@router.get("")
@limiter.limit("10/minute")
async def get_feature(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    # Implementation
    pass
```

### Response Models

All endpoints use Pydantic models for validation:
- **Request**: Automatic validation from `schemas/`
- **Response**: Declared via `response_model` parameter
- **Errors**: Handled by global exception handlers

### Path vs Query Parameters

```python
# Path parameter
@router.get("/{item_id}")
async def get_item(item_id: int): ...

# Query parameter
@router.get("")
async def list_items(skip: int = 0, limit: int = 10): ...
```

---

## 📚 Related Documentation

- **Services**: See `../services/README.md` for business logic
- **Schemas**: See `../schemas/` for request/response models
- **Middleware**: See `../middleware/` for auth, rate limiting, CORS
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## 🚀 Next Steps

After routes implementation:
1. **Create main.py** - Initialize FastAPI app and register routes
2. **Testing** - Write integration tests for endpoints
3. **Frontend Integration** - Connect React dashboard to API
4. **Deployment** - Configure production server (Uvicorn, Gunicorn)
