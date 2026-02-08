import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, Square, Leaf, ArrowRight, Loader2, AlertCircle, Camera, Clock, Flame, CheckCircle, TrendingUp } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import StatsCard from '../components/StatsCard'
import DistractionMonitor from '../components/DistractionMonitor'
import CircularTimerPicker from '../components/CircularTimerPicker'
import { useAuth } from '../contexts/AuthContext'
import { useSessionContext } from '../contexts/SessionContext'
import { userAPI, sessionAPI, statsAPI, getErrorMessage } from '../services/api'
import type { UserStats, Session, DailyStats } from '../services/api'

const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="card-soft p-5 border border-slate-800/60"
  >
    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
      {title}
    </div>
    {children}
  </motion.div>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const {
    activeSession,
    timeLeft,
    isTimerRunning,
    sessionDuration,
    setPlannedDuration,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    refreshActiveSession,
  } = useSessionContext()
  
  // Stats and session data
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()
  const [showStartPopup, setShowStartPopup] = useState(false)
  const [popupChallenge, setPopupChallenge] = useState<string | null>(null)

  // Calculate real-time stats including current session progress
  const liveStats = {
    total_focus_min: (stats?.total_focus_min || 0) + (activeSession ? Math.floor((sessionDuration * 60 - timeLeft) / 60) : 0),
    total_sessions: (stats?.total_sessions || 0) + (activeSession ? 1 : 0),
    current_streak: stats?.current_streak || 0,
    avg_focus_per_session: 0,
    longest_streak: stats?.longest_streak || 0,
    user_id: stats?.user_id || ''
  }
  
  // Calculate average dynamically based on live totals
  if (liveStats.total_sessions > 0) {
    liveStats.avg_focus_per_session = liveStats.total_focus_min / liveStats.total_sessions
  }

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData()
    // If navigated here with a challenge start request, show the START popup briefly
    if ((location as any)?.state?.showChallengeStart) {
      const st = (location as any).state
      setPopupChallenge(st.challenge || null)
      // Clear history state so refresh doesn't re-trigger popup
      try { window.history.replaceState({}, '') } catch (e) {}
      // show after a small delay so the page is visibly loaded
      setTimeout(() => {
        setShowStartPopup(true)
        // show START popup longer and with smoother exit
        setTimeout(() => setShowStartPopup(false), 3200)
      }, 200)
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      // Don't set loading if we already have data (prevent stats reset during refresh)
      if (!stats) {
        setLoading(true)
      }
      setError(null)
      
      const [statsData, sessions, dailyData] = await Promise.all([
        userAPI.getStats(),
        sessionAPI.list({ limit: 4 }),
        statsAPI.getDailyStats(7),
      ])
      
      console.log('Dashboard stats loaded:', statsData)
      setStats(statsData)
      setRecentSessions(sessions || [])
      setDailyStats(dailyData?.daily_stats || [])
      await refreshActiveSession()
    } catch (err: any) {
      console.error('Dashboard load error:', err)
      setError(getErrorMessage(err, 'Failed to load dashboard data'))
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    try {
      setError(null)
      const session = await sessionAPI.create(sessionDuration)
      console.log('Created session:', session) // Debug log
      const duration = session.duration_minutes || sessionDuration
      startTimer(session, duration)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to start session'))
    }
  }

  const handlePauseSession = () => {
    pauseTimer()
  }

  const handleSessionComplete = async () => {
    if (!activeSession || !activeSession.id) {
      setError('No active session found')
      return
    }
    
    console.log('Attempting to complete session:', activeSession.id)
    
    try {
      pauseTimer()
      
      // Calculate actual duration from the session's planned duration and time elapsed
      const plannedSeconds = (activeSession.duration_minutes || sessionDuration) * 60
      const elapsedSeconds = plannedSeconds - timeLeft
      const actualMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60))
      const focusScore = Math.min(100, Math.floor((elapsedSeconds / plannedSeconds) * 100))
      
      console.log(`Completing session with ${actualMinutes} minutes, focus score ${focusScore}%`)
      console.log('Stats BEFORE complete:', stats?.total_focus_min, 'min,', stats?.total_sessions, 'sessions')
      
      // Complete the session on backend (updates XP, stats, plants)
      const completedSession = await sessionAPI.complete(activeSession.id, actualMinutes, focusScore)
      console.log('Backend returned completed session:', completedSession)
      
      // Refresh ALL data FIRST to load updated stats
      await Promise.all([
        refreshUser(),           // Updates XP and level in user object
        loadDashboardData(),     // Reloads stats and recent sessions
      ])
      
      // Wait a tiny bit for React state to update before stopping timer
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Stop timer AFTER new data is loaded and state updated
      stopTimer()
      
      console.log('Session completed successfully, all stats refreshed')
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Failed to complete session')
      console.error('Complete session error:', errorMsg, err)
      setError(errorMsg)
      // If session not found, clear the stale state
      if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        console.log('Session not found, clearing stale state')
        stopTimer()
      }
    }
  }

  const formatTime = (seconds: number): string => {
    // Safety check to prevent NaN display
    if (!seconds || isNaN(seconds) || seconds < 0) {
      seconds = 0;
    }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const buildSparklinePoints = (data: DailyStats[]) => {
    if (!data || data.length === 0) return '0,48 200,48'
    const max = Math.max(...data.map((d) => d.focus_min || 0), 1)
    const step = data.length > 1 ? 200 / (data.length - 1) : 200
    return data
      .map((d, i) => {
        const value = d.focus_min || 0
        const y = 48 - (value / max) * 40
        return `${Math.round(i * step)},${Math.round(y)}`
      })
      .join(' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.08, 0.18, 0.08], 
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* START popup overlay when coming from ProfilePage */}
        <AnimatePresence>
          {showStartPopup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 left-[5rem] z-40 flex items-center justify-center pointer-events-auto">
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.45 }} className="relative bg-gradient-to-br from-primary-600 to-primary-500 text-white px-8 py-6 rounded-3xl shadow-2xl pointer-events-auto max-w-3xl mx-4">
                <div className="text-lg font-bold mb-2">START your challenge</div>
                <div className="text-2xl font-display">{popupChallenge}</div>
                <div className="mt-2 text-sm opacity-90">Good luck — heading to your dashboard!</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-display font-bold mb-2">
                  Welcome back, <span className="gradient-text">{user?.username || 'Focus Warrior'}</span>
                </h1>
                <p className="text-slate-400">
                  Level {user?.lvl || 1} • {user?.xp_points || 0} XP • Today’s focus overview.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => navigate('/camera')}
                  className="btn-secondary flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Camera className="w-5 h-5" />
                  <span>Presence Detection</span>
                </motion.button>
                <motion.button
                  onClick={() => navigate('/garden')}
                  className="btn-primary flex items-center space-x-2 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Leaf className="w-5 h-5" />
                  <span>Go to Garden</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Timer Card */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-8"
              >
                {/* Session Status Bar */}
                {activeSession && (
                  <div className="mb-6 p-4 bg-slate-900/60 border border-slate-800/70 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-300">Session: <span className="font-semibold text-slate-100">{sessionDuration} min</span></span>
                      </div>
                      <div className="w-px h-4 bg-slate-700" />
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-300">Time left: <span className="font-semibold text-slate-100">{formatTime(timeLeft)}</span></span>
                      </div>
                      <div className="w-px h-4 bg-slate-700" />
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-300">Status: <span className="font-semibold text-slate-100">{isTimerRunning ? 'Active' : 'Paused'}</span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-display font-semibold mb-1">
                      {activeSession ? 'Focus Session Active' : 'Set Your Focus Time'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {activeSession ? 'Stay focused and watch your garden grow' : 'Drag the clock to choose your perfect session duration'}
                    </p>
                  </div>
                </div>

                {/* Circular Timer Picker / Active Timer Display */}
                <div className="flex items-center justify-center my-8">
                  {!activeSession ? (
                    <CircularTimerPicker
                      duration={sessionDuration}
                      onDurationChange={setPlannedDuration}
                      disabled={false}
                    />
                  ) : (
                    <div className="relative">
                      {/* Running timer display with circular progress */}
                      <svg width="320" height="320" viewBox="0 0 320 320">
                        <defs>
                      <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="100%" stopColor="#94a3b8" />
                      </linearGradient>
                    </defs>
                        
                        {/* Background circle */}
                        <circle
                          cx="160"
                          cy="160"
                          r="140"
                          fill="none"
                          stroke="#1f2937"
                          strokeWidth="32"
                          opacity="0.6"
                        />
                        
                        {/* Progress circle */}
                        <motion.circle
                          cx="160"
                          cy="160"
                          r="140"
                          fill="none"
                        stroke="#cbd5f5"
                        strokeWidth="32"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 140}
                          strokeDashoffset={2 * Math.PI * 140 * (1 - (timeLeft / (sessionDuration * 60)))}
                          transform="rotate(-90 160 160)"
                          animate={isTimerRunning ? { 
                            strokeDashoffset: 2 * Math.PI * 140 * (1 - (timeLeft / (sessionDuration * 60)))
                          } : {}}
                          transition={{ duration: 1, ease: 'linear' }}
                        />
                        
                        {/* Center time display */}
                        <text
                          x="160"
                          y="150"
                          textAnchor="middle"
                          className="text-7xl font-display font-bold fill-slate-100"
                        >
                          {formatTime(timeLeft)}
                        </text>
                        <text
                          x="160"
                          y="185"
                          textAnchor="middle"
                          className="text-lg font-medium fill-slate-400"
                        >
                          {isTimerRunning ? 'In Progress' : 'Paused'}
                        </text>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Timer Controls */}
                <div className="flex gap-4">
                  {!activeSession ? (
                    <motion.button
                      onClick={handleStartSession}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-5 h-5" />
                      Start Session
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        onClick={isTimerRunning ? handlePauseSession : resumeTimer}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isTimerRunning ? (
                          <>
                            <Pause className="w-5 h-5" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            Resume
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={handleSessionComplete}
                        className="flex-1 bg-nature-500 hover:bg-nature-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Square className="w-5 h-5" />
                        Complete
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Distraction Monitor */}
              <DistractionMonitor
                sessionId={activeSession?.id || null}
                isActive={!!activeSession && isTimerRunning}
              />
            </div>

            {/* Stats Column */}
            <div className="space-y-6">
              {/* Hero Stat - Total Focus Time (larger) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-soft p-6 border border-slate-800/70"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <Clock className="w-7 h-7 text-slate-200" />
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-display font-bold mb-1">
                    {formatMinutes(liveStats.total_focus_min)}
                  </div>
                  <div className="text-sm text-slate-400">Total Focus Time</div>
                </div>
                <div className="text-xs text-slate-400 font-semibold">Keep building momentum</div>
              </motion.div>

              {/* Secondary Stats (smaller) */}
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  title="Streak"
                  value={`${liveStats.current_streak}`}
                  icon={<Flame className="w-5 h-5" />}
                  gradient="from-slate-700 to-slate-800"
                  trend={liveStats.current_streak ? 'days' : undefined}
                />
                <StatsCard
                  title="Sessions"
                  value={`${liveStats.total_sessions}`}
                  icon={<CheckCircle className="w-5 h-5" />}
                  gradient="from-slate-700 to-slate-800"
                  trend={`${liveStats.avg_focus_per_session ? liveStats.avg_focus_per_session.toFixed(0) : '0'} min`}
                />
              </div>

              {/* Focus Tip */}
              <InfoCard title="Focus Tip">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Try a 25/5 cadence: 25 minutes of deep focus, 5 minutes of reset.
                  It keeps attention high without burnout.
                </p>
              </InfoCard>

              {/* Today Summary */}
              <InfoCard title="Today Summary">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Time focused today</span>
                  <span className="text-slate-100 font-semibold">
                    {activeSession ? formatMinutes(Math.floor((sessionDuration * 60 - timeLeft) / 60)) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300 mt-2">
                  <span>Sessions today</span>
                  <span className="text-slate-100 font-semibold">
                    {activeSession ? '1' : '0'}
                  </span>
                </div>
              </InfoCard>

              {/* Quick Insight */}
              <InfoCard title="Quick Insight">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Avg session length</span>
                  <span className="text-slate-100 font-semibold">
                    {liveStats.avg_focus_per_session ? `${liveStats.avg_focus_per_session.toFixed(0)} min` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300 mt-2">
                  <span>Current streak</span>
                  <span className="text-slate-100 font-semibold">
                    {liveStats.current_streak} days
                  </span>
                </div>
              </InfoCard>

              {/* Weekly Focus Trend */}
              <InfoCard title="Weekly Focus Trend">
                <div className="h-20">
                  <svg viewBox="0 0 200 60" className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      points={buildSparklinePoints(dailyStats)}
                    />
                    <circle cx="200" cy="22" r="3" fill="#e2e8f0" />
                  </svg>
                </div>
                <div className="text-xs text-slate-400 mt-2">Last 7 days focus minutes</div>
              </InfoCard>
            </div>
          </div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-display font-semibold mb-4">
              Recent Sessions
            </h2>
            <div className="card-soft border border-slate-800/60">
              {recentSessions.length > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  <div className="grid grid-cols-5 text-xs uppercase tracking-wider text-slate-500 px-4 py-3">
                    <span>Status</span>
                    <span>Duration</span>
                    <span>Date</span>
                    <span>Blink</span>
                    <span className="text-right">Focus</span>
                  </div>
                  {recentSessions.map((session, index) => {
                    const duration = session.duration_minutes || 25
                    const blinkRate = session.blink_rate ? session.blink_rate.toFixed(1) : '—'
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="grid grid-cols-5 items-center px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            session.completed ? 'bg-emerald-400' : 'bg-slate-400 animate-pulse'
                          }`} />
                          <span className="text-slate-300">
                            {session.completed ? 'Completed' : 'Active'}
                          </span>
                        </div>
                        <span className="text-slate-200 font-semibold">{duration}m</span>
                        <span className="text-slate-400">
                          {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-slate-300">{blinkRate}</span>
                        <span className="text-right text-slate-400">—</span>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  No sessions yet. Start your first focus session!
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
