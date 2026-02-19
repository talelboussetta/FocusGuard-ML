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
    ForbiddenException,
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
        ForbiddenException: If user doesn't own the session
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
        raise ForbiddenException("You don't own this session")
    
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
        ForbiddenException: If user doesn't own the garden
    """
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id)
    )
    garden = result.scalar_one_or_none()
    
    if not garden:
        raise GardenNotFoundException(garden_id=garden_id)
    
    # Verify ownership if user_id provided
    if user_id and garden.user_id != user_id:
        raise ForbiddenException("You don't have access to this garden")
    
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
            "user_id": user_id,
            "total_plants": 0,
            "rare_plants": 0,
            "epic_plants": 0,
            "legendary_plants": 0,
            "last_plant_at": None
        }
    
    # Calculate statistics
    total_plants = len(gardens)
    rare_plants = 0  # Uncommon (13-15)
    epic_plants = 0  # Rare (16-17)
    legendary_plants = 0  # Legendary (18)
    
    for garden in gardens:
        plant_type_num = int(garden.plant_type)
        if 13 <= plant_type_num <= 15:
            rare_plants += 1
        elif 16 <= plant_type_num <= 17:
            epic_plants += 1
        elif plant_type_num == 18:
            legendary_plants += 1
    
    # Get most recent plant timestamp
    last_plant_at = max((g.created_at for g in gardens), default=None)
    
    return {
        "user_id": user_id,
        "total_plants": total_plants,
        "rare_plants": rare_plants,
        "epic_plants": epic_plants,
        "legendary_plants": legendary_plants,
        "last_plant_at": last_plant_at.isoformat() if last_plant_at else None
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


async def reset_user_garden(
    db: AsyncSession,
    user_id: str
) -> int:
    """
    Delete all garden entries for a user.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Number of garden entries deleted
    """
    from sqlalchemy import delete
    
    # Delete all garden entries for this user
    result = await db.execute(
        delete(Garden).where(Garden.user_id == user_id)
    )
    
    await db.commit()
    
    return result.rowcount


async def plant_single_plant(
    db: AsyncSession,
    user_id: str,
    session_id: str
) -> dict:
    """
    Plant a single plant in real-time during an active session.
    
    Args:
        db: Database session
        user_id: User ID
        session_id: Active session ID
        
    Returns:
        Dictionary with plant details and total count
        
    Raises:
        SessionNotFoundException: If session not found
        ForbiddenException: If user doesn't own the session
    """
    import random
    from ..models import UserStats
    
    # Verify session exists, belongs to user, and is not completed
    result = await db.execute(
        select(Session).where(
            and_(
                Session.id == session_id,
                Session.user_id == user_id,
                Session.completed == False
            )
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise SessionNotFoundException(session_id=session_id)
    
    # Get next plant number for user
    result = await db.execute(
        select(func.max(Garden.plant_num)).where(Garden.user_id == user_id)
    )
    max_plant_num = result.scalar() or -1
    plant_num = max_plant_num + 1
    
    # Get user's total focus time for rare plant calculation
    result = await db.execute(
        select(UserStats.total_focus_min).where(UserStats.user_id == user_id)
    )
    total_focus_min = result.scalar() or 0
    
    # Plant rarity based on total study time
    rand = random.random() * 100
    
    # Calculate rarity boost: 0.5% per 100 minutes studied (caps at 20% boost)
    rarity_boost = min(20, (total_focus_min / 100) * 0.5)
    
    if rand < (2 + rarity_boost):  # Legendary
        plant_type = "18"
        rarity = "legendary"
    elif rand < (7 + rarity_boost):  # Rare
        plant_type = str(random.randint(16, 17))
        rarity = "rare"
    elif rand < (17 + rarity_boost):  # Uncommon
        plant_type = str(random.randint(13, 15))
        rarity = "uncommon"
    else:  # Regular
        plant_type = str(random.randint(0, 12))
        rarity = "regular"
    
    # Create garden entry
    new_garden = Garden(
        user_id=user_id,
        session_id=session_id,
        plant_num=plant_num,
        plant_type=plant_type,
        growth_stage=0,  # Start at growth stage 0
        total_plants=1   # Each entry represents 1 plant
    )
    db.add(new_garden)
    await db.commit()
    await db.refresh(new_garden)
    
    # Get total plant count
    result = await db.execute(
        select(func.count(Garden.id)).where(Garden.user_id == user_id)
    )
    total_plants = result.scalar() or 0
    
    print(f"🌱 Planted {rarity} plant #{plant_num} (type {plant_type}) for user {user_id}")
    
    return {
        "plant_num": plant_num,
        "plant_type": plant_type,
        "rarity": rarity,
        "total_plants": total_plants,
        "message": f"🌱 New {rarity} plant added to your garden!"
    }
