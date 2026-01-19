"""
FocusGuard API - User Schemas

Pydantic models for user operations.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


# ============================================================================
# User Create/Update Schemas
# ============================================================================

class UserCreate(BaseModel):
    """Schema for creating a new user."""
    
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "username": "new_username",
                "email": "newemail@example.com"
            }]
        }
    }


class PasswordChange(BaseModel):
    """Schema for changing password."""
    
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "current_password": "OldPassword123",
                "new_password": "NewSecurePass456"
            }]
        }
    }


# ============================================================================
# User Response Schemas
# ============================================================================

class UserInDB(BaseModel):
    """User schema as stored in database (includes password hash)."""
    
    id: str
    username: str
    email: str
    password_hash: str
    lvl: int
    xp_points: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class UserResponse(BaseModel):
    """Public user profile (no sensitive data)."""
    
    id: str = Field(..., description="User ID (UUID)")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")
    lvl: int = Field(..., description="User level")
    xp_points: int = Field(..., description="Experience points")
    created_at: datetime = Field(..., description="Account creation date")
    updated_at: datetime = Field(..., description="Last update date")
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [{
                "id": "a1111111-1111-1111-1111-111111111111",
                "username": "alice_focus",
                "email": "alice@focusguard.com",
                "lvl": 5,
                "xp_points": 1250,
                "created_at": "2026-01-10T08:30:00Z",
                "updated_at": "2026-01-19T10:15:00Z"
            }]
        }
    }


class UserPublic(BaseModel):
    """Minimal public user info (for leaderboards, etc.)."""
    
    id: str
    username: str
    lvl: int
    xp_points: int
    
    model_config = {
        "from_attributes": True
    }


# ============================================================================
# User Stats Combined
# ============================================================================

class UserWithStats(UserResponse):
    """User response with statistics included."""
    
    total_focus_min: int = Field(..., description="Total focus minutes")
    total_sessions: int = Field(..., description="Total completed sessions")
    current_streak: int = Field(..., description="Current day streak")
    best_streak: int = Field(..., description="Best day streak")


# ============================================================================
# Response Messages
# ============================================================================

class UserDeleteResponse(BaseModel):
    """Response for user deletion."""
    
    message: str = Field(default="User account deleted successfully")
    
    
class UserUpdateResponse(BaseModel):
    """Response for user update."""
    
    message: str = Field(default="User profile updated successfully")
    user: UserResponse
