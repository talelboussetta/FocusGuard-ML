"""
Embeddings Module

Converts text into dense vector representations for semantic search using OpenAI.

Features:
- OpenAI text-embedding-3-small (1536 dimensions) - Recommended
- OpenAI text-embedding-3-large (3072 dimensions) - Higher quality
- Automatic batching for efficiency
- Retry logic for reliability
- Token usage tracking

Example usage:
    ```python
    from rag.embeddings import get_embedder
    
    # Get singleton instance (uses config from .env)
    embedder = get_embedder()
    
    # Single text
    vector = await embedder.embed_text("How to improve focus?")
    
    # Batch processing
    vectors = await embedder.embed_batch([
        "Focus tip 1",
        "Focus tip 2",
        "Focus tip 3"
    ])
    ```
"""

from .base_embedder import BaseEmbedder
from .sentence_transformer_embedder import SentenceTransformerEmbedder
from .config import get_embedder, initialize_embedder, reset_embedder

# Conditional import - only available if openai package is installed
try:
    from .openai_embedder import OpenAIEmbedder
    OPENAI_AVAILABLE = True
except ImportError:
    OpenAIEmbedder = None  # type: ignore
    OPENAI_AVAILABLE = False


__all__ = [
    "BaseEmbedder",
    "OpenAIEmbedder",
    "SentenceTransformerEmbedder",
    "get_embedder",
    "initialize_embedder",
    "reset_embedder",
    "OPENAI_AVAILABLE",
]
