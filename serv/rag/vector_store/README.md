# Vector Store Module - Qdrant Implementation

Production-ready vector storage for FocusGuard's RAG pipeline using Qdrant.

## Overview

The vector store handles:
- **Storage**: Persisting document embeddings with metadata
- **Search**: Fast similarity search using cosine distance
- **Filtering**: Metadata-based filtering (category, user_id, session_id, tags)
- **Scalability**: Supports both local Docker (dev) and Qdrant Cloud (production)

## Architecture

```
vector_store/
├── base_store.py       # Abstract base class (Document, SearchResult, BaseVectorStore)
├── qdrant_store.py     # Qdrant implementation
├── config.py           # Configuration & singleton access
├── examples.py         # Usage examples & testing
└── __init__.py         # Public API exports
```

## Quick Start

### 1. Start Qdrant (Local Docker)

```bash
# Start Qdrant service
docker-compose up -d qdrant

# Verify it's running
curl http://localhost:6333/healthz
# Response: {"title":"qdrant - vector search engine","version":"..."}
```

### 2. Configure Environment

Add to `serv/.env`:

```bash
# Qdrant Settings (Local Docker)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=                          # Leave empty for local
QDRANT_COLLECTION_NAME=focusguard_knowledge
QDRANT_VECTOR_SIZE=1536                  # OpenAI text-embedding-3-small

# For Qdrant Cloud (Production)
# QDRANT_URL=https://xxx.qdrant.io
# QDRANT_API_KEY=your-api-key-here
```

### 3. Basic Usage

```python
from rag.vector_store import get_vector_store, Document

# Get singleton instance (uses config from .env)
store = get_vector_store()
await store.initialize()

# Add documents
documents = [
    Document(
        id="doc-1",
        content="Pomodoro Technique: 25 min work, 5 min break",
        metadata={
            "category": "focus_tips",
            "tags": ["pomodoro", "time_management"]
        }
    )
]

# Embeddings from OpenAI (see embeddings/ module)
embeddings = [[0.1, 0.2, ...]]  # 1536-dimensional vectors

await store.add_documents(documents, embeddings)

# Search
query_embedding = [0.15, 0.25, ...]  # From query text
results = await store.search(query_embedding, top_k=5)

for result in results:
    print(f"Score: {result.score}, Content: {result.document.content}")
```

## Advanced Features

### Metadata Filtering

```python
# Search only focus tips for a specific user
results = await store.search(
    query_embedding,
    top_k=5,
    filter_metadata={
        "category": "focus_tips",
        "user_id": "user-123"
    }
)
```

### User Personalization

```python
# Store user-specific patterns
user_pattern = Document(
    id=f"{user_id}-pattern-1",
    content="User performs best in morning sessions",
    metadata={
        "category": "user_pattern",
        "user_id": user_id,
        "pattern_type": "time_preference"
    }
)

await store.add_documents([user_pattern], [embedding])

# Retrieve personalized insights
results = await store.search(
    query_embedding,
    filter_metadata={"user_id": user_id, "category": "user_pattern"}
)
```

### CRUD Operations

```python
# Create/Update (upsert by ID)
doc = Document(id="doc-1", content="...", metadata={...})
await store.add_documents([doc], [embedding])

# Read (search)
results = await store.search(query_embedding, top_k=1)

# Delete
await store.delete_by_id("doc-1")

# Clear all (WARNING: deletes everything)
await store.clear()
```

## Metadata Schema

Standard metadata fields for FocusGuard documents:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `category` | str | Document category | `"focus_tips"`, `"productivity_research"`, `"user_pattern"` |
| `source` | str | Source file/URL | `"focus_guide.md"`, `"research_paper.pdf"` |
| `user_id` | str | User UUID (optional) | `"user-123"` |
| `session_id` | str | Session UUID (optional) | `"session-456"` |
| `tags` | List[str] | Keywords | `["pomodoro", "deep_work"]` |
| `created_at` | str | ISO timestamp | `"2026-01-31T10:30:00Z"` |

These fields are **indexed** for fast filtering.

## Integration with FastAPI

### Startup/Shutdown

Add to `serv/main.py`:

```python
from contextlib import asynccontextmanager
from rag.vector_store.config import initialize_vector_store, shutdown_vector_store

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await initialize_vector_store()
    yield
    # Shutdown
    await shutdown_vector_store()

app = FastAPI(lifespan=lifespan)
```

### Use in Routes

```python
from fastapi import APIRouter, Depends
from rag.vector_store import get_vector_store

router = APIRouter()

@router.post("/rag/query")
async def rag_query(query: str):
    store = get_vector_store()
    
    # Get query embedding (from embeddings module)
    query_embedding = await get_embedding(query)
    
    # Search vector store
    results = await store.search(query_embedding, top_k=5)
    
    return {"results": results}
```

## Performance

### Vector Dimensions
- **OpenAI text-embedding-3-small**: 1536 dims (recommended, good quality/speed balance)
- **OpenAI text-embedding-3-large**: 3072 dims (higher quality, slower)

### Search Speed
- **< 1ms** for collections under 10K documents
- **< 10ms** for collections under 1M documents (with HNSW indexing)

### Memory Usage
- **1536-dim vectors**: ~6KB per document (vector + metadata)
- **10K documents**: ~60MB RAM
- **100K documents**: ~600MB RAM

## Testing

### Run Examples

```bash
# Ensure Qdrant is running
docker-compose up -d qdrant

# Run all examples
cd serv
python -m rag.vector_store.examples
```

Examples include:
1. Basic usage (add/search/delete)
2. Metadata filtering
3. User personalization
4. CRUD operations

### Manual Testing

```bash
# Check collection exists
curl http://localhost:6333/collections/focusguard_knowledge

# Get collection info
curl http://localhost:6333/collections/focusguard_knowledge
```

## Deployment

### Local Development
```bash
docker-compose up -d qdrant
# Data persisted in Docker volume: qdrant_storage
```

### Production (Qdrant Cloud)

1. Sign up at https://cloud.qdrant.io
2. Create cluster and get API key
3. Update `.env`:
   ```bash
   QDRANT_URL=https://xxx-yyyy.qdrant.io
   QDRANT_API_KEY=your-secret-api-key
   ```
4. Deploy - no code changes needed!

### Production (Self-Hosted)

```bash
# Deploy Qdrant on server
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

# Update backend .env
QDRANT_URL=http://your-server-ip:6333
```

## Troubleshooting

### Connection Errors

```python
# Check Qdrant is running
curl http://localhost:6333/healthz

# Check logs
docker logs focusguard-qdrant

# Restart service
docker-compose restart qdrant
```

### Collection Not Found

```python
# Initialize collection
from rag.vector_store import get_vector_store

store = get_vector_store()
await store.initialize()  # Creates collection if missing
```

### Dimension Mismatch

Ensure `QDRANT_VECTOR_SIZE` matches your embedding model:
- OpenAI `text-embedding-3-small` → 1536
- OpenAI `text-embedding-3-large` → 3072

## Next Steps

1. ✅ **Vector Store** (Complete - this module)
2. 🔄 **Embeddings**: Implement OpenAI embedding generation
3. 🔄 **Knowledge Base**: Load/process documents from markdown files
4. 🔄 **Retrieval**: Build query pipeline
5. 🔄 **Generation**: LLM response generation

## References

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Qdrant Python Client](https://github.com/qdrant/qdrant-client)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
