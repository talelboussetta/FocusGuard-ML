# FocusGuard API Server

Backend REST API for the FocusGuard ML application - an AI-powered focus management platform with gamification features.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   cd serv
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Start PostgreSQL** (if using Docker)
   ```bash
   cd ..
   docker-compose up -d
   ```

6. **Run the API**
   ```bash
   python main.py
   ```

   Or with uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Access API Documentation**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📁 Project Structure

```
serv/
├── main.py                      # FastAPI application entry point
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
├── .env                         # Your environment variables (git-ignored)
│
├── api/                         # Main API package
│   ├── config.py                # Configuration management
│   ├── database.py              # Database connection & session
│   │
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── user.py              # User model
│   │   ├── session.py           # Session model
│   │   ├── garden.py            # Garden model
│   │   └── user_stats.py        # UserStats model
│   │
│   ├── schemas/                 # Pydantic validation schemas
│   │   ├── auth.py              # Authentication schemas
│   │   ├── user.py              # User schemas
│   │   ├── session.py           # Session schemas
│   │   ├── garden.py            # Garden schemas
│   │   └── stats.py             # Statistics schemas
│   │
│   ├── services/                # Business logic layer
│   │   ├── auth_service.py      # Authentication logic
│   │   ├── user_service.py      # User management
│   │   ├── session_service.py   # Session management
│   │   ├── garden_service.py    # Garden management
│   │   └── stats_service.py     # Statistics & leaderboards
│   │
│   ├── routes/                  # FastAPI route handlers
│   │   ├── auth.py              # /auth endpoints
│   │   ├── users.py             # /users endpoints
│   │   ├── sessions.py          # /sessions endpoints
│   │   ├── garden.py            # /garden endpoints
│   │   └── stats.py             # /stats & /leaderboard endpoints
│   │
│   ├── middleware/              # Custom middleware
│   │   ├── error_handler.py     # Global exception handling
│   │   ├── cors_middleware.py   # CORS configuration
│   │   ├── auth_middleware.py   # JWT authentication
│   │   └── rate_limiter.py      # Rate limiting
│   │
│   └── utils/                   # Utility modules
│       ├── password.py          # Password hashing
│       ├── jwt_handler.py       # JWT token management
│       ├── validators.py        # Input validators
│       └── exceptions.py        # Custom exceptions
│
├── models/                      # AI/ML models (separate from ORM)
│   └── blink_detector.py        # Blink detection model
│
└── test/                        # Tests (future)
    └── ...
```

## 🗄️ Database

### Schema

The API uses PostgreSQL with 4 main tables:

- **users**: User accounts (username, email, password, level, XP)
- **sessions**: Focus sessions (duration, completion status, blink rate)
- **garden**: Virtual garden entries (plants, growth stages)
- **user_stats**: Aggregated statistics (total focus time, streaks)

### Migrations

Database schema is managed via SQL scripts in `/database/init/`:

```bash
001_extensions.sql      # Enable pgcrypto
002_users.sql          # Users table
003_sessions.sql       # Sessions table
004_garden.sql         # Garden table
005_user_stats.sql     # User stats table
006_indexes.sql        # Performance indexes
007_seed_data.sql      # Sample data (optional)
```

Execute in order or run via Docker initialization.

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register**: `POST /auth/register`
   - Returns access token (15 min) and refresh token (7 days)

2. **Login**: `POST /auth/login`
   - Returns access and refresh tokens

3. **Authenticated Requests**:
   ```http
   Authorization: Bearer <access_token>
   ```

4. **Refresh Token**: `POST /auth/refresh`
   - Use refresh token to get new access token

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update profile
- `PUT /users/me/password` - Change password
- `DELETE /users/me` - Delete account
- `GET /users/{user_id}` - Get public profile

### Sessions
- `POST /sessions` - Create session
- `GET /sessions` - List sessions (paginated)
- `GET /sessions/active` - Get active session
- `GET /sessions/{id}` - Get session details
- `PUT /sessions/{id}` - Update session
- `POST /sessions/{id}/complete` - Complete session (awards XP)
- `DELETE /sessions/{id}` - Delete session

### Garden
- `POST /garden` - Create garden entry
- `GET /garden` - List garden entries
- `GET /garden/stats` - Garden statistics
- `GET /garden/{id}` - Get garden entry
- `PUT /garden/{id}` - Update garden entry
- `DELETE /garden/{id}` - Delete garden entry

### Statistics
- `GET /stats/me` - User statistics
- `GET /stats/daily?days=7` - Daily stats
- `GET /stats/trends` - 30-day trends
- `GET /leaderboard?metric=xp&limit=10` - Leaderboard
- `GET /leaderboard/me?metric=xp` - User rank

## 🎮 Gamification System

### XP & Leveling
- **XP Award**: 10 XP per minute of focus time
- **Level Formula**: `level = floor(total_xp / 250) + 1`

Example:
- 25-minute session → 250 XP
- Level 1: 0-249 XP
- Level 2: 250-499 XP
- Level 10: 2250-2499 XP

### Virtual Garden
- 19 plant types (ROSE, TULIP, SUNFLOWER, etc.)
- Growth stages: 0-5
- One garden entry per session
- Track total plants grown

### Leaderboards
- **XP**: Total experience points
- **Focus Time**: Total minutes focused
- **Streak**: Consecutive sessions/days

## ⚡ Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /auth/register | 3/minute |
| POST /auth/login | 5/minute |
| PUT /users/me/password | 5/minute |
| DELETE /users/me | 3/hour |
| Most endpoints | 60/minute |

## 🧪 Testing

### Interactive Testing (Swagger UI)

1. Navigate to http://localhost:8000/docs
2. Click "Authorize" button
3. Enter: `Bearer <your_access_token>`
4. Test endpoints interactively

### Example curl Requests

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123"
  }'

# Create Session (with token)
curl -X POST http://localhost:8000/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_minutes": 25
  }'

# Get Stats
curl http://localhost:8000/stats/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🛠️ Development

### Running in Development Mode

```bash
# With auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using the built-in runner
python main.py
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
DATABASE_URL=postgresql+asyncpg://talel_admin:bou6199425@localhost:5432/focusguard_db
JWT_SECRET_KEY=your-super-secret-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Adding New Features

1. **Create ORM Model** in `api/models/`
2. **Create Pydantic Schemas** in `api/schemas/`
3. **Implement Business Logic** in `api/services/`
4. **Add API Endpoints** in `api/routes/`
5. **Register Router** in `main.py`

## 📦 Dependencies

### Core
- **FastAPI**: Modern web framework
- **Uvicorn**: ASGI server
- **SQLAlchemy 2.0**: Async ORM
- **asyncpg**: PostgreSQL async driver
- **Pydantic**: Data validation

### Security
- **python-jose**: JWT handling
- **passlib[bcrypt]**: Password hashing
- **slowapi**: Rate limiting

### Database
- **psycopg2-binary**: PostgreSQL adapter
- **alembic**: Database migrations (optional)

## 🚀 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET_KEY` to secure random value
- [ ] Set `DATABASE_URL` to production database
- [ ] Configure production CORS origins
- [ ] Use environment variables (not .env file)
- [ ] Run behind reverse proxy (Nginx)
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Monitor rate limits

### Running with Gunicorn

```bash
pip install gunicorn

gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Support

For issues and questions, please open a GitHub issue.
