# FocusGuard 🌙

> An AI-powered productivity platform combining Pomodoro focus sessions with real-time webcam analysis, gamification, and team collaboration.

**Live Demo:** [app.focusguardml.tech](https://app.focusguardml.tech)  
**API Docs:** [focusguard-ml.onrender.com/docs](https://focusguard-ml.onrender.com/docs)

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![FocusGuard Banner](https://github.com/talelboussetta/FocusGuard-ML/blob/main/client/focusguard-dashboard/src/assets/images/banner.png)

## Database Architecture

![FocusGuard Architecture](https://github.com/talelboussetta/FocusGuard-ML/blob/main/Excalidraw_architecture_progress/services_update.png)

---

## 🚀 Features

### 🎯 Core Functionality
- **Pomodoro Timer:** Customizable focus sessions (15/25/45/60 min)
- **AI Distraction Detection:** Real-time webcam analysis using MediaPipe (browser-based)
- **Focus Quality Scoring:** Blink rate tracking and posture analysis
- **Session Analytics:** Daily/weekly stats, focus trends, and performance insights

### 🤖 AI-Powered Tutor
- **RAG System:** Qdrant vector database with productivity knowledge base
- **Contextual Coaching:** HuggingFace Mistral-7B provides personalized advice
- **Conversation History:** Multi-turn dialogue with session-aware context

### 🎮 Gamification
- **XP & Levels:** Earn experience points for completed sessions
- **Virtual Garden:** Collect plants based on focus quality
- **Leaderboards:** Global and team rankings (XP, focus time, sessions)
- **Achievement Streaks:** Track daily consistency

### 👥 Team Features
- **Team Creation:** Invite members via unique codes
- **Team Chat:** Real-time messaging within teams
- **Team Leaderboards:** Collaborative competition

---

## 🏗️ Architecture

### Backend (FastAPI)
```
FastAPI 0.109+ (Python 3.11)
├── Async PostgreSQL (asyncpg + SQLAlchemy ORM)
├── JWT Authentication (HS256 with refresh token rotation)
├── WebSocket (real-time distraction monitoring)
├── RAG Service (Qdrant + HuggingFace Inference API)
└── Rate Limiting (SlowAPI)
```

**Key Design Decisions:**
- **Service-Layer Architecture:** Strict separation (routes → services → models → database)
- **UUID Primary Keys:** Enhanced security (no ID enumeration)
- **Sequential SQL Migrations:** Append-only migration system
- **Async Everything:** Non-blocking I/O for scalability

### Frontend (React 18)
```
React 18 + TypeScript + Vite
├── Tailwind CSS (styling)
├── Framer Motion (animations)
├── MediaPipe Face/Pose Landmarker (browser ML)
├── React Router v6 (navigation)
└── Context API (state management)
```

**Key Design Decisions:**
- **Browser-Based ML:** MediaPipe WASM for privacy & cost efficiency
- **Zero Backend ML:** All face/pose detection runs client-side
- **Responsive Design:** Mobile-first approach
- **Real-Time Updates:** WebSocket for live stats

### Infrastructure
```
Production Stack (Render.com Free Tier)
├── Backend: Web Service (512MB RAM, Python 3.11)
├── Frontend: Static Site (CDN-served)
├── Database: PostgreSQL 15 (managed)
├── Vector DB: Qdrant Cloud (1GB free tier)
└── LLM: HuggingFace Inference API (Mistral-7B)
```

---

## 💡 Technical Highlights

### 1. **Browser-Based ML Innovation**
Moved all ML inference to the browser using MediaPipe, eliminating:
- Backend GPU costs
- Video transmission (privacy win!)
- Network latency
- Server compute overhead

### 2. **RAG Implementation**
- Semantic search over productivity knowledge base
- Sentence embeddings via HuggingFace APIs
- Context-aware responses with conversation history
- Lazy-loading to optimize cold-start times

### 3. **Production Optimization**
- Removed heavy dependencies (PyTorch, OpenCV) for 512MB RAM limit
- Skipped blocking warmup tasks for faster port binding
- Implemented efficient connection pooling
- Async database operations throughout

### 4. **Gamification Engine**
- XP calculation: session_duration_min × base_multiplier (default: 10 XP/25 min)
- Level progression: sqrt(xp_points / 100)
- Plant rarity: Based on focus score thresholds
- Streak tracking: Daily session completion

---

## 📊 Database Schema

**9 Core Tables:**
- `users` - Authentication & profile
- `sessions` - Focus session tracking
- `user_stats` - Aggregated metrics
- `gardens` - Plant collection (1:1 with sessions)
- `teams` - Team metadata
- `team_members` - Membership tracking
- `team_messages` - Chat history
- `conversations` - AI tutor dialogue
- `distractions` - Event logging (optional)

**Key Relationships:**
- Users → Sessions (1:N)
- Sessions → Gardens (1:1)
- Users → Teams (N:1, single team membership)
- Conversations → Users (N:1, scoped by session)

---

## 🛠️ Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Git

### Backend Setup
```bash
cd serv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

python main.py  # Runs on http://localhost:8000
```

### Frontend Setup
```bash
cd client/focusguard-dashboard
npm install

# Set up environment variables
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000

npm run dev  # Runs on http://localhost:5173
```

### Database Setup
```bash
# Option 1: Docker (recommended)
docker-compose up -d  # PostgreSQL on :5432

# Option 2: Local PostgreSQL
# Create database and run migrations from serv/database/init/
```

---

## 🔒 Security Features

- JWT access tokens (15 min expiry)
- Refresh token rotation (7 day expiry)
- Bcrypt password hashing (12 rounds)
- CORS protection (whitelisted origins)
- Rate limiting on auth endpoints
- UUID-based IDs (prevent enumeration)
- Input validation (Pydantic schemas)

---

## 📈 Performance Metrics

- **Build Time:** <10s (frontend), <2min (backend)
- **Bundle Size:** 618KB (minified JS)
- **API Response Time:** <100ms (p95)
- **Cold Start:** <5s (free tier)
- **Database Queries:** Optimized with SQLAlchemy async

---

## 🚀 Deployment

**Production URLs:**
- Frontend: https://app.focusguardml.tech
- Backend: https://focusguard-ml.onrender.com
- API Docs: https://focusguard-ml.onrender.com/docs

**Custom Domain Setup:**
- DNS: CNAME `app` → `focusguard-frontend.onrender.com`
- SSL: Auto-provisioned by Render (Let's Encrypt)
- CDN: Render global edge network

**Environment Variables (Backend):**
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
JWT_SECRET_KEY=your-secret-key
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your-api-key
HUGGINGFACE_API_KEY=your-hf-token
ALLOWED_ORIGINS=https://app.focusguardml.tech,http://localhost:5173
```

**Environment Variables (Frontend):**
```bash
VITE_API_URL=https://focusguard-ml.onrender.com
VITE_ENABLE_CAMERA=true
```

---

## 📚 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, Python 3.11, asyncpg, SQLAlchemy 2.0 |
| **Database** | PostgreSQL 15 (Render managed) |
| **Vector DB** | Qdrant Cloud |
| **ML/AI** | MediaPipe (Face/Pose), HuggingFace Mistral-7B |
| **Auth** | JWT (HS256), Bcrypt |
| **Deployment** | Render.com (Web Service + Static Site) |
| **DevOps** | Docker, Git, GitHub |

---

## 🎯 Key Learnings

1. **Async Python:** Mastered asyncio, async/await patterns, and async SQLAlchemy
2. **Production Optimization:** Reduced memory footprint from 800MB to <200MB
3. **Browser ML:** Implemented real-time face/pose tracking with MediaPipe WASM
4. **RAG Systems:** Built semantic search with vector embeddings and LLM integration
5. **Deployment:** Navigated free-tier constraints (512MB RAM) successfully

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline mode with service workers
- [ ] Social features (friend requests, challenges)
- [ ] Advanced analytics dashboard
- [ ] Custom knowledge base upload
- [ ] Integration with calendar apps
- [ ] Spotify/music integration
- [ ] Browser extension for distraction blocking

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev) for browser-based ML models
- [FastAPI](https://fastapi.tiangolo.com) for the incredible Python framework
- [Qdrant](https://qdrant.tech) for vector database
- [HuggingFace](https://huggingface.co) for LLM inference API
- [Render](https://render.com) for hassle-free deployment

---

## 📞 Contact

**Talel Boussetta**  
- GitHub: [@talelboussetta](https://github.com/talelboussetta)
- LinkedIn: [My LinkedIn Profile]((https://www.linkedin.com/in/talel-boussetta/))
- Email: talelboussetta6@gmail.com
- Portfolio: [My Portfolio](https://talelboussetta.me)

---



<p align="center">Made with 💚 for focused minds everywhere</p>
<p align="center">⭐ Star this repo if you found it helpful!</p>
