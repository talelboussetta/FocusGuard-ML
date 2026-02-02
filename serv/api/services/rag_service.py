"""
RAG Service

Business logic for RAG (Retrieval-Augmented Generation) queries.
Coordinates retrieval from vector store and generation from LLM.
"""

import logging
from typing import List, Optional, Dict, Any

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
        
        logger.info("Initializing RAG service...")
        
        # Lazy import to avoid loading heavy dependencies at module import time
        from rag.embeddings.sentence_transformer_embedder import SentenceTransformerEmbedder
        from rag.vector_store.qdrant_store import QdrantVectorStore
        from rag.retrieval.retriever import Retriever
        from rag.generation.config import get_generator
        
        # Initialize embedder
        logger.info("Loading embedder...")
        self.embedder = SentenceTransformerEmbedder()
        
        # Initialize vector store
        logger.info("Connecting to Qdrant...")
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
        include_sources: bool = True
    ) -> RAGQueryResponse:
        """
        Process RAG query: retrieve relevant docs + generate answer.
        
        Args:
            query: User's question
            top_k: Number of context documents to retrieve
            category_filter: Optional category filter (e.g., 'focus_productivity')
            include_sources: Whether to include source documents in response
        
        Returns:
            RAGQueryResponse with generated answer and optional sources
        """
        if not self._initialized:
            await self.initialize()
        
        logger.info(f"Processing RAG query: '{query}' (top_k={top_k})")
        
        # Build metadata filter if category specified
        filter_metadata = None
        if category_filter:
            filter_metadata = {"category": category_filter}
            logger.info(f"Filtering by category: {category_filter}")
        
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
        
        # Generate answer using LLM
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


# Singleton instance
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get singleton RAG service instance."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
