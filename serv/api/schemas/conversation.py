"""
Conversation Schemas

Pydantic models for AI Tutor conversation API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class ConversationMessageCreate(BaseModel):
    """Create a new message in a conversation."""
    content: str = Field(..., min_length=1, max_length=5000, description="Message content")


class ConversationMessageResponse(BaseModel):
    """Individual conversation message."""
    id: UUID
    role: str  # 'user' or 'assistant'
    content: str
    model_used: Optional[str] = None
    sources_used: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    """Create a new conversation."""
    title: Optional[str] = Field(None, max_length=200)


class ConversationResponse(BaseModel):
    """Conversation with messages."""
    id: UUID
    user_id: UUID
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int = Field(default=0, description="Number of messages in conversation")
    
    model_config = {"from_attributes": True}


class ConversationDetailResponse(ConversationResponse):
    """Detailed conversation with all messages."""
    messages: List[ConversationMessageResponse] = []
    
    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    """List of conversations."""
    conversations: List[ConversationResponse]
    total: int


class ConversationQueryRequest(BaseModel):
    """Request to query AI Tutor with conversation context."""
    query: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[UUID] = Field(None, description="Existing conversation ID for context")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of knowledge base docs to retrieve")
    include_sources: bool = Field(default=True, description="Include source documents in response")


class ConversationQueryResponse(BaseModel):
    """AI Tutor response with conversation context."""
    conversation_id: UUID
    message_id: UUID
    answer: str
    sources: Optional[List[dict]] = None
    model_used: str
