import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SessionProvider } from './contexts/SessionContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import GardenPage from './pages/GardenPage'
import CameraPage from './pages/CameraPage'
import AITutorPage from './pages/AITutorPage'
import AnalyticsPage from './pages/AnalyticsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ErrorPage from './pages/ErrorPage'
import TimerOverlay from './components/TimerOverlay'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SessionProvider>
      <TimerOverlay />
      {children}
    </SessionProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garden"
          element={
            <ProtectedRoute>
              <GardenPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/camera"
          element={
            <ProtectedRoute>
              <CameraPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-tutor"
          element={
            <ProtectedRoute>
              <AITutorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        {/* Catch-all route for 404 errors */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <NotificationProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </NotificationProvider>
  )
}

export default App
