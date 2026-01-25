# FocusGuard AI Coding Agent Instructions

## Project Overview
FocusGuard is a full-stack productivity platform combining Pomodoro focus sessions with AI-powered webcam analysis, gamification, and team features.

### Tech Stack
- **Backend**: FastAPI (Python 3.11+) with async PostgreSQL (asyncpg)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: PostgreSQL 15+ with sequential SQL migrations
- **ML Runtime**: MediaPipe (Face + Pose Landmarker) - 100% browser-based, no backend ML
- **Auth**: JWT (HS256) with refresh token rotation
- **State**: React Context (AuthContext, SessionContext, NotificationContext)

## Architecture Patterns

### Backend: Service-Route-Model-Schema Layering
FastAPI endpoints follow strict separation:
```
routes/ → services/ → models/ → database
```
- **Routes** (`api/routes/*.py`): HTTP handlers only - no business logic. Use `Depends(get_current_user_id)` for auth.
- **Services** (`api/services/*_service.py`): All business logic, XP calculations, transaction handling.
- **Models** (`api/models/*.py`): SQLAlchemy ORM with UUID primary keys.
- **Schemas** (`api/schemas/*.py`): Pydantic for request/response validation.

**Never put business logic in routes.** Move calculations to services.

### Database Patterns
- All IDs are UUIDs (`UUID(as_uuid=True)`)
- Migrations are sequential SQL files: `001_extensions.sql`, `002_users.sql`, etc. in `serv/database/init/`
- Foreign keys cascade delete automatically
- Use async session: `AsyncSession = Depends(get_db)`

### Frontend Patterns
- **State**: React Context for auth/sessions (`contexts/AuthContext.tsx`, `SessionContext.tsx`)
- **API**: Centralized in `services/api.ts` with typed responses
- **Auth**: JWT in localStorage, header: `Authorization: Bearer <token>`
- **Styling**: Tailwind classes only - no custom CSS files except `index.css`

## Critical Workflows

### Running the Stack
```bash
# Backend (in serv/)
python main.py  # FastAPI on :8000

# Frontend (in client/focusguard-dashboard/)
npm run dev  # Vite on :5173

# Database
docker-compose up -d  # PostgreSQL on :5432
```

### Adding a New Endpoint
1. Create Pydantic schema in `api/schemas/`
2. Add business logic in `api/services/`
3. Create route in `api/routes/` - import service, use `Depends(get_current_user_id)`
4. Register router in `main.py` (already includes all routers)

### Database Migration
1. Create `serv/database/init/0XX_description.sql`
2. Run: `docker-compose down && docker-compose up -d` (migrations auto-run on init)
3. Or manual: `python run_migration.py` (for single-column changes)

### Testing Endpoints
- Swagger UI: http://localhost:8000/docs (auto-generated, live testing)
- See `serv/TESTS.md` for curl examples with real tokens

## Code Conventions

### Backend
- **Async everywhere**: All DB operations use `async`/`await`
- **Error handling**: Raise custom exceptions from `api/utils/exceptions.py` (e.g., `UserNotFoundException`, `InvalidCredentialsException`)
- **Rate limiting**: Apply `@limiter.limit("N/timeunit")` decorator and add `Request` param
- **Documentation**: Docstrings on all service functions with Args/Returns/Raises

Example route pattern:
```python
@router.post("/", response_model=TeamResponse, status_code=201)
@limiter.limit("5/hour")
async def create_team(
    request: Request,
    team_data: TeamCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    team = await team_service.create_team(db, user_id, team_data)
    return TeamResponse.model_validate(team)
```

### Frontend
- **Types**: Match backend schema exactly (`User`, `Session`, `Garden`)
- **API calls**: Always use `services/api.ts` functions, handle errors with `getErrorMessage()`
- **Auth context**: Access user with `const { user } = useAuth()`
- **Routing**: React Router v6 - use `useNavigate()` for programmatic navigation

## Project-Specific Quirks

1. **XP System**: Session completion awards XP (25min = 10 XP). XP → Level logic in `session_service.py`
2. **Garden**: 1-to-1 with sessions via `session_id` foreign key. Create garden entry when session completes.
3. **Teams**: Users can only be in ONE team at a time. Enforced in `team_service.join_team()`.
4. **Blink Rate**: Stored on `sessions.blink_rate` (nullable FLOAT). Calculated by frontend ML models.
5. **Authentication**: Access token expires in 15 min. Refresh token in 7 days (from `api/config.py`).
6. **Leaderboards**: Calculated in `stats_service.py` - no caching yet, pulls from DB each request.

## Key Files

- `serv/main.py`: FastAPI app entry, CORS config, lifespan events
- `serv/api/database.py`: Async engine setup, `get_db()` dependency
- `serv/api/middleware/auth_middleware.py`: JWT validation, `get_current_user_id()`
- `client/focusguard-dashboard/src/services/api.ts`: All backend calls, error handling
- `docker-compose.yml`: PostgreSQL with auto-init from `serv/database/init/`

## Common Tasks

**Add new model field:**
1. Update SQLAlchemy model in `api/models/`
2. Update Pydantic schema in `api/schemas/`
3. Create migration SQL in `database/init/0XX_add_field.sql`
4. Update frontend type in `services/api.ts`

**Add rate limit:**
Add decorator: `@limiter.limit("10/minute")` and `request: Request` param

**Fix CORS:**
Allowed origins in `main.py`: `http://localhost:5173` (frontend dev server)

## Documentation
- API docs auto-generated at `/docs` (Swagger)
- Service READMEs: `serv/api/services/README.md`, `serv/database/README.md`
- Testing guide: `serv/TESTS.md` with curl examples

---

## 🔐 Environment & Configuration (Production-Critical)

### Step 1: Environment Setup
Each layer has its own `.env` file - **NEVER commit these to Git!**

**Root `.env`** (Docker Compose variables):
```bash
cp .env.example .env
# Edit: Set strong POSTGRES_PASSWORD
```

**Backend `.env`** (`serv/.env`):
```bash
cp serv/.env.example serv/.env
# Critical changes:
# 1. JWT_SECRET_KEY - Generate with: openssl rand -hex 32
# 2. DATABASE_URL - Match Docker postgres credentials
# 3. DEBUG=False in production
# 4. ALLOWED_ORIGINS - Add your production domain
```

**Frontend `.env`** (`client/focusguard-dashboard/.env`):
```bash
cp client/focusguard-dashboard/.env.example client/focusguard-dashboard/.env
# Set VITE_API_URL to backend URL (prod: https://api.yourdomain.com)
```

### Step 2: Secret Generation
```bash
# Generate JWT secret (backend .env)
openssl rand -hex 32

# Verify no default secrets in production:
grep -r "your-super-secret-key-change-in-production" serv/  # Should return nothing
```

### Step 3: Security Validation Checklist
- [ ] `JWT_SECRET_KEY` is unique (not default value)
- [ ] `POSTGRES_PASSWORD` is strong (16+ chars, mixed case, symbols)
- [ ] `DEBUG=False` in production
- [ ] `ALLOWED_ORIGINS` includes ONLY your domains (no wildcards)
- [ ] Database credentials not in code (only in .env)
- [ ] `.env` files in `.gitignore`

### Configuration Architecture
Settings loaded via **Pydantic Settings** (`serv/api/config.py`):
- Validates types at runtime
- Reads from `.env` file automatically
- Provides defaults for development
- `Settings.model_config` specifies env file location

**Important**: Backend uses `DATABASE_URL=postgresql+asyncpg://...` (requires `+asyncpg` driver)

---

## 🤖 ML Pipeline (Browser-Based Architecture)

### Critical Design Decision
**All ML inference runs in the browser** - zero backend ML processing. This ensures:
- User privacy (video never leaves device)
- Reduced backend load
- Real-time performance (WebGPU acceleration)

### Implementation (`client/focusguard-dashboard/src/pages/CameraPage.tsx`)

**Model Loading** (on component mount):
```typescript
// Step 1: Load MediaPipe WASM runtime from CDN
const vision = await FilesetResolver.forVisionTasks(
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
);

// Step 2: Initialize Pose Landmarker (body tracking)
const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  modelAssetPath: 'https://storage.googleapis.com/.../pose_landmarker_lite.task',
  runningMode: 'VIDEO',  // Optimize for video streams
  minPoseDetectionConfidence: 0.3
});

// Step 3: Initialize Face Landmarker (blink detection)
const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
  modelAssetPath: 'https://storage.googleapis.com/.../face_landmarker.task',
  runningMode: 'VIDEO',
  outputFaceBlendshapes: true  // Enable blink detection via eye blendshapes
});
```

**Real-time Detection Loop**:
```typescript
// requestAnimationFrame loop processes video frames
const detectFrame = () => {
  const poseResults = poseLandmarker.detectForVideo(videoElement, timestamp);
  const faceResults = faceLandmarker.detectForVideo(videoElement, timestamp);
  
  // Calculate blink rate from eye aspect ratio (EAR)
  // Tracked in blinkTimestampsRef - sliding 60s window
  
  animationFrameRef.current = requestAnimationFrame(detectFrame);
};
```

**Blink Rate Calculation**:
- Eye blendshapes: `eyeBlinkLeft`, `eyeBlinkRight` from `faceResults.faceBlendshapes`
- Blink threshold: `> 0.3` (calibrated from MediaPipe docs)
- Stored in state, sent to backend on session completion: `PATCH /sessions/{id}` with `{ blink_rate: 12.5 }`

### Backend Storage
- **Field**: `sessions.blink_rate` (FLOAT, nullable)
- **Source**: Frontend calculates, backend stores
- **Usage**: Future analytics, focus quality scoring

**When adding ML features:**
1. Check browser WebGPU support for acceleration
2. Load models on component mount (cache in refs, not state)
3. Clean up with `model.close()` in useEffect cleanup
4. Handle CORS for model CDN URLs (already allowed in Vite config)

---

## 🧪 Testing Strategy

### Manual Testing (Current Approach)
**Swagger UI** (http://localhost:8000/docs):
- Auto-generated, always in sync with code
- Test endpoints with real auth tokens
- See `serv/TESTS.md` for 1300+ lines of curl examples

**Test Token Generation**:
```bash
cd serv
python api/utils/test_tokens.py  # Outputs valid JWT for testing
```

### Frontend Testing
- **Live reload**: Vite HMR at `:5173`
- **Browser DevTools**: Network tab for API calls, Console for errors
- **React DevTools**: Inspect Context state (AuthContext, SessionContext)

### Database Testing
```bash
# Reset database (destroys all data!)
docker-compose down -v
docker-compose up -d
# Migrations auto-run from serv/database/init/*.sql
```

### Production Health Checks
**Endpoints built-in:**
- `GET /health` - Returns `{"status": "healthy", "database": "connected"}`
- `GET /info` - Non-sensitive config (rate limits, CORS origins)

**Future Enhancements** (when scaling):
- Add `pytest` for backend unit tests (`serv/tests/`)
- Add `vitest` for frontend (`client/focusguard-dashboard/src/**/*.test.tsx`)
- GitHub Actions for CI/CD (`.github/workflows/test.yml`)

---

## 🚀 Deployment & Production Patterns

### Step 1: Production Environment Variables

**Backend** (`serv/.env` for production):
```bash
DEBUG=False
DATABASE_URL=postgresql+asyncpg://user:pass@prod-db-host:5432/focusguard_db
JWT_SECRET_KEY=<generated-with-openssl-rand-hex-32>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
BCRYPT_ROUNDS=12  # Higher = more secure but slower (12 is production-grade)
RATE_LIMIT_ENABLED=True
```

**Frontend** (build-time .env):
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_ENABLE_CAMERA=true
```

### Step 2: Database Migration in Production

**Critical Rule**: Migrations are **append-only**. Never modify existing `.sql` files.

**Adding migration:**
```bash
# 1. Create new numbered file
vim serv/database/init/013_add_new_feature.sql

# 2. Write idempotent SQL (safe to re-run)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);

# 3. Apply manually in production
psql $DATABASE_URL -f serv/database/init/013_add_new_feature.sql

# OR for Docker:
docker exec -i focusguard-postgres psql -U user -d focusguard_db < serv/database/init/013_add_new_feature.sql
```

**For local dev**, migrations auto-run via Docker volume mount:
```yaml
volumes:
  - ./serv/database/init:/docker-entrypoint-initdb.d  # Runs *.sql on first init
```

### Step 3: Docker Production Build

**Backend Dockerfile** (create `serv/Dockerfile`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**Frontend Dockerfile** (create `client/focusguard-dashboard/Dockerfile`):
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Production docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    build: ./serv
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:${POSTGRES_PASSWORD}@db:5432/focusguard_db
    depends_on:
      - db
    restart: unless-stopped
  
  frontend:
    build: ./client/focusguard-dashboard
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
  
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
```

### Step 4: Performance & Scaling Considerations

**Database Connection Pooling**:
- SQLAlchemy default pool size: 5
- For production, configure in `database.py`:
```python
engine = create_async_engine(
    settings.database_url,
    pool_size=20,           # Max concurrent connections
    max_overflow=10,        # Overflow if pool exhausted
    pool_pre_ping=True,     # Verify connections before use
    pool_recycle=3600       # Recycle connections every hour
)
```

**Rate Limiting in Production**:
- Currently uses in-memory limiter (resets on restart)
- **Production upgrade**: Use Redis backend for distributed rate limiting
```python
# Add to requirements.txt: redis
from slowapi.middleware import SlowAPIMiddleware
limiter = Limiter(key_func=get_remote_address, storage_uri="redis://localhost:6379")
```

**Caching Strategy** (not yet implemented):
- Leaderboards (`stats_service.py`) query DB on every request
- **Add Redis caching**: Cache for 5 minutes, invalidate on session completion
- User stats: Cache per-user for 30 seconds

**Logging** (production enhancement):
```python
# Replace print() statements with structured logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# In services:
logger.info(f"Session completed: {session_id}", extra={"user_id": user_id, "xp_awarded": 10})
```

### Step 5: Security Hardening

**Headers** (add to `main.py`):
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com", "*.yourdomain.com"])

# Add security headers
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

**HTTPS Enforcement**:
- Use Nginx/Traefik as reverse proxy
- Obtain SSL cert from Let's Encrypt
- Redirect HTTP → HTTPS at proxy level

**Database Backups**:
```bash
# Automated daily backup (add to cron)
pg_dump $DATABASE_URL | gzip > backups/focusguard_$(date +%Y%m%d).sql.gz
# Retain 30 days, upload to S3/GCS
```

### Step 6: Monitoring & Observability

**Health endpoint already exists**:
```bash
curl https://api.yourdomain.com/health
# {"status": "healthy", "database": "connected"}
```

**Add metrics** (future enhancement):
- **Prometheus**: `/metrics` endpoint for request counts, latencies
- **Sentry**: Error tracking with `sentry-sdk[fastapi]`
- **DataDog/New Relic**: APM for performance monitoring

**Database query monitoring**:
```python
# Enable SQL logging in production (carefully!)
DATABASE_ECHO=True  # Only for debugging, disable in normal operation
```

---

## 📊 Architecture Decision Records (ADRs)

### ADR-001: Why Browser-Based ML?
**Decision**: Run all ML inference in browser (MediaPipe) instead of backend (TensorFlow/PyTorch)

**Rationale**:
- **Privacy**: Video never transmitted to server
- **Scalability**: Offload compute to client devices
- **Latency**: Real-time processing without network roundtrips
- **Cost**: No GPU servers required

**Trade-offs**:
- Requires modern browser (WebAssembly, WebGPU)
- Limited to MediaPipe model catalog
- Can't train/fine-tune models on user data

### ADR-002: UUID Primary Keys
**Decision**: Use UUID v4 for all entity IDs instead of auto-increment integers

**Rationale**:
- Prevents ID enumeration attacks (`/users/1`, `/users/2`...)
- Enables distributed ID generation
- Safe for client-side generation (sessions created offline)
- Merging data from multiple databases easier

**Trade-offs**:
- Slightly larger storage (16 bytes vs 4-8 bytes)
- Less human-readable in logs
- No natural ordering (use `created_at` instead)

### ADR-003: Single Team Membership
**Decision**: Users can only join ONE team at a time (enforced in `team_service.join_team()`)

**Rationale**:
- Simplifies leaderboard logic (no team-hopping)
- Clear XP attribution
- Reduces database complexity (no many-to-many)

**Implementation**: 
```python
# Before joining, check if user already in team
existing = await db.execute(select(TeamMember).where(TeamMember.user_id == user_id))
if existing.scalar_one_or_none():
    raise UserAlreadyInTeamException()
```

### ADR-004: JWT Short Expiry
**Decision**: Access tokens expire in 15 minutes (not days/weeks)

**Rationale**:
- Limits damage if token stolen
- Refresh token pattern allows long sessions
- Encourages proper token refresh flow

**Frontend implementation**: `AuthContext.tsx` handles silent refresh before expiry

---
