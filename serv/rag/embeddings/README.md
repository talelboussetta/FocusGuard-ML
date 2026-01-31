# Embeddings Module - OpenAI Implementation

Production-ready text embedding using OpenAI's embedding models for FocusGuard's RAG pipeline.

## Overview

The embeddings module converts text into dense vector representations (embeddings) for semantic search. These vectors capture the meaning of text, enabling similarity-based retrieval.

## Features

- ✅ **OpenAI Integration**: text-embedding-3-small (1536d) and text-embedding-3-large (3072d)
- ✅ **Automatic Batching**: Process up to 2048 texts per batch
- ✅ **Retry Logic**: Handles transient failures (rate limits, server errors)
- ✅ **Token Tracking**: Logs usage for cost monitoring
- ✅ **Dimension Validation**: Ensures vectors match expected size
- ✅ **Lazy Validation**: API key checked on first use
- ✅ **Async Operations**: Non-blocking for FastAPI integration

## Quick Start

### 1. Configure API Key

Add to `serv/.env`:

```bash
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### 2. Basic Usage

```python
from rag.embeddings import get_embedder

# Get singleton instance (uses config from .env)
embedder = get_embedder()

# Single text
vector = await embedder.embed_text("How to improve focus?")
print(f"Dimension: {len(vector)}")  # 1536

# Batch processing
vectors = await embedder.embed_batch([
    "Focus tip 1",
    "Focus tip 2",
    "Focus tip 3"
])
print(f"Embedded {len(vectors)} texts")
```

### 3. Direct Instantiation

```python
from rag.embeddings import OpenAIEmbedder

embedder = OpenAIEmbedder(
    api_key="sk-...",
    model="text-embedding-3-small",
    batch_size=100
)

vector = await embedder.embed_text("Deep work requires focus")
```

## Model Comparison

| Model | Dimensions | Cost (per 1M tokens) | Use Case |
|-------|-----------|---------------------|----------|
| **text-embedding-3-small** | 1536 | $0.020 | ✅ **Recommended** - Best cost/quality balance |
| text-embedding-3-large | 3072 | $0.130 | Higher quality, 6.5x more expensive |
| text-embedding-ada-002 | 1536 | $0.100 | Legacy model (avoid) |

**For FocusGuard**: Use `text-embedding-3-small` unless quality issues arise.

## Advanced Usage

### Large Batch Processing

```python
# Embed 1000 documents with progress logging
texts = [f"Document {i}" for i in range(1000)]
vectors = await embedder.embed_batch(texts, show_progress=True)

# Output:
# Processing batch 1/10
# Processing batch 2/10
# ...
# Embedded 1000 texts in 10 batch(es)
```

### Semantic Similarity

```python
import numpy as np

def cosine_similarity(vec1, vec2):
    a, b = np.array(vec1), np.array(vec2)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Compare similarity
text1 = "How to focus during work"
text2 = "Strategies for concentration"
text3 = "Best recipes for pasta"

vectors = await embedder.embed_batch([text1, text2, text3])

sim_1_2 = cosine_similarity(vectors[0], vectors[1])  # ~0.85 (high)
sim_1_3 = cosine_similarity(vectors[0], vectors[2])  # ~0.30 (low)

print(f"Similar texts: {sim_1_2:.2f}")
print(f"Dissimilar texts: {sim_1_3:.2f}")
```

### Integration with Vector Store

```python
from rag.embeddings import get_embedder
from rag.vector_store import get_vector_store, Document

# Initialize
embedder = get_embedder()
store = get_vector_store()
await store.initialize()

# Prepare documents
docs = [
    Document(
        id="doc-1",
        content="The Pomodoro Technique uses 25-minute intervals",
        metadata={"category": "focus_tips"}
    ),
    Document(
        id="doc-2",
        content="Deep work requires eliminating distractions",
        metadata={"category": "productivity"}
    )
]

# Embed and store
embeddings = await embedder.embed_batch([doc.content for doc in docs])
await store.add_documents(docs, embeddings)

# Query
query = "How to stay focused?"
query_vector = await embedder.embed_text(query)
results = await store.search(query_vector, top_k=5)
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-proj-...

# Optional (with defaults)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # or text-embedding-3-large
```

### Initialization Parameters

```python
OpenAIEmbedder(
    api_key: str,              # OpenAI API key
    model: str = "text-embedding-3-small",
    batch_size: int = 100,     # Texts per API call (max 2048)
    max_retries: int = 1,      # Retry attempts on failure
    retry_delay: float = 1.0   # Seconds between retries
)
```

## Error Handling

### Retry Logic

The embedder automatically retries on:
- **Rate limits** (429): Waits 1s, retries once
- **Server errors** (500-599): Waits 1s, retries once

Client errors (400-499) fail immediately.

### Example Error Handling

```python
from openai import OpenAIError, RateLimitError

try:
    vectors = await embedder.embed_batch(texts)
except RateLimitError:
    print("Rate limit exceeded - try smaller batches or wait")
except OpenAIError as e:
    print(f"OpenAI API error: {e}")
```

## Performance

### Embedding Speed

- **Single text**: ~100-200ms
- **Batch of 100**: ~500ms (5ms per text)
- **Batch of 1000**: ~5s (5ms per text)

### Cost Estimation

```python
# Estimate cost for 10,000 documents (~500 tokens each)
num_tokens = 10_000 * 500  # 5M tokens
cost = await embedder.get_embedding_cost(num_tokens)
print(f"Estimated cost: ${cost:.2f}")  # ~$0.10 for text-embedding-3-small
```

### Token Limits

OpenAI limits: **8,191 tokens per text**

The embedder automatically handles this (no truncation needed for typical FocusGuard texts).

## Testing

### Run Examples

```bash
cd serv
python -m rag.embeddings.examples
```

### Expected Output

```
============================================================
OPENAI EMBEDDINGS EXAMPLES
============================================================

Example 1: Basic Embedding Operations
✓ Embedder initialized
✓ Single text embedded (dimension: 1536)
✓ Dimension validation passed

Example 2: Batch Embedding
✓ Batch embedded (5 texts, 1536 dims each)

Example 3: Semantic Similarity
✓ Similar texts score: 0.8542
✓ Dissimilar texts score: 0.3128
✓ Semantic similarity validation passed!

Example 4: Embedding Consistency
✓ Consistency validation passed! (similarity > 0.9999)

Example 5: Large Batch Processing
✓ Large batch processed (150 texts in 3 batches)

Example 6: Qdrant Integration Test
✓ Vector store initialized
✓ Created 3 embeddings
✓ Added 3 documents to Qdrant
✓ Search results returned

============================================================
✅ ALL VALIDATION CHECKS PASSED!
============================================================

Readiness Checklist:
✅ I know my vector size: 1536
✅ My embedder returns consistent vectors
✅ Similar texts → similar vectors
✅ Qdrant accepts my vectors without errors

🚀 Ready to move on to knowledge base ingestion!
```

## Integration with FastAPI

### Startup Initialization

Add to `serv/main.py`:

```python
from contextlib import asynccontextmanager
from rag.embeddings import initialize_embedder

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await initialize_embedder()  # Validates API key
    yield
    # Shutdown (nothing to clean up for embedder)

app = FastAPI(lifespan=lifespan)
```

### Use in Routes

```python
from fastapi import APIRouter
from rag.embeddings import get_embedder

router = APIRouter()

@router.post("/embed")
async def embed_text(text: str):
    embedder = get_embedder()
    vector = await embedder.embed_text(text)
    return {"dimension": len(vector), "vector": vector}
```

## Troubleshooting

### API Key Issues

```bash
# Check if key is set
echo $OPENAI_API_KEY  # Linux/Mac
echo %OPENAI_API_KEY%  # Windows CMD
$env:OPENAI_API_KEY    # Windows PowerShell

# Test key validity
python -c "from openai import OpenAI; OpenAI(api_key='sk-...').models.list()"
```

### Rate Limits

OpenAI free tier: **3 RPM** (requests per minute)

If hitting limits:
- Reduce `batch_size` parameter
- Add delays between batches
- Upgrade to paid tier

### Dimension Mismatch

```python
# Ensure embedder and vector store dimensions match
embedder = OpenAIEmbedder(model="text-embedding-3-small")  # 1536
store = QdrantVectorStore(vector_size=1536)  # Must match!

# For text-embedding-3-large:
embedder = OpenAIEmbedder(model="text-embedding-3-large")  # 3072
store = QdrantVectorStore(vector_size=3072)
```

## Readiness Checklist

Before moving to the next step, verify:

- ✅ **Vector Size Known**: 1536 dimensions (text-embedding-3-small)
- ✅ **Consistent Vectors**: Same input → identical output (deterministic)
- ✅ **Semantic Similarity**: Similar texts have high cosine similarity (>0.7)
- ✅ **Qdrant Compatible**: Vectors accepted without errors
- ✅ **API Key Valid**: Embeddings generate successfully
- ✅ **Token Usage Logged**: Costs are being tracked

## Next Steps

1. ✅ **Vector Store** (Complete)
2. ✅ **Embeddings** (Complete - this module)
3. 🔄 **Knowledge Base**: Load documents from `knowledge_base/` folder
4. 🔄 **Retrieval**: Build query pipeline
5. 🔄 **Generation**: LLM response generation

## References

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [text-embedding-3 Announcement](https://openai.com/blog/new-embedding-models-and-api-updates)
