"""
FocusGuard API - Authentication Schemas

Pydantic models for authentication requests/responses.
"""

from typing import Optional
from pydantic import BaseModel, Field, EmailStr


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
    
    id: str = Field(..., description="User ID (UUID)")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")
    message: str = Field(default="User registered successfully")


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
    user: "UserResponse" = Field(..., description="User information")


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
# User Response (for auth endpoints)
# ============================================================================

class UserResponse(BaseModel):
    """User information in auth responses."""
    
    id: str = Field(..., description="User ID (UUID)")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")
    lvl: int = Field(..., description="User level")
    xp_points: int = Field(..., description="Experience points")
    
    model_config = {
        "from_attributes": True  # Enable ORM mode
    }


# ============================================================================
# Logout Schema
# ============================================================================

class LogoutResponse(BaseModel):
    """Logout response."""
    
    message: str = Field(default="Successfully logged out")
