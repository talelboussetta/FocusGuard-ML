"""
Base class for vector storage systems.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class Document:
    """
    Represents a document in the knowledge base.
    
    Attributes:
        id: Unique identifier
        content: The actual text content
        embedding: Vector representation (optional, computed by embedder)
        metadata: Additional info (source file, category, user_id, etc.)
    """
    id: str
    content: str
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = None


@dataclass
class SearchResult:
    """
    Result from vector similarity search.
    
    Attributes:
        document: The matched document
        score: Similarity score (higher = more relevant)
        rank: Position in result list (0 = best match)
    """
    document: Document
    score: float
    rank: int


class BaseVectorStore(ABC):
    """
    Abstract interface for vector storage and retrieval.
    """
    
    @abstractmethod
    async def add_documents(
        self,
        documents: List[Document],
        embeddings: List[List[float]]
    ) -> None:
        """
        Store documents with their embeddings.
        
        Args:
            documents: List of Document objects with content and metadata
            embeddings: Corresponding vector embeddings for each document
        """
        pass
    
    @abstractmethod
    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """
        Find most similar documents to query.
        
        Args:
            query_embedding: Vector representation of the query
            top_k: Number of results to return
            filter_metadata: Optional filters (e.g., {"category": "focus_tips"})
            
        Returns:
            List of SearchResult objects, sorted by relevance
        """
        pass
    
    @abstractmethod
    async def delete_by_id(self, document_id: str) -> bool:
        """
        Remove a document from the store.
        
        Args:
            document_id: Unique identifier of document to delete
            
        Returns:
            True if deleted, False if not found
        """
        pass
    
    @abstractmethod
    async def clear(self) -> None:
        """
        Remove all documents from the store.
        """
        pass
