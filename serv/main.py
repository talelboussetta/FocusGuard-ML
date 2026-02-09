"""
FocusGuard API - Main Application

FastAPI application entry point.
"""

# Sentry imports - optional (only if sentry-sdk installed)
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    sentry_sdk = None  # type: ignore
    FastApiIntegration = None  # type: ignore
    SqlalchemyIntegration = None  # type: ignore
    SENTRY_AVAILABLE = False

from fastapi import FastAPI
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
from api.routes.rag import router as rag_router
from api.routes.conversation import router as conversation_router
from api.middleware.error_handler import register_exception_handlers
from api.middleware.rate_limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


# Initialize Sentry for error tracking and performance monitoring
if settings.sentry_dsn:
    if SENTRY_AVAILABLE:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.sentry_environment,
            traces_sample_rate=settings.sentry_traces_sample_rate,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            # Capture errors, performance data, and breadcrumbs
            send_default_pii=False,  # Don't send personally identifiable information
            attach_stacktrace=True,
            max_breadcrumbs=50,
        )
        print(f"[OK] Sentry initialized (environment: {settings.sentry_environment})")
    else:
        print("[WARNING] Sentry DSN configured but sentry-sdk not installed. Install with: pip install sentry-sdk[fastapi]")
else:
    print("[INFO] Sentry disabled (no DSN configured)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    
    CRITICAL: Must complete quickly to allow port binding.
    All slow operations run in background.
    """
    import asyncio
    import os
    
    async def startup_with_timeout():
        """Startup logic with hard timeout to prevent hanging."""
        # Startup
        print("[*] Starting FocusGuard API...")
        port = os.getenv("PORT", settings.port)
        print(f"[INFO] Binding to port: {port}")
        print(f"[INFO] Database URL configured: {settings.database_url[:30]}...")
        
        # Skip table creation in production - tables exist from migrations
        # Only verify connection (fast check)
        if not settings.debug:
            print("[INFO] Production mode - skipping table creation")
            try:
                is_connected = await asyncio.wait_for(check_db_connection(), timeout=3.0)
                if is_connected:
                    print("[OK] Database connection verified")
                else:
                    print("[WARNING] Database connection check failed - will retry on first request")
            except asyncio.TimeoutError:
                print("[WARNING] Database check timed out - will retry on first request")
            except Exception as e:
                print(f"[WARNING] Database check error: {str(e)[:100]} - will retry on first request")
        else:
            # Development mode - create tables if they don't exist
            print("[INFO] Development mode - checking tables...")
            try:
                await asyncio.wait_for(init_db(), timeout=5.0)
                print("[OK] Database tables ready")
            except asyncio.TimeoutError:
                print("[WARNING] Table creation timed out - continuing anyway")
            except Exception as e:
                print(f"[WARNING] Table creation error: {str(e)[:100]}")
        
        # Initialize RAG/AI Tutor in background (don't block)
        print("[INFO] AI Tutor initializing in background...")
        
        async def initialize_rag():
            """Initialize RAG service in background."""
            try:
                from api.services.rag_service import get_rag_service
                rag_service = get_rag_service()
                await asyncio.wait_for(rag_service.initialize(), timeout=30.0)
                print("[OK] AI Tutor ready (RAG system initialized)")
            except asyncio.TimeoutError:
                print("[WARNING] AI Tutor initialization timed out - using fallback mode")
            except Exception as e:
                print(f"[WARNING] AI Tutor initialization failed: {str(e)[:100]}")
                print("[INFO] AI Tutor will use fallback mode")
        
        # Start initialization in background (don't block startup)
        asyncio.create_task(initialize_rag())
    
    # Run startup with absolute 10-second timeout
    # This MUST complete or app won't bind to port
    try:
        await asyncio.wait_for(startup_with_timeout(), timeout=10.0)
        print(f"[✓] API startup complete in <10s")
        print(f"[✓] Swagger UI available at /docs")
        print(f"[✓] Health check available at /health")
    except asyncio.TimeoutError:
        print("[ERROR] Startup exceeded 10s timeout - starting anyway!")
        print("[INFO] Some features may not be available immediately")
    except Exception as e:
        print(f"[ERROR] Startup error: {str(e)[:200]}")
        print("[INFO] Starting anyway - check logs for issues")
    
    yield
    
    # Shutdown
    print("[*] Shutting down FocusGuard API...")
    try:
        await asyncio.wait_for(close_db(), timeout=5.0)
        print("[OK] Database connection closed")
    except:
        print("[WARNING] Database close timed out - exiting anyway")


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
app.include_router(rag_router)
app.include_router(conversation_router)


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
