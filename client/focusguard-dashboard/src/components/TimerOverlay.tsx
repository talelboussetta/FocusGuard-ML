import { motion } from 'framer-motion'
import { Pause, Play, Timer as TimerIcon, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSessionContext } from '../contexts/SessionContext'

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0))
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const TimerOverlay = () => {
  const navigate = useNavigate()
  const {
    activeSession,
    timeLeft,
    sessionDuration,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
  } = useSessionContext()

  if (!activeSession) return null

  return (
    <div className="fixed top-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-lg px-4 py-2 backdrop-blur"
      >
        <div className="flex items-center gap-2 text-slate-200">
          <TimerIcon className="w-5 h-5 text-yellow-400" />
          <span className="text-sm uppercase tracking-wide text-slate-400">Focus Session</span>
        </div>
        <div className="flex items-baseline gap-2 font-mono text-lg text-white">
          <span className="font-semibold">{formatTime(timeLeft)}</span>
          <span className="text-xs text-slate-400">/ {sessionDuration}m</span>
        </div>
        <div className="flex items-center gap-2">
          {isTimerRunning ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-1 rounded-full bg-slate-800 text-slate-100 px-3 py-1 text-sm hover:bg-slate-700 transition"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          ) : (
            <button
              onClick={resumeTimer}
              className="flex items-center gap-1 rounded-full bg-yellow-500 text-slate-900 px-3 py-1 text-sm hover:bg-yellow-400 transition"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 rounded-full border border-slate-700 text-slate-200 px-3 py-1 text-sm hover:border-slate-500 transition"
          >
            <ArrowRight className="w-4 h-4" />
            Open
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default TimerOverlay
