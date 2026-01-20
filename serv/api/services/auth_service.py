"""
FocusGuard API - Authentication Service

Business logic for user authentication and registration.
"""

from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import User, UserStats
from ..schemas.auth import RegisterRequest, LoginRequest
from ..utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    validate_username,
    validate_email,
    validate_password_strength,
    InvalidCredentialsException,
    DuplicateUserException,
    UserNotFoundException
)
from ..config import settings


async def register_user(
    db: AsyncSession,
    registration: RegisterRequest
) -> User:
    """
    Register a new user.
    
    Args:
        db: Database session
        registration: Registration data (username, email, password)
        
    Returns:
        Created user object
        
    Raises:
        DuplicateUserException: If username or email already exists
        ValidationException: If validation fails
    """
    # Validate input
    username = validate_username(registration.username)
    email = validate_email(registration.email)
    validate_password_strength(registration.password)
    
    # Check if username exists
    result = await db.execute(
        select(User).where(User.username == username)
    )
    if result.scalar_one_or_none():
        raise DuplicateUserException(field="username", value=username)
    
    # Check if email exists
    result = await db.execute(
        select(User).where(User.email == email)
    )
    if result.scalar_one_or_none():
        raise DuplicateUserException(field="email", value=email)
    
    # Hash password
    password_hash = hash_password(registration.password)
    
    # Create user
    new_user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        lvl=1,
        xp_points=0
    )
    
    db.add(new_user)
    await db.flush()  # Get user ID
    
    # Create initial user stats (1-to-1 relationship)
    user_stats = UserStats(
        user_id=new_user.id,
        total_focus_min=0,
        total_sessions=0,
        current_streak=0,
        best_streak=0
    )
    
    db.add(user_stats)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


async def authenticate_user(
    db: AsyncSession,
    login: LoginRequest
) -> User:
    """
    Authenticate a user with username/email and password.
    
    Args:
        db: Database session
        login: Login credentials (username/email, password)
        
    Returns:
        Authenticated user object
        
    Raises:
        InvalidCredentialsException: If credentials are invalid
    """
    # Find user by username or email
    result = await db.execute(
        select(User).where(
            (User.username == login.username) | (User.email == login.username)
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise InvalidCredentialsException("User not found. Please check your username/email or sign up for a new account.")
    
    # Verify password
    if not verify_password(login.password, user.password_hash):
        raise InvalidCredentialsException("Invalid password. Please try again.")
    
    return user


async def create_tokens(user: User) -> Dict[str, str]:
    """
    Create access and refresh tokens for a user.
    
    Args:
        user: User object
        
    Returns:
        Dictionary with access_token and refresh_token
    """
    token_data = {
        "sub": str(user.id),
        "username": user.username
    }
    
    access_token = create_access_token(
        token_data,
        secret_key=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    
    refresh_token = create_refresh_token(
        token_data,
        secret_key=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }


async def get_user_by_id(
    db: AsyncSession,
    user_id: str
) -> User:
    """
    Get user by ID.
    
    Args:
        db: Database session
        user_id: User ID (UUID)
        
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
