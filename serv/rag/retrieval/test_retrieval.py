"""
Comprehensive Tests for Retrieval Module

Tests the full retrieval pipeline with embeddings and vector store integration.
"""

import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from rag.retrieval import Retriever
from rag.embeddings import SentenceTransformerEmbedder
from rag.vector_store import QdrantVectorStore, Document


# ============================================================================
# Test Setup
# ============================================================================

async def setup_test_environment():
    """Create embedder and vector store for testing."""
    # Use local embeddings (free, no API key needed)
    embedder = SentenceTransformerEmbedder(
        model_name='all-MiniLM-L6-v2',
        batch_size=8
    )
    
    # Use test collection in Qdrant
    vector_store = QdrantVectorStore(
        url="http://localhost:6333",
        collection_name="test_retrieval",
        vector_size=384,  # all-MiniLM-L6-v2 dimension
    )
    
    # Initialize and clear collection
    await vector_store.initialize()
    await vector_store.clear()  # Clear existing data if any
    
    return embedder, vector_store


async def populate_test_data(embedder, vector_store):
    """Add sample focus tips to vector store."""
    
    focus_tips = [
        {
            "id": "tip-1",
            "content": "Use the Pomodoro Technique: work for 25 minutes, then take a 5-minute break. This helps maintain focus and prevents burnout.",
            "metadata": {"category": "time_management", "tags": ["pomodoro", "breaks"]}
        },
        {
            "id": "tip-2",
            "content": "Turn off all notifications on your phone and computer during deep work sessions. Distractions break your flow state.",
            "metadata": {"category": "distraction_management", "tags": ["notifications", "phone"]}
        },
        {
            "id": "tip-3",
            "content": "Create a dedicated workspace that signals to your brain it's time for focused work. Keep it clean and organized.",
            "metadata": {"category": "environment", "tags": ["workspace", "organization"]}
        },
        {
            "id": "tip-4",
            "content": "Practice mindfulness meditation for 10 minutes daily to improve your concentration and reduce mental chatter.",
            "metadata": {"category": "wellness", "tags": ["meditation", "mindfulness"]}
        },
        {
            "id": "tip-5",
            "content": "Break large tasks into smaller, manageable chunks. This makes work less overwhelming and easier to start.",
            "metadata": {"category": "productivity", "tags": ["task_management", "planning"]}
        },
        {
            "id": "tip-6",
            "content": "Use website blockers to prevent access to social media during work hours. Apps like Freedom or Cold Turkey can help.",
            "metadata": {"category": "distraction_management", "tags": ["social_media", "tools"]}
        },
        {
            "id": "tip-7",
            "content": "Schedule your most important work during your peak energy hours, typically morning for most people.",
            "metadata": {"category": "time_management", "tags": ["scheduling", "energy"]}
        },
    ]
    
    # Create documents
    documents = [
        Document(
            id=tip["id"],
            content=tip["content"],
            metadata=tip["metadata"]
        )
        for tip in focus_tips
    ]
    
    # Embed and store
    print(f"Embedding {len(documents)} documents...")
    embeddings = await embedder.embed_batch([doc.content for doc in documents])
    await vector_store.add_documents(documents, embeddings)
    
    print(f"✅ Populated {len(documents)} test documents\n")


# ============================================================================
# Test Cases
# ============================================================================

async def test_basic_retrieval():
    """Test basic retrieval without filters."""
    print("="*70)
    print("TEST: Basic Retrieval")
    print("="*70)
    
    embedder, vector_store = await setup_test_environment()
    await populate_test_data(embedder, vector_store)
    
    retriever = Retriever(embedder, vector_store)
    
    query = "How can I avoid getting distracted by my phone?"
    print(f"Query: {query}\n")
    
    results = await retriever.retrieve(query, top_k=3)
    
    print(f"Retrieved {len(results)} results:\n")
    for i, result in enumerate(results, 1):
        print(f"{i}. [Score: {result.score:.4f}]")
        print(f"   Content: {result.document.content[:80]}...")
        print(f"   Metadata: {result.document.metadata}\n")
    
    # Validate
    assert len(results) > 0, "Should retrieve at least one result"
    assert results[0].score > 0.3, "Top result should have decent similarity"
    
    # Check if phone-related tip is in top results
    top_contents = [r.document.content for r in results]
    assert any("notification" in c.lower() or "phone" in c.lower() for c in top_contents), \
        "Should retrieve phone/notification related tips"
    
    print("✅ PASSED: Basic retrieval\n")
    
    # Cleanup
    await vector_store.clear()
    return True


async def test_metadata_filtering():
    """Test retrieval with metadata filters."""
    print("="*70)
    print("TEST: Metadata Filtering")
    print("="*70)
    
    embedder, vector_store = await setup_test_environment()
    await populate_test_data(embedder, vector_store)
    
    retriever = Retriever(embedder, vector_store)
    
    query = "Tips for better focus"
    filter_metadata = {"category": "time_management"}
    
    print(f"Query: {query}")
    print(f"Filter: {filter_metadata}\n")
    
    results = await retriever.retrieve(
        query,
        top_k=5,
        filter_metadata=filter_metadata
    )
    
    print(f"Retrieved {len(results)} results:\n")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.document.metadata['category']}: {result.document.content[:60]}...")
    
    # Validate all results match filter
    for result in results:
        assert result.document.metadata["category"] == "time_management", \
            f"Result should match filter category"
    
    print("\n✅ PASSED: Metadata filtering\n")
    
    await vector_store.clear()
    return True


async def test_score_threshold():
    """Test minimum score filtering."""
    print("="*70)
    print("TEST: Score Threshold Filtering")
    print("="*70)
    
    embedder, vector_store = await setup_test_environment()
    await populate_test_data(embedder, vector_store)
    
    # Create retriever with minimum score threshold
    retriever = Retriever(
        embedder,
        vector_store,
        min_score_threshold=0.4  # Only return results with >0.4 similarity
    )
    
    query = "random unrelated text xyz123"  # Should have low similarity
    print(f"Query (intentionally unrelated): {query}\n")
    
    results = await retriever.retrieve(query, top_k=10)
    
    print(f"Retrieved {len(results)} results with score >= 0.4\n")
    
    # Validate all results meet threshold
    for result in results:
        assert result.score >= 0.4, f"Score {result.score} below threshold 0.4"
        print(f"  Score: {result.score:.4f} - {result.document.content[:50]}...")
    
    print("\n✅ PASSED: Score threshold filtering\n")
    
    await vector_store.clear()
    return True


async def test_query_preprocessing():
    """Test query preprocessing (cleaning, normalization)."""
    print("="*70)
    print("TEST: Query Preprocessing")
    print("="*70)
    
    embedder, vector_store = await setup_test_environment()
    await populate_test_data(embedder, vector_store)
    
    retriever = Retriever(embedder, vector_store, enable_preprocessing=True)
    
    # Query with extra whitespace and special characters
    messy_query = "  How   to avoid   phone\ndistractions???  \t  "
    print(f"Raw query: '{messy_query}'")
    
    # Internal preprocessing test
    cleaned = retriever._preprocess_query(messy_query)
    print(f"Cleaned query: '{cleaned}'")
    
    assert "  " not in cleaned, "Should remove extra spaces"
    assert "\n" not in cleaned, "Should remove newlines"
    assert "\t" not in cleaned, "Should remove tabs"
    
    # Test retrieval still works
    results = await retriever.retrieve(messy_query, top_k=3)
    assert len(results) > 0, "Should retrieve results despite messy query"
    
    print(f"\nRetrieved {len(results)} results from preprocessed query")
    print("\n✅ PASSED: Query preprocessing\n")
    
    await vector_store.clear()
    return True


async def test_context_filtering():
    """Test context-based filtering."""
    print("="*70)
    print("TEST: Context-Based Filtering")
    print("="*70)
    
    embedder, vector_store = await setup_test_environment()
    await populate_test_data(embedder, vector_store)
    
    retriever = Retriever(embedder, vector_store)
    
    query = "productivity tips"
    context = {"category": "wellness"}  # Only wellness tips
    
    print(f"Query: {query}")
    print(f"Context filter: {context}\n")
    
    results = await retriever.retrieve(query, top_k=5, context=context)
    
    print(f"Retrieved {len(results)} wellness-category results:\n")
    for result in results:
        print(f"  - {result.document.metadata['category']}: {result.document.content[:60]}...")
        assert result.document.metadata["category"] == "wellness"
    
    print("\n✅ PASSED: Context filtering\n")
    
    await vector_store.clear()
    return True


async def test_deduplication():
    """Test duplicate removal in results."""
    print("="*70)
    print("TEST: Result Deduplication")
    print("="*70)
    
    embedder, vector_store = await setup_test_environment()
    
    # Add same document twice with different IDs
    duplicate_content = "Test duplicate content for deduplication"
    documents = [
        Document(id="dup-1", content=duplicate_content, metadata={"version": "1"}),
        Document(id="dup-2", content=duplicate_content, metadata={"version": "2"}),
        Document(id="unique-1", content="Unique content here", metadata={}),
    ]
    
    embeddings = await embedder.embed_batch([doc.content for doc in documents])
    await vector_store.add_documents(documents, embeddings)
    
    retriever = Retriever(embedder, vector_store)
    
    results = await retriever.retrieve("test duplicate", top_k=5)
    
    # Check that IDs are unique (deduplication by ID works)
    ids = [r.document.id for r in results]
    unique_ids = set(ids)
    
    print(f"Total results: {len(results)}")
    print(f"Unique IDs: {len(unique_ids)}")
    print(f"Result IDs: {ids}")
    
    assert len(ids) == len(unique_ids), "Should deduplicate by ID"
    
    print("\n✅ PASSED: Deduplication\n")
    
    await vector_store.clear()
    return True


async def test_empty_results():
    """Test handling of no matching results."""
    print("="*70)
    print("TEST: Empty Results Handling")
    print("="*70)
    
    embedder, vector_store = await setup_test_environment()
    # Don't populate data - empty store
    
    retriever = Retriever(embedder, vector_store)
    
    results = await retriever.retrieve("any query", top_k=5)
    
    print(f"Results from empty store: {len(results)}")
    assert len(results) == 0, "Should return empty list for empty store"
    
    print("✅ PASSED: Empty results handling\n")
    
    await vector_store.clear()
    return True


# ============================================================================
# Main Test Runner
# ============================================================================

async def run_all_tests():
    """Run all retrieval tests."""
    print("\n" + "="*70)
    print("RETRIEVAL MODULE - COMPREHENSIVE TEST SUITE")
    print("="*70 + "\n")
    
    tests = [
        ("Basic Retrieval", test_basic_retrieval),
        ("Metadata Filtering", test_metadata_filtering),
        ("Score Threshold", test_score_threshold),
        ("Query Preprocessing", test_query_preprocessing),
        ("Context Filtering", test_context_filtering),
        ("Deduplication", test_deduplication),
        ("Empty Results", test_empty_results),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            result = await test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ FAILED: {name}")
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result is True)
    failed = sum(1 for _, result in results if result is False)
    
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {len(results)} | Passed: {passed} | Failed: {failed}")
    print("="*70 + "\n")
    
    return failed == 0


if __name__ == "__main__":
    # Check if Qdrant is running
    import aiohttp
    
    async def check_qdrant():
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("http://localhost:6333/healthz") as resp:
                    if resp.status == 200:
                        return True
        except:
            return False
        return False
    
    async def main():
        if not await check_qdrant():
            print("❌ ERROR: Qdrant is not running!")
            print("\nStart Qdrant with: docker-compose up -d qdrant")
            print("Or check if it's running on http://localhost:6333\n")
            return
        
        success = await run_all_tests()
        sys.exit(0 if success else 1)
    
    asyncio.run(main())
