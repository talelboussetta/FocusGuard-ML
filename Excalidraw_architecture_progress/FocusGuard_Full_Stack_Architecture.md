# FocusGuard Full-Stack Architecture

**Generated with Figma MCP** - [View in FigJam](https://www.figma.com/online-whiteboard/create-diagram/8383ccc0-87a7-481a-bc3d-4ab2eb70956b?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=748e2aed-9767-498d-9662-1acbfb27d70b)

## Architecture Components

### 🖥️ Frontend Layer (React 18 + TypeScript)
- **UI Components**: React with Tailwind CSS + Framer Motion for animations
- **State Management**: 
  - AuthContext (user authentication)
  - SessionContext (Pomodoro sessions)
  - NotificationContext (alerts)
- **Browser ML Engine**: 
  - MediaPipe Face + Pose Landmarker
  - WebGPU acceleration
  - Real-time blink rate analysis
  - 100% local processing (privacy-first)

### ⚙️ Backend Layer (FastAPI Python 3.11+)

#### HTTP Routes
- `/auth/*` - Login, register, JWT token management
- `/sessions/*` - Create, complete, update sessions
- `/stats/*` - Analytics, leaderboards, user progress
- `/rag/*` - AI coach query processing
- `/teams/*` - Team creation, joining, management

#### Middleware
- **JWT Auth**: Token validation via `get_current_user_id`
- **Rate Limiter**: SlowAPI with per-endpoint limits
- **CORS Handler**: Configured for localhost:5173 (dev)

#### Services (Business Logic)
- `auth_service`: Login, JWT generation, refresh tokens
- `session_service`: XP calculation, streaks, garden growth
- `stats_service`: Leaderboards, analytics aggregation
- `rag_service`: RAG query orchestration
- `team_service`: Team operations, member management

### 🗄️ Database Layer (PostgreSQL 15+)

#### Tables
- `users` - User accounts with UUID primary keys
- `sessions` - Pomodoro sessions with duration, XP, blink rate
- `gardens` - Virtual garden entries (1:1 with sessions)
- `user_stats` - Aggregated stats, streaks, total XP
- `teams` - Team information
- `distractions` - Distraction tracking data

#### Performance
- Indexes on user_id, created_at, completed status
- Async operations with asyncpg driver
- Connection pooling (20 pool size, 10 overflow)

### 🤖 RAG Pipeline (AI Coach)

#### Embeddings Layer
- **Local (Default)**: SentenceTransformer all-MiniLM-L6-v2 (384d)
  - Runs on CPU
  - 100% offline
  - Free
- **Optional**: OpenAI text-embedding-3-small (1536d)

#### Vector Store (Qdrant)
- **Collection**: focusguard_knowledge
- **Search**: Cosine similarity with HNSW algorithm
- **Metadata**: category, tags, user_id filters
- **Deployment**: Local Docker (dev) | Qdrant Cloud (prod)

#### Retrieval Pipeline
1. **Preprocessing**: Query cleaning and normalization
2. **Vector Search**: Top-K retrieval with score threshold (0.3)
3. **Post-Processing**: Deduplication and filtering

#### Generation (LLM)
- **Provider**: HuggingFace Inference API (free tier)
- **Model**: Mistral-7B-Instruct-v0.2
- **Prompts**: 
  - Productivity coach persona
  - Stats analysis templates
  - Context-aware responses

### ☁️ External Services

- **Docker Compose**: PostgreSQL + Qdrant local containers
- **HuggingFace API**: LLM inference endpoints
- **Qdrant Cloud**: Production vector store (optional)

## Data Flow

1. **User Interaction**:
   ```
   Browser (React) → MediaPipe ML → Blink Rate
   ↓
   HTTP/REST + JWT → FastAPI Backend
   ↓
   async asyncpg → PostgreSQL
   ```

2. **AI Coach Query**:
   ```
   User Query → RAG Service
   ↓
   Embedder (384d vector) → Qdrant Search
   ↓
   Retrieved Context → HuggingFace LLM
   ↓
   Generated Response → User
   ```

3. **Session Completion**:
   ```
   Frontend → PATCH /sessions/{id}
   ↓
   session_service: Award XP, Update Streaks
   ↓
   garden_service: Create Garden Entry
   ↓
   user_stats: Increment Totals
   ```

## Key Design Decisions

### ADR-001: Browser-Based ML
- **Privacy**: Video never transmitted to server
- **Scalability**: Offload compute to client devices
- **Latency**: Real-time processing without network roundtrips

### ADR-002: Local Embeddings by Default
- **Cost**: Free vs OpenAI paid API
- **Privacy**: No external API calls for embeddings
- **Performance**: Fast CPU inference (384d vs 1536d)

### ADR-003: Async PostgreSQL
- **Non-blocking**: asyncpg for concurrent requests
- **Performance**: Connection pooling
- **Modern**: SQLAlchemy 2.0 async patterns

### ADR-004: Hugging Face LLM
- **Free Tier**: No credit card required
- **Quality**: Mistral-7B competitive with GPT-3.5
- **Flexibility**: Easy to swap providers later

## Environment Configuration

```bash
# Backend (.env)
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/focusguard_db
JWT_SECRET_KEY=<generated-secret>
QDRANT_URL=http://localhost:6333
QDRANT_VECTOR_SIZE=384
HUGGINGFACE_API_KEY=<your-key>
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Frontend (.env)
VITE_API_URL=http://localhost:8000
```

## Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d  # PostgreSQL + Qdrant

# 2. Backend
cd serv
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py  # FastAPI on :8000

# 3. Frontend
cd client/focusguard-dashboard
npm install
npm run dev  # Vite on :5173
```

## API Endpoints

- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: GET /health
- **RAG Query**: POST /api/rag/query
- **Leaderboard**: GET /api/stats/leaderboard

## Production Considerations

- **Database**: PostgreSQL with SSL, backups
- **Caching**: Redis for leaderboards (not yet implemented)
- **Logging**: Structured logging (upgrade from print statements)
- **Monitoring**: /health endpoint + Prometheus metrics (future)
- **Security**: HTTPS, rate limiting, JWT short expiry (15min)

---

**Diagram Type**: Flowchart (LR)  
**Generated**: February 3, 2026  
**Tool**: Figma MCP + Mermaid.js  
**Status**: ✅ Production-ready architecture
