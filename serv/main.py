"""
FocusGuard API - Main Application

FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.config import settings
from api.database import init_db, close_db, check_db_connection
from api.routes import (
    auth_router,
    users_router,
    sessions_router,
    garden_router,
    stats_router,
    distraction_router,
    team_router,
    team_message_router
)
from api.middleware.error_handler import register_exception_handlers
from api.middleware.rate_limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    print("🚀 Starting FocusGuard API...")
    
    # Initialize database
    await init_db()
    print("✅ Database connection initialized")
    
    # Check database connection
    is_connected = await check_db_connection()
    if is_connected:
        print("✅ Database connection verified")
    else:
        print("⚠️  Warning: Database connection check failed")
    
    print(f"📊 API running at: http://localhost:8000")
    print(f"📚 Swagger UI: http://localhost:8000/docs")
    print(f"📖 ReDoc: http://localhost:8000/redoc")
    
    yield
    
    # Shutdown
    print("👋 Shutting down FocusGuard API...")
    await close_db()
    print("✅ Database connection closed")


# Create FastAPI application
app = FastAPI(
    title="FocusGuard API",
    description="""
    **FocusGuard** - AI-Powered Focus Management Platform
    
    A comprehensive REST API for managing focus sessions, user gamification, 
    and AI-driven productivity insights.
    
    ## Features
    
    * 🔐 **Authentication**: JWT-based user authentication
    * ⏱️ **Focus Sessions**: Track and manage focus sessions
    * 🌱 **Virtual Garden**: Gamification with plant growth system
    * 📊 **Statistics**: Detailed analytics and insights
    * 🏆 **Leaderboards**: Global rankings by XP, focus time, and streaks
    * 🤖 **AI Integration**: Blink detection and focus analysis (coming soon)
    
    ## Getting Started
    
    1. Register a new account at `/auth/register`
    2. Login to receive access tokens at `/auth/login`
    3. Use the access token in the `Authorization: Bearer {token}` header
    4. Start creating focus sessions!
    
    ## Rate Limits
    
    - Register: 3 requests/minute
    - Login: 5 requests/minute
    - Most endpoints: 60 requests/minute
    """,
    version="1.0.0",
    contact={
        "name": "FocusGuard Team",
        "url": "https://github.com/talelboussetta/FocusGuard-ML",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register exception handlers
register_exception_handlers(app)

# Register routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(sessions_router)
app.include_router(garden_router)
app.include_router(stats_router)
app.include_router(distraction_router)
app.include_router(team_router)
app.include_router(team_message_router)


@app.get(
    "/",
    tags=["Root"],
    summary="API Root",
    description="Welcome endpoint with API information"
)
async def root():
    """
    API root endpoint.
    
    Returns basic information about the API.
    """
    return {
        "message": "Welcome to FocusGuard API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }


@app.get(
    "/health",
    tags=["Health"],
    summary="Health Check",
    description="Check API and database health status"
)
async def health_check():
    """
    Health check endpoint.
    
    Returns the health status of the API and database.
    """
    db_healthy = await check_db_connection()
    
    return {
        "status": "healthy" if db_healthy else "degraded",
        "api": "online",
        "database": "connected" if db_healthy else "disconnected",
        "version": "1.0.0"
    }


@app.get(
    "/info",
    tags=["Info"],
    summary="API Information",
    description="Get detailed API configuration and settings"
)
async def api_info():
    """
    API information endpoint.
    
    Returns configuration details (non-sensitive).
    """
    return {
        "title": "FocusGuard API",
        "version": "1.0.0",
        "environment": "development",
        "cors_origins": settings.allowed_origins,
        "rate_limits": {
            "default": "60/minute",
            "login": "5/minute",
            "register": "3/minute"
        },
        "features": {
            "authentication": "JWT",
            "gamification": "Virtual Garden",
            "analytics": "Statistics & Leaderboards",
            "ai": "Blink Detection (coming soon)"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
