# RAG Pipeline for FocusGuard

**Retrieval-Augmented Generation system** for AI-powered productivity coaching, focus insights, and personalized productivity recommendations.

---

## 🏗️ Architecture Overview

```
rag/
├── embeddings/          ✅ COMPLETE - Text → vector conversion (384d local, 1536d OpenAI)
├── vector_store/        ✅ COMPLETE - Qdrant vector database integration
├── retrieval/           ✅ COMPLETE - Smart document retrieval with filtering
├── generation/          🔴 IN PROGRESS - LLM response generation (OpenAI/Claude/Ollama)
└── knowledge_base/      🔴 TODO - Productivity tips & focus strategies
```

---

## 📊 Current Implementation Status

### ✅ **Embeddings Module** - Production Ready
**Provider-agnostic design** with dual support:

| Provider | Model | Dimensions | Cost | Speed | Use Case |
|----------|-------|------------|------|-------|----------|
| **Local** (Default) | all-MiniLM-L6-v2 | 384 | FREE | Fast | Development, privacy-focused |
| **OpenAI** | text-embedding-3-small | 1536 | $0.02/1M tokens | Medium | Production, higher quality |

**Configuration** (`.env`):
```bash
USE_LOCAL_EMBEDDINGS=True  # Toggle provider
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
```

**Key Features**:
- Async batch processing
- Automatic model caching
- CPU/GPU support
- Preprocessing (lowercase, strip)

---

### ✅ **Vector Store Module** - Production Ready
**Qdrant integration** with Docker local deployment:

- **Storage**: Cosine similarity search
- **Metadata**: Category, tags, user_id, session_id, created_at
- **Operations**: CRUD, search, filtering, health checks
- **Deployment**: Local Docker (dev), Qdrant Cloud (prod)

**Configuration**:
```bash
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=focusguard_knowledge
QDRANT_VECTOR_SIZE=384  # Must match embedder dimension
```

**Docker Setup**:
```yaml
# In docker-compose.yml (already configured)
qdrant:
  image: qdrant/qdrant:latest
  ports:
    - "6333:6333"
  volumes:
    - qdrant_storage:/qdrant/storage
```

---

### ✅ **Retrieval Module** - Production Ready
**Smart document retrieval** with preprocessing and filtering:

**Pipeline**: Query → Preprocess → Embed → Search → Filter → Deduplicate → Results

**Features**:
- **Preprocessing**: Whitespace normalization, control character removal
- **Metadata filtering**: `{category: "focus_tips", user_id: "123"}`
- **Score threshold**: Default 0.3 (configurable)
- **Deduplication**: Removes duplicate document IDs
- **Reranking**: Placeholder for cross-encoder (future)

**Configuration**:
```bash
RAG_RETRIEVAL_TOP_K=5          # How many docs to retrieve
RAG_SCORE_THRESHOLD=0.3        # Min similarity score (0.0-1.0)
RAG_ENABLE_RERANKING=False     # Cross-encoder reranking
```

**Usage Example**:
```python
from rag.embeddings.config import get_embedder
from rag.vector_store.config import get_vector_store
from rag.retrieval import Retriever

embedder = get_embedder()
vector_store = get_vector_store()
retriever = Retriever(embedder, vector_store)

results = await retriever.retrieve(
    query="How to avoid phone distractions?",
    top_k=3,
    context={"category": "distraction_management"}
)
# Returns: [SearchResult(score=0.61, document=...)]
```

---

### 🔴 **Generation Module** - Not Implemented
**Multi-provider LLM support** (configuration ready, implementation pending):

**Supported Providers** (config exists, choose based on research):

| Provider | Model Options | Cost | Quality | Latency | Offline |
|----------|--------------|------|---------|---------|---------|
| **OpenAI** | gpt-3.5-turbo, gpt-4 | $$ | Excellent | 1-3s | ❌ |
| **Anthropic** | claude-3-sonnet, opus | $$$ | Excellent | 2-4s | ❌ |
| **Ollama** | llama3:8b, mistral | FREE | Good | 5-15s | ✅ |

**Configuration** (already in `.env`):
```bash
# Provider Selection
USE_LOCAL_LLM=False              # Toggle between API/local

# OpenAI Settings
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-3.5-turbo  # or gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=500

# Anthropic (Alternative)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Ollama (Local/Free)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b

# Request Settings
LLM_TIMEOUT_SECONDS=30
LLM_MAX_RETRIES=2
```

**What Needs Building**:
1. `openai_generator.py` - GPT-3.5/GPT-4 implementation
2. `anthropic_generator.py` - Claude integration (optional)
3. `ollama_generator.py` - Local LLM support (optional)
4. `config.py` - Singleton factory (like embeddings)
5. `prompts.py` - FocusGuard-specific prompt templates

---

### 🔴 **Knowledge Base** - Sample Data Only
**Productivity content** in structured markdown:

**Current State**:
- ✅ Sample document: Pomodoro Technique guide
- ❌ Not ingested into vector store yet
- ❌ No ingestion pipeline

**Document Format**:
```markdown
---
category: focus_tips
difficulty: beginner
tags: [pomodoro, breaks, time_management]
---

# The Pomodoro Technique for Deep Focus

## What is the Pomodoro Technique?
...
```

**Needed**:
1. Ingestion script to load markdown → vector store
2. More content: focus strategies, distraction management, time blocking
3. Metadata extraction from YAML frontmatter
4. Document chunking for long content

---

## 🔧 Configuration Summary

**All settings in `serv/api/config.py`** with environment variable support:

```python
# Embeddings
use_local_embeddings: bool = True
sentence_transformer_model: str = "all-MiniLM-L6-v2"
openai_embedding_model: str = "text-embedding-3-small"

# Vector Store
qdrant_url: str = "http://localhost:6333"
qdrant_vector_size: int = 384

# Retrieval
rag_retrieval_top_k: int = 5
rag_score_threshold: float = 0.3

# Generation (ready for implementation)
use_local_llm: bool = False
openai_chat_model: str = "gpt-3.5-turbo"
ollama_model: str = "llama3:8b"
```

---

## 🚀 RAG Query Flow (When Complete)

```python
# Future endpoint: POST /api/rag/query
async def query_rag(request: RAGQueryRequest):
    # 1. Retrieve relevant documents
    retriever = Retriever(embedder, vector_store)
    docs = await retriever.retrieve(request.query, top_k=5)
    
    # 2. Generate response
    generator = get_generator()  # OpenAI/Anthropic/Ollama
    response = await generator.generate(
        query=request.query,
        context_documents=[doc.content for doc in docs],
        system_prompt=PRODUCTIVITY_COACH_PROMPT
    )
    
    return {"answer": response, "sources": docs}
```

---

## 📈 Next Steps

### **Immediate** (Generation Module):
1. Research LLM providers (OpenAI vs Claude vs Ollama)
2. Implement chosen provider(s) in `generation/`
3. Create prompt templates for FocusGuard coaching
4. Test end-to-end RAG pipeline

### **Short-term** (Knowledge Base):
1. Write ingestion script: `python ingest_knowledge.py`
2. Add more productivity content (20-30 documents)
3. Chunk long documents (max 500 tokens per chunk)

### **Integration**:
1. Create `/api/rag/query` FastAPI endpoint
2. Connect to session service for personalized tips
3. Add to frontend: AI coach chatbot

---

## 📚 Documentation

- **Embeddings**: `embeddings/README.md` - Dual provider setup
- **Vector Store**: `vector_store/README.md` - Qdrant operations
- **Retrieval**: `retrieval/README.md` - Search pipeline
- **Generation**: `generation/base_generator.py` - Interface docs

---

## 💡 Use Cases for FocusGuard

1. **Session Insights**: "Why did my last session have low focus score?"
2. **Personalized Tips**: "How can I improve my afternoon focus?"
3. **Distraction Analysis**: "What are the best ways to avoid phone distractions?"
4. **Progress Tracking**: "Show me successful strategies from my past sessions"
5. **Coaching**: Real-time AI coach during Pomodoro sessions

---

**Status**: 60% complete - Embeddings, vector store, and retrieval are production-ready. Generation module needs implementation based on LLM provider research.

