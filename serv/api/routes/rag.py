"""
RAG Query Routes

Endpoints for RAG (Retrieval-Augmented Generation) system.
Provides AI-powered answers to study and productivity questions.
"""

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from api.schemas.rag import RAGQueryRequest, RAGQueryResponse, RAGHealthResponse
from api.services.rag_service import get_rag_service
from api.utils.exceptions import RAGServiceException


router = APIRouter(prefix="/rag", tags=["RAG"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/query", response_model=RAGQueryResponse)
@limiter.limit("20/minute")  # Prevent abuse of LLM API
async def query_rag(
    request: Request,
    query_request: RAGQueryRequest
):
    """
    Query the RAG system with a study/productivity question.
    
    The system will:
    1. Search the knowledge base for relevant information
    2. Use an LLM to generate a helpful, contextualized answer
    3. Return the answer with source citations
    
    **Rate limit:** 20 requests/minute
    
    **Example Request:**
    ```json
    {
        "query": "How do I avoid phone distractions during study sessions?",
        "top_k": 3,
        "include_sources": true,
        "category_filter": "focus_productivity"
    }
    ```
    
    **Example Response:**
    ```json
    {
        "answer": "To avoid phone distractions during study sessions...",
        "sources": [
            {
                "content": "# Focus and Productivity\\n\\n## Distraction Management...",
                "source": "focus_productivity.md",
                "section_title": "Distraction Management Strategies",
                "score": 0.87,
                "category": "focus_productivity"
            }
        ],
        "query": "How do I avoid phone distractions during study sessions?",
        "model_used": "mistralai/Mistral-7B-Instruct-v0.2"
    }
    ```
    """
    try:
        rag_service = get_rag_service()
        
        response = await rag_service.query(
            query=query_request.query,
            top_k=query_request.top_k,
            category_filter=query_request.category_filter,
            include_sources=query_request.include_sources
        )
        
        return response
        
    except RAGServiceException as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"RAG query failed: {str(e)}"
        )


@router.get("/health", response_model=RAGHealthResponse)
async def rag_health():
    """
    Check health status of RAG system components.
    
    Returns status of:
    - Embedding model (local SentenceTransformer)
    - Vector store (Qdrant connection)
    - LLM generator (HuggingFace API)
    - Knowledge base document count
    
    **Example Response:**
    ```json
    {
        "status": "healthy",
        "embedder_ready": true,
        "vector_store_ready": true,
        "generator_ready": true,
        "documents_count": 87
    }
    ```
    """
    try:
        rag_service = get_rag_service()
        health_data = await rag_service.health_check()
        
        return RAGHealthResponse(**health_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"RAG health check failed: {str(e)}"
        )


@router.post("/initialize")
@limiter.limit("5/hour")  # Prevent abuse
async def initialize_rag(request: Request):
    """
    Manually trigger RAG service initialization.
    
    Useful for:
    - Preloading models on server startup
    - Reinitializing after configuration changes
    
    **Rate limit:** 5 requests/hour
    
    **Note:** Initialization happens automatically on first query,
    this endpoint is optional.
    """
    try:
        rag_service = get_rag_service()
        await rag_service.initialize()
        
        return {
            "status": "initialized",
            "message": "RAG service initialized successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"RAG initialization failed: {str(e)}"
        )
