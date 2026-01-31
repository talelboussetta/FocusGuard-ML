import asyncio
import sys
sys.path.insert(0, ".")

async def test_direct():
    print("\n" + "="*60)
    print("TESTING OPENAI API DIRECTLY")
    print("="*60)
    
    from openai import AsyncOpenAI
    from api.config import settings
    
    print(f"\nAPI Key starts with: {settings.openai_api_key[:25]}...")
    print(f"Model: {settings.openai_embedding_model}")
    
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    try:
        print("\nCalling OpenAI API...")
        response = await client.embeddings.create(
            model=settings.openai_embedding_model,
            input="test"
        )
        
        embedding = response.data[0].embedding
        print(f"\n[SUCCESS] Direct API call worked!")
        print(f"  Dimension: {len(embedding)}")
        print(f"  Tokens used: {response.usage.total_tokens}")
        
    except Exception as e:
        print(f"\n[ERROR] {e}")

asyncio.run(test_direct())
