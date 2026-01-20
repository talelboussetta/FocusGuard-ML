"""
FocusGuard API - Garden Service

Business logic for virtual garden management.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from ..models import Garden, Session
from ..schemas.garden import GardenCreate, GardenUpdate, PlantType
from ..utils import (
    GardenNotFoundException,
    UnauthorizedAccessException,
    SessionNotFoundException,
    ValidationException
)


async def create_garden_entry(
    db: AsyncSession,
    user_id: str,
    garden_data: GardenCreate
) -> Garden:
    """
    Create a new garden entry for a session.
    
    Args:
        db: Database session
        user_id: User ID
        garden_data: Garden creation data
        
    Returns:
        Created garden object
        
    Raises:
        SessionNotFoundException: If session not found
        UnauthorizedAccessException: If user doesn't own the session
        ValidationException: If session already has a garden
    """
    # Verify session exists and belongs to user
    result = await db.execute(
        select(Session).where(Session.id == garden_data.session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise SessionNotFoundException(session_id=garden_data.session_id)
    
    if session.user_id != user_id:
        raise UnauthorizedAccessException("You don't own this session")
    
    # Check if session already has a garden (1-to-1 constraint)
    result = await db.execute(
        select(Garden).where(Garden.session_id == garden_data.session_id)
    )
    if result.scalar_one_or_none():
        raise ValidationException("Session already has a garden entry")
    
    # Create garden entry
    new_garden = Garden(
        user_id=user_id,
        **garden_data.model_dump()
    )
    
    db.add(new_garden)
    await db.commit()
    await db.refresh(new_garden)
    
    return new_garden


async def get_garden_entry(
    db: AsyncSession,
    garden_id: int,
    user_id: Optional[str] = None
) -> Garden:
    """
    Get garden entry by ID.
    
    Args:
        db: Database session
        garden_id: Garden ID
        user_id: Optional user ID to verify ownership
        
    Returns:
        Garden object
        
    Raises:
        GardenNotFoundException: If garden not found
        UnauthorizedAccessException: If user doesn't own the garden
    """
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id)
    )
    garden = result.scalar_one_or_none()
    
    if not garden:
        raise GardenNotFoundException(garden_id=garden_id)
    
    # Verify ownership if user_id provided
    if user_id and garden.user_id != user_id:
        raise UnauthorizedAccessException("You don't have access to this garden")
    
    return garden


async def update_garden_entry(
    db: AsyncSession,
    garden_id: int,
    user_id: str,
    update_data: GardenUpdate
) -> Garden:
    """
    Update a garden entry.
    
    Args:
        db: Database session
        garden_id: Garden ID
        user_id: User ID (for authorization)
        update_data: Updated garden data
        
    Returns:
        Updated garden object
    """
    # Get and verify ownership
    garden = await get_garden_entry(db, garden_id, user_id)
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(garden, field, value)
    
    await db.commit()
    await db.refresh(garden)
    
    return garden


async def list_user_garden(
    db: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 50
) -> tuple[List[Garden], int]:
    """
    List all garden entries for a user with pagination.
    
    Args:
        db: Database session
        user_id: User ID
        skip: Pagination offset
        limit: Results per page
        
    Returns:
        Tuple of (garden entries list, total count)
    """
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(Garden).where(Garden.user_id == user_id)
    )
    total = count_result.scalar()
    
    # Get paginated results ordered by most recent
    result = await db.execute(
        select(Garden)
        .where(Garden.user_id == user_id)
        .order_by(Garden.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    gardens = result.scalars().all()
    
    return list(gardens), total


async def get_garden_statistics(
    db: AsyncSession,
    user_id: str
) -> dict:
    """
    Get garden statistics for a user.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Dictionary with statistics:
        - total_plants: Total number of plants grown
        - plants_by_type: Count of each plant type
        - average_growth_stage: Average growth stage
        - highest_plant_num: Highest plant number achieved
    """
    # Get all garden entries for user
    result = await db.execute(
        select(Garden).where(Garden.user_id == user_id)
    )
    gardens = result.scalars().all()
    
    if not gardens:
        return {
            "total_plants": 0,
            "plants_by_type": {},
            "average_growth_stage": 0.0,
            "highest_plant_num": 0
        }
    
    # Calculate statistics
    total_plants = sum(g.total_plants for g in gardens)
    highest_plant_num = max(g.plant_num for g in gardens)
    avg_growth_stage = sum(g.growth_stage for g in gardens) / len(gardens)
    
    # Count plants by type
    plants_by_type = {}
    for garden in gardens:
        plant_type = garden.plant_type
        plants_by_type[plant_type] = plants_by_type.get(plant_type, 0) + 1
    
    return {
        "total_plants": total_plants,
        "plants_by_type": plants_by_type,
        "average_growth_stage": round(avg_growth_stage, 2),
        "highest_plant_num": highest_plant_num
    }


async def delete_garden_entry(
    db: AsyncSession,
    garden_id: int,
    user_id: str
) -> None:
    """
    Delete a garden entry.
    
    Args:
        db: Database session
        garden_id: Garden ID
        user_id: User ID (for authorization)
    """
    garden = await get_garden_entry(db, garden_id, user_id)
    
    await db.delete(garden)
    await db.commit()
