from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from ..database import get_db
from ..schemas.team_message import (
    TeamMessageCreate,
    TeamMessageResponse,
    TeamMessagesListResponse
)
from ..services import team_message_service, team_service
from ..utils.exceptions import (
    MessageNotFoundException,
    DuplicateMessageException,
    MessagePermissionException,
    MessageRateLimitException
)
from ..middleware.auth_middleware import get_current_user_id
router = APIRouter(prefix="/teams/{team_id}/messages", tags=["Team Messages"])
@router.post(
    "/",
    response_model=TeamMessageResponse,
    summary="Create a team message",
    description="Create a new message in the specified team"
)
async def create_team_message(
    team_id: UUID,
    message_data: TeamMessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new message in the specified team.
    
    Args:
        team_id: ID of the team
        message_data: Message content and type
        user_id: ID of the authenticated user (sender)
        db: Database session"""
    # Membership check
    if not await team_service.is_team_member(db, team_id, user_id):
        raise HTTPException(status_code=403, detail="Not a member of this team")
    try:
        message = await team_message_service.create_team_message(
            db=db,
            team_id=team_id,
            sender_id=UUID(user_id),
            message_data=message_data
        )
        return TeamMessageResponse.model_validate(message)
    except MessageRateLimitException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except DuplicateMessageException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
@router.get(
    "/",
    response_model=TeamMessagesListResponse,
    summary="Get team messages",
    description="Retrieve messages for the specified team"
)
async def get_team_messages(
    team_id: UUID,
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve messages for the specified team.
    
    Args:
        team_id: ID of the team
        limit: Maximum number of messages to retrieve
        offset: Number of messages to skip
        user_id: ID of the authenticated user
        db: Database session
    """
    # Membership check
    if not await team_service.is_team_member(db, team_id, user_id):
        raise HTTPException(status_code=403, detail="Not a member of this team")
    messages = await team_message_service.get_team_messages(
        db=db,
        team_id=team_id,
        limit=limit,
        offset=offset
    )
    return TeamMessagesListResponse(messages=[TeamMessageResponse.model_validate(msg) for msg in messages])
@router.get(
    "/{message_id}",
    response_model=TeamMessageResponse,
    summary="Get a team message by ID",
    description="Retrieve a specific message in the specified team by its ID"
)
async def get_team_message_by_id(
    team_id: UUID,
    message_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a specific message in the specified team by its ID.
    
    Args:
        team_id: ID of the team
        message_id: ID of the message to retrieve
        user_id: ID of the authenticated user
        db: Database session
    """
    # Membership check
    if not await team_service.is_team_member(db, team_id, user_id):
        raise HTTPException(status_code=403, detail="Not a member of this team")
    try:
        message = await team_message_service.get_team_message_by_id(
            db=db,
            message_id=message_id
        )
        if not message or message.team_id != team_id:
            raise HTTPException(status_code=404, detail="Message not found in the specified team")
        return TeamMessageResponse.model_validate(message)
    except MessageNotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
@router.delete(
    "/{message_id}",
    response_model=None,
    summary="Delete a team message",
    description="Delete a specific message in the specified team by its ID"
)
async def delete_team_message(
    team_id: UUID,
    message_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a specific message in the specified team by its ID.
    
    Args:
        team_id: ID of the team
        message_id: ID of the message to delete
        user_id: ID of the authenticated user
        db: Database session
    """
    # Membership check
    if not await team_service.is_team_member(db, team_id, user_id):
        raise HTTPException(status_code=403, detail="Not a member of this team")
    try:
        message = await team_message_service.get_team_message_by_id(
            db=db,
            message_id=message_id
        )
        if not message or message.team_id != team_id:
            raise HTTPException(status_code=404, detail="Message not found in the specified team")
        # Sender check (only sender can delete)
        if str(message.sender_id) != str(user_id):
            raise HTTPException(status_code=403, detail="You are not allowed to delete this message")
        await team_message_service.delete_team_message(
            db=db,
            message_id=message_id
        )
    except MessageNotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
@router.delete(
    "/cleanup/older-than/{days}",
    response_model=None,
    summary="Delete old team messages",
    description="Delete team messages older than the specified number of days"
)
async def delete_messages_older_than(
    team_id: UUID,
    days: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete team messages older than the specified number of days.
    
    Args:
        team_id: ID of the team
        days: Number of days; messages older than this will be deleted
        user_id: ID of the authenticated user
        db: Database session
    """
    # Membership check
    if not await team_service.is_team_member(db, team_id, user_id):
        raise HTTPException(status_code=403, detail="Not a member of this team")
    await team_message_service.delete_messages_older_than(
        db=db,
        days=days
    )

# End of serv/api/routes/team_message.py
