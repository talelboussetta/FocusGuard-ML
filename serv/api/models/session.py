"""
FocusGuard API - Session ORM Model

SQLAlchemy model for the sessions table.
"""

from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..database import Base


class Session(Base):
    """
    Session model - tracks user focus sessions.
    
    Relationships:
    - Many sessions belong to one user
    - One session has one garden entry
    """
    
    __tablename__ = "sessions"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique session identifier (UUID)"
    )
    
    # Foreign key to users
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Reference to the user who created this session"
    )
    
    # Session data
    completed = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        comment="Whether the session was completed successfully"
    )
    
    duration_minutes = Column(
        Integer,
        nullable=True,
        comment="Planned duration in minutes (e.g., 15, 25, 45, 60 for Pomodoro)"
    )
    
    actual_duration_minutes = Column(
        Integer,
        nullable=True,
        comment="Actual duration user spent on session in minutes (from timer state). NULL for old sessions."
    )
    
    blink_rate = Column(
        Float,
        nullable=True,
        comment="Blink rate from AI analysis"
    )
    
    # Timestamp
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        comment="Timestamp when the session was created"
    )
    
    # Relationships
    user = relationship(
        "User",
        back_populates="sessions"
    )
    
    garden = relationship(
        "Garden",
        back_populates="session",
        uselist=False,  # One-to-one relationship
        cascade="all, delete-orphan"
    )
    
    distraction_events = relationship(
        "DistractionEvent",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, completed={self.completed})>"
