"""
FocusGuard API - Team Schemas

Pydantic models for team operations.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


# ============================================================================
# Team Create/Update Schemas
# ============================================================================

class TeamCreate(BaseModel):
    """Schema for creating a new team."""
    
    team_name: str = Field(..., min_length=3, max_length=100, description="Team name")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "team_name": "Study Warriors"
            }]
        }
    }


class TeamJoin(BaseModel):
    """Schema for joining a team."""
    
    team_id: UUID = Field(..., description="Team UUID to join")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "team_id": "123e4567-e89b-12d3-a456-426614174000"
            }]
        }
    }


# ============================================================================
# Team Response Schemas
# ============================================================================

class TeamMemberResponse(BaseModel):
    """Schema for team member information."""
    
    user_id: UUID
    username: str
    joined_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class TeamResponse(BaseModel):
    """Schema for team information."""
    
    team_id: UUID
    team_name: str
    created_at: datetime
    updated_at: datetime
    total_members: int
    total_xp: int
    total_sessions_completed: int
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [{
                "team_id": "123e4567-e89b-12d3-a456-426614174000",
                "team_name": "Study Warriors",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "total_members": 5,
                "total_xp": 1500,
                "total_sessions_completed": 42
            }]
        }
    }


class TeamDetailResponse(TeamResponse):
    """Schema for detailed team information including members."""
    
    members: List[TeamMemberResponse] = []
    
    model_config = {
        "from_attributes": True
    }


class UserTeamResponse(BaseModel):
    """Schema for user's team information."""
    
    team_id: UUID
    team_name: str
    joined_at: datetime
    total_members: int
    total_xp: int
    total_sessions_completed: int
    
    model_config = {
        "from_attributes": True
    }


class TeamLeaderboardEntry(BaseModel):
    """Schema for team leaderboard entry."""
    
    rank: int
    team_id: UUID
    team_name: str
    total_members: int
    value: int = Field(..., description="Metric value (XP, sessions, etc.)")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "rank": 1,
                "team_id": "123e4567-e89b-12d3-a456-426614174000",
                "team_name": "Study Warriors",
                "total_members": 5,
                "value": 5000
            }]
        }
    }


class TeamLeaderboardResponse(BaseModel):
    """Schema for team leaderboard response."""
    
    metric: str
    leaderboard: List[TeamLeaderboardEntry]
    total_teams: int
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "metric": "xp",
                "leaderboard": [
                    {
                        "rank": 1,
                        "team_id": "123e4567-e89b-12d3-a456-426614174000",
                        "team_name": "Study Warriors",
                        "total_members": 5,
                        "value": 5000
                    }
                ],
                "total_teams": 10
            }]
        }
    }
