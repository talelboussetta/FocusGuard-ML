"""
Test Hugging Face Generator

Simple validation script to test the generation module.
Run: python -m rag.generation.test_generator
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.config import settings
from rag.generation.config import get_generator
from rag.generation.prompts import PRODUCTIVITY_COACH_PROMPT


async def test_basic_generation():
    """Test basic text generation."""
    print("\n" + "="*70)
    print("TEST 1: Basic Text Generation")
    print("="*70)
    
    # Check configuration
    if not settings.huggingface_api_key:
        print("❌ HUGGINGFACE_API_KEY not set in .env")
        print("   Get free key: https://huggingface.co/settings/tokens")
        return False
    
    print(f"✓ Using model: {settings.huggingface_model}")
    print(f"✓ API key configured: {settings.huggingface_api_key[:10]}...")
    
    # Initialize generator
    try:
        generator = get_generator()
        print(f"✓ Generator initialized: {type(generator).__name__}")
    except Exception as e:
        print(f"❌ Failed to initialize generator: {e}")
        return False
    
    # Test generation
    query = "How can I avoid getting distracted by my phone during focus sessions?"
    context_docs = [
        "Turn off all notifications on your phone and computer during deep work sessions. Even seeing a notification preview can break your concentration.",
        "Put your phone in another room or in a drawer during Pomodoro sessions. Physical distance reduces the temptation to check it.",
        "Use app blockers like Freedom or FocusGuard's built-in distraction tracking to prevent access to social media during focus time."
    ]
    
    print(f"\nQuery: {query}")
    print(f"Context documents: {len(context_docs)}")
    
    try:
        print("\n⏳ Generating response (this may take 5-20 seconds)...\n")
        
        response = await generator.generate(
            query=query,
            context_documents=context_docs,
            system_prompt=PRODUCTIVITY_COACH_PROMPT
        )
        
        print("="*70)
        print("RESPONSE:")
        print("="*70)
        print(response)
        print("="*70)
        print(f"\n✓ Generated {len(response)} characters")
        
        return True
        
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_short_query():
    """Test with minimal context."""
    print("\n" + "="*70)
    print("TEST 2: Short Query with Single Context")
    print("="*70)
    
    generator = get_generator()
    
    query = "What is the Pomodoro Technique?"
    context_docs = [
        "The Pomodoro Technique is a time management method that uses 25-minute focused work intervals followed by 5-minute breaks."
    ]
    
    print(f"Query: {query}")
    
    try:
        print("⏳ Generating...\n")
        
        response = await generator.generate(
            query=query,
            context_documents=context_docs
        )
        
        print("Response:", response)
        print(f"✓ Success ({len(response)} chars)")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False


async def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("HUGGING FACE GENERATOR - VALIDATION TESTS")
    print("="*70)
    
    results = []
    
    # Test 1: Basic generation
    results.append(await test_basic_generation())
    
    # Test 2: Short query
    if results[0]:  # Only run if first test passed
        await asyncio.sleep(2)  # Rate limit buffer
        results.append(await test_short_query())
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All tests passed! Generation module is working.")
    else:
        print("❌ Some tests failed. Check configuration and API key.")
    print("="*70 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
