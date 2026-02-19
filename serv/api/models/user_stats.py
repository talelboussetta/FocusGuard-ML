"""
FocusGuard API - UserStats ORM Model

SQLAlchemy model for the user_stats table.
"""

from sqlalchemy import Column, String, Integer, TIMESTAMP, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class UserStats(Base):
    """
    UserStats model - stores aggregated statistics for each user.
    
    Relationships:
    - One user has one user_stats record (1-to-1)
    """
    
    __tablename__ = "user_stats"
    
    # Primary key (also foreign key - enforces 1-to-1 with users)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        primary_key=True,
        comment="Reference to the user (also serves as primary key)"
    )
    
    # Statistics data
    total_focus_min = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total minutes of focus time accumulated"
    )
    
    total_sessions = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total number of completed sessions"
    )
    
    current_streak = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Current consecutive days streak"
    )
    
    best_streak = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Best consecutive days streak ever achieved"
    )
    
    # Timestamp
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Last time statistics were updated"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint('total_focus_min >= 0', name='user_stats_focus_min_positive'),
        CheckConstraint('total_sessions >= 0', name='user_stats_sessions_positive'),
        CheckConstraint('current_streak >= 0', name='user_stats_current_streak_positive'),
        CheckConstraint('best_streak >= 0', name='user_stats_best_streak_positive'),
    )
    
    # Relationship
    user = relationship(
        "User",
        back_populates="stats"
    )
    
    def __repr__(self):
        return f"<UserStats(user_id={self.user_id}, total_sessions={self.total_sessions}, current_streak={self.current_streak})>"
