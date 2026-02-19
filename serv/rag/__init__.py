"""
RAG (Retrieval-Augmented Generation) Pipeline for FocusGuard

This module provides AI-powered insights by:
1. Embedding user queries and knowledge base documents
2. Retrieving relevant context from vector store
3. Generating personalized responses using LLM
"""

__all__ = [
    'embeddings',
    'vector_store',
    'retrieval',
    'generation',
]
