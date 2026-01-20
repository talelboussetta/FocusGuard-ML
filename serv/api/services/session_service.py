"""
FocusGuard API - Session Service

Business logic for focus session management.
"""

from typing import List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc

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
        duration_minutes=session_data.duration_min,
        **session_data.model_dump(exclude_unset=True, exclude={'blink_rate', 'duration_min'})
    )
    
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    return new_session


async def get_session(
    db: AsyncSession,
    session_id: str,
    user_id: Optional[str] = None
) -> Session:
    """
    Get session by ID.
    
    Args:
        db: Database session
        session_id: Session ID (UUID string)
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
    
    # Verify ownership if user_id provided (convert UUIDs to strings for comparison)
    if user_id and str(session.user_id) != str(user_id):
        raise ForbiddenException("You don't have access to this session")
    
    return session


async def update_session(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    update_data: SessionUpdate
) -> Session:
    """
    Update a focus session.
    
    Args:
        db: Database session
        session_id: Session ID (UUID string)
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
    session_id: str,
    user_id: str,
    actual_duration: int,
    focus_score: Optional[float] = None,
    blink_rate: Optional[float] = None
) -> Session:
    """
    Mark a session as completed and update user stats.
    
    Args:
        db: Database session
        session_id: Session ID
        user_id: User ID
        actual_duration: Actual time spent in minutes
        focus_score: Optional focus quality score (0-100)
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
    
    # Update user stats (use actual_duration for XP calculation)
    await _update_user_stats_on_completion(db, user_id, session, actual_duration, focus_score)
    
    await db.commit()
    await db.refresh(session)
    
    return session


async def _update_user_stats_on_completion(
    db: AsyncSession,
    user_id: str,
    session: Session,
    actual_duration: int,
    focus_score: Optional[float] = None
) -> None:
    """
    Update user stats and XP when a session is completed.
    
    Uses actual_duration for XP calculation instead of planned duration.
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
    stats.total_focus_min += actual_duration
    
    # Update streak based on consecutive days
    from datetime import datetime, timedelta
    
    # Get user's most recent completed session (excluding current one)
    result = await db.execute(
        select(Session)
        .where(
            and_(
                Session.user_id == user_id,
                Session.completed == True,
                Session.id != session.id
            )
        )
        .order_by(desc(Session.created_at))
        .limit(1)
    )
    last_session = result.scalar_one_or_none()
    
    # Get today's date (date only, not time)
    today = datetime.utcnow().date()
    session_date = session.created_at.date() if hasattr(session.created_at, 'date') else datetime.fromisoformat(str(session.created_at)).date()
    
    if last_session:
        last_session_date = last_session.created_at.date() if hasattr(last_session.created_at, 'date') else datetime.fromisoformat(str(last_session.created_at)).date()
        days_diff = (session_date - last_session_date).days
        
        if days_diff == 0:
            # Same day - don't increment streak
            pass
        elif days_diff == 1:
            # Consecutive day - increment streak
            stats.current_streak += 1
        else:
            # Broke streak - reset to 1
            stats.current_streak = 1
    else:
        # First session ever - start streak at 1
        stats.current_streak = 1
    
    # Update best streak if current is higher
    if stats.current_streak > stats.best_streak:
        stats.best_streak = stats.current_streak
    
    # Award plants based on session duration (1 plant every 5 minutes)
    plants_earned = actual_duration // 5
    print(f"🌱 Session complete - Duration: {actual_duration} min, Plants earned: {plants_earned}")
    
    if plants_earned > 0:
        from ..models import Garden
        import random
        
        # Get next plant number for user
        result = await db.execute(
            select(func.max(Garden.plant_num)).where(Garden.user_id == user_id)
        )
        max_plant_num = result.scalar() or -1
        
        # Get user's total focus time for rare plant calculation
        result = await db.execute(
            select(UserStats.total_focus_min).where(UserStats.user_id == user_id)
        )
        total_focus_min = result.scalar() or 0
        
        print(f"🌱 User total focus time: {total_focus_min} min, Max plant num: {max_plant_num}")
        
        # Create garden entries for earned plants
        for i in range(plants_earned):
            plant_num = max_plant_num + i + 1
            
            # Plant rarity based on total study time
            # Regular plants (0-12): Always available
            # Uncommon plants (13-15): 10% chance, increases with study time
            # Rare plants (16-17): 5% chance, increases with study time
            # Legendary plant (18): 2% chance, increases with study time
            
            rand = random.random() * 100
            
            # Calculate rarity boost: 0.5% per 100 minutes studied (caps at 20% boost)
            rarity_boost = min(20, (total_focus_min / 100) * 0.5)
            
            if rand < (2 + rarity_boost):  # Legendary
                plant_type = "18"
            elif rand < (7 + rarity_boost):  # Rare
                plant_type = str(random.randint(16, 17))
            elif rand < (17 + rarity_boost):  # Uncommon
                plant_type = str(random.randint(13, 15))
            else:  # Regular
                plant_type = str(random.randint(0, 12))
            
            new_garden = Garden(
                user_id=user_id,
                session_id=session.id,
                plant_num=plant_num,
                plant_type=plant_type,
                growth_stage=0,  # Start at growth stage 0
                total_plants=1   # Each entry represents 1 plant
            )
            db.add(new_garden)
            print(f"🌱 Created plant #{plant_num} - Type: {plant_type}, Rarity boost: {rarity_boost:.2f}%")
    
    print(f"🌱 Committing {plants_earned} plants to database...")
    
    # Update user XP and level (use actual_duration)
    await _award_xp(db, user_id, actual_duration)


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
    
    # Return the most recent incomplete session (or None)
    # Using first() instead of scalar_one_or_none() to handle multiple incomplete sessions gracefully
    return result.scalars().first()


async def delete_session(
    db: AsyncSession,
    session_id: str,
    user_id: str
) -> None:
    """
    Delete a session.
    
    Args:
        db: Database session
        session_id: Session ID (UUID string)
        user_id: User ID (for authorization)
        
    Raises:
        SessionNotFoundException: If session not found
        ForbiddenException: If user doesn't own the session
    """
    session = await get_session(db, session_id, user_id)
    
    await db.delete(session)
    await db.commit()
