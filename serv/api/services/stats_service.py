"""
FocusGuard API - Statistics Service

Business logic for user statistics and leaderboards.
"""

from typing import List
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from ..models import User, UserStats, Session
from ..utils import UserNotFoundException


async def get_user_stats(
    db: AsyncSession,
    user_id: str
) -> UserStats:
    """
    Get user statistics.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        UserStats object
        
    Raises:
        UserNotFoundException: If user or stats not found
    """
    result = await db.execute(
        select(UserStats).where(UserStats.user_id == user_id)
    )
    stats = result.scalar_one_or_none()
    
    if not stats:
        raise UserNotFoundException(user_id=user_id)
    
    return stats


async def get_daily_stats(
    db: AsyncSession,
    user_id: str,
    days: int = 7
) -> List[dict]:
    """
    Get daily statistics for the past N days.
    
    Args:
        db: Database session
        user_id: User ID
        days: Number of days to include (default 7)
        
    Returns:
        List of daily statistics dictionaries
    """
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get sessions in date range
    result = await db.execute(
        select(Session)
        .where(
            and_(
                Session.user_id == user_id,
                Session.completed == True,
                Session.created_at >= start_date
            )
        )
        .order_by(Session.created_at)
    )
    sessions = result.scalars().all()
    
    # Group by date
    daily_data = {}
    for session in sessions:
        date_key = session.created_at.date().isoformat()
        
        if date_key not in daily_data:
            daily_data[date_key] = {
                "date": date_key,
                "sessions": 0,
                "total_minutes": 0
            }
        
        daily_data[date_key]["sessions"] += 1
        daily_data[date_key]["total_minutes"] += session.duration_minutes
    
    # Fill in missing dates with zeros
    current_date = start_date.date()
    while current_date <= end_date.date():
        date_key = current_date.isoformat()
        if date_key not in daily_data:
            daily_data[date_key] = {
                "date": date_key,
                "sessions": 0,
                "total_minutes": 0
            }
        current_date += timedelta(days=1)
    
    # Sort by date
    return sorted(daily_data.values(), key=lambda x: x["date"])


async def get_user_trends(
    db: AsyncSession,
    user_id: str
) -> dict:
    """
    Get user trends and insights.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Dictionary with trend data
    """
    # Get stats for last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    result = await db.execute(
        select(Session)
        .where(
            and_(
                Session.user_id == user_id,
                Session.completed == True,
                Session.created_at >= thirty_days_ago
            )
        )
    )
    recent_sessions = result.scalars().all()
    
    if not recent_sessions:
        return {
            "average_session_length": 0,
            "total_sessions_30d": 0,
            "total_minutes_30d": 0,
            "most_productive_hour": None
        }
    
    # Calculate averages
    total_minutes = sum(s.duration_minutes for s in recent_sessions)
    avg_session_length = total_minutes / len(recent_sessions)
    
    # Find most productive hour
    hour_distribution = {}
    for session in recent_sessions:
        hour = session.created_at.hour
        hour_distribution[hour] = hour_distribution.get(hour, 0) + 1
    
    most_productive_hour = max(hour_distribution, key=hour_distribution.get) if hour_distribution else None
    
    return {
        "average_session_length": round(avg_session_length, 1),
        "total_sessions_30d": len(recent_sessions),
        "total_minutes_30d": total_minutes,
        "most_productive_hour": most_productive_hour
    }


async def get_leaderboard(
    db: AsyncSession,
    metric: str = "xp",
    limit: int = 10
) -> List[dict]:
    """
    Get leaderboard rankings.
    
    Args:
        db: Database session
        metric: Ranking metric ("xp", "focus_time", "streak")
        limit: Number of top users to return
        
    Returns:
        List of leaderboard entries
    """
    if metric == "xp":
        # Rank by XP points
        result = await db.execute(
            select(User, UserStats)
            .join(UserStats, User.id == UserStats.user_id)
            .order_by(desc(User.xp_points))
            .limit(limit)
        )
    elif metric == "focus_time":
        # Rank by total focus minutes
        result = await db.execute(
            select(User, UserStats)
            .join(UserStats, User.id == UserStats.user_id)
            .order_by(desc(UserStats.total_focus_min))
            .limit(limit)
        )
    elif metric == "streak":
        # Rank by current streak
        result = await db.execute(
            select(User, UserStats)
            .join(UserStats, User.id == UserStats.user_id)
            .order_by(desc(UserStats.current_streak))
            .limit(limit)
        )
    else:
        # Default to XP
        result = await db.execute(
            select(User, UserStats)
            .join(UserStats, User.id == UserStats.user_id)
            .order_by(desc(User.xp_points))
            .limit(limit)
        )
    
    # Format results
    leaderboard = []
    for rank, (user, stats) in enumerate(result.all(), start=1):
        leaderboard.append({
            "rank": rank,
            "user_id": user.id,
            "username": user.username,
            "lvl": user.lvl,
            "xp_points": user.xp_points,
            "total_focus_min": stats.total_focus_min,
            "current_streak": stats.current_streak
        })
    
    return leaderboard


async def get_user_rank(
    db: AsyncSession,
    user_id: str,
    metric: str = "xp"
) -> dict:
    """
    Get user's rank on the leaderboard.
    
    Args:
        db: Database session
        user_id: User ID
        metric: Ranking metric
        
    Returns:
        Dictionary with rank information
    """
    # Get user
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise UserNotFoundException(user_id=user_id)
    
    # Count users with better stats
    if metric == "xp":
        count_result = await db.execute(
            select(func.count()).select_from(User)
            .where(User.xp_points > user.xp_points)
        )
    elif metric == "focus_time":
        stats_result = await db.execute(
            select(UserStats).where(UserStats.user_id == user_id)
        )
        user_stats = stats_result.scalar_one()
        
        count_result = await db.execute(
            select(func.count()).select_from(UserStats)
            .where(UserStats.total_focus_min > user_stats.total_focus_min)
        )
    elif metric == "streak":
        stats_result = await db.execute(
            select(UserStats).where(UserStats.user_id == user_id)
        )
        user_stats = stats_result.scalar_one()
        
        count_result = await db.execute(
            select(func.count()).select_from(UserStats)
            .where(UserStats.current_streak > user_stats.current_streak)
        )
    else:
        count_result = await db.execute(
            select(func.count()).select_from(User)
            .where(User.xp_points > user.xp_points)
        )
    
    rank = count_result.scalar() + 1
    
    return {
        "rank": rank,
        "metric": metric
    }
