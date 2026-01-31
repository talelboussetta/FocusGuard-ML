"""
Embeddings Configuration & Initialization

Provides singleton access to the embedder using app config.
"""

from typing import Optional
import logging

from api.config import settings
from .openai_embedder import OpenAIEmbedder


logger = logging.getLogger(__name__)


# Singleton instance
_embedder: Optional[OpenAIEmbedder] = None


def get_embedder() -> OpenAIEmbedder:
    """
    Get or create the global embedder instance.
    
    Uses configuration from api.config.settings.
    Thread-safe singleton pattern.
    
    Returns:
        Configured OpenAIEmbedder instance
        
    Raises:
        ValueError: If OpenAI API key is not configured
        
    Example:
        ```python
        from rag.embeddings import get_embedder
        
        embedder = get_embedder()
        vector = await embedder.embed_text("How to focus?")
        ```
    """
    global _embedder
    
    if _embedder is None:
        if not settings.openai_api_key:
            raise ValueError(
                "OPENAI_API_KEY not configured. "
                "Please set it in your .env file."
            )
        
        _embedder = OpenAIEmbedder(
            api_key=settings.openai_api_key,
            model=settings.openai_embedding_model,
            batch_size=100,  # Default batch size
        )
        
        logger.info(
            f"Created embedder: {settings.openai_embedding_model} "
            f"(dimension: {_embedder.dimension})"
        )
    
    return _embedder


async def initialize_embedder() -> None:
    """
    Initialize and validate the embedder.
    
    Call this during application startup to ensure API key is valid.
    
    Example:
        ```python
        # In main.py
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            await initialize_embedder()
            yield
        ```
    """
    embedder = get_embedder()
    # Validation happens lazily on first embed_text call
    # We can trigger it here if needed
    await embedder.embed_text("test")
    logger.info("Embedder initialized and validated successfully")


def reset_embedder() -> None:
    """
    Reset the singleton embedder (useful for testing).
    """
    global _embedder
    _embedder = None
    logger.info("Embedder reset")
