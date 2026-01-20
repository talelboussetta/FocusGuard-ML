# FocusGuard API - Comprehensive Testing Guide

This document provides detailed test cases for all API endpoints, middleware, and services.

---

## Prerequisites

- ✅ Backend running on `http://localhost:8000`
- ✅ Frontend running on `http://localhost:5173` (Vite dev server)
- ✅ PostgreSQL database running
- ✅ All dependencies installed

---

## Testing Tools

You can test using:
1. **Swagger UI**: http://localhost:8000/docs (Interactive, auto-generated)
2. **Postman/Insomnia**: Import endpoints manually
3. **cURL**: Command-line testing
4. **Frontend Dashboard**: Real-world integration testing

---

# 1. CORS Middleware Tests

## Test 1.1: CORS Preflight Request
**Purpose**: Verify CORS headers are set correctly

**Request**:
```bash
curl -X OPTIONS http://localhost:8000/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

**Expected Response**:
- Status: `200 OK`
- Headers should include:
  - `Access-Control-Allow-Origin: http://localhost:5173`
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Methods: *`
  - `Access-Control-Allow-Headers: *`

**Database Changes**: None

---

## Test 1.2: CORS Actual Request
**Purpose**: Verify CORS works with actual requests

**Request**:
```bash
curl -X GET http://localhost:8000/ \
  -H "Origin: http://localhost:5173"
```

**Expected Response**:
- Status: `200 OK`
- Headers include: `Access-Control-Allow-Origin: http://localhost:5173`
- Body: Welcome message JSON

**Database Changes**: None

---

# 2. Rate Limiting Middleware Tests

## Test 2.1: Normal Rate Limit
**Purpose**: Verify rate limiting is active

**Request**: Make 61 requests in 1 minute to any endpoint
```bash
for i in {1..61}; do curl http://localhost:8000/; done
```

**Expected Response**:
- First 60 requests: `200 OK`
- 61st request: `429 Too Many Requests`
- Body: `{"error": "Rate limit exceeded: 60 per 1 minute"}`

**Database Changes**: None

---

## Test 2.2: Login Rate Limit (Stricter)
**Purpose**: Verify stricter rate limit on auth endpoints

**Request**: Make 6 login attempts in 1 minute
```bash
for i in {1..6}; do 
  curl -X POST http://localhost:8000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'; 
done
```

**Expected Response**:
- First 5 requests: `401 Unauthorized` (wrong credentials)
- 6th request: `429 Too Many Requests`

**Database Changes**: None (failed login attempts)

---

## Test 2.3: Register Rate Limit
**Purpose**: Verify registration rate limit

**Request**: Make 4 registration attempts in 1 minute

**Expected Response**:
- First 3 requests: Various (success or validation errors)
- 4th request: `429 Too Many Requests`

**Database Changes**: Depends on valid requests

---

# 3. Authentication Service Tests

## Test 3.1: User Registration (Success)
**Purpose**: Create a new user account

**Request**:
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser123@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }'
```

**Expected Response**:
- Status: `201 Created`
- Body:
```json
{
  "user": {
    "user_id": "<uuid>",
    "username": "testuser123",
    "email": "testuser123@example.com",
    "full_name": "Test User",
    "xp": 0,
    "lvl": 1,
    "is_active": true,
    "created_at": "<timestamp>"
  },
  "access_token": "<jwt_token>",
  "refresh_token": "<jwt_token>",
  "token_type": "bearer"
}
```

**Database Changes**:
- **users table**: New row with username "testuser123"
- **user_stats table**: New row linked to user (via foreign key)
  - total_focus_min = 0
  - total_sessions = 0
  - current_streak = 0
- **garden table**: New row with default plants
  - total_plants = 0

**Verification Query**:
```sql
SELECT u.username, u.email, u.xp, u.lvl, 
       us.total_focus_min, g.total_plants
FROM users u
LEFT JOIN user_stats us ON u.user_id = us.user_id
LEFT JOIN garden g ON u.user_id = g.user_id
WHERE u.username = 'testuser123';
```

---

## Test 3.2: User Registration (Duplicate Email)
**Purpose**: Test email uniqueness constraint

**Request**: Use same email as Test 3.1

**Expected Response**:
- Status: `400 Bad Request`
- Body:
```json
{
  "detail": "User with this email already exists"
}
```

**Database Changes**: None

---

## Test 3.3: User Registration (Duplicate Username)
**Purpose**: Test username uniqueness constraint

**Request**: Use same username as Test 3.1

**Expected Response**:
- Status: `400 Bad Request`
- Body:
```json
{
  "detail": "User with this username already exists"
}
```

**Database Changes**: None

---

## Test 3.4: User Registration (Weak Password)
**Purpose**: Test password validation

**Request**:
```json
{
  "username": "testuser2",
  "email": "test2@example.com",
  "password": "123",
  "full_name": "Test"
}
```

**Expected Response**:
- Status: `422 Unprocessable Entity`
- Body: Pydantic validation error (password too short)

**Database Changes**: None

---

## Test 3.5: User Login (Success)
**Purpose**: Authenticate existing user

**Request**:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser123@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "access_token": "<jwt_token>",
  "refresh_token": "<jwt_token>",
  "token_type": "bearer",
  "user": {
    "user_id": "<uuid>",
    "username": "testuser123",
    "email": "testuser123@example.com",
    "xp": 0,
    "lvl": 1
  }
}
```

**Database Changes**: None (read-only operation)

---

## Test 3.6: User Login (Invalid Password)
**Purpose**: Test authentication failure

**Request**: Use wrong password

**Expected Response**:
- Status: `401 Unauthorized`
- Body:
```json
{
  "detail": "Invalid credentials"
}
```

**Database Changes**: None

---

## Test 3.7: User Login (Non-existent Email)
**Purpose**: Test login with unknown email

**Expected Response**:
- Status: `401 Unauthorized`
- Body: `{"detail": "Invalid credentials"}`

**Database Changes**: None

---

## Test 3.8: Token Refresh
**Purpose**: Get new access token using refresh token

**Request**:
```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token_from_login>"
  }'
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "access_token": "<new_jwt_token>",
  "token_type": "bearer"
}
```

**Database Changes**: None

---

## Test 3.9: Token Refresh (Invalid Token)
**Purpose**: Test with invalid/expired refresh token

**Expected Response**:
- Status: `401 Unauthorized`
- Body: `{"detail": "Invalid or expired refresh token"}`

**Database Changes**: None

---

# 4. Auth Middleware Tests

## Test 4.1: Access Protected Endpoint (Valid Token)
**Purpose**: Test JWT authentication middleware

**Request**:
```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body: User profile data

**Database Changes**: None

---

## Test 4.2: Access Protected Endpoint (No Token)
**Purpose**: Test authentication requirement

**Request**:
```bash
curl -X GET http://localhost:8000/users/me
```

**Expected Response**:
- Status: `401 Unauthorized`
- Body: `{"detail": "Not authenticated"}`

**Database Changes**: None

---

## Test 4.3: Access Protected Endpoint (Invalid Token)
**Purpose**: Test token validation

**Request**:
```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected Response**:
- Status: `401 Unauthorized`
- Body: `{"detail": "Could not validate credentials"}`

**Database Changes**: None

---

## Test 4.4: Access Protected Endpoint (Expired Token)
**Purpose**: Test token expiration (wait 15+ minutes after login)

**Expected Response**:
- Status: `401 Unauthorized`
- Body: `{"detail": "Token has expired"}`

**Database Changes**: None

---

# 5. User Service Tests

## Test 5.1: Get Current User Profile
**Purpose**: Retrieve authenticated user's profile

**Request**:
```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "user_id": "<uuid>",
  "username": "testuser123",
  "email": "testuser123@example.com",
  "full_name": "Test User",
  "xp": 0,
  "lvl": 1,
  "is_active": true,
  "created_at": "<timestamp>",
  "updated_at": "<timestamp>"
}
```

**Database Changes**: None

---

## Test 5.2: Update User Profile
**Purpose**: Modify user information

**Request**:
```bash
curl -X PUT http://localhost:8000/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Test User",
    "bio": "I love focusing!"
  }'
```

**Expected Response**:
- Status: `200 OK`
- Body: Updated user object with new full_name and bio

**Database Changes**:
- **users table**: Update full_name and bio for user
- **users.updated_at**: Set to current timestamp

**Verification Query**:
```sql
SELECT full_name, bio, updated_at 
FROM users 
WHERE username = 'testuser123';
```

---

## Test 5.3: Get User Statistics
**Purpose**: Retrieve user's focus statistics

**Request**:
```bash
curl -X GET http://localhost:8000/users/me/stats \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "user_id": "<uuid>",
  "total_focus_min": 0,
  "total_sessions": 0,
  "current_streak": 0,
  "longest_streak": 0,
  "avg_focus_per_session": 0
}
```

**Database Changes**: None

---

## Test 5.4: Delete User Account
**Purpose**: Test account deletion

**Request**:
```bash
curl -X DELETE http://localhost:8000/users/me \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `204 No Content`

**Database Changes**:
- **users table**: Row deleted (user_id = current user)
- **user_stats table**: Row cascade deleted
- **garden table**: Row cascade deleted
- **sessions table**: All user's sessions cascade deleted

**Verification Query**:
```sql
SELECT * FROM users WHERE username = 'testuser123';
-- Should return 0 rows
```

---

# 6. Session Service Tests

## Test 6.1: Create Focus Session
**Purpose**: Start a new focus session

**Request**:
```bash
curl -X POST http://localhost:8000/sessions \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "planned_duration": 25
  }'
```

**Expected Response**:
- Status: `201 Created`
- Body:
```json
{
  "session_id": "<uuid>",
  "user_id": "<uuid>",
  "planned_duration": 25,
  "actual_duration": 0,
  "status": "active",
  "started_at": "<timestamp>",
  "completed_at": null,
  "xp_earned": 0,
  "focus_score": null
}
```

**Database Changes**:
- **sessions table**: New row
  - status = 'active'
  - planned_duration = 25
  - started_at = current timestamp

**Verification Query**:
```sql
SELECT session_id, status, planned_duration, started_at 
FROM sessions 
WHERE user_id = '<user_id>' 
ORDER BY started_at DESC 
LIMIT 1;
```

---

## Test 6.2: Get Active Sessions
**Purpose**: List all active sessions for user

**Request**:
```bash
curl -X GET http://localhost:8000/sessions?status=active \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body: Array of active sessions

**Database Changes**: None

---

## Test 6.3: Complete Session (Full Duration)
**Purpose**: Mark session as completed after full duration

**Request**:
```bash
curl -X PATCH http://localhost:8000/sessions/<session_id>/complete \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_duration": 25,
    "focus_score": 85
  }'
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "session_id": "<uuid>",
  "status": "completed",
  "actual_duration": 25,
  "xp_earned": 25,
  "focus_score": 85,
  "completed_at": "<timestamp>"
}
```

**Database Changes**:
- **sessions table**: Update session
  - status = 'completed'
  - actual_duration = 25
  - focus_score = 85
  - xp_earned = 25 (base: 25 * 1)
  - completed_at = current timestamp

- **users table**: Update user
  - xp += 25
  - lvl = recalculated (may level up if xp >= threshold)

- **user_stats table**: Update stats
  - total_focus_min += 25
  - total_sessions += 1
  - Update streak if applicable

**Verification Query**:
```sql
-- Check session
SELECT status, actual_duration, xp_earned, focus_score 
FROM sessions 
WHERE session_id = '<session_id>';

-- Check user XP/level
SELECT username, xp, lvl 
FROM users 
WHERE user_id = '<user_id>';

-- Check stats
SELECT total_focus_min, total_sessions, current_streak 
FROM user_stats 
WHERE user_id = '<user_id>';
```

---

## Test 6.4: Complete Session (Bonus XP for High Focus)
**Purpose**: Test XP bonus for focus_score >= 90

**Request**: Complete session with focus_score = 95

**Expected Response**:
- xp_earned = 25 * 1.5 = 37 (or 38 rounded)

**Database Changes**:
- Same as Test 6.3 but with higher XP

---

## Test 6.5: Abandon Session
**Purpose**: Mark session as abandoned before completion

**Request**:
```bash
curl -X PATCH http://localhost:8000/sessions/<session_id>/abandon \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body: Session with status = 'abandoned'

**Database Changes**:
- **sessions table**: Update status to 'abandoned'
- **No XP awarded**
- **No stats update**

**Verification Query**:
```sql
SELECT status, xp_earned FROM sessions WHERE session_id = '<session_id>';
-- status should be 'abandoned', xp_earned should be 0
```

---

## Test 6.6: Get Session History (Pagination)
**Purpose**: Test pagination and filtering

**Request**:
```bash
curl -X GET "http://localhost:8000/sessions?limit=10&offset=0&status=completed" \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body: Array of up to 10 completed sessions

**Database Changes**: None

---

## Test 6.7: Get Session by ID
**Purpose**: Retrieve specific session details

**Request**:
```bash
curl -X GET http://localhost:8000/sessions/<session_id> \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body: Session details

**Database Changes**: None

---

## Test 6.8: Access Other User's Session (Forbidden)
**Purpose**: Test authorization - users can't access other users' sessions

**Request**: Try to get session_id belonging to different user

**Expected Response**:
- Status: `403 Forbidden`
- Body: `{"detail": "Not authorized to access this session"}`

**Database Changes**: None

---

# 7. Garden Service Tests

## Test 7.1: Get User's Garden
**Purpose**: Retrieve garden state

**Request**:
```bash
curl -X GET http://localhost:8000/garden \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "garden_id": "<uuid>",
  "user_id": "<uuid>",
  "total_plants": 0,
  "rare_plants": 0,
  "epic_plants": 0,
  "legendary_plants": 0,
  "last_plant_at": null
}
```

**Database Changes**: None

---

## Test 7.2: Grow Plant (After Completing Session)
**Purpose**: Add plant to garden after session

**Pre-requisite**: Complete a focus session first

**Request**:
```bash
curl -X POST http://localhost:8000/garden/grow \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<completed_session_id>"
  }'
```

**Expected Response**:
- Status: `201 Created`
- Body:
```json
{
  "plant_type": "common",
  "message": "You grew a common plant!",
  "garden": {
    "total_plants": 1,
    "rare_plants": 0,
    "epic_plants": 0,
    "legendary_plants": 0
  }
}
```

**Database Changes**:
- **garden table**: Update garden
  - total_plants += 1
  - Increment specific rarity counter (common/rare/epic/legendary)
  - last_plant_at = current timestamp

**Verification Query**:
```sql
SELECT total_plants, rare_plants, epic_plants, legendary_plants, last_plant_at 
FROM garden 
WHERE user_id = '<user_id>';
```

---

## Test 7.3: Grow Rare Plant (High Focus Score)
**Purpose**: Test rare plant probability with focus_score >= 80

**Pre-requisite**: Complete session with focus_score = 85

**Expected Response**:
- Higher chance of rare/epic/legendary plants
- Body indicates plant_type could be "rare", "epic", or "legendary"

**Database Changes**:
- Garden counters updated based on plant rarity

---

## Test 7.4: Reset Garden
**Purpose**: Clear all plants from garden

**Request**:
```bash
curl -X POST http://localhost:8000/garden/reset \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "message": "Garden reset successfully",
  "garden": {
    "total_plants": 0,
    "rare_plants": 0,
    "epic_plants": 0,
    "legendary_plants": 0
  }
}
```

**Database Changes**:
- **garden table**: Reset all plant counts to 0

**Verification Query**:
```sql
SELECT * FROM garden WHERE user_id = '<user_id>';
-- All plant counts should be 0
```

---

# 8. Statistics Service Tests

## Test 8.1: Get Daily Statistics
**Purpose**: Retrieve focus minutes per day

**Request**:
```bash
curl -X GET "http://localhost:8000/stats/daily?days=7" \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "stats": [
    {"date": "2026-01-20", "focus_min": 50, "sessions_completed": 2},
    {"date": "2026-01-19", "focus_min": 25, "sessions_completed": 1},
    ...
  ],
  "total_days": 7
}
```

**Database Changes**: None

---

## Test 8.2: Get Weekly Trends
**Purpose**: Compare this week vs last week

**Request**:
```bash
curl -X GET http://localhost:8000/stats/trends \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "this_week": {
    "total_focus_min": 150,
    "sessions_completed": 6,
    "avg_focus_score": 82.5
  },
  "last_week": {
    "total_focus_min": 100,
    "sessions_completed": 4,
    "avg_focus_score": 78.0
  },
  "this_month": {...},
  "last_month": {...}
}
```

**Database Changes**: None

---

## Test 8.3: Get XP Leaderboard
**Purpose**: Retrieve global rankings by XP

**Request**:
```bash
curl -X GET "http://localhost:8000/stats/leaderboard?metric=xp&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "leaderboard": [
    {"rank": 1, "user_id": "<uuid>", "username": "top_user", "value": 5000, "lvl": 15},
    {"rank": 2, "user_id": "<uuid>", "username": "user2", "value": 3200, "lvl": 12},
    ...
  ],
  "current_user_rank": 5,
  "total_users": 50,
  "metric": "xp"
}
```

**Database Changes**: None

---

## Test 8.4: Get Focus Time Leaderboard
**Purpose**: Retrieve rankings by total focus minutes

**Request**:
```bash
curl -X GET "http://localhost:8000/stats/leaderboard?metric=focus_time&limit=10"
```

**Expected Response**:
- Similar to Test 8.3 but sorted by total_focus_min

**Database Changes**: None

---

## Test 8.5: Get Streak Leaderboard
**Purpose**: Retrieve rankings by current streak

**Request**:
```bash
curl -X GET "http://localhost:8000/stats/leaderboard?metric=streak&limit=10"
```

**Expected Response**:
- Leaderboard sorted by current_streak

**Database Changes**: None

---

## Test 8.6: Get User's Rank
**Purpose**: Find current user's position in leaderboard

**Request**:
```bash
curl -X GET "http://localhost:8000/stats/leaderboard/me?metric=xp" \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:
- Status: `200 OK`
- Body:
```json
{
  "rank": 5,
  "total_users": 50,
  "metric": "xp",
  "value": 2500
}
```

**Database Changes**: None

---

# 9. Integration Tests (Frontend + Backend)

## Test 9.1: Full User Journey
**Purpose**: End-to-end test of typical user workflow

**Steps**:
1. Open frontend at http://localhost:5173
2. Register new account
3. Verify redirect to dashboard
4. Start a focus session (25 minutes)
5. Complete the session
6. Check XP increase
7. Grow a plant in garden
8. View statistics page
9. Check leaderboard position
10. Logout
11. Login again
12. Verify session persists

**Expected Behavior**:
- Smooth flow with no errors
- Real-time updates in UI
- Database reflects all changes
- Session tokens work correctly

---

## Test 9.2: Multi-Session Test
**Purpose**: Test completing multiple sessions in sequence

**Steps**:
1. Complete 5 sessions in a row (each 25 minutes)
2. Check total_focus_min = 125
3. Check total_sessions = 5
4. Verify XP increases with each session
5. Check for level up (XP threshold)
6. Verify streak increments

**Expected Database State**:
```sql
SELECT u.username, u.xp, u.lvl, 
       us.total_focus_min, us.total_sessions, us.current_streak
FROM users u
JOIN user_stats us ON u.user_id = us.user_id
WHERE u.user_id = '<test_user_id>';

-- Results:
-- total_focus_min = 125
-- total_sessions = 5
-- xp = 125 (or more with bonuses)
-- lvl >= 2 (depending on XP thresholds)
```

---

## Test 9.3: Streak Calculation Test
**Purpose**: Verify daily streak logic

**Day 1**: Complete 1 session
- Expected: current_streak = 1

**Day 2**: Complete 1 session
- Expected: current_streak = 2

**Day 3**: Skip (no sessions)

**Day 4**: Complete 1 session
- Expected: current_streak = 1 (streak broken)

**Verification**:
- Check user_stats.current_streak
- Check user_stats.longest_streak (should be 2)

---

# 10. Error Handling Tests

## Test 10.1: Invalid JSON Body
**Purpose**: Test request validation

**Request**: Send malformed JSON

**Expected Response**:
- Status: `422 Unprocessable Entity`
- Body: Validation error details

---

## Test 10.2: Missing Required Fields
**Purpose**: Test field validation

**Request**: Register without email

**Expected Response**:
- Status: `422 Unprocessable Entity`
- Body: Field requirement error

---

## Test 10.3: Database Connection Failure
**Purpose**: Test error handling when DB is down

**Steps**:
1. Stop PostgreSQL database
2. Try any endpoint
3. Restart database

**Expected Response**:
- Status: `503 Service Unavailable`
- Body: Database connection error

---

## Test 10.4: Non-existent Resource
**Purpose**: Test 404 handling

**Request**:
```bash
curl -X GET http://localhost:8000/sessions/invalid-uuid-here \
  -H "Authorization: Bearer <token>"
```

**Expected Response**:
- Status: `404 Not Found`
- Body: `{"detail": "Session not found"}`

---

# 11. Performance Tests

## Test 11.1: Concurrent Requests
**Purpose**: Test API under load

**Tool**: Apache Bench or similar
```bash
ab -n 1000 -c 10 http://localhost:8000/
```

**Expected Behavior**:
- All requests complete successfully
- Response times < 200ms for most requests
- No database deadlocks

---

## Test 11.2: Large Dataset Query
**Purpose**: Test pagination with many sessions

**Pre-requisite**: Create 100+ sessions in database

**Request**:
```bash
curl -X GET "http://localhost:8000/sessions?limit=50&offset=0"
```

**Expected Behavior**:
- Query completes in < 500ms
- Correct pagination
- No memory issues

---

# 12. Security Tests

## Test 12.1: SQL Injection Protection
**Purpose**: Verify input sanitization

**Request**: Try SQL injection in username
```json
{
  "username": "admin' OR '1'='1",
  "email": "test@test.com",
  "password": "Password123"
}
```

**Expected Response**:
- Request handled safely
- No database error
- Treated as literal string

---

## Test 12.2: XSS Protection
**Purpose**: Test script injection in text fields

**Request**: Update profile with `<script>alert('xss')</script>`

**Expected Behavior**:
- Stored as plain text
- Escaped in responses
- Not executed in frontend

---

## Test 12.3: Password Hashing
**Purpose**: Verify passwords are never stored in plaintext

**Verification**:
```sql
SELECT password_hash FROM users WHERE username = 'testuser123';
-- Should return bcrypt hash starting with $2b$
-- Should NOT be the original password
```

---

# 13. Quick Verification Checklist

After running all tests, verify:

- [ ] All endpoints respond correctly
- [ ] CORS headers present
- [ ] Rate limiting works
- [ ] JWT authentication enforced
- [ ] User registration creates all related records
- [ ] Session completion updates stats
- [ ] XP calculations correct
- [ ] Level up triggers properly
- [ ] Garden plant growth works
- [ ] Leaderboards rank correctly
- [ ] Streaks calculate properly
- [ ] Pagination works
- [ ] Error messages are clear
- [ ] Database constraints enforced
- [ ] Cascade deletes work
- [ ] No sensitive data in responses
- [ ] Frontend connects successfully
- [ ] Swagger UI accessible

---

# 14. Database State Verification Queries

## Check User Data Consistency
```sql
-- Ensure every user has stats and garden
SELECT 
    u.user_id,
    u.username,
    CASE WHEN us.user_id IS NULL THEN 'MISSING' ELSE 'OK' END as stats_status,
    CASE WHEN g.user_id IS NULL THEN 'MISSING' ELSE 'OK' END as garden_status
FROM users u
LEFT JOIN user_stats us ON u.user_id = us.user_id
LEFT JOIN garden g ON u.user_id = g.user_id;
```

## Verify Session Aggregates
```sql
-- Check if user_stats matches actual session data
SELECT 
    u.username,
    us.total_sessions as stats_sessions,
    COUNT(s.session_id) as actual_sessions,
    us.total_focus_min as stats_focus,
    COALESCE(SUM(s.actual_duration), 0) as actual_focus
FROM users u
JOIN user_stats us ON u.user_id = us.user_id
LEFT JOIN sessions s ON u.user_id = s.user_id AND s.status = 'completed'
GROUP BY u.user_id, u.username, us.total_sessions, us.total_focus_min;
```

## Check XP Consistency
```sql
-- Verify user XP matches sum of session XP
SELECT 
    u.username,
    u.xp as user_xp,
    COALESCE(SUM(s.xp_earned), 0) as session_xp_total
FROM users u
LEFT JOIN sessions s ON u.user_id = s.user_id
GROUP BY u.user_id, u.username, u.xp;
```

---

# 15. Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test user and all related data (cascades automatically)
DELETE FROM users WHERE email LIKE '%@example.com';

-- Or reset specific test user
DELETE FROM users WHERE username = 'testuser123';

-- Verify cleanup
SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com';
-- Should return 0
```

---

## Notes

- **Token Expiration**: Access tokens expire in 15 minutes. Use refresh tokens if needed.
- **Time Zones**: All timestamps are in UTC.
- **Rate Limits**: Wait 1 minute between rate limit tests.
- **Database**: Ensure PostgreSQL is running before testing.
- **CORS**: Frontend must be on allowed origins list.

---

## Swagger UI Testing

The easiest way to test most endpoints:

1. Open http://localhost:8000/docs
2. Click "Authorize" button
3. Login to get access_token
4. Paste token in format: `Bearer <token>`
5. Test any endpoint with interactive UI
6. View request/response in real-time

---

**Happy Testing! 🚀**
