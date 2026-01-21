"""
FocusGuard API - Distraction Event ORM Model

SQLAlchemy model for the distraction_events table.
"""

from sqlalchemy import Column, String, Integer, TIMESTAMP, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..database import Base


class DistractionEvent(Base):
    """
    DistractionEvent model - tracks distraction events during focus sessions.
    
    Relationships:
    - Many distraction events belong to one session
    - Many distraction events belong to one user
    """
    
    __tablename__ = "distraction_events"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique distraction event identifier (UUID)"
    )
    
    # Foreign keys
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey('sessions.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Reference to the session this distraction occurred in"
    )
    
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Reference to the user"
    )
    
    # Event details
    event_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Type of distraction: phone_usage, user_absent, multiple_persons"
    )
    
    duration_seconds = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Duration of the distraction in seconds"
    )
    
    severity = Column(
        String(20),
        nullable=False,
        default='low',
        comment="Severity level: low, medium, high"
    )
    
    # Additional details JSON (avoid reserved name 'metadata')
    details = Column(
        JSONB,
        nullable=True,
        comment="Additional JSON data about the detection (confidence scores, etc.)"
    )
    
    # Timestamps
    started_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        comment="When the distraction started"
    )
    
    ended_at = Column(
        TIMESTAMP(timezone=True),
        nullable=True,
        comment="When the distraction ended"
    )
    
    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Record creation timestamp"
    )
    
    # Relationships
    session = relationship("Session", back_populates="distraction_events")
    user = relationship("User", back_populates="distraction_events")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('phone_usage', 'user_absent', 'multiple_persons')",
            name="valid_event_type"
        ),
        CheckConstraint(
            "severity IN ('low', 'medium', 'high')",
            name="valid_severity"
        ),
        CheckConstraint(
            "duration_seconds >= 0",
            name="valid_duration"
        ),
    )
    
    def __repr__(self):
        return f"<DistractionEvent(id={self.id}, type={self.event_type}, duration={self.duration_seconds}s)>"
