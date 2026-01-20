"""
FocusGuard API - Session Routes

Endpoints for focus session management.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas.session import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    SessionListResponse,
    ActiveSessionResponse
)
from ..services import session_service
from ..middleware.auth_middleware import get_current_user_id
from ..middleware.rate_limiter import limiter
from fastapi import Request


router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post(
    "",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new session",
    description="Start a new focus session"
)
@limiter.limit("30/minute")
async def create_session(
    request: Request,
    session_data: SessionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new focus session.
    
    - **duration_minutes**: Planned session duration
    
    Returns created session with completed=False.
    """
    session = await session_service.create_session(db, user_id, session_data)
    return SessionResponse.model_validate(session)


@router.get(
    "",
    response_model=SessionListResponse,
    summary="List user sessions",
    description="Get paginated list of user's focus sessions"
)
async def list_sessions(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    completed_only: bool = Query(False, description="Filter for completed sessions only"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    List user's focus sessions with pagination.
    
    - **skip**: Pagination offset (default 0)
    - **limit**: Results per page (default 20, max 100)
    - **completed_only**: Show only completed sessions
    
    Returns list of sessions ordered by most recent.
    """
    sessions, total = await session_service.list_user_sessions(
        db, user_id, skip, limit, completed_only
    )
    
    return SessionListResponse(
        sessions=[SessionResponse.model_validate(s) for s in sessions],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/active",
    response_model=ActiveSessionResponse,
    summary="Get active session",
    description="Get user's currently active (incomplete) session"
)
async def get_active_session(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's active session.
    
    Returns active session or null if no session in progress.
    """
    session = await session_service.get_active_session(db, user_id)
    
    return ActiveSessionResponse(
        session=SessionResponse.model_validate(session) if session else None
    )


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Get session by ID",
    description="Get specific session details"
)
async def get_session(
    session_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get session by ID.
    
    User must own the session.
    """
    session = await session_service.get_session(db, session_id, user_id)
    return SessionResponse.model_validate(session)


@router.put(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Update session",
    description="Update session details"
)
@limiter.limit("20/minute")
async def update_session(
    request: Request,
    session_id: int,
    update_data: SessionUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Update session fields.
    
    - **duration_minutes**: Updated duration (optional)
    - **completed**: Completion status (optional)
    - **blink_rate**: Blink rate from AI analysis (optional)
    
    User must own the session.
    """
    session = await session_service.update_session(db, session_id, user_id, update_data)
    return SessionResponse.model_validate(session)


@router.post(
    "/{session_id}/complete",
    response_model=SessionResponse,
    summary="Complete session",
    description="Mark session as completed and update user stats/XP"
)
@limiter.limit("20/minute")
async def complete_session(
    request: Request,
    session_id: int,
    blink_rate: Optional[float] = Query(None, description="Blink rate from AI analysis"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Complete a focus session.
    
    - **blink_rate**: Optional blink rate from AI model
    
    Automatically:
    - Marks session as completed
    - Updates user statistics
    - Awards XP (10 XP per minute)
    - Recalculates user level
    - Updates streak
    
    User must own the session.
    """
    session = await session_service.complete_session(db, session_id, user_id, blink_rate)
    return SessionResponse.model_validate(session)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete session",
    description="Delete a session"
)
@limiter.limit("10/minute")
async def delete_session(
    request: Request,
    session_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete session by ID.
    
    User must own the session.
    Returns 204 No Content on success.
    """
    await session_service.delete_session(db, session_id, user_id)
