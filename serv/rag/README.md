# RAG Pipeline for FocusGuard

This directory contains the Retrieval-Augmented Generation (RAG) pipeline for providing AI-powered focus insights and productivity tips.

## Architecture Overview

```
rag/
├── embeddings/          # Convert text to vector embeddings
├── vector_store/        # Store and index embeddings (ChromaDB, FAISS, etc.)
├── retrieval/           # Retrieve relevant documents based on queries
├── generation/          # Generate responses using LLM (OpenAI, Anthropic, etc.)
└── knowledge_base/      # Source documents (markdown, txt, pdf)
```

## Workflow

1. **Ingestion**: Documents from `knowledge_base/` are processed
2. **Embedding**: Text is converted to vectors using `embeddings/`
3. **Storage**: Vectors stored in `vector_store/` with metadata
4. **Retrieval**: User query → find top-k relevant documents
5. **Generation**: LLM generates answer using retrieved context

## Use Cases for FocusGuard

- **Focus Tips**: Query user's distraction patterns → retrieve relevant focus strategies
- **Productivity Insights**: Analyze session history → generate personalized recommendations
- **AI Coaching**: Provide real-time advice during sessions
- **Pattern Analysis**: Find similar successful sessions from knowledge base

## Getting Started

1. Add documents to `knowledge_base/` (e.g., focus_tips.md, productivity_research.pdf)
2. Choose embedding model (OpenAI, HuggingFace, local)
3. Choose vector store (ChromaDB for simplicity, FAISS for speed)
4. Implement retrieval logic
5. Connect to LLM (OpenAI GPT-4, Anthropic Claude, etc.)

## Future Integrations

- Add RAG endpoint: `POST /api/rag/query` → `{"query": "how to avoid phone distractions", "context": {...}}`
- Integrate with session service to auto-generate tips
- Store user-specific embeddings for personalized retrieval
