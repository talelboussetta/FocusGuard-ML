"""
Conversation Service

Business logic for AI Tutor conversation management and memory.
"""

import logging
import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from datetime import datetime
from uuid import UUID

from api.models.conversation import Conversation, ConversationMessage
from api.models.user import User
from api.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationMessageResponse,
)
from api.utils.exceptions import NotFoundException, ForbiddenException


logger = logging.getLogger(__name__)


class ConversationService:
    """Handles conversation persistence and retrieval."""
    
    @staticmethod
    async def create_conversation(
        db: AsyncSession,
        user_id: UUID,
        title: Optional[str] = None
    ) -> Conversation:
        """
        Create a new conversation for a user.
        
        Args:
            db: Database session
            user_id: User UUID
            title: Optional conversation title (auto-generated if None)
        
        Returns:
            Created conversation
        """
        conversation = Conversation(
            user_id=user_id,
            title=title
        )
        
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        
        logger.info(f"Created conversation {conversation.id} for user {user_id}")
        return conversation
    
    @staticmethod
    async def get_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        include_messages: bool = True
    ) -> Conversation:
        """
        Get a conversation by ID with permission check.
        
        Args:
            db: Database session
            conversation_id: Conversation UUID
            user_id: Requesting user UUID
            include_messages: Whether to load messages
        
        Returns:
            Conversation with optional messages
        
        Raises:
            NotFoundException: Conversation not found
            ForbiddenException: User doesn't own conversation
        """
        query = select(Conversation).where(Conversation.id == conversation_id)
        result = await db.execute(query)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            raise NotFoundException(f"Conversation {conversation_id} not found")
        
        if conversation.user_id != user_id:
            raise ForbiddenException("You don't have access to this conversation")
        
        if include_messages:
            # Force load messages relationship
            await db.refresh(conversation, ["messages"])
        
        return conversation
    
    @staticmethod
    async def list_conversations(
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> ConversationListResponse:
        """
        List all conversations for a user.
        
        Args:
            db: Database session
            user_id: User UUID
            skip: Pagination offset
            limit: Maximum results
        
        Returns:
            List of conversations with count
        """
        # Get total count
        count_query = select(func.count(Conversation.id)).where(Conversation.user_id == user_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()
        
        # Get conversations
        query = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        conversations = result.scalars().all()
        
        # Build responses with message counts
        conversation_responses = []
        for conv in conversations:
            # Count messages
            msg_count_query = select(func.count(ConversationMessage.id)).where(
                ConversationMessage.conversation_id == conv.id
            )
            msg_count_result = await db.execute(msg_count_query)
            msg_count = msg_count_result.scalar_one()
            
            conv_response = ConversationResponse(
                id=conv.id,
                user_id=conv.user_id,
                title=conv.title,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=msg_count
            )
            conversation_responses.append(conv_response)
        
        return ConversationListResponse(
            conversations=conversation_responses,
            total=total
        )
    
    @staticmethod
    async def add_user_message(
        db: AsyncSession,
        conversation_id: UUID,
        content: str
    ) -> ConversationMessage:
        """
        Add a user message to a conversation.
        
        Args:
            db: Database session
            conversation_id: Conversation UUID
            content: Message content
        
        Returns:
            Created message
        """
        message = ConversationMessage(
            conversation_id=conversation_id,
            role="user",
            content=content
        )
        
        db.add(message)
        
        # Update conversation timestamp
        update_query = (
            select(Conversation)
            .where(Conversation.id == conversation_id)
        )
        result = await db.execute(update_query)
        conversation = result.scalar_one()
        conversation.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(message)
        
        return message
    
    @staticmethod
    async def add_assistant_message(
        db: AsyncSession,
        conversation_id: UUID,
        content: str,
        model_used: str,
        sources: Optional[List[dict]] = None
    ) -> ConversationMessage:
        """
        Add an assistant message to a conversation.
        
        Args:
            db: Database session
            conversation_id: Conversation UUID
            content: Message content
            model_used: LLM model identifier
            sources: Optional list of source documents used
        
        Returns:
            Created message
        """
        message = ConversationMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=content,
            model_used=model_used,
            sources_used=json.dumps(sources) if sources else None
        )
        
        db.add(message)
        
        # Update conversation timestamp
        update_query = (
            select(Conversation)
            .where(Conversation.id == conversation_id)
        )
        result = await db.execute(update_query)
        conversation = result.scalar_one()
        conversation.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(message)
        
        return message
    
    @staticmethod
    async def get_conversation_context(
        db: AsyncSession,
        conversation_id: UUID,
        max_messages: int = 10
    ) -> List[dict]:
        """
        Get recent conversation messages for context.
        
        Args:
            db: Database session
            conversation_id: Conversation UUID
            max_messages: Maximum number of recent messages to retrieve
        
        Returns:
            List of message dicts with role and content
        """
        query = (
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation_id)
            .order_by(desc(ConversationMessage.created_at))
            .limit(max_messages)
        )
        result = await db.execute(query)
        messages = result.scalars().all()
        
        # Reverse to get chronological order
        messages = list(reversed(messages))
        
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
    
    @staticmethod
    async def auto_generate_title(
        db: AsyncSession,
        conversation_id: UUID,
        first_user_message: str
    ):
        """
        Auto-generate conversation title from first user message.
        
        Args:
            db: Database session
            conversation_id: Conversation UUID
            first_user_message: First message content
        """
        # Simple title generation: first 50 chars
        title = first_user_message[:50]
        if len(first_user_message) > 50:
            title += "..."
        
        query = select(Conversation).where(Conversation.id == conversation_id)
        result = await db.execute(query)
        conversation = result.scalar_one()
        conversation.title = title
        
        await db.commit()
    
    @staticmethod
    async def delete_conversation(
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID
    ):
        """
        Delete a conversation.
        
        Args:
            db: Database session
            conversation_id: Conversation UUID
            user_id: User UUID (for permission check)
        
        Raises:
            NotFoundException: Conversation not found
            ForbiddenException: User doesn't own conversation
        """
        conversation = await ConversationService.get_conversation(
            db, conversation_id, user_id, include_messages=False
        )
        
        await db.delete(conversation)
        await db.commit()
        
        logger.info(f"Deleted conversation {conversation_id}")
