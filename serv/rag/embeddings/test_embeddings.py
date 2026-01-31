"""
Comprehensive Tests for Embeddings Module

Tests both OpenAI and SentenceTransformer embedders.
"""

import asyncio
import os
import sys
from typing import List

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Now import from rag
from rag.embeddings import (
    OpenAIEmbedder,
    SentenceTransformerEmbedder,
    get_embedder,
    reset_embedder
)


# ============================================================================
# Test Data
# ============================================================================

SAMPLE_TEXTS = [
    "How to improve focus while working?",
    "Tips for avoiding distractions",
    "Deep work requires concentration",
    "Pomodoro technique for productivity",
    "Taking breaks improves performance",
]

SINGLE_TEXT = "This is a test sentence for embedding."


# ============================================================================
# SentenceTransformer Tests (Local, Free)
# ============================================================================

async def test_sentence_transformer_single():
    """Test embedding a single text with SentenceTransformer."""
    print("\n" + "="*70)
    print("TEST: SentenceTransformer - Single Text")
    print("="*70)
    
    embedder = SentenceTransformerEmbedder(model_name='all-MiniLM-L6-v2')
    
    print(f"Model: {embedder.model_name}")
    print(f"Dimension: {embedder.dimension}")
    print(f"Device: {embedder.model.device}")
    print(f"\nInput: {SINGLE_TEXT}")
    
    vector = await embedder.embed_text(SINGLE_TEXT)
    
    print(f"Output dimension: {len(vector)}")
    print(f"First 5 values: {vector[:5]}")
    print(f"Vector norm: {sum(x**2 for x in vector)**0.5:.4f}")
    
    # Validate
    assert len(vector) == embedder.dimension, "Dimension mismatch!"
    assert all(isinstance(x, float) for x in vector), "All values should be floats"
    
    print("\n✅ PASSED: Single text embedding")
    return True


async def test_sentence_transformer_batch():
    """Test batch embedding with SentenceTransformer."""
    print("\n" + "="*70)
    print("TEST: SentenceTransformer - Batch Processing")
    print("="*70)
    
    embedder = SentenceTransformerEmbedder(
        model_name='all-MiniLM-L6-v2',
        batch_size=2,
        show_progress=True
    )
    
    print(f"Batch size: {embedder.batch_size}")
    print(f"Number of texts: {len(SAMPLE_TEXTS)}")
    
    vectors = await embedder.embed_batch(SAMPLE_TEXTS)
    
    print(f"\nEmbedded {len(vectors)} texts")
    print(f"Each vector dimension: {len(vectors[0])}")
    
    # Validate
    assert len(vectors) == len(SAMPLE_TEXTS), "Should have one vector per text"
    assert all(len(v) == embedder.dimension for v in vectors), "All vectors same dimension"
    
    # Test semantic similarity
    print("\n--- Semantic Similarity Test ---")
    import numpy as np
    
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        a, b = np.array(v1), np.array(v2)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    # Texts 0 and 1 should be similar (both about focus/distractions)
    sim_01 = cosine_similarity(vectors[0], vectors[1])
    # Texts 0 and 4 should be less similar (focus vs breaks)
    sim_04 = cosine_similarity(vectors[0], vectors[4])
    
    print(f"Similarity (text 0 & 1): {sim_01:.4f}")
    print(f"Similarity (text 0 & 4): {sim_04:.4f}")
    print(f"Text 0: {SAMPLE_TEXTS[0]}")
    print(f"Text 1: {SAMPLE_TEXTS[1]}")
    print(f"Text 4: {SAMPLE_TEXTS[4]}")
    
    print("\n✅ PASSED: Batch embedding and similarity")
    return True


async def test_sentence_transformer_empty():
    """Test edge case: empty input."""
    print("\n" + "="*70)
    print("TEST: SentenceTransformer - Empty Input")
    print("="*70)
    
    embedder = SentenceTransformerEmbedder(model_name='all-MiniLM-L6-v2')
    
    vectors = await embedder.embed_batch([])
    
    print(f"Result: {vectors}")
    assert vectors == [], "Empty input should return empty list"
    
    print("✅ PASSED: Empty input handling")
    return True


# ============================================================================
# OpenAI Tests (Requires API Key)
# ============================================================================

async def test_openai_single():
    """Test OpenAI embedding (requires API key)."""
    print("\n" + "="*70)
    print("TEST: OpenAI - Single Text")
    print("="*70)
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️  SKIPPED: OPENAI_API_KEY not set")
        return False
    
    embedder = OpenAIEmbedder(
        api_key=api_key,
        model="text-embedding-3-small"
    )
    
    print(f"Model: {embedder.model}")
    print(f"Dimension: {embedder.dimension}")
    print(f"\nInput: {SINGLE_TEXT}")
    
    vector = await embedder.embed_text(SINGLE_TEXT)
    
    print(f"Output dimension: {len(vector)}")
    print(f"First 5 values: {vector[:5]}")
    
    # Validate
    assert len(vector) == embedder.dimension, "Dimension mismatch!"
    assert all(isinstance(x, float) for x in vector), "All values should be floats"
    
    print("\n✅ PASSED: OpenAI single text embedding")
    return True


async def test_openai_batch():
    """Test OpenAI batch embedding."""
    print("\n" + "="*70)
    print("TEST: OpenAI - Batch Processing")
    print("="*70)
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️  SKIPPED: OPENAI_API_KEY not set")
        return False
    
    embedder = OpenAIEmbedder(
        api_key=api_key,
        model="text-embedding-3-small",
        batch_size=3
    )
    
    print(f"Batch size: {embedder.batch_size}")
    print(f"Number of texts: {len(SAMPLE_TEXTS)}")
    
    vectors = await embedder.embed_batch(SAMPLE_TEXTS, show_progress=True)
    
    print(f"\nEmbedded {len(vectors)} texts")
    print(f"Each vector dimension: {len(vectors[0])}")
    
    # Validate
    assert len(vectors) == len(SAMPLE_TEXTS)
    assert all(len(v) == embedder.dimension for v in vectors)
    
    # Calculate cost estimate
    avg_tokens_per_text = 10  # Rough estimate
    total_tokens = avg_tokens_per_text * len(SAMPLE_TEXTS)
    cost = await embedder.get_embedding_cost(total_tokens)
    print(f"\nEstimated cost: ${cost:.6f} USD")
    
    print("\n✅ PASSED: OpenAI batch embedding")
    return True


# ============================================================================
# Config & Singleton Tests
# ============================================================================

async def test_singleton_pattern():
    """Test singleton pattern with get_embedder()."""
    print("\n" + "="*70)
    print("TEST: Singleton Pattern")
    print("="*70)
    
    # Reset singleton
    reset_embedder()
    
    # Set to use local embeddings
    from api.config import settings
    original_use_local = settings.use_local_embeddings
    settings.use_local_embeddings = True
    
    # Get embedder twice
    embedder1 = get_embedder()
    embedder2 = get_embedder()
    
    print(f"Embedder 1: {type(embedder1).__name__}")
    print(f"Embedder 2: {type(embedder2).__name__}")
    print(f"Same instance: {embedder1 is embedder2}")
    
    assert embedder1 is embedder2, "Should return same instance"
    assert isinstance(embedder1, SentenceTransformerEmbedder), "Should be SentenceTransformer"
    
    # Restore original setting
    settings.use_local_embeddings = original_use_local
    reset_embedder()
    
    print("\n✅ PASSED: Singleton pattern")
    return True


async def test_model_comparison():
    """Compare different SentenceTransformer models."""
    print("\n" + "="*70)
    print("TEST: Model Comparison")
    print("="*70)
    
    models = [
        ('all-MiniLM-L6-v2', 384),
        ('all-MiniLM-L12-v2', 384),
    ]
    
    test_text = "Deep work requires focus and concentration"
    
    print(f"Test text: {test_text}\n")
    
    for model_name, expected_dim in models:
        embedder = SentenceTransformerEmbedder(model_name=model_name)
        vector = await embedder.embed_text(test_text)
        
        print(f"Model: {model_name}")
        print(f"  Expected dimension: {expected_dim}")
        print(f"  Actual dimension: {len(vector)}")
        print(f"  First 3 values: {vector[:3]}")
        
        assert len(vector) == expected_dim, f"Dimension mismatch for {model_name}"
        print(f"  ✅ Validated\n")
    
    print("✅ PASSED: Model comparison")
    return True


# ============================================================================
# Main Test Runner
# ============================================================================

async def run_all_tests():
    """Run all tests and report results."""
    print("\n" + "="*70)
    print("EMBEDDINGS MODULE - COMPREHENSIVE TEST SUITE")
    print("="*70)
    
    tests = [
        ("SentenceTransformer Single", test_sentence_transformer_single),
        ("SentenceTransformer Batch", test_sentence_transformer_batch),
        ("SentenceTransformer Empty", test_sentence_transformer_empty),
        ("Singleton Pattern", test_singleton_pattern),
        ("Model Comparison", test_model_comparison),
        ("OpenAI Single", test_openai_single),
        ("OpenAI Batch", test_openai_batch),
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
    skipped = sum(1 for _, result in results if result is False)
    failed = sum(1 for _, result in results if result is None)
    
    for name, result in results:
        status = "✅ PASSED" if result is True else "⚠️  SKIPPED" if result is False else "❌ FAILED"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {len(results)} | Passed: {passed} | Skipped: {skipped} | Failed: {failed}")
    print("="*70 + "\n")


if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run tests
    asyncio.run(run_all_tests())
