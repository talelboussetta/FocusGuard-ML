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
    SessionComplete,
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
    
    completed_count = sum(1 for s in sessions if s.completed)
    incomplete_count = len(sessions) - completed_count
    
    return SessionListResponse(
        sessions=[SessionResponse.model_validate(s) for s in sessions],
        total=total,
        completed_count=completed_count,
        incomplete_count=incomplete_count
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
        has_active=session is not None,
        session=SessionResponse.model_validate(session) if session else None
    )


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Get session by ID",
    description="Get specific session details"
)
async def get_session(
    session_id: str,
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
    session_id: str,
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


@router.patch(
    "/{session_id}/complete",
    response_model=SessionResponse,
    summary="Complete session",
    description="Mark session as completed and update user stats/XP"
)
@limiter.limit("20/minute")
async def complete_session(
    request: Request,
    session_id: str,
    complete_data: SessionComplete,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Complete a focus session.
    
    - **actual_duration**: Actual time spent in minutes
    - **focus_score**: Optional focus quality score (0-100)
    - **blink_rate**: Optional blink rate from AI model
    
    Automatically:
    - Marks session as completed
    - Updates user statistics
    - Awards XP (10 XP per minute of actual duration)
    - Recalculates user level
    - Updates streak
    
    User must own the session.
    """
    session = await session_service.complete_session(
        db, session_id, user_id, 
        complete_data.actual_duration,
        complete_data.focus_score,
        complete_data.blink_rate
    )
    return SessionResponse.model_validate(session)


@router.patch(
    "/{session_id}/abandon",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Abandon session",
    description="Mark session as abandoned (deleted without awarding XP)"
)
@limiter.limit("20/minute")
async def abandon_session(
    request: Request,
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Abandon a focus session.
    
    Marks session as abandoned by deleting it.
    No XP is awarded for abandoned sessions.
    
    User must own the session.
    """
    await session_service.delete_session(db, session_id, user_id)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete session",
    description="Delete a session"
)
@limiter.limit("10/minute")
async def delete_session(
    request: Request,
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete session by ID.
    
    User must own the session.
    Returns 204 No Content on success.
    """
    await session_service.delete_session(db, session_id, user_id)
