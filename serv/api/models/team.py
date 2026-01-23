"""
FocusGuard API - Team ORM Models

SQLAlchemy models for team and team_members tables.
"""

from sqlalchemy import Column, String, Integer, TIMESTAMP, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..database import Base


class Team(Base):
    """
    Team model - stores team information.
    
    Relationships:
    - One team has many team members
    """
    
    __tablename__ = "team"
    
    # Primary key
    team_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique team identifier (UUID)"
    )
    
    # Team info
    team_name = Column(
        String(100),
        nullable=False,
        unique=True,
        comment="Unique team name"
    )
    
    # Timestamps
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Team creation timestamp"
    )
    
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Team last update timestamp"
    )
    
    # Statistics
    total_members = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total number of team members"
    )
    
    total_xp = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total team XP"
    )
    
    total_sessions_completed = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total sessions completed by team"
    )
    
    # Check constraints
    __table_args__ = (
        CheckConstraint('total_members >= 0', name='total_members_non_negative'),
        CheckConstraint('total_xp >= 0', name='total_xp_non_negative'),
        CheckConstraint('total_sessions_completed >= 0', name='total_sessions_completed_non_negative'),
    )
    
    # Relationships
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    """
    TeamMember model - stores team membership information.
    
    Relationships:
    - Many team members belong to one team
    - One team member is one user
    """
    
    __tablename__ = "team_members"
    
    # Composite primary key
    team_id = Column(
        UUID(as_uuid=True),
        ForeignKey('team.team_id', ondelete='CASCADE'),
        primary_key=True,
        comment="Team ID"
    )
    
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        primary_key=True,
        comment="User ID"
    )
    
    # User info (denormalized for easier queries)
    username = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Username (cached from users table)"
    )
    
    # Timestamp
    joined_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="When user joined the team"
    )
    
    # Relationships
    team = relationship("Team", back_populates="members")
