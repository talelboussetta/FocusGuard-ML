"""
FocusGuard API - Team Routes

Endpoints for team management.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ..database import get_db
from ..schemas.team import (
    TeamCreate,
    TeamJoin,
    TeamResponse,
    TeamDetailResponse,
    UserTeamResponse
)
from ..services import team_service
from ..middleware.auth_middleware import get_current_user_id
from ..middleware.rate_limiter import limiter
from fastapi import Request


router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post(
    "/",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new team",
    description="Create a new team and become its first member"
)
@limiter.limit("5/hour")
async def create_team(
    request: Request,
    team_data: TeamCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new team.
    
    The authenticated user becomes the first member of the team.
    Team names must be unique.
    
    Rate limit: 5 teams per hour per user.
    """
    team = await team_service.create_team(db, user_id, team_data)
    return TeamResponse.model_validate(team)


@router.post(
    "/join",
    response_model=TeamResponse,
    summary="Join a team",
    description="Join an existing team by team ID"
)
@limiter.limit("10/hour")
async def join_team(
    request: Request,
    join_data: TeamJoin,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Join an existing team.
    
    Provide the team UUID to join.
    Users cannot join the same team twice.
    
    Rate limit: 10 join attempts per hour per user.
    """
    team = await team_service.join_team(db, user_id, join_data.team_id)
    return TeamResponse.model_validate(team)


@router.delete(
    "/{team_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Leave a team",
    description="Leave your current team"
)
async def leave_team(
    team_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Leave a team.
    
    If you are the last member, the team will be deleted.
    """
    await team_service.leave_team(db, user_id, team_id)
    return None


@router.get(
    "/{team_id}",
    response_model=TeamDetailResponse,
    summary="Get team details",
    description="Get detailed information about a team including members"
)
async def get_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get team details.
    
    Returns team information including all members.
    Public endpoint - no authentication required.
    """
    team = await team_service.get_team(db, team_id)
    return TeamDetailResponse.model_validate(team)


@router.get(
    "/me/current",
    response_model=UserTeamResponse,
    summary="Get my current team",
    description="Get the team the authenticated user is currently in"
)
async def get_my_team(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's team.
    
    Returns team information if user is in a team.
    Returns 404 if user is not in any team.
    """
    team = await team_service.get_user_team(db, user_id)
    
    if not team:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not currently in any team"
        )
    
    # Get membership info
    from sqlalchemy import select
    from ..models.team import TeamMember
    
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.team_id,
            TeamMember.user_id == user_id
        )
    )
    member = result.scalar_one()
    
    return UserTeamResponse(
        team_id=team.team_id,
        team_name=team.team_name,
        joined_at=member.joined_at,
        total_members=team.total_members,
        total_xp=team.total_xp,
        total_sessions_completed=team.total_sessions_completed
    )


@router.get(
    "/",
    response_model=list[TeamResponse],
    summary="List all teams",
    description="Get a list of all teams, ordered by total XP"
)
async def list_teams(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    List teams.
    
    Returns teams ordered by total XP (highest first).
    Public endpoint - no authentication required.
    """
    teams = await team_service.list_teams(db, limit, offset)
    return [TeamResponse.model_validate(team) for team in teams]
