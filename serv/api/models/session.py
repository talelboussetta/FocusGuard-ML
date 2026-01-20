"""
FocusGuard API - Session ORM Model

SQLAlchemy model for the sessions table.
"""

from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKey
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
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique session identifier (UUID)"
    )
    
    # Foreign key to users
    user_id = Column(
        String(36),
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
    
    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, completed={self.completed})>"
