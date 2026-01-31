"""
Vector Store Configuration & Initialization

Provides singleton access to the Qdrant vector store using app config.
"""

from typing import Optional
import logging

from api.config import settings
from .qdrant_store import QdrantVectorStore


logger = logging.getLogger(__name__)


# Singleton instance
_vector_store: Optional[QdrantVectorStore] = None


def get_vector_store() -> QdrantVectorStore:
    """
    Get or create the global vector store instance.
    
    Uses configuration from api.config.settings.
    Thread-safe singleton pattern.
    
    Returns:
        Configured QdrantVectorStore instance
        
    Example:
        ```python
        from rag.vector_store import get_vector_store
        
        store = get_vector_store()
        results = await store.search(embedding, top_k=5)
        ```
    """
    global _vector_store
    
    if _vector_store is None:
        _vector_store = QdrantVectorStore(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key if settings.qdrant_api_key else None,
            collection_name=settings.qdrant_collection_name,
            vector_size=settings.qdrant_vector_size,
        )
        logger.info(
            f"Created vector store: {settings.qdrant_url}/"
            f"{settings.qdrant_collection_name}"
        )
    
    return _vector_store


async def initialize_vector_store() -> None:
    """
    Initialize the vector store (create collection if needed).
    
    Call this during application startup (in main.py lifespan).
    
    Example:
        ```python
        # In main.py
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            await initialize_vector_store()
            yield
            await shutdown_vector_store()
        ```
    """
    store = get_vector_store()
    await store.initialize()
    logger.info("Vector store initialized successfully")


async def shutdown_vector_store() -> None:
    """
    Close vector store connection.
    
    Call this during application shutdown (in main.py lifespan).
    """
    global _vector_store
    
    if _vector_store is not None:
        await _vector_store.close()
        _vector_store = None
        logger.info("Vector store connection closed")
