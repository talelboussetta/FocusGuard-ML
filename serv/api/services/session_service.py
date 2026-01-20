"""
FocusGuard API - Session Service

Business logic for focus session management.
"""

from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from ..models import Session, User, UserStats
from ..schemas.session import SessionCreate, SessionUpdate
from ..utils import (
    UserNotFoundException,
    SessionNotFoundException,
    ForbiddenException
)


async def create_session(
    db: AsyncSession,
    user_id: str,
    session_data: SessionCreate
) -> Session:
    """
    Create a new focus session.
    
    Args:
        db: Database session
        user_id: User ID
        session_data: Session creation data
        
    Returns:
        Created session object
        
    Raises:
        UserNotFoundException: If user not found
    """
    # Verify user exists
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    if not result.scalar_one_or_none():
        raise UserNotFoundException(user_id=user_id)
    
    # Create session
    new_session = Session(
        user_id=user_id,
        completed=False,
        blink_rate=None,
        **session_data.model_dump(exclude_unset=True)
    )
    
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    return new_session


async def get_session(
    db: AsyncSession,
    session_id: int,
    user_id: Optional[str] = None
) -> Session:
    """
    Get session by ID.
    
    Args:
        db: Database session
        session_id: Session ID
        user_id: Optional user ID to verify ownership
        
    Returns:
        Session object
        
    Raises:
        SessionNotFoundException: If session not found
        ForbiddenException: If user doesn't own the session
    """
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise SessionNotFoundException(session_id=session_id)
    
    # Verify ownership if user_id provided
    if user_id and session.user_id != user_id:
        raise ForbiddenException("You don't have access to this session")
    
    return session


async def update_session(
    db: AsyncSession,
    session_id: int,
    user_id: str,
    update_data: SessionUpdate
) -> Session:
    """
    Update a focus session.
    
    Args:
        db: Database session
        session_id: Session ID
        user_id: User ID (for authorization)
        update_data: Updated session data
        
    Returns:
        Updated session object
        
    Raises:
        SessionNotFoundException: If session not found
        ForbiddenException: If user doesn't own the session
    """
    # Get and verify ownership
    session = await get_session(db, session_id, user_id)
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(session, field, value)
    
    await db.commit()
    await db.refresh(session)
    
    return session


async def complete_session(
    db: AsyncSession,
    session_id: int,
    user_id: str,
    blink_rate: Optional[float] = None
) -> Session:
    """
    Mark a session as completed and update user stats.
    
    Args:
        db: Database session
        session_id: Session ID
        user_id: User ID
        blink_rate: Optional blink rate from AI analysis
        
    Returns:
        Completed session object
    """
    # Get session
    session = await get_session(db, session_id, user_id)
    
    # Mark as completed
    session.completed = True
    if blink_rate is not None:
        session.blink_rate = blink_rate
    
    # Update user stats
    await _update_user_stats_on_completion(db, user_id, session)
    
    await db.commit()
    await db.refresh(session)
    
    return session


async def _update_user_stats_on_completion(
    db: AsyncSession,
    user_id: str,
    session: Session
) -> None:
    """
    Update user stats and XP when a session is completed.
    
    Internal helper function.
    """
    # Get user stats
    result = await db.execute(
        select(UserStats).where(UserStats.user_id == user_id)
    )
    stats = result.scalar_one_or_none()
    
    if not stats:
        # Create stats if doesn't exist (shouldn't happen)
        stats = UserStats(
            user_id=user_id,
            total_focus_min=0,
            total_sessions=0,
            current_streak=0,
            best_streak=0
        )
        db.add(stats)
    
    # Update stats
    stats.total_sessions += 1
    stats.total_focus_min += session.duration_minutes
    
    # Update streak (simplified - just increment)
    # TODO: Proper streak calculation based on consecutive days
    stats.current_streak += 1
    if stats.current_streak > stats.best_streak:
        stats.best_streak = stats.current_streak
    
    # Update user XP and level
    await _award_xp(db, user_id, session.duration_minutes)


async def _award_xp(
    db: AsyncSession,
    user_id: str,
    duration_minutes: int
) -> None:
    """
    Award XP based on session duration and update user level.
    
    XP Formula: 10 XP per minute of focus
    Level Formula: Level = floor(XP / 250) + 1
    """
    xp_earned = duration_minutes * 10
    
    # Get user
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one()
    
    # Update XP
    user.xp_points += xp_earned
    
    # Calculate new level
    new_level = (user.xp_points // 250) + 1
    user.lvl = new_level


async def list_user_sessions(
    db: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    completed_only: bool = False
) -> tuple[List[Session], int]:
    """
    List sessions for a user with pagination.
    
    Args:
        db: Database session
        user_id: User ID
        skip: Pagination offset
        limit: Results per page
        completed_only: Filter for completed sessions only
        
    Returns:
        Tuple of (sessions list, total count)
    """
    # Build query
    query = select(Session).where(Session.user_id == user_id)
    
    if completed_only:
        query = query.where(Session.completed == True)
    
    # Order by most recent
    query = query.order_by(Session.created_at.desc())
    
    # Get total count
    count_query = select(func.count()).select_from(Session).where(Session.user_id == user_id)
    if completed_only:
        count_query = count_query.where(Session.completed == True)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    return list(sessions), total


async def get_active_session(
    db: AsyncSession,
    user_id: str
) -> Optional[Session]:
    """
    Get user's currently active (incomplete) session.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Active session or None
    """
    result = await db.execute(
        select(Session).where(
            and_(
                Session.user_id == user_id,
                Session.completed == False
            )
        ).order_by(Session.created_at.desc())
    )
    
    return result.scalar_one_or_none()


async def delete_session(
    db: AsyncSession,
    session_id: int,
    user_id: str
) -> None:
    """
    Delete a session.
    
    Args:
        db: Database session
        session_id: Session ID
        user_id: User ID (for authorization)
        
    Raises:
        SessionNotFoundException: If session not found
        ForbiddenException: If user doesn't own the session
    """
    session = await get_session(db, session_id, user_id)
    
    await db.delete(session)
    await db.commit()
