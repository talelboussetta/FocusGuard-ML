"""
Main retrieval logic for RAG pipeline.

Handles query embedding, vector search, and result filtering for FocusGuard's RAG system.
"""

from typing import List, Dict, Any, Optional
import logging
import re

from rag.embeddings.base_embedder import BaseEmbedder
from rag.vector_store.base_store import BaseVectorStore, SearchResult


logger = logging.getLogger(__name__)


class Retriever:
    """
    Handles the retrieval phase of RAG.
    
    Takes user queries and returns relevant documents from knowledge base.
    
    Workflow:
        1. Preprocess query (optional: expand with synonyms, fix typos)
        2. Embed query using embedder
        3. Search vector store for similar documents
        4. Post-process results (re-rank, deduplicate, filter)
        
    Example:
        retriever = Retriever(embedder=openai_embedder, vector_store=chroma_store)
        
        # Simple retrieval
        docs = await retriever.retrieve("how to focus better?", top_k=5)
        
        # With user context for personalization
        docs = await retriever.retrieve(
            query="tips for morning sessions",
            context={"user_id": "123", "preferred_session_length": 25}
        )
    """
    
    def __init__(
        self,
        embedder: BaseEmbedder,
        vector_store: BaseVectorStore,
        enable_preprocessing: bool = True,
        min_score_threshold: float = 0.0,
    ):
        """
        Initialize retriever with embedding model and vector store.
        
        Args:
            embedder: Instance of BaseEmbedder for query embedding
            vector_store: Instance of BaseVectorStore for searching
            enable_preprocessing: Whether to clean/normalize queries
            min_score_threshold: Minimum similarity score to include results (0.0 - 1.0)
        """
        self.embedder = embedder
        self.vector_store = vector_store
        self.enable_preprocessing = enable_preprocessing
        self.min_score_threshold = min_score_threshold
        
        logger.info(
            f"Initialized Retriever: preprocessing={enable_preprocessing}, "
            f"min_score={min_score_threshold}"
        )
    
    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        context: Optional[Dict[str, Any]] = None,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[SearchResult]:
        """
        Retrieve relevant documents for a query.
        
        Args:
            query: User's question or search query
            top_k: Number of documents to return
            context: Optional user context for filtering/personalization
                     Example: {"user_id": "123", "session_type": "deep_work"}
            filter_metadata: Direct metadata filter for vector store
        
        Returns:
            List of SearchResult objects with relevant documents, sorted by score
            
        Example:
            ```python
            results = await retriever.retrieve(
                query="How to avoid phone distractions?",
                top_k=3,
                context={"user_id": "123"}
            )
            
            for result in results:
                print(f"Score: {result.score:.3f}")
                print(f"Content: {result.document.content}")
                print(f"Metadata: {result.document.metadata}")
            ```
        """
        logger.info(f"Retrieving documents for query: '{query[:50]}...'")
        
        # Step 1: Preprocess query
        processed_query = self._preprocess_query(query) if self.enable_preprocessing else query
        logger.debug(f"Processed query: '{processed_query}'")
        
        # Step 2: Embed the query
        query_embedding = await self.embedder.embed_text(processed_query)
        logger.debug(f"Query embedded: {len(query_embedding)} dimensions")
        
        # Step 3: Build metadata filter
        combined_filter = self._build_filter(context, filter_metadata)
        
        # Step 4: Search vector store
        results = await self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k,
            filter_metadata=combined_filter
        )
        
        logger.info(f"Retrieved {len(results)} documents before filtering")
        
        # Step 5: Post-process (filter by score, deduplicate)
        filtered_results = self._post_process(results)
        
        logger.info(f"Returning {len(filtered_results)} documents after filtering")
        return filtered_results
    
    def _preprocess_query(self, query: str) -> str:
        """
        Clean and normalize the query text.
        
        Preprocessing steps:
        - Strip whitespace
        - Remove extra spaces
        - Remove special characters (keep letters, numbers, spaces)
        - Lowercase (optional, embeddings usually handle this)
        
        Args:
            query: Raw user query
            
        Returns:
            Cleaned query string
        """
        # Strip and normalize whitespace
        cleaned = query.strip()
        cleaned = re.sub(r'\s+', ' ', cleaned)
        
        # Remove control characters but keep punctuation
        cleaned = re.sub(r'[\x00-\x1F\x7F]', '', cleaned)
        
        return cleaned
    
    def _build_filter(
        self,
        context: Optional[Dict[str, Any]],
        filter_metadata: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Build metadata filter from context and explicit filter.
        
        Args:
            context: User context (e.g., {"user_id": "123", "category": "focus"})
            filter_metadata: Explicit metadata filter
            
        Returns:
            Combined filter dict or None
            
        Example:
            context = {"user_id": "123"}
            filter_metadata = {"category": "focus_tips"}
            → {"user_id": "123", "category": "focus_tips"}
        """
        combined = {}
        
        # Add context filters
        if context:
            # Extract relevant context fields for filtering
            filterable_fields = ["user_id", "category", "tags", "session_id"]
            for field in filterable_fields:
                if field in context:
                    combined[field] = context[field]
        
        # Add explicit filters (overrides context)
        if filter_metadata:
            combined.update(filter_metadata)
        
        return combined if combined else None
    
    def _post_process(self, results: List[SearchResult]) -> List[SearchResult]:
        """
        Apply post-processing to search results.
        
        Current processing:
        - Filter by minimum score threshold
        - Remove exact duplicates (same content)
        
        Future enhancements:
        - Re-rank with cross-encoder model
        - Diversify results (MMR - Maximal Marginal Relevance)
        - Apply business rules (e.g., prioritize recent content)
        
        Args:
            results: Raw search results from vector store
            
        Returns:
            Filtered and processed results
        """
        # Filter by minimum score
        filtered = [r for r in results if r.score >= self.min_score_threshold]
        
        if len(filtered) < len(results):
            logger.debug(
                f"Filtered {len(results) - len(filtered)} results "
                f"below threshold {self.min_score_threshold}"
            )
        
        # Remove exact duplicates (same document ID)
        seen_ids = set()
        deduplicated = []
        for result in filtered:
            doc_id = result.document.id
            if doc_id not in seen_ids:
                seen_ids.add(doc_id)
                deduplicated.append(result)
        
        if len(deduplicated) < len(filtered):
            logger.debug(f"Removed {len(filtered) - len(deduplicated)} duplicate documents")
        
        return deduplicated
    
    async def retrieve_with_reranking(
        self,
        query: str,
        top_k: int = 5,
        rerank_top_k: int = 20,
        context: Optional[Dict[str, Any]] = None,
    ) -> List[SearchResult]:
        """
        Retrieve documents with two-stage retrieval (fetch many, rerank, return top).
        
        Useful when you want higher recall in initial search, then rerank for precision.
        
        Args:
            query: User's question
            top_k: Final number of documents to return
            rerank_top_k: Number of documents to fetch for reranking
            context: User context
            
        Returns:
            Top-k reranked results
            
        Note: Currently just retrieves top-k from rerank_top_k.
              Future: Add cross-encoder reranking model.
        """
        # Fetch more documents than needed
        results = await self.retrieve(
            query=query,
            top_k=rerank_top_k,
            context=context
        )
        
        # TODO: Implement actual reranking with cross-encoder
        # For now, just return top-k from the initial results
        return results[:top_k]
