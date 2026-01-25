"""
FocusGuard API - Team Service

Business logic for team management operations.
"""

from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from sqlalchemy.orm import selectinload
from uuid import UUID

from ..models.team import Team, TeamMember
from ..models.user import User
from ..schemas.team import TeamCreate, TeamJoin
from ..utils.exceptions import (
    NotFoundException,
    DuplicateException,
    BadRequestException
)


class TeamNotFoundException(NotFoundException):
    """Exception raised when team is not found."""
    
    def __init__(self, team_id: str = None, team_name: str = None):
        if team_id:
            message = f"Team with ID {team_id} not found"
        elif team_name:
            message = f"Team with name '{team_name}' not found"
        else:
            message = "Team not found"
        super().__init__(message)


class DuplicateTeamException(DuplicateException):
    """Exception raised when team name already exists."""
    
    def __init__(self, team_name: str):
        super().__init__(f"Team name '{team_name}' is already taken")


class AlreadyInTeamException(BadRequestException):
    """Exception raised when user is already in a team."""
    
    def __init__(self, username: str, team_name: str):
        super().__init__(f"User '{username}' is already a member of team '{team_name}'")


async def create_team(
    db: AsyncSession,
    user_id: str,
    team_data: TeamCreate
) -> Team:
    """
    Create a new team and add creator as first member.
    
    Args:
        db: Database session
        user_id: Creator's user ID
        team_data: Team creation data
        
    Returns:
        Created team object
        
    Raises:
        DuplicateTeamException: If team name already exists
        UserNotFoundException: If user not found
    """
    # Check if team name already exists
    result = await db.execute(
        select(Team).where(Team.team_name == team_data.team_name)
    )
    if result.scalar_one_or_none():
        raise DuplicateTeamException(team_data.team_name)
    
    # Get user info
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        from ..utils.exceptions import UserNotFoundException
        raise UserNotFoundException(user_id=user_id)
    
    # Create team
    team = Team(
        team_name=team_data.team_name,
        total_members=1
    )
    db.add(team)
    await db.flush()  # Get team_id
    
    # Add creator as first member
    member = TeamMember(
        team_id=team.team_id,
        user_id=user.id,
        username=user.username
    )
    db.add(member)
    
    await db.commit()
    await db.refresh(team)
    
    return team


async def join_team(
    db: AsyncSession,
    user_id: str,
    team_id: UUID
) -> Team:
    """
    Join an existing team.
    
    Args:
        db: Database session
        user_id: User ID
        team_id: Team ID to join
        
    Returns:
        Team object
        
    Raises:
        TeamNotFoundException: If team not found
        UserNotFoundException: If user not found
        AlreadyInTeamException: If user already in team
    """
    # Get team
    result = await db.execute(
        select(Team).where(Team.team_id == team_id)
    )
    team = result.scalar_one_or_none()
    if not team:
        raise TeamNotFoundException(team_id=str(team_id))
    
    # Get user
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        from ..utils.exceptions import UserNotFoundException
        raise UserNotFoundException(user_id=user_id)
    
    # Check if user is already a member
    existing = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id
        )
    )
    if existing.scalar_one_or_none():
        raise AlreadyInTeamException(user.username, team.team_name)
    
    # Add user to team
    member = TeamMember(
        team_id=team_id,
        user_id=user.id,
        username=user.username
    )
    db.add(member)
    
    # Update team member count
    await db.execute(
        update(Team)
        .where(Team.team_id == team_id)
        .values(total_members=Team.total_members + 1)
    )
    
    await db.commit()
    await db.refresh(team)
    
    return team


async def leave_team(
    db: AsyncSession,
    user_id: str,
    team_id: UUID
) -> None:
    """
    Leave a team.
    
    Args:
        db: Database session
        user_id: User ID
        team_id: Team ID to leave
        
    Raises:
        TeamNotFoundException: If team not found
        BadRequestException: If user is not a member
    """
    # Check if user is a member
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise BadRequestException("You are not a member of this team")
    
    # Remove member
    await db.execute(
        delete(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id
        )
    )
    
    # Update team member count
    await db.execute(
        update(Team)
        .where(Team.team_id == team_id)
        .values(total_members=Team.total_members - 1)
    )
    
    # If team is empty, delete it
    team_result = await db.execute(
        select(Team).where(Team.team_id == team_id)
    )
    team = team_result.scalar_one_or_none()
    if team and team.total_members <= 1:  # Will be 0 after decrement
        await db.execute(delete(Team).where(Team.team_id == team_id))
    
    await db.commit()


async def get_team(
    db: AsyncSession,
    team_id: UUID
) -> Team:
    """
    Get team by ID.
    
    Args:
        db: Database session
        team_id: Team ID
        
    Returns:
        Team object
        
    Raises:
        TeamNotFoundException: If team not found
    """
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members))
        .where(Team.team_id == team_id)
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise TeamNotFoundException(team_id=str(team_id))
    
    return team


async def get_user_team(
    db: AsyncSession,
    user_id: str
) -> Optional[Team]:
    """
    Get user's current team.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Team object or None if user is not in a team
    """
    result = await db.execute(
        select(Team)
        .join(TeamMember, Team.team_id == TeamMember.team_id)
        .where(TeamMember.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_team_members(
    db: AsyncSession,
    team_id: UUID
) -> List[TeamMember]:
    """
    Get all members of a team.
    
    Args:
        db: Database session
        team_id: Team ID
        
    Returns:
        List of team members
        
    Raises:
        TeamNotFoundException: If team not found
    """
    # Verify team exists
    team = await get_team(db, team_id)
    
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.team_id == team_id)
        .order_by(TeamMember.joined_at)
    )
    return list(result.scalars().all())


async def list_teams(
    db: AsyncSession,
    limit: int = 20,
    offset: int = 0
) -> List[Team]:
    """
    List all teams.
    
    Args:
        db: Database session
        limit: Maximum number of teams to return
        offset: Number of teams to skip
        
    Returns:
        List of teams
    """
    result = await db.execute(
        select(Team)
        .order_by(Team.total_xp.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def update_team_stats(
    db: AsyncSession,
    team_id: UUID,
    xp_delta: int = 0,
    sessions_delta: int = 0
) -> None:
    """
    Update team statistics (called when members complete sessions).
    
    Args:
        db: Database session
        team_id: Team ID
        xp_delta: XP points to add
        sessions_delta: Sessions count to add
    """
    await db.execute(
        update(Team)
        .where(Team.team_id == team_id)
        .values(
            total_xp=Team.total_xp + xp_delta,
            total_sessions_completed=Team.total_sessions_completed + sessions_delta
        )
    )
    await db.commit()


# =============================
# Membership Utility
# =============================
async def is_team_member(db: AsyncSession, team_id: UUID, user_id: str) -> bool:
    """
    Returns True if the user is a member of the team, else False.
    """
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id
        )
    )
    return result.scalar_one_or_none() is not None
