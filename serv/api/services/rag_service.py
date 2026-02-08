"""
RAG Service

Business logic for RAG (Retrieval-Augmented Generation) queries.
Coordinates retrieval from vector store and generation from LLM.
"""

import logging
import re
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from api.schemas.rag import RAGQueryResponse, SourceDocument


logger = logging.getLogger(__name__)


class RAGService:
    """Handles RAG query processing."""
    
    def __init__(self):
        self.embedder = None
        self.vector_store = None
        self.retriever = None
        self.generator = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize RAG components (embedder, vector store, retriever, generator)."""
        if self._initialized:
            return
        
        logger.info("[RAG] Initializing RAG service...")
        
        try:
            # Lazy import to avoid loading heavy dependencies at module import time
            from rag.embeddings.sentence_transformer_embedder import SentenceTransformerEmbedder
            from rag.vector_store.qdrant_store import QdrantVectorStore
            from rag.retrieval.retriever import Retriever
            from rag.generation.config import get_generator
            
            # Initialize embedder
            logger.info("[RAG] Loading sentence transformer embedder...")
            self.embedder = SentenceTransformerEmbedder()
            logger.info(f"[RAG] Embedder loaded: dimension={self.embedder.dimension}")
            
            # Initialize vector store
            logger.info("[RAG] Connecting to Qdrant vector store...")
        except Exception as e:
            logger.error(f"[RAG] Fatal error during initialization: {e}", exc_info=True)
            raise
        self.vector_store = QdrantVectorStore(
            url="http://localhost:6333",
            collection_name="focusguard_knowledge",
            vector_size=self.embedder.dimension
        )
        await self.vector_store.initialize()
        
        # Initialize retriever
        logger.info("Initializing retriever...")
        self.retriever = Retriever(
            embedder=self.embedder,
            vector_store=self.vector_store,
            enable_preprocessing=True,
            min_score_threshold=0.3  # Filter low-relevance results
        )
        
        # Initialize generator
        logger.info("Loading LLM generator...")
        self.generator = get_generator()
        
        self._initialized = True
        logger.info("✅ RAG service initialized successfully")
    
    async def query(
        self,
        query: str,
        top_k: int = 3,
        category_filter: Optional[str] = None,
        include_sources: bool = True,
        user_id: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> RAGQueryResponse:
        """
        Process RAG query: retrieve relevant docs + generate answer.
        
        Args:
            query: User's question
            top_k: Number of context documents to retrieve
            category_filter: Optional category filter (e.g., 'focus_productivity')
            include_sources: Whether to include source documents in response
            user_id: Optional authenticated user ID for personalized responses
            db: Optional database session for fetching user stats
        
        Returns:
            RAGQueryResponse with generated answer and optional sources
        """
        if not self._initialized:
            await self.initialize()
        
        logger.info(f"[RAG Query] Starting: '{query[:100]}...' (top_k={top_k}, user_id={user_id or 'anonymous'})")
        
        # Check if this is a stats/analytics query
        is_stats_query = self._is_stats_query(query)
        user_stats_context = None
        
        if is_stats_query and user_id and db:
            logger.info(f"[RAG Query] Detected stats query - fetching user data for user_id={user_id}")
            user_stats_context = await self._fetch_user_stats(user_id, db)
        
        # Build metadata filter if category specified
        filter_metadata = None
        if category_filter:
            filter_metadata = {"category": category_filter}
            logger.info(f"Filtering by category: {category_filter}")
        
        # Check if knowledge base is empty
        try:
            collection_info = await self.vector_store.get_collection_info()
            doc_count = collection_info.get('points_count', 0)
            
            if doc_count == 0:
                logger.warning("Knowledge base is empty - returning helpful message")
                
                # Return a helpful message explaining how to populate the knowledge base
                empty_kb_message = """I'm your AI productivity coach, but it looks like the knowledge base is empty right now.

To enable AI-powered coaching, please run the knowledge base ingestion:

**Steps:**
1. Open a terminal
2. Navigate to the `serv` directory
3. Run: `python -m rag.ingest_knowledge_base`
4. Wait for all documents to be ingested

Once complete, I'll be able to provide personalized productivity tips, focus strategies, and study guidance based on 40+ research-backed documents!

In the meantime, here's some general advice: The Pomodoro Technique (25 minutes of focused work followed by 5-minute breaks) is a great starting point for improving focus and productivity."""
                
                return RAGQueryResponse(
                    answer=empty_kb_message,
                    sources=[] if include_sources else None,
                    query=query,
                    model_used="system_message"
                )
        except Exception as e:
            logger.error(f"Failed to check document count: {e}")
            # Continue with normal flow if health check fails
        
        try:
            # Retrieve relevant documents
            search_results = await self.retriever.retrieve(
                query=query,
                top_k=top_k,
                filter_metadata=filter_metadata
            )
            
            # Check if this is a conversational/greeting query (low relevance scores)
            is_conversational = not search_results or (search_results and search_results[0].score < 0.5)
            
            if not search_results or is_conversational:
                # For conversational queries or no matches, use LLM without context
                logger.info(f"Handling conversational/general query (best score: {search_results[0].score if search_results else 'N/A'})")
                
                # Import here to avoid circular dependency
                from rag.generation.prompts import PRODUCTIVITY_COACH_PROMPT
                
                # Create a simple prompt for conversational queries
                conversational_prompt = f"""{PRODUCTIVITY_COACH_PROMPT}

User Message: {query}

Respond naturally and helpfully. If it's a greeting, introduce yourself warmly. If it's a question you can help with, provide guidance."""
                
                answer = await self.generator.generate(
                    query=query,
                    context_documents=[conversational_prompt],
                    system_prompt=""
                )
                
                return RAGQueryResponse(
                    answer=answer,
                    sources=[] if include_sources else None,
                    query=query,
                    model_used=self.generator.model if self.generator else "conversational"
                )
            
            logger.info(f"Retrieved {len(search_results)} documents (scores: {[f'{r.score:.3f}' for r in search_results]})")
            
            # Extract context documents for LLM
            context_docs = [result.document.content for result in search_results]
            
            # If stats query with user data, build specialized stats prompt
            if is_stats_query and user_stats_context:
                logger.info("Building stats analysis prompt with user data")
                from rag.generation.prompts import build_stats_analysis_prompt
                
                stats_prompt = build_stats_analysis_prompt(
                    query=query,
                    user_stats=user_stats_context,
                    context_documents=context_docs[:2]  # Include top 2 relevant tips
                )
                
                # Generate personalized stats analysis
                answer = await self.generator.generate(
                    query=query,
                    context_documents=[stats_prompt],
                    system_prompt=""
                )
            else:
                # Generate answer using LLM with knowledge base context
                logger.info("Generating answer with LLM...")
                answer = await self.generator.generate(
                    query=query,
                    context_documents=context_docs
                )
            
            logger.info(f"Generated answer ({len(answer)} chars)")
            
            # Build source documents if requested
            sources = None
            if include_sources:
                sources = [
                    SourceDocument(
                        content=result.document.content[:300] + "..." if len(result.document.content) > 300 else result.document.content,
                        source=result.document.metadata.get('source', 'unknown'),
                        section_title=result.document.metadata.get('section_title', 'N/A'),
                        score=result.score,
                        category=result.document.metadata.get('category')
                    )
                    for result in search_results
                ]
            
            return RAGQueryResponse(
                answer=answer,
                sources=sources,
                query=query,
                model_used=self.generator.model if self.generator else "unknown"
            )
            
        except Exception as e:
            logger.error(
                f"[RAG Query] FAILED - Error processing query: {str(e)}",
                exc_info=True,
                extra={
                    "query": query[:200],
                    "user_id": user_id,
                    "top_k": top_k,
                    "category_filter": category_filter,
                    "error_type": type(e).__name__,
                }
            )
            # Re-raise to be handled by route
            raise
    
    async def query_with_conversation(
        self,
        query: str,
        conversation_history: List[dict] = None,
        top_k: int = 3,
        category_filter: Optional[str] = None,
        include_sources: bool = True,
        user_id: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> RAGQueryResponse:
        """
        Process RAG query with conversation context for memory-aware responses.
        
        Args:
            query: Current user question
            conversation_history: Previous messages [{"role": "user"/"assistant", "content": "..."}]
            top_k: Number of knowledge base documents to retrieve
            category_filter: Optional category filter
            include_sources: Whether to include source documents
            user_id: Optional user ID for personalization
            db: Optional database session
        
        Returns:
            RAGQueryResponse with context-aware answer
        """
        if not self._initialized:
            await self.initialize()
        
        logger.info(
            f"[RAG Query w/ Conversation] query='{query[:80]}...', "
            f"history_length={len(conversation_history) if conversation_history else 0}, "
            f"user_id={user_id or 'anon'}"
        )
        
        # Check for stats query
        is_stats_query = self._is_stats_query(query)
        user_stats_context = None
        
        if is_stats_query and user_id and db:
            user_stats_context = await self._fetch_user_stats(user_id, db)
        
        # Build metadata filter
        filter_metadata = {"category": category_filter} if category_filter else None
        
        try:
            # Retrieve relevant documents
            search_results = await self.retriever.retrieve(
                query=query,
                top_k=top_k,
                filter_metadata=filter_metadata
            )
            
            logger.info(f"Retrieved {len(search_results)} documents (scores: {[f'{r.score:.3f}' for r in search_results]})")
            
            # Check if conversational query (low relevance or no results)
            is_conversational = not search_results or (search_results and search_results[0].score < 0.5)
            
            if is_conversational and not is_stats_query:
                logger.info("Handling conversational query with history")
                from rag.generation.prompts import build_conversation_aware_prompt, PRODUCTIVITY_COACH_PROMPT
                
                prompt = build_conversation_aware_prompt(
                    query=query,
                    context_documents=[],
                    conversation_history=conversation_history,
                    system_prompt=PRODUCTIVITY_COACH_PROMPT
                )
                
                answer = await self.generator.generate(
                    query=query,
                    context_documents=[prompt],
                    system_prompt=""
                )
                
                return RAGQueryResponse(
                    answer=answer,
                    sources=[],
                    query=query,
                    model_used=self.generator.model if self.generator else "conversational"
                )
            
            # Extract context documents
            context_docs = [result.document.content for result in search_results]
            
            # Build prompt with conversation context
            from rag.generation.prompts import build_conversation_aware_prompt, build_stats_analysis_prompt
            
            if is_stats_query and user_stats_context:
                # Stats query with conversation awareness
                stats_prompt = build_stats_analysis_prompt(
                    query=query,
                    user_stats=user_stats_context,
                    context_documents=context_docs[:2]
                )
                
                # Add conversation context to stats prompt if available
                if conversation_history:
                    history_summary = "\n".join(
                        f"- {msg['role']}: {msg['content'][:100]}..." 
                        for msg in conversation_history[-3:]
                    )
                    stats_prompt += f"\n\nRecent Conversation:\n{history_summary}\n\nConsider the conversation context when providing insights."
                
                answer = await self.generator.generate(
                    query=query,
                    context_documents=[stats_prompt],
                    system_prompt=""
                )
            else:
                # Regular RAG with conversation context
                prompt = build_conversation_aware_prompt(
                    query=query,
                    context_documents=context_docs,
                    conversation_history=conversation_history
                )
                
                answer = await self.generator.generate(
                    query=query,
                    context_documents=[prompt],
                    system_prompt=""
                )
            
            # Build sources
            sources = None
            if include_sources and search_results:
                sources = [
                    SourceDocument(
                        content=result.document.content[:300] + "..." if len(result.document.content) > 300 else result.document.content,
                        source=result.document.metadata.get('source', 'unknown'),
                        section_title=result.document.metadata.get('section_title', 'N/A'),
                        score=result.score,
                        category=result.document.metadata.get('category')
                    )
                    for result in search_results
                ]
            
            return RAGQueryResponse(
                answer=answer,
                sources=sources,
                query=query,
                model_used=self.generator.model if self.generator else "unknown"
            )
            
        except Exception as e:
            logger.error(f"[RAG Query w/ Conversation] FAILED: {e}", exc_info=True)
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health status of all RAG components."""
        if not self._initialized:
            await self.initialize()
        
        # Check vector store document count
        try:
            info = await self.vector_store.get_collection_info()
            doc_count = info.get('points_count', 0)
        except Exception as e:
            logger.error(f"Vector store health check failed: {e}")
            doc_count = 0
        
        return {
            "status": "healthy" if self._initialized else "not_initialized",
            "embedder_ready": self.embedder is not None,
            "vector_store_ready": self.vector_store is not None,
            "generator_ready": self.generator is not None,
            "documents_count": doc_count
        }
    
    def _is_stats_query(self, query: str) -> bool:
        """
        Detect if query is asking for personal stats/analytics.
        
        Keywords: analyze, stats, trends, progress, how am i doing, performance, etc.
        """
        stats_keywords = [
            r'\b(analyze|analyse)\b.*\b(trend|stat|progress|performance)\b',
            r'\b(my|mine)\b.*\b(trend|stat|progress|performance|session)\b',
            r'\bhow\s+(am\s+i|have\s+i)\b.*\b(doing|performing|progressing)\b',
            r'\b(show|give|tell)\s+me\s+my\b',
            r'\bmy\s+(focus|productivity|distraction)\s+(pattern|trend|stat)\b',
            r'\b(recent|latest)\s+(session|progress|performance)\b'
        ]
        
        query_lower = query.lower()
        return any(re.search(pattern, query_lower) for pattern in stats_keywords)
    
    async def _fetch_user_stats(self, user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """
        Fetch comprehensive user statistics for personalized responses.
        
        Returns dict with:
        - total_sessions, completed_sessions
        - total_focus_minutes
        - current level, XP
        - recent session stats (last 7 days)
        - distraction patterns (if available)
        """
        from api.models.user import User
        from api.models.session import Session
        from api.models.user_stats import UserStats
        
        try:
            # Get user info (User model uses 'id' not 'user_id')
            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            
            if not user:
                return {}
            
            # Get user stats
            stats_result = await db.execute(select(UserStats).where(UserStats.user_id == user_id))
            user_stats = stats_result.scalar_one_or_none()
            
            # Get session counts
            total_sessions_result = await db.execute(
                select(func.count(Session.id)).where(Session.user_id == user_id)
            )
            total_sessions = total_sessions_result.scalar() or 0
            
            completed_sessions_result = await db.execute(
                select(func.count(Session.id)).where(
                    Session.user_id == user_id,
                    Session.completed == True
                )
            )
            completed_sessions = completed_sessions_result.scalar() or 0
            
            # Get recent sessions (last 7 days)
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            recent_sessions_result = await db.execute(
                select(Session).where(
                    Session.user_id == user_id,
                    Session.created_at >= seven_days_ago
                ).order_by(Session.created_at.desc())
            )
            recent_sessions = recent_sessions_result.scalars().all()
            
            # Calculate focus time from recent sessions
            recent_focus_minutes = sum(
                (s.duration_minutes or 0) for s in recent_sessions if s.completed
            )
            
            # Calculate average blink rate (indicator of screen time / focus quality)
            blink_rates = [s.blink_rate for s in recent_sessions if s.blink_rate]
            avg_blink_rate = sum(blink_rates) / len(blink_rates) if blink_rates else None
            
            return {
                "username": user.username,
                "level": user.lvl,
                "xp_points": user.xp_points,
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "completion_rate": round((completed_sessions / total_sessions * 100), 1) if total_sessions > 0 else 0,
                "total_focus_minutes": user_stats.total_focus_time if user_stats else 0,
                "current_streak": user_stats.current_streak if user_stats else 0,
                "longest_streak": user_stats.longest_streak if user_stats else 0,
                "last_7_days": {
                    "sessions_count": len(recent_sessions),
                    "completed_count": len([s for s in recent_sessions if s.completed]),
                    "focus_minutes": recent_focus_minutes,
                    "avg_blink_rate": round(avg_blink_rate, 2) if avg_blink_rate else None
                }
            }
        except Exception as e:
            logger.error(f"Error fetching user stats: {e}")
            return {}


# Singleton instance
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get singleton RAG service instance."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
