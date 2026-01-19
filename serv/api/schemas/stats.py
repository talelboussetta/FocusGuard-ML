"""
FocusGuard API - Statistics Schemas

Pydantic models for user statistics and analytics.
"""

from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, Field


# ============================================================================
# User Stats Response
# ============================================================================

class UserStatsResponse(BaseModel):
    """User statistics response."""
    
    user_id: str = Field(..., description="User ID (UUID)")
    total_focus_min: int = Field(..., description="Total focus minutes")
    total_sessions: int = Field(..., description="Total completed sessions")
    current_streak: int = Field(..., description="Current consecutive days streak")
    best_streak: int = Field(..., description="Best streak ever achieved")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [{
                "user_id": "a1111111-1111-1111-1111-111111111111",
                "total_focus_min": 1250,
                "total_sessions": 15,
                "current_streak": 5,
                "best_streak": 8,
                "updated_at": "2026-01-19T14:30:00Z"
            }]
        }
    }


class UserStatsInDB(BaseModel):
    """User stats schema as stored in database."""
    
    user_id: str
    total_focus_min: int
    total_sessions: int
    current_streak: int
    best_streak: int
    updated_at: datetime
    
    model_config = {
        "from_attributes": True
    }


# ============================================================================
# Daily Stats
# ============================================================================

class DailyStats(BaseModel):
    """Statistics for a single day."""
    
    date: date = Field(..., description="Date")
    focus_min: int = Field(..., description="Focus minutes for this day")
    sessions_completed: int = Field(..., description="Sessions completed this day")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "date": "2026-01-19",
                "focus_min": 120,
                "sessions_completed": 3
            }]
        }
    }


class DailyStatsResponse(BaseModel):
    """Response for daily statistics."""
    
    daily_stats: list[DailyStats] = Field(..., description="List of daily stats")
    total_days: int = Field(..., description="Number of days included")
    total_focus_min: int = Field(..., description="Total focus minutes")
    total_sessions: int = Field(..., description="Total sessions")
    average_focus_per_day: float = Field(..., description="Average focus minutes per day")


# ============================================================================
# Trend Stats
# ============================================================================

class TrendStats(BaseModel):
    """Trend statistics (weekly, monthly)."""
    
    period: str = Field(..., description="Period (week/month)")
    focus_min: int = Field(..., description="Focus minutes in period")
    sessions: int = Field(..., description="Sessions in period")
    growth_percentage: Optional[float] = Field(None, description="Growth vs previous period")


class TrendsResponse(BaseModel):
    """Response for trends analysis."""
    
    this_week: TrendStats = Field(..., description="Current week stats")
    last_week: TrendStats = Field(..., description="Previous week stats")
    this_month: TrendStats = Field(..., description="Current month stats")
    last_month: TrendStats = Field(..., description="Previous month stats")


# ============================================================================
# Platform Summary Stats
# ============================================================================

class PlatformSummary(BaseModel):
    """Platform-wide summary statistics."""
    
    total_users: int = Field(..., description="Total registered users")
    total_sessions: int = Field(..., description="Total sessions across all users")
    total_focus_hours: float = Field(..., description="Total focus hours")
    active_users_today: int = Field(..., description="Users active today")
    total_plants_grown: int = Field(..., description="Total plants in all gardens")


# ============================================================================
# Leaderboard Schemas
# ============================================================================

class LeaderboardEntry(BaseModel):
    """Single entry in a leaderboard."""
    
    rank: int = Field(..., description="Rank position")
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    value: int = Field(..., description="Metric value (XP, focus time, etc.)")
    lvl: Optional[int] = Field(None, description="User level (for XP leaderboard)")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "rank": 1,
                "user_id": "user-uuid",
                "username": "eve_learn",
                "value": 5000,
                "lvl": 10
            }]
        }
    }


class LeaderboardResponse(BaseModel):
    """Leaderboard response."""
    
    leaderboard: list[LeaderboardEntry] = Field(..., description="Leaderboard entries")
    current_user_rank: Optional[int] = Field(None, description="Current user's rank")
    total_users: int = Field(..., description="Total users in leaderboard")
    metric: str = Field(..., description="Metric type (xp/focus_time/streak/sessions)")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "leaderboard": [
                    {"rank": 1, "user_id": "uuid1", "username": "eve_learn", "value": 5000, "lvl": 10},
                    {"rank": 2, "user_id": "uuid2", "username": "charlie_dev", "value": 3200, "lvl": 8}
                ],
                "current_user_rank": 5,
                "total_users": 100,
                "metric": "xp"
            }]
        }
    }
