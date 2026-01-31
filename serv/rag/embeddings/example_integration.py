"""
Quick Integration Example for FocusGuard Embeddings

Demonstrates how to use embeddings in the FocusGuard RAG pipeline.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from rag.embeddings import get_embedder


async def main():
    """Quick integration demo."""
    
    print("="*70)
    print("FocusGuard Embeddings - Quick Integration Example")
    print("="*70)
    
    # Example focus-related content from knowledge base
    focus_tips = [
        "Use the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break.",
        "Eliminate distractions by turning off notifications during deep work sessions.",
        "Create a dedicated workspace free from interruptions.",
        "Practice mindfulness meditation to improve concentration.",
        "Break large tasks into smaller, manageable chunks.",
    ]
    
    # User query
    user_query = "How can I avoid getting distracted by my phone?"
    
    print(f"\n📝 Knowledge Base ({len(focus_tips)} tips loaded)")
    print(f"🔍 User Query: \"{user_query}\"\n")
    
    # Get embedder (automatically uses config from .env)
    embedder = get_embedder()
    print(f"🤖 Using: {type(embedder).__name__}")
    print(f"📊 Dimension: {embedder.dimension}")
    
    # Embed knowledge base
    print(f"\n⚙️  Embedding knowledge base...")
    kb_vectors = await embedder.embed_batch(focus_tips)
    print(f"✅ Embedded {len(kb_vectors)} tips")
    
    # Embed user query
    print(f"\n⚙️  Embedding user query...")
    query_vector = await embedder.embed_text(user_query)
    print(f"✅ Query embedded (dimension: {len(query_vector)})")
    
    # Calculate similarities (simple dot product for normalized vectors)
    print(f"\n📈 Calculating similarities...")
    import numpy as np
    
    def cosine_similarity(v1, v2):
        a, b = np.array(v1), np.array(v2)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    similarities = []
    for i, kb_vec in enumerate(kb_vectors):
        sim = cosine_similarity(query_vector, kb_vec)
        similarities.append((sim, i, focus_tips[i]))
    
    # Sort by similarity (highest first)
    similarities.sort(reverse=True, key=lambda x: x[0])
    
    # Display top 3 most relevant tips
    print(f"\n🎯 Top 3 Most Relevant Tips:\n")
    for rank, (score, idx, tip) in enumerate(similarities[:3], 1):
        print(f"{rank}. [{score:.4f}] {tip}")
    
    print(f"\n" + "="*70)
    print("✅ Integration Example Complete!")
    print("="*70)
    
    # Show how to use in a RAG endpoint
    print("\n💡 Usage in FastAPI Endpoint:")
    print("""
    @router.post("/rag/query")
    async def query_knowledge_base(query: str):
        # 1. Embed user query
        embedder = get_embedder()
        query_vec = await embedder.embed_text(query)
        
        # 2. Retrieve top-k from vector store (Qdrant)
        results = vector_store.search(query_vec, limit=3)
        
        # 3. Generate response using LLM + retrieved context
        response = await llm.generate(query, context=results)
        
        return {"answer": response, "sources": results}
    """)


if __name__ == "__main__":
    asyncio.run(main())
