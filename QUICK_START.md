# FocusGuard ML - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.13+ (for ML backend)
- Webcam (for focus detection)

### Frontend Setup

```bash
cd client/focusguard-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup (ML Models)

```bash
cd serv

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r models/requirements.txt

# Run blink detector
python models/blink_detector_opencv.py
```

## 📱 Available Routes

- `/` - Landing page
- `/auth` - Sign in / Sign up
- `/dashboard` - Main dashboard
- `/garden` - Virtual productivity garden
- `/camera` - Live focus detection
- `/ai-tutor` - AI chat coach
- `/analytics` - Productivity analytics

## 🎨 Using UI Components

```tsx
import { Button, Card, Modal, Input } from './components/ui'

function MyComponent() {
  return (
    <Card variant="gradient">
      <Input label="Name" placeholder="Enter name" />
      <Button variant="primary" onClick={handleClick}>
        Submit
      </Button>
    </Card>
  )
}
```

## 🪝 Using Hooks

```tsx
import { useTimer, useFocusSession, useNotification } from './hooks'

function TimerComponent() {
  const timer = useTimer({
    duration: 1500, // 25 minutes
    onComplete: () => console.log('Done!')
  })

  return (
    <div>
      <p>{timer.minutes}:{timer.seconds}</p>
      <button onClick={timer.start}>Start</button>
      <button onClick={timer.pause}>Pause</button>
      <button onClick={timer.reset}>Reset</button>
    </div>
  )
}
```

## 🔔 Notifications

```tsx
import { useNotificationContext } from './contexts/NotificationContext'

function MyComponent() {
  const { success, error, warning, info } = useNotificationContext()

  const handleSave = () => {
    success('Changes saved successfully!')
  }

  return <button onClick={handleSave}>Save</button>
}
```

## 🎯 Focus Session Management

```tsx
import { useFocusSession } from './hooks'

function SessionComponent() {
  const { 
    startSession, 
    completeSession, 
    getSessionStats 
  } = useFocusSession()

  const handleStart = () => {
    startSession('focus', 1500) // 25 min focus session
  }

  const handleComplete = () => {
    completeSession(85, 20, 2) // quality%, blinks, distractions
  }

  const stats = getSessionStats()
  
  return (
    <div>
      <p>Today's sessions: {stats.todaySessions}</p>
      <p>Total focus time: {stats.totalFocusTime}s</p>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleComplete}>Complete</button>
    </div>
  )
}
```

## 🔌 Backend Integration Points

### 1. Blink Detection API
```typescript
// CameraPage is ready to integrate with:
POST /api/detect
Content-Type: application/json

Request:
{
  frame: base64EncodedImage,
  timestamp: number
}

Response:
{
  blinkCount: number,
  focusQuality: number,
  eyeAspectRatio: number
}
```

### 2. AI Tutor API
```typescript
// AITutorPage ready for:
POST /api/chat
Content-Type: application/json

Request:
{
  message: string,
  sessionHistory: Array<{role, content}>
}

Response:
{
  reply: string,
  suggestions?: string[]
}
```

### 3. Analytics API
```typescript
// AnalyticsPage ready for:
GET /api/sessions?startDate=2024-01-01&endDate=2024-01-31

Response:
{
  sessions: Array<FocusSession>,
  stats: {
    totalTime: number,
    averageQuality: number,
    streak: number
  }
}
```

## 📁 Project Structure

```
FocusGuard-ML/
├── client/focusguard-dashboard/    # React frontend
│   ├── src/
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── components/
│   │   │   └── ui/                  # Reusable UI components
│   │   ├── contexts/                # React contexts
│   │   ├── pages/                   # Route pages
│   │   └── assets/                  # Images, fonts
│   └── package.json
└── serv/                            # Python backend
    ├── models/                      # ML models
    │   ├── blink_detector_opencv.py
    │   └── requirements.txt
    └── app/                         # Flask API (to be added)
```

## 🎨 Color System

```tsx
// Tailwind classes available:
- primary-500     // Blue
- emerald-500     // Green (success)
- yellow-500      // Yellow (warning)
- red-500         // Red (danger)
- purple-500      // Purple (accent)
- slate-900       // Dark backgrounds
```

## 🔧 Development Tips

1. **Hot Module Replacement**: Changes appear instantly in browser
2. **TypeScript**: Use Cmd/Ctrl+Space for autocomplete
3. **Component Props**: Hover over components to see available props
4. **Console Logs**: Check browser console for errors
5. **React DevTools**: Install browser extension for debugging

## 📚 Key Dependencies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **React Router** - Navigation

## 🐛 Common Issues

### Port already in use
```bash
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

### TypeScript errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Camera not working
- Check browser permissions (allow camera access)
- Ensure no other app is using the camera
- Try a different browser

## 📖 Further Reading

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion)

## 🎯 Next Steps

1. ✅ Frontend is complete and ready to use
2. 🔄 Build Flask API for backend integration
3. 🔄 Connect camera feed to blink detector
4. 🔄 Integrate authentication system
5. 🔄 Add database for session persistence
6. 🔄 Deploy to production

---

**Happy coding! 🚀** If you have questions, check the component README files in `/hooks` and `/components/ui`.
