"""
FocusGuard API - Statistics Service

Business logic for user statistics and leaderboards.
"""

from typing import List, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from uuid import UUID

from ..models import User, UserStats, Session
from ..models.team import Team, TeamMember
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
    end_date = datetime.now()
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
                "sessions_completed": 0,
                "focus_min": 0
            }
        
        daily_data[date_key]["sessions_completed"] += 1
        # Use actual_duration_minutes (from timer state) with fallback to planned duration for old sessions
        daily_data[date_key]["focus_min"] += (session.actual_duration_minutes or session.duration_minutes or 0)
    
    # Fill in missing dates with zeros
    current_date = start_date.date()
    while current_date <= end_date.date():
        date_key = current_date.isoformat()
        if date_key not in daily_data:
            daily_data[date_key] = {
                "date": date_key,
                "sessions_completed": 0,
                "focus_min": 0
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
    now = datetime.now()
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)
    fourteen_days_ago = now - timedelta(days=14)

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

    def total_minutes(sessions):
        # Use actual_duration_minutes (from timer state) with fallback to planned duration for old sessions
        return sum((s.actual_duration_minutes or s.duration_minutes or 0) for s in sessions)

    # Buckets
    this_week_sessions = [s for s in recent_sessions if s.created_at >= seven_days_ago]
    last_week_sessions = [s for s in recent_sessions if fourteen_days_ago <= s.created_at < seven_days_ago]
    this_month_sessions = recent_sessions
    last_month_sessions: list[Session] = []  # out of scope of 30d window

    # Helper to build TrendStats-like dict
    def build_trend(period: str, sessions_list: list[Session]):
        focus_min = total_minutes(sessions_list)
        sessions_count = len(sessions_list)
        return {
          "period": period,
          "focus_min": focus_min,
          "sessions": sessions_count,
          "growth_percentage": None
        }

    return {
        "this_week": build_trend("this_week", this_week_sessions),
        "last_week": build_trend("last_week", last_week_sessions),
        "this_month": build_trend("this_month", this_month_sessions),
        "last_month": build_trend("last_month", last_month_sessions),
    }


async def get_leaderboard(
    db: AsyncSession,
    metric: str = "xp",
    limit: int = 10,
    team_id: Optional[UUID] = None
) -> List[dict]:
    """
    Get leaderboard rankings.
    
    Args:
        db: Database session
        metric: Ranking metric ("xp", "focus_time", "sessions", "streak")
        limit: Number of top users to return
        team_id: Optional team ID to filter by team members only
        
    Returns:
        List of leaderboard entries
    """
    # Base query
    base_query = select(User, UserStats).join(UserStats, User.id == UserStats.user_id)
    
    # Add team filter if provided
    if team_id:
        base_query = base_query.join(
            TeamMember,
            and_(
                TeamMember.user_id == User.id,
                TeamMember.team_id == team_id
            )
        )
    
    if metric == "xp":
        # Rank by XP points
        result = await db.execute(
            base_query
            .order_by(desc(User.xp_points))
            .limit(limit)
        )
    elif metric == "focus_time":
        # Rank by total focus minutes
        result = await db.execute(
            base_query
            .order_by(desc(UserStats.total_focus_min))
            .limit(limit)
        )
    elif metric == "sessions":
        # Rank by total sessions completed
        result = await db.execute(
            base_query
            .order_by(desc(UserStats.total_sessions))
            .limit(limit)
        )
    elif metric == "streak":
        # Rank by current streak
        result = await db.execute(
            base_query
            .order_by(desc(UserStats.current_streak))
            .limit(limit)
        )
    else:
        # Default to XP
        result = await db.execute(
            base_query
            .order_by(desc(User.xp_points))
            .limit(limit)
        )
    
    # Format results with appropriate value for the metric
    leaderboard = []
    for rank, (user, stats) in enumerate(result.all(), start=1):
        # Determine value based on metric
        if metric == "xp":
            value = user.xp_points
        elif metric == "focus_time":
            value = stats.total_focus_min
        elif metric == "sessions":
            value = stats.total_sessions
        elif metric == "streak":
            value = stats.current_streak
        else:
            value = user.xp_points
        
        leaderboard.append({
            "rank": rank,
            "user_id": str(user.id),
            "username": user.username,
            "lvl": user.lvl,
            "value": value
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


async def get_team_leaderboard(
    db: AsyncSession,
    metric: str = "xp",
    limit: int = 10
) -> List[dict]:
    """
    Get team leaderboard rankings.
    
    Args:
        db: Database session
        metric: Ranking metric ("xp", "focus_time", "sessions", "streak")
        limit: Number of top teams to return
        
    Returns:
        List of team leaderboard entries
    """
    if metric == "xp":
        # Rank by total XP
        result = await db.execute(
            select(Team)
            .order_by(desc(Team.total_xp))
            .limit(limit)
        )
    elif metric == "sessions":
        # Rank by total sessions completed
        result = await db.execute(
            select(Team)
            .order_by(desc(Team.total_sessions_completed))
            .limit(limit)
        )
    elif metric == "focus_time":
        # For focus time, we need to calculate from team members' stats
        # Get teams with aggregated focus time from their members
        result = await db.execute(
            select(
                Team,
                func.coalesce(func.sum(UserStats.total_focus_min), 0).label('total_focus')
            )
            .outerjoin(TeamMember, Team.team_id == TeamMember.team_id)
            .outerjoin(UserStats, TeamMember.user_id == UserStats.user_id)
            .group_by(Team.team_id)
            .order_by(desc('total_focus'))
            .limit(limit)
        )
        
        # Format results for focus_time
        leaderboard = []
        for rank, (team, total_focus) in enumerate(result.all(), start=1):
            leaderboard.append({
                "rank": rank,
                "team_id": str(team.team_id),
                "team_name": team.team_name,
                "total_members": team.total_members,
                "value": int(total_focus)
            })
        return leaderboard
        
    elif metric == "streak":
        # For streak, use average streak of team members
        result = await db.execute(
            select(
                Team,
                func.coalesce(func.avg(UserStats.current_streak), 0).label('avg_streak')
            )
            .outerjoin(TeamMember, Team.team_id == TeamMember.team_id)
            .outerjoin(UserStats, TeamMember.user_id == UserStats.user_id)
            .group_by(Team.team_id)
            .order_by(desc('avg_streak'))
            .limit(limit)
        )
        
        # Format results for streak
        leaderboard = []
        for rank, (team, avg_streak) in enumerate(result.all(), start=1):
            leaderboard.append({
                "rank": rank,
                "team_id": str(team.team_id),
                "team_name": team.team_name,
                "total_members": team.total_members,
                "value": int(avg_streak)
            })
        return leaderboard
    else:
        # Default to XP
        result = await db.execute(
            select(Team)
            .order_by(desc(Team.total_xp))
            .limit(limit)
        )
    
    # Format results for xp and sessions
    leaderboard = []
    for rank, team in enumerate(result.scalars().all(), start=1):
        if metric == "xp":
            value = team.total_xp
        elif metric == "sessions":
            value = team.total_sessions_completed
        else:
            value = team.total_xp
        
        leaderboard.append({
            "rank": rank,
            "team_id": str(team.team_id),
            "team_name": team.team_name,
            "total_members": team.total_members,
            "value": value
        })
    
    return leaderboard
