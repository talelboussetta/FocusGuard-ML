"""
FocusGuard API - Database Connection

SQLAlchemy async database setup for PostgreSQL.
Provides async engine, session management, and FastAPI dependency injection.
"""

from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from .config import settings

# Ensure asyncpg is available (this import forces SQLAlchemy to use it)
try:
    import asyncpg  # noqa: F401
except ImportError:
    raise ImportError(
        "asyncpg is required for async PostgreSQL operations. "
        "Install it with: pip install asyncpg"
    )

# ============================================================================
# Database URL Conversion (Render Compatibility)
# ============================================================================

# Render provides DATABASE_URL as postgresql://, but we need postgresql+asyncpg://
# Auto-convert if needed (don't modify settings, create local variable)
database_url = settings.database_url
if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
    print(f"[INFO] Converted DATABASE_URL to use asyncpg driver")

# ============================================================================
# Database Engine
# ============================================================================

# Create async engine for PostgreSQL
# Note: Set DATABASE_ECHO=True in .env to log SQL queries during development
if settings.debug:
    # Debug mode: No connection pooling (simpler, easier to debug)
    engine = create_async_engine(
        database_url,
        echo=settings.database_echo,
        future=True,
        poolclass=NullPool,
    )
else:
    # Production mode: Connection pooling with limits
    engine = create_async_engine(
        database_url,
        echo=settings.database_echo,
        future=True,
        pool_size=5,  # Max 5 persistent connections
        max_overflow=10,  # Allow 10 extra connections if pool exhausted
        pool_pre_ping=True,  # Check connection health before use
        pool_recycle=3600,  # Recycle connections after 1 hour
    )

# ============================================================================
# Session Factory
# ============================================================================

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit
    autocommit=False,
    autoflush=False,
)

# ============================================================================
# Base Class for ORM Models
# ============================================================================

Base = declarative_base()

# ============================================================================
# Dependency Injection for FastAPI
# ============================================================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.
    
    Usage in routes:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            # Use db session here
            pass
    
    The session is automatically closed after the request.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()  # Commit if no errors
        except Exception:
            await session.rollback()  # Rollback on error
            raise
        finally:
            await session.close()


# ============================================================================
# Database Initialization
# ============================================================================

async def init_db() -> None:
    """
    Initialize database - create all tables.
    
    Note: In production, use Alembic migrations instead.
    This is mainly for development/testing.
    """
    async with engine.begin() as conn:
        # Import all models to ensure they're registered with Base.metadata
        # This guarantees create_all will include every table.
        from . import models  # noqa: F401
        
        # Create all missing tables
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """
    Close database connections.
    Call this on application shutdown.
    """
    await engine.dispose()


# ============================================================================
# Database Health Check
# ============================================================================

async def check_db_connection() -> bool:
    """
    Check if database connection is working.
    
    Returns:
        True if connection successful, False otherwise.
        Never hangs - has 3-second timeout.
    """
    import asyncio
    try:
        async def _check():
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return True
        
        # 3-second timeout to prevent hanging
        return await asyncio.wait_for(_check(), timeout=3.0)
    except asyncio.TimeoutError:
        print(f"[WARNING] Database connection check timed out")
        return False
    except Exception as e:
        print(f"[WARNING] Database connection failed: {str(e)[:100]}")
        return False
