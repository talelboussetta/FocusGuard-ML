"""
Sentence Transformers Embeddings Implementation

Free, local text embeddings using HuggingFace sentence-transformers.
No API keys required, runs completely offline on CPU/GPU.
"""

from typing import List, Optional
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor

from sentence_transformers import SentenceTransformer

from .base_embedder import BaseEmbedder


logger = logging.getLogger(__name__)


class SentenceTransformerEmbedder(BaseEmbedder):
    """
    Free local embedder using sentence-transformers (HuggingFace).
    
    Features:
    - 100% free and open source
    - Runs completely offline (no API calls)
    - CPU and GPU support
    - Automatic batching
    - Multiple model options
    
    Recommended Models:
    - all-MiniLM-L6-v2: 384 dims, fast, good quality (RECOMMENDED)
    - all-mpnet-base-v2: 768 dims, slower, better quality
    - all-MiniLM-L12-v2: 384 dims, balanced
    
    Example:
        embedder = SentenceTransformerEmbedder(
            model_name='all-MiniLM-L6-v2'
        )
        
        # Single text
        vector = await embedder.embed_text('How to focus better?')
        
        # Batch
        vectors = await embedder.embed_batch(['tip 1', 'tip 2'])
    """
    
    # Model dimensions (verified from HuggingFace)
    MODEL_DIMENSIONS = {
        'all-MiniLM-L6-v2': 384,
        'all-mpnet-base-v2': 768,
        'all-MiniLM-L12-v2': 384,
        'paraphrase-MiniLM-L6-v2': 384,
        'paraphrase-mpnet-base-v2': 768,
    }
    
    def __init__(
        self,
        model_name: str = 'all-MiniLM-L6-v2',
        device: Optional[str] = None,
        batch_size: int = 32,
        show_progress: bool = False,
    ):
        if model_name not in self.MODEL_DIMENSIONS:
            logger.warning(
                f'Model {model_name} not in known models. '
                f'Dimension will be detected automatically.'
            )
        
        self.model_name = model_name
        self.batch_size = batch_size
        self.show_progress = show_progress
        
        # Load model (downloads on first use)
        logger.info(f'Loading sentence-transformer model: {model_name}')
        self.model = SentenceTransformer(model_name, device=device)
        
        # Auto-detect dimension
        self._dimension = self.model.get_sentence_embedding_dimension()
        
        # Thread pool for async execution
        self._executor = ThreadPoolExecutor(max_workers=1)
        
        logger.info(
            f'Initialized SentenceTransformerEmbedder: '
            f'model={model_name}, dimension={self._dimension}, '
            f'device={self.model.device}'
        )
    
    @property
    def dimension(self) -> int:
        return self._dimension
    
    async def embed_text(self, text: str) -> List[float]:
        vectors = await self.embed_batch([text])
        return vectors[0]
    
    async def embed_batch(
        self,
        texts: List[str],
        show_progress: bool = False
    ) -> List[List[float]]:
        if not texts:
            logger.warning('Empty text list provided')
            return []
        
        # Run in thread pool (sentence-transformers is synchronous)
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            self._executor,
            self._encode_sync,
            texts,
            show_progress or self.show_progress
        )
        
        # Convert numpy to lists
        embeddings_list = [emb.tolist() for emb in embeddings]
        
        logger.info(f'Embedded {len(texts)} texts using {self.model_name}')
        
        return embeddings_list
    
    def _encode_sync(
        self,
        texts: List[str],
        show_progress: bool
    ) -> List:
        return self.model.encode(
            texts,
            batch_size=self.batch_size,
            show_progress_bar=show_progress,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
    
    def get_model_info(self) -> dict:
        return {
            'model_name': self.model_name,
            'dimension': self._dimension,
            'device': str(self.model.device),
            'max_sequence_length': self.model.max_seq_length,
            'batch_size': self.batch_size,
        }
    
    def __repr__(self) -> str:
        return (
            f'SentenceTransformerEmbedder('
            f'model={self.model_name}, '
            f'dimension={self._dimension}, '
            f'device={self.model.device})'
        )
    
    def __del__(self):
        if hasattr(self, '_executor'):
            self._executor.shutdown(wait=False)
