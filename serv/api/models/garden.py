"""
FocusGuard API - Garden ORM Model

SQLAlchemy model for the garden table.
"""

from sqlalchemy import Column, String, Integer, TIMESTAMP, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..database import Base


class Garden(Base):
    """
    Garden model - stores virtual garden/plant data for gamification.
    
    Relationships:
    - Many garden entries belong to one user
    - One garden entry belongs to one session (1-to-1)
    """
    
    __tablename__ = "garden"
    
    # Primary key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique garden entry identifier (UUID)"
    )
    
    # Foreign keys
    user_id = Column(
        String(36),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Reference to the user who owns this garden entry"
    )
    
    session_id = Column(
        String(36),
        ForeignKey('sessions.id', ondelete='CASCADE'),
        nullable=False,
        unique=True,  # Enforces 1-to-1 with session
        index=True,
        comment="Reference to the associated session (1-to-1 relationship)"
    )
    
    # Garden/plant data
    plant_num = Column(
        Integer,
        nullable=False,
        comment="Number identifier of the plant"
    )
    
    plant_type = Column(
        String(50),
        nullable=False,
        comment="Type/species of the plant"
    )
    
    growth_stage = Column(
        Integer,
        nullable=False,
        comment="Current growth stage of the plant"
    )
    
    total_plants = Column(
        Integer,
        nullable=False,
        comment="Total number of plants in this garden entry"
    )
    
    # Timestamp
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        comment="Timestamp when the garden entry was created"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint('plant_num >= 0', name='garden_plant_num_positive'),
        CheckConstraint('growth_stage >= 0', name='garden_growth_stage_positive'),
        CheckConstraint('total_plants >= 0', name='garden_total_plants_positive'),
    )
    
    # Relationships
    user = relationship(
        "User",
        back_populates="gardens"
    )
    
    session = relationship(
        "Session",
        back_populates="garden"
    )
    
    def __repr__(self):
        return f"<Garden(id={self.id}, plant_type={self.plant_type}, growth_stage={self.growth_stage})>"
