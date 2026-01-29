"""
Embeddings Module

Converts text into dense vector representations for semantic search.

Common approaches:
- OpenAI Embeddings API (text-embedding-3-small, text-embedding-3-large)
- HuggingFace models (sentence-transformers/all-MiniLM-L6-v2)
- Local models for privacy (all-mpnet-base-v2)

Example usage:
    embedder = OpenAIEmbedder(model="text-embedding-3-small")
    vector = embedder.embed("How to improve focus during work?")
"""
