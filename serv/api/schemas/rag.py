"""
RAG Query Schemas

Pydantic models for RAG endpoint requests and responses.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class RAGQueryRequest(BaseModel):
    """Request model for RAG query endpoint."""
    
    query: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="User's question or query",
        examples=["How do I avoid phone distractions during study?"]
    )
    
    top_k: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of context documents to retrieve"
    )
    
    include_sources: bool = Field(
        default=True,
        description="Whether to include source documents in response"
    )
    
    category_filter: Optional[str] = Field(
        default=None,
        description="Filter by knowledge base category (e.g., 'focus_productivity', 'study_techniques')",
        examples=["focus_productivity", "time_management"]
    )


class SourceDocument(BaseModel):
    """Metadata about a source document used in the response."""
    
    content: str = Field(description="Snippet of the source document")
    source: str = Field(description="Filename of the source document")
    section_title: str = Field(description="Section title within the document")
    score: float = Field(description="Relevance score (0.0 - 1.0)")
    category: Optional[str] = Field(default=None, description="Document category")


class RAGQueryResponse(BaseModel):
    """Response model for RAG query endpoint."""
    
    answer: str = Field(description="Generated response from the LLM")
    
    sources: Optional[List[SourceDocument]] = Field(
        default=None,
        description="Source documents used to generate the answer"
    )
    
    query: str = Field(description="Original user query")
    
    model_used: str = Field(description="LLM model that generated the response")


class RAGHealthResponse(BaseModel):
    """Health check response for RAG system."""
    
    status: str = Field(description="Overall RAG system status")
    embedder_ready: bool = Field(description="Embedding model loaded")
    vector_store_ready: bool = Field(description="Vector store connected")
    generator_ready: bool = Field(description="LLM generator available")
    documents_count: int = Field(description="Number of documents in vector store")
