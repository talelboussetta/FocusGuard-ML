# Retrieval Module

Production-ready document retrieval for FocusGuard's RAG pipeline.

## Overview

The retrieval module orchestrates finding relevant documents for user queries by:
1. **Preprocessing** queries (cleaning, normalization)
2. **Embedding** queries using the embeddings module
3. **Searching** the vector store for similar documents
4. **Filtering** results by metadata and score thresholds
5. **Deduplicating** results

## Quick Start

### Basic Usage

```python
from rag.retrieval import Retriever
from rag.embeddings import get_embedder
from rag.vector_store import create_vector_store

# Initialize components
embedder = get_embedder()  # Uses config from .env
vector_store = create_vector_store()
await vector_store.initialize()

# Create retriever
retriever = Retriever(embedder, vector_store)

# Retrieve documents
results = await retriever.retrieve(
    query="How to avoid phone distractions?",
    top_k=5
)

# Process results
for result in results:
    print(f"Score: {result.score:.3f}")
    print(f"Content: {result.document.content}")
    print(f"Metadata: {result.document.metadata}")
```

### With Metadata Filtering

```python
# Retrieve only focus tips for a specific user
results = await retriever.retrieve(
    query="improve concentration",
    top_k=3,
    filter_metadata={"category": "focus_tips", "user_id": "123"}
)
```

### With Context

```python
# Use context dict for filtering
results = await retriever.retrieve(
    query="productivity tips",
    top_k=5,
    context={
        "user_id": "123",
        "category": "time_management"
    }
)
```

### With Score Threshold

```python
# Only return high-quality matches
retriever = Retriever(
    embedder,
    vector_store,
    min_score_threshold=0.5  # Only results with >50% similarity
)

results = await retriever.retrieve("focus tips", top_k=10)
```

## Advanced Features

### Query Preprocessing

Automatic query cleaning and normalization:

```python
retriever = Retriever(
    embedder,
    vector_store,
    enable_preprocessing=True  # Default
)

# Handles messy input automatically
results = await retriever.retrieve(
    "  How   to focus\n  better???  ",  # Extra spaces, newlines, punctuation
    top_k=5
)
```

Preprocessing steps:
- Strip leading/trailing whitespace
- Normalize multiple spaces to single space
- Remove control characters
- Preserve meaningful punctuation

### Two-Stage Retrieval (Reranking)

```python
# Fetch 20 candidates, return top 5 after reranking
results = await retriever.retrieve_with_reranking(
    query="avoid distractions",
    top_k=5,
    rerank_top_k=20
)
```

**Note**: Currently returns top-k from initial retrieval. Future enhancement: cross-encoder reranking.

## Configuration

### Retriever Options

```python
retriever = Retriever(
    embedder=embedder,              # Required: BaseEmbedder instance
    vector_store=vector_store,      # Required: BaseVectorStore instance
    enable_preprocessing=True,      # Enable query preprocessing
    min_score_threshold=0.0,        # Minimum similarity score (0.0-1.0)
)
```

### Metadata Filtering

Supported filter fields:
- `category`: Document category (e.g., "focus_tips", "wellness")
- `user_id`: User-specific content
- `session_id`: Session-specific content
- `tags`: List of tags (exact match)

Example:
```python
filter_metadata = {
    "category": "focus_tips",
    "tags": ["pomodoro"],
}
```

## Architecture

```
User Query
    ↓
Preprocessing (clean, normalize)
    ↓
Embedder (convert to vector)
    ↓
Vector Store (similarity search)
    ↓
Post-Processing (filter, deduplicate)
    ↓
Results (List[SearchResult])
```

## Testing

Run comprehensive tests:

```bash
# Ensure Qdrant is running
docker-compose up -d qdrant

# Run tests
cd serv
python rag/retrieval/test_retrieval.py
```

**Test coverage:**
- ✅ Basic retrieval
- ✅ Metadata filtering
- ✅ Score threshold filtering
- ✅ Query preprocessing
- ✅ Context-based filtering
- ✅ Deduplication
- ✅ Empty results handling

## Integration with FocusGuard

### RAG Endpoint Example

```python
from fastapi import APIRouter, Depends
from rag.retrieval import Retriever
from rag.embeddings import get_embedder
from rag.vector_store import get_vector_store

router = APIRouter()

@router.post("/rag/query")
async def query_knowledge_base(
    query: str,
    user_id: str = Depends(get_current_user_id),
    top_k: int = 5
):
    """Retrieve relevant focus tips for user query."""
    
    # Get singleton instances
    embedder = get_embedder()
    vector_store = get_vector_store()
    
    # Create retriever
    retriever = Retriever(embedder, vector_store)
    
    # Retrieve with user context
    results = await retriever.retrieve(
        query=query,
        top_k=top_k,
        context={"user_id": user_id}
    )
    
    # Format response
    return {
        "query": query,
        "results": [
            {
                "content": r.document.content,
                "score": r.score,
                "metadata": r.document.metadata
            }
            for r in results
        ]
    }
```

### Session-Specific Tips

```python
@router.post("/sessions/{session_id}/tips")
async def get_session_tips(
    session_id: str,
    distraction_type: str,  # e.g., "phone", "noise"
):
    """Get tips for current session based on distractions."""
    
    retriever = Retriever(get_embedder(), get_vector_store())
    
    results = await retriever.retrieve(
        query=f"How to avoid {distraction_type} distractions",
        top_k=3,
        context={"session_id": session_id}
    )
    
    return {"tips": [r.document.content for r in results]}
```

## Performance

### Speed
- **Query embedding**: ~10-50ms (local), ~100-200ms (OpenAI)
- **Vector search**: <1ms for <10K docs, <10ms for <100K docs
- **Total retrieval**: ~50-250ms depending on embedder

### Memory
- Query preprocessing: Negligible
- Embedding cache: Optional (future enhancement)

## Future Enhancements

- [ ] Cross-encoder reranking for better precision
- [ ] Hybrid search (combine vector + keyword search)
- [ ] Query expansion (synonyms, related terms)
- [ ] Semantic caching (cache frequent queries)
- [ ] MMR diversification (reduce redundancy in results)
- [ ] Contextual boosting (prioritize recent/relevant docs)

## Troubleshooting

### No results returned
1. Check if vector store has documents: `await vector_store.count()`
2. Lower `min_score_threshold` if too restrictive
3. Verify embedder and vector store use same dimensions

### Low similarity scores
1. Ensure embedding model matches vector store dimension
2. Check if documents are relevant to query
3. Try different embedding model (OpenAI vs local)

### Slow retrieval
1. Increase vector store HNSW parameters for speed
2. Use local embeddings instead of OpenAI (faster)
3. Reduce `rerank_top_k` if using reranking

## See Also

- [Embeddings Module](../embeddings/README.md)
- [Vector Store Module](../vector_store/README.md)
- [Generation Module](../generation/) (coming next)
