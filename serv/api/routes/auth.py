"""
FocusGuard API - Authentication Routes

Endpoints for user authentication and registration.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    TokenResponse,
    RefreshTokenRequest
)
from ..schemas.user import UserResponse
from ..services import auth_service
from ..middleware.rate_limiter import limiter, REGISTER_RATE_LIMIT, LOGIN_RATE_LIMIT
from fastapi import Request


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account with username, email, and password"
)
@limiter.limit(REGISTER_RATE_LIMIT)
async def register(
    request: Request,
    registration: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.
    
    - **username**: 3-50 characters, alphanumeric with underscores/hyphens
    - **email**: Valid email address (RFC 5322)
    - **password**: Minimum 8 characters, must contain letter and number
    
    Returns user data and access tokens.
    """
    # Create user
    user = await auth_service.register_user(db, registration)
    
    # Generate tokens
    tokens = await auth_service.create_tokens(user)
    
    return RegisterResponse(
        user=UserResponse.model_validate(user),
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer"
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login user",
    description="Authenticate user with username/email and password"
)
@limiter.limit(LOGIN_RATE_LIMIT)
async def login(
    request: Request,
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return access tokens.
    
    - **username**: Username or email address
    - **password**: User password
    
    Returns user data and access tokens.
    """
    # Authenticate user
    user = await auth_service.authenticate_user(db, credentials)
    
    # Generate tokens
    tokens = await auth_service.create_tokens(user)
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer"
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Get new access token using refresh token"
)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token.
    
    - **refresh_token**: Valid JWT refresh token
    
    Returns new access and refresh tokens.
    """
    from ..utils.jwt_handler import verify_token
    from ..config import settings
    
    # Verify refresh token
    payload = verify_token(
        request.refresh_token,
        secret_key=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    
    # Get user
    user = await auth_service.get_user_by_id(db, payload["sub"])
    
    # Generate new tokens
    tokens = await auth_service.create_tokens(user)
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer"
    )
