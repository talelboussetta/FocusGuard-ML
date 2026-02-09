"""
Conversation Routes

Endpoints for AI Tutor conversation management.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address
from uuid import UUID

from api.schemas.conversation import (
    ConversationListResponse,
    ConversationDetailResponse,
    ConversationResponse,
    ConversationQueryRequest,
    ConversationQueryResponse,
)
from api.services.conversation_service import ConversationService
from api.services.rag_service import get_rag_service
from api.database import get_db
from api.middleware.auth_middleware import get_current_user_id
from api.utils.exceptions import NotFoundException, ForbiddenException


router = APIRouter(prefix="/conversations", tags=["Conversations"])
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=ConversationListResponse)
@limiter.limit("30/minute")
async def list_conversations(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    List all conversations for the authenticated user.
    
    Returns conversations sorted by most recently updated first.
    Each conversation includes message count.
    
    **Rate limit:** 30 requests/minute
    """
    user_uuid = UUID(user_id)
    return await ConversationService.list_conversations(
        db=db,
        user_id=user_uuid,
        skip=skip,
        limit=limit
    )


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
@limiter.limit("30/minute")
async def get_conversation(
    request: Request,
    conversation_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific conversation with all messages.
    
    Returns full conversation history with messages in chronological order.
    
    **Rate limit:** 30 requests/minute
    """
    user_uuid = UUID(user_id)
    conversation = await ConversationService.get_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=user_uuid,
        include_messages=True
    )
    
    # Build response manually since we need to access relationships
    messages = [
        {
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "model_used": msg.model_used,
            "sources_used": msg.sources_used,
            "created_at": msg.created_at
        }
        for msg in conversation.messages
    ]
    
    return ConversationDetailResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=len(messages),
        messages=messages
    )


@router.post("/query", response_model=ConversationQueryResponse)
@limiter.limit("20/minute")
async def query_with_conversation(
    request: Request,
    query_request: ConversationQueryRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Query the AI Tutor with conversation context.
    
    If conversation_id is provided, loads conversation history for context.
    If not, creates a new conversation.
    
    The system will:
    1. Load conversation history (if exists)
    2. Search knowledge base for relevant documents
    3. Generate context-aware response with conversation memory
    4. Save messages to conversation
    5. Auto-generate title from first user message
    
    **Authentication:** Required
    **Rate limit:** 20 requests/minute
    
    **Example Request:**
    ```json
    {
        "query": "What are some good study techniques?",
        "conversation_id": "uuid-here-or-null",
        "top_k": 3,
        "include_sources": true
    }
    ```
    """
    user_uuid = UUID(user_id)
    rag_service = get_rag_service()
    
    # Get or create conversation
    conversation_id = query_request.conversation_id
    if conversation_id:
        # Verify user owns this conversation
        conversation = await ConversationService.get_conversation(
            db=db,
            conversation_id=conversation_id,
            user_id=user_uuid,
            include_messages=False
        )
    else:
        # Create new conversation
        conversation = await ConversationService.create_conversation(
            db=db,
            user_id=user_uuid
        )
        conversation_id = conversation.id
    
    # Add user message
    user_message = await ConversationService.add_user_message(
        db=db,
        conversation_id=conversation_id,
        content=query_request.query
    )
    
    # Get conversation history for context
    conversation_history = await ConversationService.get_conversation_context(
        db=db,
        conversation_id=conversation_id,
        max_messages=6
    )
    
    # Query RAG with conversation context (with timeout protection)
    try:
        rag_response = await rag_service.query_with_conversation(
            query=query_request.query,
            conversation_history=conversation_history,
            top_k=query_request.top_k,
            include_sources=query_request.include_sources,
            user_id=user_uuid,
            db=db
        )
    except Exception as rag_error:
        # If RAG service fails, return helpful error without crashing
        import logging
        logging.error(f"RAG service error: {rag_error}")
        raise HTTPException(
            status_code=503,
            detail="AI Tutor is currently initializing. Please try again in 30 seconds."
        )
    
    # Add assistant message
    sources_list = None
    if rag_response.sources:
        sources_list = [s.model_dump() for s in rag_response.sources]
    
    assistant_message = await ConversationService.add_assistant_message(
        db=db,
        conversation_id=conversation_id,
        content=rag_response.answer,
        model_used=rag_response.model_used,
        sources=sources_list
    )
    
    # Auto-generate title from first user message if needed
    if not conversation.title:
        await ConversationService.auto_generate_title(
            db=db,
            conversation_id=conversation_id,
            first_user_message=query_request.query
        )
    
    return ConversationQueryResponse(
        conversation_id=conversation_id,
        message_id=assistant_message.id,
        answer=rag_response.answer,
        sources=[s.model_dump() for s in rag_response.sources] if rag_response.sources else None,
        model_used=rag_response.model_used
    )


@router.delete("/{conversation_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_conversation(
    request: Request,
    conversation_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a conversation and all its messages.
    
    **Rate limit:** 10 requests/minute
    """
    user_uuid = UUID(user_id)
    await ConversationService.delete_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=user_uuid
    )
    return None
