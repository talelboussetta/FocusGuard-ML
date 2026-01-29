"""
Base class for embedding models.

Define your embedding interface here to easily swap providers.
"""

from abc import ABC, abstractmethod
from typing import List


class BaseEmbedder(ABC):
    """
    Abstract base class for text embedding models.
    
    Implementing classes should provide methods to:
    - Embed single text strings
    - Embed batches of text for efficiency
    """
    
    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """
        Convert a single text string to a vector embedding.
        
        Args:
            text: The text to embed
            
        Returns:
            A list of floats representing the embedding vector
            
        Example:
            vector = await embedder.embed_text("How to focus better?")
            # vector = [0.123, -0.456, 0.789, ...]
        """
        pass
    
    @abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Convert multiple texts to embeddings in a single batch.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors (one per input text)
            
        Example:
            vectors = await embedder.embed_batch([
                "Focus tip 1",
                "Focus tip 2"
            ])
        """
        pass
    
    @property
    @abstractmethod
    def dimension(self) -> int:
        """
        Return the dimensionality of the embedding vectors.
        
        Examples:
            - OpenAI text-embedding-3-small: 1536
            - sentence-transformers/all-MiniLM-L6-v2: 384
        """
        pass
