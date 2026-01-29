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
    retriever = Retriever(embedder, vector_store)
    results = await retriever.retrieve(
        query="How to avoid phone distractions?",
        top_k=5,
        context={"user_id": "123", "recent_distractions": ["phone", "social_media"]}
    )
"""
