"""
FocusGuard API - Authentication Schemas

Pydantic models for authentication requests/responses.
"""

from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from pydantic import BaseModel, Field, EmailStr

if TYPE_CHECKING:
    from .user import UserResponse as UserResponseType
else:
    UserResponseType = "UserResponse"


# ============================================================================
# Registration Schemas
# ============================================================================

class RegisterRequest(BaseModel):
    """User registration request."""
    
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "username": "alice_focus",
                "email": "alice@focusguard.com",
                "password": "SecurePass123"
            }]
        }
    }


class RegisterResponse(BaseModel):
    """User registration response."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponseType = Field(..., description="User information")


# ============================================================================
# Login Schemas
# ============================================================================

class LoginRequest(BaseModel):
    """User login request."""
    
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "username": "alice_focus",
                "password": "SecurePass123"
            }]
        }
    }


class LoginResponse(BaseModel):
    """User login response with tokens."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponseType = Field(..., description="User information")


# ============================================================================
# Token Schemas
# ============================================================================

class TokenResponse(BaseModel):
    """Generic token response."""
    
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    
    refresh_token: str = Field(..., description="Refresh token")


class TokenPayload(BaseModel):
    """Decoded token payload."""
    
    sub: str = Field(..., description="Subject (user ID)")
    username: Optional[str] = Field(None, description="Username")
    type: str = Field(..., description="Token type (access/refresh)")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")


# ============================================================================
# Logout Schema
# ============================================================================

class LogoutResponse(BaseModel):
    """Logout response."""
    
    message: str = Field(default="Successfully logged out")


# ============================================================================
# Model Rebuilding (resolve forward references)
# ============================================================================

def rebuild_models():
    """Rebuild models after UserResponse is imported."""
    from .user import UserResponse
    RegisterResponse.model_rebuild()
    LoginResponse.model_rebuild()
