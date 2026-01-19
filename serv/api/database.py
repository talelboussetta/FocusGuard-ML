"""
FocusGuard API - Database Connection

SQLAlchemy async database setup for PostgreSQL.
Provides async engine, session management, and FastAPI dependency injection.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from .config import settings

# ============================================================================
# Database Engine
# ============================================================================

# Create async engine for PostgreSQL
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,  # Log SQL queries when True
    future=True,  # Use SQLAlchemy 2.0 style
    poolclass=NullPool if settings.debug else None,  # Disable pooling in debug mode
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
        # Import all models here to ensure they're registered
        # from .models import user, session, garden, user_stats
        
        # Create all tables
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
        True if connection successful, False otherwise
    """
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False
