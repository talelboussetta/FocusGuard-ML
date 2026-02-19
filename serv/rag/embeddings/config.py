"""
Embeddings Configuration & Initialization

Provides singleton access to the embedder using app config.
"""

from typing import Optional, Union
import logging

from api.config import settings
from .sentence_transformer_embedder import SentenceTransformerEmbedder
from .base_embedder import BaseEmbedder

# Conditional import - only available if openai package is installed
try:
    from .openai_embedder import OpenAIEmbedder
    OPENAI_AVAILABLE = True
except ImportError:
    OpenAIEmbedder = None  # type: ignore
    OPENAI_AVAILABLE = False


logger = logging.getLogger(__name__)


# Singleton instance
_embedder: Optional[Union[OpenAIEmbedder, SentenceTransformerEmbedder]] = None


def get_embedder() -> BaseEmbedder:
    """
    Get or create the global embedder instance.
    
    Uses configuration from api.config.settings.
    Chooses between OpenAI (cloud) or SentenceTransformer (local) based on config.
    Thread-safe singleton pattern.
    
    Returns:
        Configured embedder instance (OpenAI or SentenceTransformer)
        
    Raises:
        ValueError: If configuration is invalid
        
    Example:
        ```python
        from rag.embeddings import get_embedder
        
        embedder = get_embedder()
        vector = await embedder.embed_text("How to focus?")
        ```
    """
    global _embedder
    
    if _embedder is None:
        if settings.use_local_embeddings:
            # Use free local embeddings (sentence-transformers)
            _embedder = SentenceTransformerEmbedder(
                model_name=settings.sentence_transformer_model,
                device=settings.sentence_transformer_device,
                batch_size=32,
            )
            logger.info(
                f"Created LOCAL embedder: {settings.sentence_transformer_model} "
                f"(dimension: {_embedder.dimension}, device: {settings.sentence_transformer_device})"
            )
        else:
            # Use OpenAI embeddings (requires API key and openai package)
            if not OPENAI_AVAILABLE:
                raise ImportError(
                    "OpenAI package not installed. "
                    "Install with 'pip install openai' or set USE_LOCAL_EMBEDDINGS=True to use local embeddings."
                )
            
            if not settings.openai_api_key:
                raise ValueError(
                    "OPENAI_API_KEY not configured. "
                    "Please set it in your .env file or set USE_LOCAL_EMBEDDINGS=True"
                )
            
            _embedder = OpenAIEmbedder(
                api_key=settings.openai_api_key,
                model=settings.openai_embedding_model,
                batch_size=100,
            )
            logger.info(
                f"Created OPENAI embedder: {settings.openai_embedding_model} "
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
