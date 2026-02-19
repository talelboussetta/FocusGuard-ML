"""
Retrieval Module

Orchestrates the process of finding relevant documents for a query.

Responsibilities:
- Query preprocessing (cleaning, expanding, rewriting)
- Embedding the query
- Searching the vector store
- Re-ranking results (optional)
- Filtering and deduplication

Example usage:
    ```python
    from rag.retrieval import Retriever
    from rag.embeddings import get_embedder
    from rag.vector_store import create_vector_store
    
    # Initialize components
    embedder = get_embedder()
    vector_store = create_vector_store()
    await vector_store.initialize()
    
    # Create retriever
    retriever = Retriever(embedder, vector_store)
    
    # Retrieve documents
    results = await retriever.retrieve(
        query="How to avoid phone distractions?",
        top_k=5,
        context={"user_id": "123"}
    )
    
    # Process results
    for result in results:
        print(f"Score: {result.score:.3f}")
        print(f"Content: {result.document.content}")
    ```
"""

from .retriever import Retriever

__all__ = ["Retriever"]
