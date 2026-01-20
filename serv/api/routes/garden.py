"""
FocusGuard API - Garden Routes

Endpoints for virtual garden management.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas.garden import (
    GardenCreate,
    GardenUpdate,
    GardenResponse,
    GardenListResponse,
    GardenStats
)
from ..services import garden_service
from ..middleware.auth_middleware import get_current_user_id
from ..middleware.rate_limiter import limiter
from fastapi import Request


router = APIRouter(prefix="/garden", tags=["Garden"])


@router.post(
    "",
    response_model=GardenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create garden entry",
    description="Create new garden entry for a session"
)
@limiter.limit("30/minute")
async def create_garden_entry(
    request: Request,
    garden_data: GardenCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a garden entry linked to a session.
    
    - **session_id**: ID of the session to link to
    - **plant_num**: Plant number (must be >= 0)
    - **plant_type**: Type of plant (19 types available)
    - **growth_stage**: Growth stage 0-5
    - **total_plants**: Total plants grown
    
    Each session can have only one garden entry (1-to-1 relationship).
    """
    garden = await garden_service.create_garden_entry(db, user_id, garden_data)
    return GardenResponse.model_validate(garden)


@router.get(
    "",
    response_model=GardenListResponse,
    summary="List user garden",
    description="Get paginated list of user's garden entries"
)
async def list_garden(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    List user's garden entries with pagination.
    
    - **skip**: Pagination offset (default 0)
    - **limit**: Results per page (default 50, max 100)
    
    Returns list ordered by most recent.
    """
    gardens, total = await garden_service.list_user_garden(db, user_id, skip, limit)
    
    # Calculate fully grown count
    fully_grown_count = sum(1 for g in gardens if g.growth_stage == 5)
    
    return GardenListResponse(
        gardens=[GardenResponse.model_validate(g) for g in gardens],
        total=total,
        fully_grown=fully_grown_count
    )


@router.get(
    "/stats",
    response_model=GardenStats,
    summary="Get garden statistics",
    description="Get aggregated garden statistics for user"
)
async def get_garden_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get garden statistics.
    
    Returns:
    - Total plants grown
    - Count by plant type
    - Average growth stage
    - Highest plant number achieved
    """
    stats = await garden_service.get_garden_statistics(db, user_id)
    return GardenStats(**stats)


@router.get(
    "/{garden_id}",
    response_model=GardenResponse,
    summary="Get garden entry by ID",
    description="Get specific garden entry details"
)
async def get_garden_entry(
    garden_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get garden entry by ID.
    
    User must own the garden entry.
    """
    garden = await garden_service.get_garden_entry(db, garden_id, user_id)
    return GardenResponse.model_validate(garden)


@router.put(
    "/{garden_id}",
    response_model=GardenResponse,
    summary="Update garden entry",
    description="Update garden entry details"
)
@limiter.limit("20/minute")
async def update_garden_entry(
    request: Request,
    garden_id: int,
    update_data: GardenUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Update garden entry fields.
    
    - **plant_num**: Updated plant number (optional)
    - **plant_type**: Updated plant type (optional)
    - **growth_stage**: Updated growth stage (optional)
    - **total_plants**: Updated total plants (optional)
    
    User must own the garden entry.
    """
    garden = await garden_service.update_garden_entry(db, garden_id, user_id, update_data)
    return GardenResponse.model_validate(garden)


@router.delete(
    "/{garden_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete garden entry",
    description="Delete a garden entry"
)
@limiter.limit("10/minute")
async def delete_garden_entry(
    request: Request,
    garden_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete garden entry by ID.
    
    User must own the garden entry.
    Returns 204 No Content on success.
    """
    await garden_service.delete_garden_entry(db, garden_id, user_id)


@router.post(
    "/reset",
    status_code=status.HTTP_200_OK,
    summary="Reset user garden",
    description="Delete all plants from user's garden"
)
@limiter.limit("5/minute")
async def reset_garden(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Reset the user's entire garden.
    
    Deletes all garden entries for the authenticated user.
    Returns count of deleted plants.
    """
    deleted_count = await garden_service.reset_user_garden(db, user_id)
    
    return {
        "message": f"Garden reset successfully. Removed {deleted_count} plants.",
        "deleted_count": deleted_count
    }


@router.post(
    "/plant/{session_id}",
    status_code=status.HTTP_201_CREATED,
    summary="Plant a single plant",
    description="Plant a single plant in real-time during active session"
)
@limiter.limit("20/minute")
async def plant_single(
    request: Request,
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Plant a single plant in real-time during an active session.
    
    - **session_id**: ID of the active session
    
    Returns plant details and rarity.
    """
    result = await garden_service.plant_single_plant(db, user_id, session_id)
    return result
