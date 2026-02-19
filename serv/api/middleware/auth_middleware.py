"""
FocusGuard API - Authentication Middleware

JWT token validation and user injection.
Provides dependency for protected routes.
"""

from typing import Optional
from fastapi import Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..utils.jwt_handler import verify_token
from ..utils.exceptions import UnauthorizedException, InvalidTokenException, TokenExpiredException
from ..config import settings


# Security scheme for Swagger UI
security = HTTPBearer()


async def get_token_from_header(
    authorization: Optional[str] = Header(None)
) -> str:
    """
    Extract JWT token from Authorization header.
    
    Expected format: "Bearer <token>"
    
    Args:
        authorization: Authorization header value
        
    Returns:
        JWT token string
        
    Raises:
        UnauthorizedException: If header is missing or malformed
    """
    if not authorization:
        raise UnauthorizedException("Missing authorization header")
    
    parts = authorization.split()
    
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization header format. Expected: Bearer <token>")
    
    return parts[1]


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Get current authenticated user ID from JWT token.
    
    This is a FastAPI dependency that can be used in route handlers.
    
    Usage:
        @router.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user_id)):
            # user_id is automatically extracted from token
            pass
    
    Args:
        credentials: HTTP Bearer credentials from request
        
    Returns:
        User ID (UUID string) from token
        
    Raises:
        UnauthorizedException: If token is missing
        InvalidTokenException: If token is invalid
        TokenExpiredException: If token has expired
    """
    token = credentials.credentials
    
    try:
        # Verify token and extract payload
        payload = verify_token(
            token,
            secret_key=settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
            expected_type="access"
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenException("Token missing user ID")
        
        return user_id
        
    except (InvalidTokenException, TokenExpiredException):
        raise
    except Exception as e:
        raise InvalidTokenException(f"Token validation failed: {str(e)}")


async def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get full decoded token payload.
    
    Use this when you need more than just the user ID.
    
    Usage:
        @router.get("/profile")
        async def get_profile(payload: dict = Depends(get_current_user_payload)):
            user_id = payload["sub"]
            username = payload["username"]
    
    Args:
        credentials: HTTP Bearer credentials from request
        
    Returns:
        Decoded token payload dictionary
        
    Raises:
        UnauthorizedException: If token is missing
        InvalidTokenException: If token is invalid
        TokenExpiredException: If token has expired
    """
    token = credentials.credentials
    
    try:
        payload = verify_token(
            token,
            secret_key=settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
            expected_type="access"
        )
        return payload
        
    except (InvalidTokenException, TokenExpiredException):
        raise
    except Exception as e:
        raise InvalidTokenException(f"Token validation failed: {str(e)}")


async def optional_authentication(
    authorization: Optional[str] = Header(None)
) -> Optional[str]:
    """
    Optional authentication - returns user ID if token is present and valid.
    
    Use for routes that work for both authenticated and unauthenticated users.
    
    Usage:
        @router.get("/content")
        async def get_content(user_id: Optional[str] = Depends(optional_authentication)):
            if user_id:
                # Return personalized content
            else:
                # Return public content
    
    Args:
        authorization: Authorization header (optional)
        
    Returns:
        User ID if token is valid, None otherwise
    """
    if not authorization:
        return None
    
    try:
        token = await get_token_from_header(authorization)
        payload = verify_token(
            token,
            secret_key=settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
            expected_type="access"
        )
        return payload.get("sub")
    except:
        return None
