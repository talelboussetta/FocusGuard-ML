"""
FocusGuard API - Garden Schemas

Pydantic models for virtual garden operations.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class PlantType(str, Enum):
    """Available plant types."""
    ROSE = "Rose"
    TULIP = "Tulip"
    SUNFLOWER = "Sunflower"
    DAISY = "Daisy"
    CACTUS = "Cactus"
    FERN = "Fern"
    BAMBOO = "Bamboo"
    ORCHID = "Orchid"
    LILY = "Lily"
    LAVENDER = "Lavender"
    MINT = "Mint"
    BASIL = "Basil"
    CHERRY_BLOSSOM = "Cherry Blossom"
    MAPLE = "Maple"
    OAK = "Oak"
    PINE = "Pine"
    WILLOW = "Willow"
    BIRCH = "Birch"
    ELM = "Elm"


# ============================================================================
# Garden Create/Update Schemas
# ============================================================================

class GardenCreate(BaseModel):
    """Schema for creating a new garden entry."""
    
    session_id: str = Field(..., description="Associated session ID (UUID)")
    plant_type: PlantType = Field(..., description="Type of plant")
    plant_num: int = Field(..., ge=0, description="Plant number")
    growth_stage: int = Field(default=0, ge=0, le=5, description="Growth stage (0-5)")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "session_id": "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "plant_type": "Rose",
                "plant_num": 1,
                "growth_stage": 0
            }]
        }
    }


class GardenUpdate(BaseModel):
    """Schema for updating a garden entry."""
    
    growth_stage: int = Field(..., ge=0, le=5, description="New growth stage")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "growth_stage": 3
            }]
        }
    }


# ============================================================================
# Garden Response Schemas
# ============================================================================

class GardenResponse(BaseModel):
    """Garden entry response."""
    
    id: str = Field(..., description="Garden entry ID (UUID)")
    user_id: str = Field(..., description="User ID (UUID)")
    session_id: str = Field(..., description="Session ID (UUID)")
    plant_num: int = Field(..., description="Plant number")
    plant_type: str = Field(..., description="Plant type")
    growth_stage: int = Field(..., description="Growth stage (0-5)")
    total_plants: int = Field(..., description="Total plants")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [{
                "id": "garden-uuid",
                "user_id": "user-uuid",
                "session_id": "session-uuid",
                "plant_num": 1,
                "plant_type": "Rose",
                "growth_stage": 5,
                "total_plants": 3,
                "created_at": "2026-01-15T10:00:00Z"
            }]
        }
    }


class GardenInDB(BaseModel):
    """Garden schema as stored in database."""
    
    id: str
    user_id: str
    session_id: str
    plant_num: int
    plant_type: str
    growth_stage: int
    total_plants: int
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }


# ============================================================================
# Garden List Response
# ============================================================================

class GardenListResponse(BaseModel):
    """Response for listing garden entries."""
    
    gardens: list[GardenResponse] = Field(..., description="List of garden entries")
    total: int = Field(..., description="Total number of garden entries")
    fully_grown: int = Field(..., description="Number of fully grown plants (stage 5)")


# ============================================================================
# Garden Stats
# ============================================================================

class GardenStats(BaseModel):
    """Garden statistics for a user."""
    
    total_plants: int = Field(..., description="Total number of plants")
    fully_grown_plants: int = Field(..., description="Number of fully grown plants")
    favorite_plant: Optional[str] = Field(None, description="Most planted type")
    plant_types_count: dict[str, int] = Field(default_factory=dict, description="Count by plant type")


# ============================================================================
# Response Messages
# ============================================================================

class GardenDeleteResponse(BaseModel):
    """Response for garden deletion."""
    
    message: str = Field(default="Garden entry deleted successfully")
