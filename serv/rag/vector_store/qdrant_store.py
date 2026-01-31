"""
Qdrant Vector Store Implementation

Production-ready vector storage using Qdrant for FocusGuard RAG pipeline.
Supports both local Docker and Qdrant Cloud deployments.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from qdrant_client import QdrantClient, AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    SearchRequest,
)
from qdrant_client.http.exceptions import UnexpectedResponse

from .base_store import BaseVectorStore, Document, SearchResult


logger = logging.getLogger(__name__)


class QdrantVectorStore(BaseVectorStore):
    """
    Qdrant-based vector storage implementation.
    
    Features:
    - Async operations for high performance
    - Metadata filtering (category, user_id, session_id, tags)
    - Cosine similarity search
    - Automatic collection creation
    - Supports local Docker and Qdrant Cloud
    
    Example:
        ```python
        store = QdrantVectorStore(
            url="http://localhost:6333",
            collection_name="focusguard_knowledge",
            vector_size=1536
        )
        await store.initialize()
        await store.add_documents(documents, embeddings)
        results = await store.search(query_embedding, top_k=5)
        ```
    """
    
    def __init__(
        self,
        url: str = "http://localhost:6333",
        api_key: Optional[str] = None,
        collection_name: str = "focusguard_knowledge",
        vector_size: int = 1536,
        distance: Distance = Distance.COSINE,
    ):
        """
        Initialize Qdrant vector store.
        
        Args:
            url: Qdrant server URL (local: http://localhost:6333, cloud: https://xxx.qdrant.io)
            api_key: API key for Qdrant Cloud (leave None for local Docker)
            collection_name: Name of the collection to store vectors
            vector_size: Dimension of embedding vectors (1536 for text-embedding-3-small)
            distance: Distance metric (COSINE recommended for text embeddings)
        """
        self.url = url
        self.api_key = api_key
        self.collection_name = collection_name
        self.vector_size = vector_size
        self.distance = distance
        
        # Initialize async client
        self.client = AsyncQdrantClient(
            url=url,
            api_key=api_key,
            timeout=30.0,
        )
        
        logger.info(f"Initialized QdrantVectorStore: {url}/{collection_name}")
    
    async def initialize(self) -> None:
        """
        Create collection if it doesn't exist.
        
        Sets up:
        - Vector configuration (size, distance metric)
        - Payload indexing for metadata filtering
        
        Call this once during application startup.
        """
        try:
            # Check if collection exists
            collections = await self.client.get_collections()
            collection_exists = any(
                col.name == self.collection_name 
                for col in collections.collections
            )
            
            if collection_exists:
                logger.info(f"Collection '{self.collection_name}' already exists")
                return
            
            # Create collection with vector configuration
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=self.distance,
                ),
            )
            
            # Create payload indexes for efficient filtering
            # Index commonly filtered fields
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="category",
                field_schema="keyword",
            )
            
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="user_id",
                field_schema="keyword",
            )
            
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="session_id",
                field_schema="keyword",
            )
            
            logger.info(f"Created collection '{self.collection_name}' with indexes")
            
        except UnexpectedResponse as e:
            logger.error(f"Failed to initialize collection: {e}")
            raise
    
    async def add_documents(
        self,
        documents: List[Document],
        embeddings: List[List[float]]
    ) -> None:
        """
        Store documents with their embeddings in Qdrant.
        
        Args:
            documents: List of Document objects with content and metadata
            embeddings: Corresponding vector embeddings for each document
            
        Raises:
            ValueError: If documents and embeddings length mismatch
            UnexpectedResponse: If Qdrant operation fails
        """
        if len(documents) != len(embeddings):
            raise ValueError(
                f"Documents count ({len(documents)}) must match "
                f"embeddings count ({len(embeddings)})"
            )
        
        if not documents:
            logger.warning("No documents to add")
            return
        
        # Convert documents to Qdrant points
        points = []
        for doc, embedding in zip(documents, embeddings):
            # Prepare payload (metadata + content)
            payload = {
                "content": doc.content,
                "created_at": datetime.utcnow().isoformat(),
            }
            
            # Add metadata if present
            if doc.metadata:
                # Ensure metadata fields are properly typed
                metadata = doc.metadata.copy()
                
                # Handle tags as list of strings
                if "tags" in metadata and isinstance(metadata["tags"], list):
                    metadata["tags"] = [str(tag) for tag in metadata["tags"]]
                
                payload.update(metadata)
            
            points.append(
                PointStruct(
                    id=doc.id,  # Use document ID as point ID
                    vector=embedding,
                    payload=payload,
                )
            )
        
        # Batch upsert to Qdrant
        await self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )
        
        logger.info(f"Added {len(points)} documents to '{self.collection_name}'")
    
    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """
        Find most similar documents to query using vector similarity.
        
        Args:
            query_embedding: Vector representation of the query
            top_k: Number of results to return
            filter_metadata: Optional filters (e.g., {"category": "focus_tips"})
            
        Returns:
            List of SearchResult objects, sorted by relevance (highest score first)
            
        Example:
            ```python
            results = await store.search(
                query_embedding=[0.1, 0.2, ...],
                top_k=5,
                filter_metadata={"category": "focus_tips", "user_id": "user-123"}
            )
            ```
        """
        # Build Qdrant filter from metadata
        qdrant_filter = None
        if filter_metadata:
            conditions = []
            for key, value in filter_metadata.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value),
                    )
                )
            
            if conditions:
                qdrant_filter = Filter(must=conditions)
        
        # Perform vector search
        search_results = await self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=top_k,
            query_filter=qdrant_filter,
        )
        
        # Convert Qdrant results to SearchResult objects
        results = []
        for rank, hit in enumerate(search_results):
            # Extract payload
            payload = hit.payload
            content = payload.pop("content", "")
            created_at = payload.pop("created_at", None)
            
            # Remaining fields are metadata
            metadata = payload.copy()
            if created_at:
                metadata["created_at"] = created_at
            
            document = Document(
                id=str(hit.id),
                content=content,
                embedding=None,  # Don't return embeddings (large)
                metadata=metadata,
            )
            
            results.append(
                SearchResult(
                    document=document,
                    score=hit.score,
                    rank=rank,
                )
            )
        
        logger.info(
            f"Search returned {len(results)} results "
            f"(filter: {filter_metadata or 'none'})"
        )
        
        return results
    
    async def delete_by_id(self, document_id: str) -> bool:
        """
        Remove a document from the store.
        
        Args:
            document_id: Unique identifier of document to delete
            
        Returns:
            True if deleted, False if not found
        """
        try:
            # Attempt to delete point by ID
            await self.client.delete(
                collection_name=self.collection_name,
                points_selector=[document_id],
            )
            logger.info(f"Deleted document '{document_id}'")
            return True
            
        except UnexpectedResponse as e:
            logger.warning(f"Failed to delete document '{document_id}': {e}")
            return False
    
    async def clear(self) -> None:
        """
        Remove all documents from the store.
        
        WARNING: This deletes the entire collection and recreates it.
        Use with caution!
        """
        try:
            # Delete collection
            await self.client.delete_collection(
                collection_name=self.collection_name
            )
            logger.info(f"Deleted collection '{self.collection_name}'")
            
            # Recreate empty collection
            await self.initialize()
            logger.info(f"Recreated empty collection '{self.collection_name}'")
            
        except UnexpectedResponse as e:
            logger.error(f"Failed to clear collection: {e}")
            raise
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """
        Get information about the collection (points count, config, etc.).
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            info = await self.client.get_collection(
                collection_name=self.collection_name
            )
            
            return {
                "name": self.collection_name,
                "points_count": info.points_count,
                "vector_size": self.vector_size,
                "distance": self.distance.name,
                "status": info.status.name,
            }
            
        except UnexpectedResponse as e:
            logger.error(f"Failed to get collection info: {e}")
            return {}
    
    async def close(self) -> None:
        """
        Close the Qdrant client connection.
        
        Call this during application shutdown.
        """
        await self.client.close()
        logger.info("Closed QdrantVectorStore connection")
