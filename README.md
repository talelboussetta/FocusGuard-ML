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
- **Framework**: FastAPI (Python 3.10+)
- **ML Models**: HuggingFace Transformers, OpenCV
- **Database**: PostgreSQL / SQLite
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI

### AI/ML
- **Focus Detection**: MediaPipe Face Mesh
- **Blink Detection**: Custom CV algorithms
- **LLM Integration**: HuggingFace API / OpenAI
- **Browser ML**: TensorFlow.js / ONNX Runtime

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.10+
- Git

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
python run.py
```

The backend will be available at `http://localhost:5000`

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

## 📁 Project Structure

```
FocusGuard-ML/
├── client/                      # Frontend application
│   └── focusguard-dashboard/
│       ├── src/
│       │   ├── components/      # React components
│       │   │   └── ui/          # Reusable UI components
│       │   ├── pages/           # Page components
│       │   ├── hooks/           # Custom React hooks
│       │   ├── assets/          # Static assets
│       │   └── styles/          # Global styles
│       ├── public/              # Public assets
│       └── package.json
│
├── serv/                        # Backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes.py           # API routes
│   │   ├── hf_client.py        # AI/ML integrations
│   │   └── utils.py            # Utility functions
│   ├── config.py               # Configuration
│   ├── run.py                  # Entry point
│   └── requirements.txt
│
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
