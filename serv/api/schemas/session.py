"""
FocusGuard API - Session Schemas

Pydantic models for focus session operations.
"""

from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, field_serializer


# ============================================================================
# Session Create/Update Schemas
# ============================================================================

class SessionCreate(BaseModel):
    """Schema for creating a new focus session."""
    
    duration_min: Optional[int] = Field(None, ge=1, description="Planned duration in minutes")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "duration_min": 25
            }]
        }
    }


class SessionUpdate(BaseModel):
    """Schema for updating a session."""
    
    completed: bool = Field(..., description="Mark session as completed")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "completed": True
            }]
        }
    }


class SessionComplete(BaseModel):
    """Schema for completing a session."""
    
    actual_duration: int = Field(..., ge=1, description="Actual duration in minutes")
    focus_score: Optional[float] = Field(None, ge=0, le=100, description="Focus score percentage")
    blink_rate: Optional[float] = Field(None, ge=0, description="Blink rate from AI analysis")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "actual_duration": 25,
                "focus_score": 95.5,
                "blink_rate": 15.2
            }]
        }
    }


# ============================================================================
# Session Response Schemas
# ============================================================================

class SessionResponse(BaseModel):
    """Session information response."""
    
    id: UUID = Field(..., description="Session ID (UUID)")
    user_id: UUID = Field(..., description="User ID (UUID)")
    completed: bool = Field(..., description="Completion status")
    duration_minutes: Optional[int] = Field(None, description="Planned duration in minutes")
    actual_duration_minutes: Optional[int] = Field(None, description="Actual duration spent on session in minutes")
    blink_rate: Optional[float] = Field(None, description="Blink rate from AI analysis")
    created_at: datetime = Field(..., description="Session creation timestamp")
    
    @field_serializer('id', 'user_id')
    def serialize_uuid(self, value: UUID) -> str:
        return str(value)
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [{
                "id": "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "user_id": "a1111111-1111-1111-1111-111111111111",
                "completed": True,
                "created_at": "2026-01-19T10:00:00Z"
            }]
        }
    }


class SessionInDB(BaseModel):
    """Session schema as stored in database."""
    
    id: str
    user_id: str
    completed: bool
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }


# ============================================================================
# Session List Response
# ============================================================================

class SessionListResponse(BaseModel):
    """Response for listing multiple sessions."""
    
    sessions: list[SessionResponse] = Field(..., description="List of sessions")
    total: int = Field(..., description="Total number of sessions")
    completed_count: int = Field(..., description="Number of completed sessions")
    incomplete_count: int = Field(..., description="Number of incomplete sessions")


# ============================================================================
# Active Session Response
# ============================================================================

class ActiveSessionResponse(BaseModel):
    """Response for active session query."""
    
    has_active: bool = Field(..., description="Whether user has an active session")
    session: Optional[SessionResponse] = Field(None, description="Active session details")


# ============================================================================
# Session with Garden Response
# ============================================================================

class SessionWithGarden(SessionResponse):
    """Session response with associated garden data."""
    
    garden: Optional["GardenResponse"] = Field(None, description="Associated garden entry")
    
    model_config = {
        "from_attributes": True
    }


# ============================================================================
# Response Messages
# ============================================================================

class SessionDeleteResponse(BaseModel):
    """Response for session deletion."""
    
    message: str = Field(default="Session deleted successfully")
