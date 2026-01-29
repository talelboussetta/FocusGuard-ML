"""
FocusGuard API - User ORM Model

SQLAlchemy model for the users table.
"""

from sqlalchemy import Column, String, Integer, TIMESTAMP, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..database import Base


class User(Base):
    """
    User model - stores authentication and profile information.
    
    Relationships:
    - One user has many sessions
    - One user has many garden entries  
    - One user has one user_stats record
    """
    
    __tablename__ = "users"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique user identifier (UUID)"
    )
    
    # Authentication & profile
    username = Column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
        comment="Unique username for login"
    )
    
    email = Column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        comment="Unique email address"
    )
    
    password_hash = Column(
        String,
        nullable=False,
        comment="Hashed password for authentication"
    )
    
    # Gamification
    lvl = Column(
        Integer,
        nullable=False,
        default=1,
        comment="User level for gamification (starts at 1)"
    )
    
    xp_points = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Experience points accumulated by user"
    )
    
    # Timestamps
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        comment="Account creation timestamp"
    )
    
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Last update timestamp"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint('lvl >= 1', name='users_lvl_positive'),
        CheckConstraint('xp_points >= 0', name='users_xp_positive'),
    )
    
    # Relationships
    sessions = relationship(
        "Session",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    gardens = relationship(
        "Garden",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    stats = relationship(
        "UserStats",
        back_populates="user",
        uselist=False,  # One-to-one relationship
        cascade="all, delete-orphan"
    )
    
    distraction_events = relationship(
        "DistractionEvent",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    team_messages = relationship(
        "TeamMessage",
        back_populates="sender",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, lvl={self.lvl})>"
