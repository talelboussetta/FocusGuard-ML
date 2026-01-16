import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { NotificationProvider } from './contexts/NotificationContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import GardenPage from './pages/GardenPage'
import CameraPage from './pages/CameraPage'
import AITutorPage from './pages/AITutorPage'
import AnalyticsPage from './pages/AnalyticsPage'

function App() {
  return (
    <NotificationProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/garden" element={<GardenPage />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/ai-tutor" element={<AITutorPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </NotificationProvider>
  )
}

export default App
