"""
FocusGuard API - Statistics & Leaderboard Routes

Endpoints for user statistics and leaderboards.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas.stats import (
    UserStatsResponse,
    DailyStatsResponse,
    TrendsResponse,
    LeaderboardResponse,
    UserRankResponse
)
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
    
    return DailyStatsResponse(
        days=days,
        data=daily_stats
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
    "/leaderboard",
    response_model=LeaderboardResponse,
    summary="Get leaderboard",
    description="Get global leaderboard rankings"
)
async def get_leaderboard(
    metric: str = Query(
        "xp",
        description="Ranking metric: xp, focus_time, or streak",
        regex="^(xp|focus_time|streak)$"
    ),
    limit: int = Query(10, ge=1, le=100, description="Number of top users to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get leaderboard rankings.
    
    - **metric**: Ranking metric
      - `xp`: Ranked by total XP points
      - `focus_time`: Ranked by total focus minutes
      - `streak`: Ranked by current streak
    - **limit**: Number of top users (default 10, max 100)
    
    Returns list of top users with rank, username, level, and stats.
    """
    leaderboard = await stats_service.get_leaderboard(db, metric, limit)
    
    return LeaderboardResponse(
        metric=metric,
        limit=limit,
        entries=leaderboard
    )


@router.get(
    "/leaderboard/me",
    response_model=UserRankResponse,
    summary="Get user rank",
    description="Get current user's rank on leaderboard"
)
async def get_user_rank(
    metric: str = Query(
        "xp",
        description="Ranking metric: xp, focus_time, or streak",
        regex="^(xp|focus_time|streak)$"
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
