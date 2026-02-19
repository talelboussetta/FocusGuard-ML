# Vector Store Module - Supabase pgvector Implementation

Production-ready vector storage for FocusGuard's RAG pipeline using Supabase pgvector.

## Overview

The vector store handles:
- **Storage**: Persisting document embeddings with metadata
- **Search**: Similarity search via Supabase RPC
- **Filtering**: Metadata-based filtering (category, user_id, session_id, tags)
- **Scalability**: Managed Postgres with pgvector

## Architecture

```
vector_store/
├── base_store.py       # Abstract base class (Document, SearchResult, BaseVectorStore)
├── supabase_store.py   # Supabase pgvector implementation
├── config.py           # Configuration & singleton access
├── examples.py         # Usage examples & testing
└── __init__.py         # Public API exports
```

## Quick Start

### 1. Configure Environment

Add to `serv/.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_COLLECTION_NAME=documents
SUPABASE_QUERY_FUNCTION=match_documents
```

### 2. Apply Migration

Run the SQL in `serv/rag/supabase_migration.sql` to create:
- `documents` table with `embedding vector(1536)`
- `match_documents` RPC for similarity search

### 3. Basic Usage

# n8n ingestion populates the table, backend queries only
```python
from rag.vector_store import get_vector_store
# Get singleton instance (uses config from .env)
store = get_vector_store()
await store.initialize()

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
cd serv
python -m rag.vector_store.examples
```

Examples include:
1. Basic usage (add/search/delete)
2. Metadata filtering
3. User personalization
4. CRUD operations

### Manual Testing

Use Supabase SQL editor to validate:
- `select count(*) from documents;`
- `select * from match_documents(:query_embedding, 0.3, 5, '{}'::jsonb);`

## Deployment

### Supabase

1. Create a Supabase project
2. Run `serv/rag/supabase_migration.sql` in SQL editor
3. Set `SUPABASE_URL` and `SUPABASE_KEY` in backend environment
4. Ensure the embedding model dimension matches `vector(1536)`

## Troubleshooting

### Connection Errors

- Verify `SUPABASE_URL` and `SUPABASE_KEY`
- Ensure the `match_documents` RPC exists

### Empty Results

- Confirm embeddings in Supabase use the same model as backend queries
- Lower `RAG_SCORE_THRESHOLD` if results are too strict

### Dimension Mismatch

Ensure the Supabase column dimension matches your embedding model:
- OpenAI `text-embedding-3-small` → 1536
- OpenAI `text-embedding-3-large` → 3072

## Next Steps

1. ✅ **Vector Store** (Complete - this module)
2. 🔄 **Embeddings**: Implement OpenAI embedding generation
3. 🔄 **Ingestion**: Maintain n8n pipeline to Supabase
4. 🔄 **Retrieval**: Build query pipeline
5. 🔄 **Generation**: LLM response generation

## References

- [Supabase](https://supabase.com/docs)
- [pgvector](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
