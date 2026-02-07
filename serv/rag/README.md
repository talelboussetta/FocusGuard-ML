# RAG Pipeline for FocusGuard

**Retrieval-Augmented Generation system** for AI-powered productivity coaching, focus insights, and personalized productivity recommendations.

---

## 🏗️ Architecture Overview

```
rag/
├── embeddings/          ✅ COMPLETE - Text → vector conversion (384d local, 1536d OpenAI)
├── vector_store/        ✅ COMPLETE - Qdrant vector database integration
├── retrieval/           ✅ COMPLETE - Smart document retrieval with filtering
├── generation/          ✅ COMPLETE - Hugging Face LLM integration (Mistral-7B)
└── knowledge_base/      ✅ COMPLETE - 43 documents (9 topics) ingested
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

### ✅ **Generation Module** - Production Ready
**Hugging Face LLM integration** with free inference API:

**Current Implementation**:
- **Provider**: Hugging Face Inference API (FREE tier, no credit card)
- **Model**: `mistralai/Mistral-7B-Instruct-v0.2` (7B parameter instruction-tuned)
- **Features**: RAG-optimized prompts, source attribution, personalized responses
- **Files**: `huggingface_generator.py`, `config.py`, `prompts.py`

**Configuration** (`.env`):
```bash
# Hugging Face Settings (ACTIVE)
HUGGINGFACE_API_KEY=your-hf-token-here
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
LLM_TIMEOUT_SECONDS=30
LLM_MAX_RETRIES=2

# Alternative Providers (Optional, not yet implemented)
USE_LOCAL_LLM=False
OPENAI_API_KEY=sk-...           # For OpenAI GPT models
ANTHROPIC_API_KEY=...           # For Claude models
OLLAMA_BASE_URL=http://localhost:11434  # For local Ollama
```

**Get Free Hugging Face Token**:
1. Sign up at https://huggingface.co
2. Go to https://huggingface.co/settings/tokens
3. Create a read token and add to `.env`

**Future Enhancements** (alternative providers):
- `openai_generator.py` - GPT-3.5/GPT-4 for premium quality
- `anthropic_generator.py` - Claude integration for advanced reasoning
- `ollama_generator.py` - Local LLM for offline operation

---

### ✅ **Knowledge Base** - Production Ready
**43 documents** across 9 productivity topics, fully ingested into Qdrant:

**Current State**:
- ✅ **9 markdown files**: focus_productivity, homework_help, learning_science, mental_models, note_taking, personal_guidance, problem_solving_frameworks, study_methods, time_management
- ✅ **43 chunks**: Automatically split by `##` sections for optimal retrieval
- ✅ **Ingested**: Run `python -m rag.ingest_knowledge_base` to refresh
- ✅ **Health check**: `GET /rag/health` shows `documents_count: 43`

**Document Format** (YAML frontmatter + Markdown):
```markdown
---
category: focus_productivity
difficulty: beginner
tags: [pomodoro, breaks, deep_work]
---

# Focus and Productivity Strategies

## The Pomodoro Technique
Work in focused 25-minute intervals with 5-minute breaks...

## Deep Work Principles
Eliminate distractions and enter flow state...
```

**Ingestion Features**:
- Extracts YAML metadata (category, tags, difficulty)
- Chunks by `##` headers (preserves context)
- Generates unique IDs: `{filename}_{chunk_index}`
- Adds section titles to metadata for better search

**Re-ingest Knowledge Base**:
```bash
cd serv
python -m rag.ingest_knowledge_base  # Reloads all .md files
```

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

## 🚀 RAG Query Flow (Production)

**Operational endpoint: `POST /rag/query`**

```python
# Example usage from RAGService
from api.services.rag_service import get_rag_service

rag_service = get_rag_service()

response = await rag_service.query(
    query="How do I avoid phone distractions during study sessions?",
    top_k=3,
    category_filter="focus_productivity",
    include_sources=True,
    user_id="optional-user-id",  # For personalization
    db=db_session
)

# Response structure:
{
    "answer": "To avoid phone distractions...",  # Generated by Mistral-7B
    "sources": [
        {
            "content": "# Focus and Productivity...",
            "source": "focus_productivity.md",
            "section_title": "Distraction Management",
            "score": 0.87,
            "category": "focus_productivity"
        }
    ],
    "query": "How do I avoid phone distractions...",
    "model_used": "mistralai/Mistral-7B-Instruct-v0.2"
}
```

**Internal Flow**:
1. **Retrieve**: Embed query → Search Qdrant → Return top-k docs (scored)
2. **Personalize**: If user_id provided, fetch stats (level, streak, sessions)
3. **Generate**: LLM creates answer with context + sources
4. **Cite**: Return answer with source attributions

---

## 📈 Next Steps

### **Immediate**:
1. ✅ ~~Research LLM providers~~ - Using Hugging Face (free tier)
2. ✅ ~~Implement generation module~~ - Mistral-7B integrated
3. ✅ ~~Create prompt templates~~ - FocusGuard coaching prompts ready
4. ✅ ~~Write ingestion script~~ - `python -m rag.ingest_knowledge_base`
5. ✅ ~~Add knowledge base content~~ - 43 documents across 9 topics

### **Short-term** (Enhancements):
1. Add more productivity content (expand from 9 to 20+ topics)
2. Implement reranking (cross-encoder for better relevance)
3. Add conversation memory (multi-turn dialogues)
4. Implement OpenAI/Anthropic generators (premium alternatives)

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

**Status**: 🎉 **100% Core Features Complete** - Full RAG pipeline operational with Hugging Face Mistral-7B, 43 knowledge base documents ingested, and production-ready API endpoints (`POST /rag/query`, `GET /rag/health`).

