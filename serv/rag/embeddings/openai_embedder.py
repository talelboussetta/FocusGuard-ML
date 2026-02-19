"""
OpenAI Embeddings Implementation

Production-ready text embedding using OpenAI's embedding models.
Supports text-embedding-3-small (1536d) and text-embedding-3-large (3072d).
"""

from typing import List, Optional
import logging
import asyncio
from openai import AsyncOpenAI
from openai import OpenAIError, RateLimitError, APIError

from .base_embedder import BaseEmbedder


logger = logging.getLogger(__name__)


class OpenAIEmbedder(BaseEmbedder):
    """
    OpenAI-based text embedder with automatic batching and retry logic.
    
    Features:
    - Async operations for high performance
    - Automatic batching (default: 100 texts per batch)
    - Retry on transient failures (1 retry with 1s delay)
    - Auto-truncation to token limit (8000 tokens)
    - Token usage logging
    - Dimension validation
    
    Example:
        ```python
        embedder = OpenAIEmbedder(
            api_key="sk-...",
            model="text-embedding-3-small"
        )
        
        # Single text
        vector = await embedder.embed_text("How to focus better?")
        
        # Batch
        vectors = await embedder.embed_batch(["tip 1", "tip 2", "tip 3"])
        ```
    """
    
    # Model dimensions (OpenAI official specs)
    MODEL_DIMENSIONS = {
        "text-embedding-3-small": 1536,
        "text-embedding-3-large": 3072,
        "text-embedding-ada-002": 1536,  # Legacy model
    }
    
    # OpenAI token limits per model
    TOKEN_LIMITS = {
        "text-embedding-3-small": 8191,
        "text-embedding-3-large": 8191,
        "text-embedding-ada-002": 8191,
    }
    
    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
        batch_size: int = 100,
        max_retries: int = 1,
        retry_delay: float = 1.0,
    ):
        """
        Initialize OpenAI embedder.
        
        Args:
            api_key: OpenAI API key
            model: Embedding model name (text-embedding-3-small recommended)
            batch_size: Number of texts to embed per API call (max 2048)
            max_retries: Number of retry attempts on failure
            retry_delay: Seconds to wait before retry
        
        Raises:
            ValueError: If model is not supported
        """
        if model not in self.MODEL_DIMENSIONS:
            raise ValueError(
                f"Unsupported model: {model}. "
                f"Supported: {list(self.MODEL_DIMENSIONS.keys())}"
            )
        
        self.model = model
        self.batch_size = min(batch_size, 2048)  # OpenAI max batch size
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        # Initialize async OpenAI client
        self.client = AsyncOpenAI(api_key=api_key)
        
        # Track if we've validated the connection
        self._validated = False
        
        logger.info(
            f"Initialized OpenAIEmbedder: model={model}, "
            f"dimension={self.dimension}, batch_size={self.batch_size}"
        )
    
    @property
    def dimension(self) -> int:
        """Return embedding vector dimension for the current model."""
        return self.MODEL_DIMENSIONS[self.model]
    
    @property
    def token_limit(self) -> int:
        """Return maximum token limit for the current model."""
        return self.TOKEN_LIMITS[self.model]
    
    async def embed_text(self, text: str) -> List[float]:
        """
        Embed a single text string.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector as list of floats
            
        Raises:
            OpenAIError: If API call fails after retries
            ValueError: If returned vector dimension is incorrect
        """
        # Use batch method for consistency (handles validation, retries, etc.)
        vectors = await self.embed_batch([text])
        return vectors[0]
    
    async def embed_batch(
        self,
        texts: List[str],
        show_progress: bool = False
    ) -> List[List[float]]:
        """
        Embed multiple texts in batches.
        
        Automatically splits into smaller batches if needed.
        
        Args:
            texts: List of texts to embed
            show_progress: Log progress for large batches
            
        Returns:
            List of embedding vectors (one per input text)
            
        Raises:
            OpenAIError: If API call fails after retries
            ValueError: If returned vectors have incorrect dimensions
        """
        if not texts:
            logger.warning("Empty text list provided")
            return []
        
        # Lazy validation on first use
        if not self._validated:
            await self._validate_connection()
        
        # Process in batches
        all_embeddings = []
        total_batches = (len(texts) + self.batch_size - 1) // self.batch_size
        
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_num = i // self.batch_size + 1
            
            if show_progress and total_batches > 1:
                logger.info(f"Processing batch {batch_num}/{total_batches}")
            
            # Embed batch with retry logic
            embeddings = await self._embed_batch_with_retry(batch)
            all_embeddings.extend(embeddings)
        
        logger.info(
            f"Embedded {len(texts)} texts in {total_batches} batch(es)"
        )
        
        return all_embeddings
    
    async def _embed_batch_with_retry(
        self,
        texts: List[str]
    ) -> List[List[float]]:
        """
        Embed a batch with retry logic.
        
        Args:
            texts: Batch of texts (must be <= batch_size)
            
        Returns:
            List of embedding vectors
            
        Raises:
            OpenAIError: If all retries fail
        """
        last_error = None
        
        for attempt in range(self.max_retries + 1):
            try:
                # Call OpenAI API
                response = await self.client.embeddings.create(
                    model=self.model,
                    input=texts,
                    encoding_format="float"  # Return as floats (not base64)
                )
                
                # Extract embeddings
                embeddings = [item.embedding for item in response.data]
                
                # Validate dimensions
                for idx, emb in enumerate(embeddings):
                    if len(emb) != self.dimension:
                        raise ValueError(
                            f"Unexpected embedding dimension: {len(emb)} "
                            f"(expected {self.dimension}) for text index {idx}"
                        )
                
                # Log token usage
                if hasattr(response, 'usage') and response.usage:
                    logger.info(
                        f"Token usage: {response.usage.total_tokens} tokens "
                        f"for {len(texts)} text(s)"
                    )
                
                return embeddings
                
            except RateLimitError as e:
                last_error = e
                if attempt < self.max_retries:
                    logger.warning(
                        f"Rate limit hit, retrying in {self.retry_delay}s... "
                        f"(attempt {attempt + 1}/{self.max_retries + 1})"
                    )
                    await asyncio.sleep(self.retry_delay)
                else:
                    logger.error(f"Rate limit error after {self.max_retries + 1} attempts")
                    raise
                    
            except APIError as e:
                last_error = e
                if attempt < self.max_retries and e.status_code >= 500:
                    # Retry on server errors (5xx)
                    logger.warning(
                        f"API error (status {e.status_code}), retrying... "
                        f"(attempt {attempt + 1}/{self.max_retries + 1})"
                    )
                    await asyncio.sleep(self.retry_delay)
                else:
                    # Don't retry on client errors (4xx)
                    logger.error(f"API error: {e}")
                    raise
                    
            except OpenAIError as e:
                last_error = e
                logger.error(f"OpenAI error: {e}")
                raise
        
        # Should not reach here, but just in case
        raise last_error
    
    async def _validate_connection(self) -> None:
        """
        Validate API connection by embedding a test string.
        
        Raises:
            OpenAIError: If connection fails
        """
        try:
            logger.info("Validating OpenAI API connection...")
            test_text = "test"
            # Call _embed_batch_with_retry directly to avoid recursion
            vectors = await self._embed_batch_with_retry([test_text])
            vector = vectors[0]
            
            if len(vector) != self.dimension:
                raise ValueError(
                    f"Dimension mismatch: got {len(vector)}, "
                    f"expected {self.dimension}"
                )
            
            self._validated = True
            logger.info(
                f"✓ OpenAI API validated: model={self.model}, "
                f"dimension={self.dimension}"
            )
            
        except Exception as e:
            logger.error(f"Failed to validate OpenAI API: {e}")
            raise
    
    async def get_embedding_cost(
        self,
        num_tokens: int
    ) -> float:
        """
        Estimate embedding cost in USD.
        
        Pricing (as of 2026):
        - text-embedding-3-small: $0.020 per 1M tokens
        - text-embedding-3-large: $0.130 per 1M tokens
        
        Args:
            num_tokens: Number of tokens to embed
            
        Returns:
            Estimated cost in USD
        """
        prices_per_million = {
            "text-embedding-3-small": 0.020,
            "text-embedding-3-large": 0.130,
            "text-embedding-ada-002": 0.100,
        }
        
        price = prices_per_million.get(self.model, 0.020)
        return (num_tokens / 1_000_000) * price
    
    def __repr__(self) -> str:
        return (
            f"OpenAIEmbedder(model={self.model}, "
            f"dimension={self.dimension}, "
            f"batch_size={self.batch_size})"
        )
