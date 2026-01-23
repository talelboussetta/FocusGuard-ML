"""
Schemas for team messages.
Defines Pydantic models for creating and responding with team messages.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
# ============================================================================
# Team Message Schemas
# ============================================================================
class TeamMessageCreate(BaseModel):
    """Schema for creating a new team message."""
    
    content: str = Field(..., min_length=1, max_length=1000, description="Message content")
    type:str=Field(default="text",description="Message type")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "content": "Don't forget to submit your assignments!",
                "type": "text"
            }]
        }
    }
class TeamMessageResponse(BaseModel):
    """Schema for team message response."""
    
    message_id: UUID = Field(..., description="Message UUID")
    team_id: UUID = Field(..., description="Team UUID")
    sender_id: UUID = Field(..., description="Sender's User UUID")
    content: str = Field(..., description="Message content")
    sent_at: datetime = Field(..., description="Timestamp when the message was sent")
    type: str = Field(..., description="Message type")  
    is_edited:bool=Field(...,description="Indicates if the message has been edited")
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [{
                "message_id": "123e4567-e89b-12d3-a456-426614174000",
                "team_id": "223e4567-e89b-12d3-a456-426614174000",
                "sender_id": "323e4567-e89b-12d3-a456-426614174000",
                "content": "Don't forget to submit your assignments!",
                "sent_at": "2026-01-20T10:15:30Z"
            }]
        }
    }
class TeamMessageInDB(BaseModel):
    """Schema for team message as stored in database."""
    
    message_id: UUID
    team_id: UUID
    sender_id: Optional[UUID]
    content: str
    sent_at: datetime
    
    model_config = {
        "from_attributes": True
    }
class TeamMessagesListResponse(BaseModel):
    """Schema for a list of team messages."""
    
    messages: List[TeamMessageResponse] = Field(..., description="List of team messages")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "messages": [
                    {
                        "message_id": "123e4567-e89b-12d3-a456-426614174000",
                        "team_id": "223e4567-e89b-12d3-a456-426614174000",
                        "sender_id": "323e4567-e89b-12d3-a456-426614174000",
                        "content": "Don't forget to submit your assignments!",
                        "sent_at": "2026-01-20T10:15:30Z"
                    },
                    {
                        "message_id": "423e4567-e89b-12d3-a456-426614174000",
                        "team_id": "223e4567-e89b-12d3-a456-426614174000",
                        "sender_id": "523e4567-e89b-12d3-a456-426614174000",
                        "content": "Meeting at 5 PM today.",
                        "sent_at": "2026-01-20T11:00:00Z"
                    }
                ]
            }]
        }
    }
# ============================================================================
