"""
FocusGuard API - User Routes

Endpoints for user profile management.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas.user import (
    UserResponse,
    UserWithStats,
    UserUpdate,
    PasswordChange,
    UserPublic
)
from ..services import user_service
from ..middleware.auth_middleware import get_current_user_id
from ..middleware.rate_limiter import limiter
from fastapi import Request


router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserWithStats,
    summary="Get current user profile",
    description="Get authenticated user's profile with statistics"
)
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user's profile.
    
    Returns complete user data including level, XP, and statistics.
    Requires authentication.
    """
    user = await user_service.get_user_profile(db, user_id)
    return UserWithStats.model_validate(user)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
    description="Update username and/or email"
)
@limiter.limit("10/minute")
async def update_current_user(
    request: Request,
    update_data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile.
    
    - **username**: New username (optional)
    - **email**: New email address (optional)
    
    At least one field must be provided.
    """
    user = await user_service.update_user_profile(db, user_id, update_data)
    return UserResponse.model_validate(user)


@router.put(
    "/me/password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Change password",
    description="Change user password with current password verification"
)
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    password_data: PasswordChange,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Change user password.
    
    - **current_password**: Current password for verification
    - **new_password**: New password (min 8 chars, letter + number)
    
    Returns 204 No Content on success.
    """
    await user_service.change_password(db, user_id, password_data)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete account",
    description="Permanently delete user account and all associated data"
)
@limiter.limit("3/hour")
async def delete_account(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete current user account.
    
    WARNING: This action is permanent and will delete:
    - User profile
    - All focus sessions
    - All garden entries
    - All statistics
    
    Returns 204 No Content on success.
    """
    await user_service.delete_user_account(db, user_id)


@router.get(
    "/{user_id}",
    response_model=UserPublic,
    summary="Get public user profile",
    description="Get public profile data for any user (for leaderboards, etc.)"
)
async def get_user_public_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get public user profile by ID.
    
    Returns limited user data (excludes email and sensitive info).
    Does not require authentication.
    """
    user = await user_service.get_public_user_profile(db, user_id)
    return UserPublic.model_validate(user)
