from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..database import Base
class TeamMessage(Base):
    """
    TeamMessage model - stores messages sent within teams.

    """
    __tablename__ = "team_messages"

    # Primary key
    message_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique message identifier (UUID)"
    )

    # Foreign keys
    team_id = Column(
        UUID(as_uuid=True),
        ForeignKey('team.team_id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Reference to the team this message belongs to"
    )

    sender_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
        comment="Reference to the user who sent this message"
    )

    # Message content
    content = Column(
        String(1000),
        nullable=False,
        comment="Content of the team message"
    )

    # Timestamps
    sent_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Timestamp when the message was sent"
    )
    edited_at = Column(
        TIMESTAMP(timezone=True),
        nullable=True,
        comment="Timestamp when the message was last edited"
    )
    #relationships
    team = relationship("Team", back_populates="messages")
    sender = relationship("User", back_populates="team_messages")
    #constraints
    __table_args__ = (
        # Ensure message content is not empty
        CheckConstraint("length(content) > 0", name="check_message_content_not_empty"),
    )