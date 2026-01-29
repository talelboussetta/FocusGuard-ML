"""
Vector Store Module

Stores and retrieves embeddings for semantic search.

Popular options:
- ChromaDB: Simple, persistent, great for prototyping
- FAISS: Fast, in-memory, best for large-scale
- Pinecone: Managed cloud service
- Weaviate: Production-ready with filtering

Example usage:
    store = ChromaVectorStore(persist_directory="./chroma_db")
    await store.add_documents(docs, embeddings, metadata)
    results = await store.search(query_embedding, top_k=5)
"""
