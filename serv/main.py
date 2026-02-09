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
    
    CRITICAL: Returns IMMEDIATELY to allow port binding.
    All startup work happens in background tasks.
    """
    import asyncio
    import os
    
    # Define all background startup tasks
    async def background_startup():
        """All startup work - runs in background after port is open."""
        try:
            port = os.getenv("PORT", settings.port)
            print(f"[BACKGROUND] Starting FocusGuard API background tasks...")
            print(f"[INFO] Server running on port: {port}")
            print(f"[INFO] Database URL: {settings.database_url[:40]}...")
            
            # Database check (non-critical)
            if not settings.debug:
                print("[INFO] Production mode - checking database connection...")
                try:
                    is_connected = await asyncio.wait_for(check_db_connection(), timeout=3.0)
                    if is_connected:
                        print("[OK] Database connection verified")
                    else:
                        print("[WARNING] Database not connected - will retry on first request")
                except Exception as e:
                    print(f"[WARNING] Database check failed: {str(e)[:100]}")
            
            # RAG initialization (completely optional)
            qdrant_url = os.getenv("QDRANT_URL", "")
            if qdrant_url and qdrant_url != "http://localhost:6333":
                print("[INFO] AI Tutor initializing...")
                try:
                    from api.services.rag_service import get_rag_service
                    rag_service = get_rag_service()
                    await asyncio.wait_for(rag_service.initialize(), timeout=30.0)
                    print("[OK] AI Tutor ready")
                except ImportError as e:
                    print(f"[INFO] AI Tutor disabled - missing dependency: {str(e).split(':')[-1].strip()}")
                except Exception as e:
                    print(f"[WARNING] AI Tutor failed: {str(e)[:100]}")
            else:
                print("[INFO] AI Tutor disabled - QDRANT_URL not configured")
            
            print("[OK] Background startup complete")
        except Exception as e:
            print(f"[ERROR] Background startup error: {str(e)[:200]}")
            import traceback
            traceback.print_exc()  # Print full traceback for debugging
    
    # Fire background tasks and return IMMEDIATELY
    print("[*] FocusGuard API starting...")
    print("[*] Port binding immediately...")
    
    # TEMPORARY: Disable background tasks entirely to isolate crash
    # If app stays up without this, we know background task was the issue
    print("[INFO] Background tasks DISABLED for debugging")
    print("[INFO] Database checks and RAG initialization skipped")
    
    # Uncomment to re-enable background tasks after confirming app is stable:
    # async def safe_background_wrapper():
    #     """Safety wrapper - exceptions here CANNOT crash the app."""
    #     try:
    #         await background_startup()
    #     except Exception as e:
    #         print(f"[CRITICAL] Background task exception (non-fatal): {str(e)[:200]}")
    #         import traceback
    #         traceback.print_exc()
    # asyncio.create_task(safe_background_wrapper())
    
    # IMMEDIATE RETURN - port binds NOW
    yield
    
    # Shutdown
    print("[*] Shutting down...")
    try:
        await asyncio.wait_for(close_db(), timeout=2.0)
        print("[OK] Shutdown complete")
    except:
        print("[WARNING] Shutdown timed out")


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
    NEVER crashes - always returns 200 OK.
    """
    try:
        db_healthy = await check_db_connection()
    except Exception as e:
        print(f"[WARNING] Health check DB error: {str(e)[:100]}")
        db_healthy = False
    
    return {
        "status": "healthy",  # Always healthy for Render health checks
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
    import os
    
    # Use PORT environment variable if set (for Render compatibility)
    # Otherwise default to 8000 for local development
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
