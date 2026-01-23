from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc

from ..models.team_message import TeamMessage
from ..schemas.team_message import (
    TeamMessageCreate,
    TeamMessageInDB,
)
from ..utils.exceptions import NotFoundException


# ============================================================================
# Exceptions
# ============================================================================

class TeamMessageNotFoundException(NotFoundException):
    """Raised when a team message is not found."""

    def __init__(self, message_id: UUID):
        super().__init__(f"Team message with ID {message_id} not found")


# ============================================================================
# Services
# ============================================================================

async def create_team_message(
    db: AsyncSession,
    team_id: UUID,
    sender_id: Optional[UUID],
    message_data: TeamMessageCreate,
) -> TeamMessageInDB:
    """
    Create a new team message.
    """

    new_message = TeamMessage(
        team_id=team_id,
        sender_id=sender_id,
        content=message_data.content,
        type=message_data.type,
        sent_at=datetime.now(timezone.utc),
    )

    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)

    return TeamMessageInDB.model_validate(new_message)


async def get_team_messages(
    db: AsyncSession,
    team_id: UUID,
    limit: int = 50,
    offset: int = 0,
) -> List[TeamMessageInDB]:
    """
    Retrieve messages for a team with pagination.
    """

    result = await db.execute(
        select(TeamMessage)
        .where(TeamMessage.team_id == team_id)
        .order_by(desc(TeamMessage.sent_at))
        .limit(limit)
        .offset(offset)
    )

    messages = result.scalars().all()
    return [TeamMessageInDB.model_validate(msg) for msg in messages]


async def get_team_message_by_id(
    db: AsyncSession,
    message_id: UUID,
) -> TeamMessageInDB:
    """
    Retrieve a single team message by ID.
    """

    result = await db.execute(
        select(TeamMessage).where(TeamMessage.message_id == message_id)
    )
    message = result.scalar_one_or_none()

    if message is None:
        raise TeamMessageNotFoundException(message_id)

    return TeamMessageInDB.model_validate(message)


async def delete_team_message(
    db: AsyncSession,
    message_id: UUID,
) -> None:
    """
    Delete a team message by ID.
    """

    result = await db.execute(
        select(TeamMessage).where(TeamMessage.message_id == message_id)
    )
    message = result.scalar_one_or_none()

    if message is None:
        raise TeamMessageNotFoundException(message_id)

    await db.delete(message)
    await db.commit()


async def delete_messages_older_than(
    db: AsyncSession,
    days: int,
) -> None:
    """
    Delete team messages older than a specified number of days.
    """

    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    await db.execute(
        delete(TeamMessage).where(TeamMessage.sent_at < cutoff_date)
    )
    await db.commit()
