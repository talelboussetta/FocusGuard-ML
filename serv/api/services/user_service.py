"""
FocusGuard API - User Service

Business logic for user management operations.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import User
from ..schemas.user import UserUpdate, PasswordChange
from ..utils import (
    hash_password,
    verify_password,
    validate_username,
    validate_email,
    validate_password_strength,
    UserNotFoundException,
    DuplicateUserException,
    InvalidCredentialsException
)


async def get_user_profile(
    db: AsyncSession,
    user_id: str
) -> User:
    """
    Get user profile by ID.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        User object
        
    Raises:
        UserNotFoundException: If user not found
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise UserNotFoundException(user_id=user_id)
    
    return user


async def update_user_profile(
    db: AsyncSession,
    user_id: str,
    update_data: UserUpdate
) -> User:
    """
    Update user profile.
    
    Args:
        db: Database session
        user_id: User ID
        update_data: Updated profile data
        
    Returns:
        Updated user object
        
    Raises:
        UserNotFoundException: If user not found
        DuplicateUserException: If username/email already taken
    """
    # Get user
    user = await get_user_profile(db, user_id)
    
    # Update username if provided
    if update_data.username:
        username = validate_username(update_data.username)
        
        # Check if username is taken by another user
        result = await db.execute(
            select(User).where(
                (User.username == username) & (User.id != user_id)
            )
        )
        if result.scalar_one_or_none():
            raise DuplicateUserException(field="username", value=username)
        
        user.username = username
    
    # Update email if provided
    if update_data.email:
        email = validate_email(update_data.email)
        
        # Check if email is taken by another user
        result = await db.execute(
            select(User).where(
                (User.email == email) & (User.id != user_id)
            )
        )
        if result.scalar_one_or_none():
            raise DuplicateUserException(field="email", value=email)
        
        user.email = email
    
    await db.commit()
    await db.refresh(user)
    
    return user


async def change_password(
    db: AsyncSession,
    user_id: str,
    password_data: PasswordChange
) -> None:
    """
    Change user password.
    
    Args:
        db: Database session
        user_id: User ID
        password_data: Current and new password
        
    Raises:
        UserNotFoundException: If user not found
        InvalidCredentialsException: If current password is wrong
    """
    # Get user
    user = await get_user_profile(db, user_id)
    
    # Verify current password
    if not verify_password(password_data.current_password, user.password_hash):
        raise InvalidCredentialsException("Current password is incorrect")
    
    # Validate new password
    validate_password_strength(password_data.new_password)
    
    # Update password
    user.password_hash = hash_password(password_data.new_password)
    
    await db.commit()


async def delete_user_account(
    db: AsyncSession,
    user_id: str
) -> None:
    """
    Delete user account (cascade deletes all related data).
    
    Args:
        db: Database session
        user_id: User ID
        
    Raises:
        UserNotFoundException: If user not found
    """
    user = await get_user_profile(db, user_id)
    
    await db.delete(user)
    await db.commit()


async def get_public_user_profile(
    db: AsyncSession,
    user_id: str
) -> User:
    """
    Get public user profile (for leaderboards, etc.).
    
    Same as get_user_profile but intended for public access.
    Response schema should exclude sensitive data.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        User object
    """
    return await get_user_profile(db, user_id)
