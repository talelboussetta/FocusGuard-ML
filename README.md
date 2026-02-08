# 🌱 FocusGuard

> Grow your focus. One session at a time.

FocusGuard is a modern productivity platform that combines the Pomodoro technique with AI-powered focus insights and gamification. Build better study habits while growing your personal digital garden.

![FocusGuard Banner](https://github.com/talelboussetta/FocusGuard-ML/blob/main/client/focusguard-dashboard/src/assets/images/banner.png)

## Database Architecture

![FocusGuard Architecture](https://github.com/talelboussetta/FocusGuard-ML/blob/main/Excalidraw_architecture_progress/services_update.png)

## ✨ Features

### 🎯 Smart Focus Sessions
- **Pomodoro Timer**: Customizable focus and break intervals
- **Session Tracking**: Monitor your daily, weekly, and monthly progress
- **Streak System**: Build momentum with consecutive focus days

### 🤖 AI-Powered Insights
- **Computer Vision**: Real-time focus detection using webcam (100% local processing)
- **Blink Rate Analysis**: Understand your attention patterns
- **AI Tutor**: Personalized coaching based on your focus habits
- **Smart Recommendations**: Get insights on optimal focus times and session lengths

### 🌿 Personal Garden
- **Gamified Progress**: Watch your garden grow with each completed session
- **Visual Motivation**: Beautiful nature-inspired visuals
- **Emotional Connection**: A personal space that reflects your dedication

### 📊 Advanced Analytics
- **Focus Trends**: Interactive charts showing your productivity patterns
- **Session Quality**: Detailed breakdowns of your focus sessions
- **Performance Insights**: Track improvements over time

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **ML Runtime**: ONNX Runtime Web (WebGPU)
- **Build Tool**: Vite
- **State Management**: React Context / Zustand

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **Authentication**: JWT with refresh token rotation
- **API Documentation**: Swagger/OpenAPI (auto-generated)
- **Async Runtime**: asyncpg for non-blocking DB operations

### AI/ML (Browser-Based)
- **Focus Detection**: MediaPipe Face + Pose Landmarker (100% browser inference)
- **Blink Rate Analysis**: MediaPipe eye blendshapes
- **RAG Pipeline**: Qdrant vector store + HuggingFace LLM API

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.11+
- Git
- Docker (for PostgreSQL database)

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/FocusGuard-ML.git
cd FocusGuard-ML
```

#### 2. Set up the Backend
```bash
cd serv

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend will be available at `http://localhost:8000`

#### 3. Set up the Frontend
```bash
cd client/focusguard-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Environment Variables

#### Backend (.env)
```env
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost/focusguard
HUGGINGFACE_API_KEY=your-hf-api-key
OPENAI_API_KEY=your-openai-api-key
CORS_ORIGINS=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_ENABLE_CAMERA=true
```

## � Deployment

### DigitalOcean App Platform (Recommended)

Deploy FocusGuard to production in under 30 minutes with DigitalOcean App Platform:

**Features:**
- ✅ Automatic deployments from GitHub
- ✅ Managed PostgreSQL database
- ✅ SSL certificates (HTTPS)
- ✅ Auto-scaling infrastructure
- ✅ Zero-downtime deployments
- ✅ Built-in monitoring

**Quick Start:**
```bash
# 1. Push your code to GitHub (already done ✅)
# 2. Follow the step-by-step guide:
```

📖 **Complete Guide**: See [DIGITALOCEAN_DEPLOYMENT.md](DIGITALOCEAN_DEPLOYMENT.md) for detailed instructions.

**Estimated Monthly Cost**: ~$25-35 USD (includes database, backend, frontend)

### Other Deployment Options

- **Docker Compose**: See [docker-compose.yml](docker-compose.yml) for local/VPS deployment
- **AWS/GCP/Azure**: See [DEPLOYMENT.md](DEPLOYMENT.md) for cloud platform guides
- **Self-Hosted**: See [docs/self-hosting.md](docs/self-hosting.md) for custom server setup

## �📁 Project Structure

```
FocusGuard-ML/
├── client/focusguard-dashboard/    # React frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── contexts/               # React Context (Auth, Session, etc.)
│   │   ├── pages/                  # Route pages
│   │   ├── services/               # API client
│   │   └── assets/                 # Images, fonts, etc.
│   └── public/
├── serv/                           # FastAPI backend
│   ├── api/
│   │   ├── routes/                 # HTTP endpoints
│   │   ├── services/               # Business logic
│   │   ├── models/                 # SQLAlchemy ORM
│   │   ├── schemas/                # Pydantic validation
│   │   └── middleware/             # Auth, CORS, rate limiting
│   ├── rag/                        # RAG AI Tutor system
│   │   ├── embeddings/             # Text embeddings
│   │   ├── retrieval/              # Vector search
│   │   ├── generation/             # LLM integration
│   │   ├── vector_store/           # Qdrant vector DB
│   │   └── knowledge_base/         # Markdown docs
│   └── database/init/              # SQL migrations
├── scripts/                        # Development utilities
│   ├── run_migration.py            # Manual DB migration
│   └── remove_background.py        # Image processing
├── .do/                            # DigitalOcean App Platform config
│   └── app.yaml                    # Deployment specification
├── .github/workflows/              # CI/CD pipelines
├── docker-compose.yml              # Local development PostgreSQL
├── DIGITALOCEAN_DEPLOYMENT.md      # Production deployment guide
└── README.md
```

## 🎨 Design Philosophy

FocusGuard is designed to be:
- **Calm**: Soft gradients, gentle animations, comfortable for long sessions
- **Intelligent**: AI-powered without feeling robotic
- **Motivating**: Gamification that feels personal, not competitive
- **Modern**: Premium UI with depth, glassmorphism, and micro-animations
- **Private**: All camera processing happens locally in your browser

## 🔒 Privacy & Security

- **Local Processing**: Camera feed never leaves your device
- **Encrypted Data**: All personal data is encrypted
- **No Tracking**: We don't sell or share your data
- **Open Source**: Full transparency in our codebase

## 🛠️ Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

#### Backend
```bash
python run.py        # Start development server
pytest              # Run tests
black .             # Format code
flake8              # Lint code
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the Pomodoro Technique by Francesco Cirillo
- UI/UX inspiration from Calm, Forest, and modern productivity tools
- Computer vision powered by MediaPipe and TensorFlow.js
- Community feedback and contributions

## 📧 Contact

- **Website**: [focusguard.app](https://focusguard.app)
- **Email**: hello@focusguard.app
- **Twitter**: [@focusguard](https://twitter.com/focusguard)

---

<p align="center">Made with 💚 for focused minds everywhere</p>
