"""
FocusGuard API - Statistics & Leaderboard Routes

Endpoints for user statistics and leaderboards.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from ..database import get_db
from ..schemas.stats import (
    UserStatsResponse,
    DailyStatsResponse,
    TrendsResponse,
    LeaderboardResponse,
    UserRankResponse
)
from ..schemas.team import TeamLeaderboardResponse
from ..services import stats_service
from ..middleware.auth_middleware import get_current_user_id


router = APIRouter(tags=["Statistics"])


@router.get(
    "/stats/me",
    response_model=UserStatsResponse,
    summary="Get user statistics",
    description="Get current user's statistics"
)
async def get_user_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user statistics.
    
    Returns:
    - Total focus minutes
    - Total sessions completed
    - Current streak
    - Best streak
    - Last updated timestamp
    """
    stats = await stats_service.get_user_stats(db, user_id)
    return UserStatsResponse.model_validate(stats)


@router.get(
    "/stats/daily",
    response_model=DailyStatsResponse,
    summary="Get daily statistics",
    description="Get daily statistics for the past N days"
)
async def get_daily_stats(
    days: int = Query(7, ge=1, le=90, description="Number of days to include"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get daily statistics for user.
    
    - **days**: Number of days to include (default 7, max 90)
    
    Returns list of daily stats with sessions count and total minutes.
    Missing dates are filled with zeros.
    """
    daily_stats = await stats_service.get_daily_stats(db, user_id, days)
    
    # Calculate totals and averages
    total_focus = sum(day.get('focus_min', 0) for day in daily_stats)
    total_sess = sum(day.get('sessions_completed', 0) for day in daily_stats)
    avg_per_day = total_focus / days if days > 0 else 0.0
    
    return DailyStatsResponse(
        daily_stats=daily_stats,
        total_days=days,
        total_focus_min=total_focus,
        total_sessions=total_sess,
        average_focus_per_day=avg_per_day
    )


@router.get(
    "/stats/trends",
    response_model=TrendsResponse,
    summary="Get user trends",
    description="Get user trends and insights (last 30 days)"
)
async def get_user_trends(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user trends and insights.
    
    Returns:
    - Average session length
    - Total sessions in last 30 days
    - Total minutes in last 30 days
    - Most productive hour of day
    """
    trends = await stats_service.get_user_trends(db, user_id)
    return TrendsResponse(**trends)


@router.get(
    "/stats/leaderboard",
    response_model=LeaderboardResponse,
    summary="Get leaderboard",
    description="Get global leaderboard rankings"
)
async def get_leaderboard(
    metric: str = Query(
        "xp",
        description="Ranking metric: xp, focus_time, sessions, or streak",
        pattern="^(xp|focus_time|sessions|streak)$"
    ),
    limit: int = Query(10, ge=1, le=100, description="Number of top users to return"),
    team_id: Optional[str] = Query(None, description="Optional team ID to filter by team members"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get leaderboard rankings.
    
    - **metric**: Ranking metric
      - `xp`: Ranked by total XP points
      - `focus_time`: Ranked by total focus minutes
      - `sessions`: Ranked by total sessions completed
      - `streak`: Ranked by current streak
    - **limit**: Number of top users (default 10, max 100)
    - **team_id**: Optional UUID to show only members of a specific team
    
    Returns list of top users with rank, username, level, and stats.
    """
    # Parse team_id if provided
    team_uuid = None
    if team_id:
        try:
            team_uuid = UUID(team_id)
        except ValueError:
            pass
    
    leaderboard = await stats_service.get_leaderboard(db, metric, limit, team_uuid)
    
    return LeaderboardResponse(
        metric=metric,
        leaderboard=leaderboard,
        total_users=len(leaderboard),
        current_user_rank=None
    )


@router.get(
    "/stats/leaderboard/me",
    response_model=UserRankResponse,
    summary="Get user rank",
    description="Get current user's rank on leaderboard"
)
async def get_user_rank(
    metric: str = Query(
        "xp",
        description="Ranking metric: xp, focus_time, sessions, or streak",
        pattern="^(xp|focus_time|sessions|streak)$"
    ),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's rank on the leaderboard.
    
    - **metric**: Ranking metric (xp, focus_time, or streak)
    
    Returns user's global rank for the selected metric.
    """
    rank_data = await stats_service.get_user_rank(db, user_id, metric)
    return UserRankResponse(**rank_data)


@router.get(
    "/stats/leaderboard/teams",
    response_model=TeamLeaderboardResponse,
    summary="Get team leaderboard",
    description="Get team rankings"
)
async def get_team_leaderboard(
    metric: str = Query(
        "xp",
        description="Ranking metric: xp, focus_time, sessions, or streak",
        pattern="^(xp|focus_time|sessions|streak)$"
    ),
    limit: int = Query(10, ge=1, le=100, description="Number of top teams to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get team leaderboard rankings.
    
    - **metric**: Ranking metric
      - `xp`: Ranked by total team XP
      - `focus_time`: Ranked by total focus minutes of all members
      - `sessions`: Ranked by total sessions completed by team
      - `streak`: Ranked by average streak of team members
    - **limit**: Number of top teams (default 10, max 100)
    
    Returns list of top teams with rank, name, members, and stats.
    """
    leaderboard = await stats_service.get_team_leaderboard(db, metric, limit)
    
    return TeamLeaderboardResponse(
        metric=metric,
        leaderboard=leaderboard,
        total_teams=len(leaderboard)
    )
