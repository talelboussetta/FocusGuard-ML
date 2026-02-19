"""
Vector Store Module

Stores and retrieves embeddings for semantic search using Supabase (pgvector).
"""

from .base_store import BaseVectorStore, Document, SearchResult
from .supabase_store import SupabaseVectorStore


__all__ = [
    "BaseVectorStore",
    "Document", 
    "SearchResult",
    "SupabaseVectorStore",
]
