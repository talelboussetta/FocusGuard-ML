"""
Qdrant Vector Store Examples & Testing

Demonstrates how to use the QdrantVectorStore for FocusGuard RAG.

Run this file to test the vector store:
    python -m rag.vector_store.examples
"""

import asyncio
import logging
from typing import List
from datetime import datetime

from .qdrant_store import QdrantVectorStore
from .base_store import Document


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def example_basic_usage():
    """Basic example: Add documents and search."""
    print("\n" + "="*60)
    print("Example 1: Basic Vector Store Operations")
    print("="*60)
    
    # Initialize store (local Docker)
    store = QdrantVectorStore(
        url="http://localhost:6333",
        collection_name="test_collection",
        vector_size=384,  # Using smaller embeddings for example
    )
    
    # Create collection
    await store.initialize()
    print("✓ Collection created")
    
    # Sample documents about focus tips
    documents = [
        Document(
            id="doc-1",
            content="The Pomodoro Technique uses 25-minute work intervals followed by 5-minute breaks to maintain focus.",
            metadata={
                "category": "focus_tips",
                "source": "productivity_guide.md",
                "tags": ["pomodoro", "time_management"],
            }
        ),
        Document(
            id="doc-2",
            content="Turn off phone notifications during focus sessions to minimize distractions.",
            metadata={
                "category": "focus_tips",
                "source": "distraction_guide.md",
                "tags": ["notifications", "phone", "distractions"],
            }
        ),
        Document(
            id="doc-3",
            content="Deep work requires at least 90 minutes of uninterrupted concentration for complex tasks.",
            metadata={
                "category": "productivity_research",
                "source": "deep_work.pdf",
                "tags": ["deep_work", "concentration"],
            }
        ),
    ]
    
    # Create dummy embeddings (in real use, generate with OpenAI)
    # Each vector is 384 dimensions (matching vector_size)
    embeddings = [
        [0.1] * 384,  # doc-1 embedding
        [0.2] * 384,  # doc-2 embedding
        [0.3] * 384,  # doc-3 embedding
    ]
    
    # Add documents
    await store.add_documents(documents, embeddings)
    print(f"✓ Added {len(documents)} documents")
    
    # Search without filters
    query_embedding = [0.15] * 384  # Similar to doc-1
    results = await store.search(query_embedding, top_k=2)
    
    print(f"\n✓ Search results (top 2):")
    for result in results:
        print(f"  - Rank {result.rank}: {result.document.content[:60]}...")
        print(f"    Score: {result.score:.4f}, Category: {result.document.metadata.get('category')}")
    
    # Get collection info
    info = await store.get_collection_info()
    print(f"\n✓ Collection info: {info}")
    
    # Cleanup
    await store.clear()
    await store.close()
    print("\n✓ Cleanup complete")


async def example_metadata_filtering():
    """Example with metadata filtering."""
    print("\n" + "="*60)
    print("Example 2: Metadata Filtering")
    print("="*60)
    
    store = QdrantVectorStore(
        url="http://localhost:6333",
        collection_name="test_filtering",
        vector_size=384,
    )
    
    await store.initialize()
    
    # Documents with different categories and users
    documents = [
        Document(
            id="user1-session1",
            content="User 1 focused well during morning session",
            metadata={
                "category": "session_analysis",
                "user_id": "user-123",
                "session_id": "session-001",
            }
        ),
        Document(
            id="user2-session1",
            content="User 2 struggled with phone distractions",
            metadata={
                "category": "session_analysis",
                "user_id": "user-456",
                "session_id": "session-002",
            }
        ),
        Document(
            id="general-tip",
            content="General productivity tip: use website blockers",
            metadata={
                "category": "focus_tips",
                "source": "tips.md",
            }
        ),
    ]
    
    embeddings = [[0.1] * 384, [0.2] * 384, [0.3] * 384]
    
    await store.add_documents(documents, embeddings)
    print("✓ Added documents with metadata")
    
    # Search with user filter
    query_embedding = [0.15] * 384
    
    print("\n1. Search for user-123 only:")
    results = await store.search(
        query_embedding,
        top_k=5,
        filter_metadata={"user_id": "user-123"}
    )
    print(f"   Found {len(results)} results")
    for r in results:
        print(f"   - {r.document.content}")
    
    print("\n2. Search for focus_tips category:")
    results = await store.search(
        query_embedding,
        top_k=5,
        filter_metadata={"category": "focus_tips"}
    )
    print(f"   Found {len(results)} results")
    for r in results:
        print(f"   - {r.document.content}")
    
    # Cleanup
    await store.clear()
    await store.close()
    print("\n✓ Cleanup complete")


async def example_user_personalization():
    """Example: User-specific document retrieval."""
    print("\n" + "="*60)
    print("Example 3: User Personalization")
    print("="*60)
    
    store = QdrantVectorStore(
        url="http://localhost:6333",
        collection_name="test_personalization",
        vector_size=384,
    )
    
    await store.initialize()
    
    # Simulate storing user's successful session patterns
    user_id = "user-789"
    
    documents = [
        Document(
            id=f"{user_id}-pattern-1",
            content="Morning sessions (8-10 AM) had highest focus scores with minimal distractions",
            metadata={
                "category": "user_pattern",
                "user_id": user_id,
                "pattern_type": "time_preference",
                "created_at": datetime.utcnow().isoformat(),
            }
        ),
        Document(
            id=f"{user_id}-pattern-2",
            content="User performs best with 50-minute sessions and 10-minute breaks",
            metadata={
                "category": "user_pattern",
                "user_id": user_id,
                "pattern_type": "duration_preference",
            }
        ),
        Document(
            id=f"{user_id}-distraction-1",
            content="Main distraction source: social media notifications on phone",
            metadata={
                "category": "user_distraction",
                "user_id": user_id,
                "distraction_type": "phone",
            }
        ),
    ]
    
    embeddings = [[0.1] * 384, [0.2] * 384, [0.3] * 384]
    
    await store.add_documents(documents, embeddings)
    print(f"✓ Stored {len(documents)} personalized insights for {user_id}")
    
    # Query: "What time should I schedule my focus session?"
    query_embedding = [0.12] * 384
    
    results = await store.search(
        query_embedding,
        top_k=3,
        filter_metadata={"user_id": user_id, "category": "user_pattern"}
    )
    
    print(f"\n✓ Personalized recommendations for {user_id}:")
    for r in results:
        print(f"   - {r.document.content}")
        print(f"     Pattern: {r.document.metadata.get('pattern_type')}")
    
    # Cleanup
    await store.clear()
    await store.close()
    print("\n✓ Cleanup complete")


async def example_crud_operations():
    """Example: CRUD operations."""
    print("\n" + "="*60)
    print("Example 4: CRUD Operations")
    print("="*60)
    
    store = QdrantVectorStore(
        url="http://localhost:6333",
        collection_name="test_crud",
        vector_size=384,
    )
    
    await store.initialize()
    
    # Create
    doc = Document(
        id="test-doc",
        content="This is a test document",
        metadata={"category": "test"}
    )
    await store.add_documents([doc], [[0.5] * 384])
    print("✓ Created document")
    
    # Read
    results = await store.search([0.5] * 384, top_k=1)
    print(f"✓ Read document: {results[0].document.content}")
    
    # Update (overwrite by adding same ID)
    updated_doc = Document(
        id="test-doc",
        content="This is an UPDATED test document",
        metadata={"category": "test", "version": "2"}
    )
    await store.add_documents([updated_doc], [[0.5] * 384])
    print("✓ Updated document")
    
    results = await store.search([0.5] * 384, top_k=1)
    print(f"✓ Verified update: {results[0].document.content}")
    
    # Delete
    deleted = await store.delete_by_id("test-doc")
    print(f"✓ Deleted document: {deleted}")
    
    results = await store.search([0.5] * 384, top_k=1)
    print(f"✓ Search after delete: {len(results)} results")
    
    # Cleanup
    await store.close()
    print("\n✓ Cleanup complete")


async def run_all_examples():
    """Run all examples sequentially."""
    print("\n" + "="*60)
    print("QDRANT VECTOR STORE EXAMPLES")
    print("="*60)
    print("\nPrerequisite: Qdrant must be running on http://localhost:6333")
    print("Run: docker-compose up -d qdrant")
    print("="*60)
    
    await example_basic_usage()
    await example_metadata_filtering()
    await example_user_personalization()
    await example_crud_operations()
    
    print("\n" + "="*60)
    print("All examples completed successfully! ✓")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(run_all_examples())
