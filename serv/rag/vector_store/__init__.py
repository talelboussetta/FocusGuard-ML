"""
Vector Store Module

Stores and retrieves embeddings for semantic search using Qdrant.

Qdrant provides:
- Fast vector similarity search with HNSW algorithm
- Metadata filtering for targeted retrieval
- Both local Docker and cloud deployment options
- Production-ready with built-in persistence

Example usage:
    ```python
    from rag.vector_store import create_vector_store
    
    # Create from config
    store = create_vector_store()
    await store.initialize()
    
    # Add documents
    await store.add_documents(docs, embeddings)
    
    # Search
    results = await store.search(query_embedding, top_k=5)
    ```
"""

from .base_store import BaseVectorStore, Document, SearchResult
from .qdrant_store import QdrantVectorStore


__all__ = [
    "BaseVectorStore",
    "Document", 
    "SearchResult",
    "QdrantVectorStore",
    "create_vector_store",
]


def create_vector_store(
    url: str = "http://localhost:6333",
    api_key: str = "",
    collection_name: str = "focusguard_knowledge",
    vector_size: int = 1536,
) -> QdrantVectorStore:
    """
    Factory function to create a Qdrant vector store instance.
    
    Args:
        url: Qdrant server URL (default: local Docker)
        api_key: API key for Qdrant Cloud (empty for local)
        collection_name: Collection name for storing vectors
        vector_size: Embedding dimension (1536 for OpenAI text-embedding-3-small)
        
    Returns:
        Configured QdrantVectorStore instance
        
    Example:
        ```python
        # Local Docker (development)
        store = create_vector_store()
        
        # Qdrant Cloud (production)
        store = create_vector_store(
            url="https://xxx.qdrant.io",
            api_key="your-api-key"
        )
        ```
    """
    return QdrantVectorStore(
        url=url,
        api_key=api_key if api_key else None,
        collection_name=collection_name,
        vector_size=vector_size,
    )
