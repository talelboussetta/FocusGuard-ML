import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { sessionAPI, gardenAPI, type Session } from '../services/api'
import { useNotification } from '../hooks/useNotification'

interface SessionContextType {
  activeSession: Session | null
  timeLeft: number
  isTimerRunning: boolean
  sessionDuration: number
  setPlannedDuration: (duration: number) => void
  
  // Timer control
  startTimer: (session: Session, duration: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  
  // Session management
  setActiveSession: (session: Session | null) => void
  refreshActiveSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useSessionContext() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSessionContext must be used within SessionProvider')
  }
  return context
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // Default 25 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(25)
  const [sessionStartMs, setSessionStartMs] = useState<number | null>(null)
  const lastPlantTimeRef = useRef<number>(0) // Track last time we planted
  const { showNotification } = useNotification()

  // Load active session on mount
  // Load active session on mount and refresh periodically (but not if session is active)
  useEffect(() => {
    loadActiveSession()
    
    // Only set up background refresh if no active session
    if (activeSession) {
      return // Don't refresh when timer is running
    }
    
    const interval = setInterval(loadActiveSession, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [activeSession])

  // Timer effect - tick every second when running
  useEffect(() => {
    if (!isTimerRunning || !sessionStartMs || !activeSession) return

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - sessionStartMs) / 1000)
      const plannedSeconds = sessionDuration * 60
      const remaining = Math.max(0, plannedSeconds - elapsedSeconds)
      setTimeLeft(remaining)

      // Check if we should plant a new plant (every 5 minutes = 300 seconds)
      const elapsedMinutes = Math.floor(elapsedSeconds / 60)
      const lastPlantMinute = lastPlantTimeRef.current
      
      // Plant at 5, 10, 15, 20, etc. minutes
      if (elapsedMinutes > 0 && elapsedMinutes % 5 === 0 && elapsedMinutes !== lastPlantMinute) {
        lastPlantTimeRef.current = elapsedMinutes
        plantNewPlant()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerRunning, sessionStartMs, sessionDuration, activeSession])

  const plantNewPlant = async () => {
    if (!activeSession) return
    
    try {
      const result = await gardenAPI.plantSingle(activeSession.id)
      console.log('🌱 Planted:', result)
      
      // Show notification based on rarity
      const rarityEmoji = {
        legendary: '✨',
        rare: '🌳',
        uncommon: '🌿',
        regular: '🌱'
      }[result.rarity] || '🌱'
      
      showNotification(
        `${rarityEmoji} ${result.message}`,
        'success'
      )
    } catch (error) {
      console.error('Failed to plant:', error)
    }
  }

  const loadActiveSession = async () => {
    // NEVER reload if a session is already loaded to prevent timer disruption
    if (activeSession) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    try {
      const session = await sessionAPI.getActive().catch(() => null)
      if (!session) {
        console.log('No active session found on backend')
        return
      }

      console.log('Found active session:', session.id)
      const duration = session.duration_minutes || 25
      const createdAt = new Date(session.created_at).getTime()
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - createdAt) / 1000)
      const plannedSeconds = duration * 60
      const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds)

      // Auto-abandon sessions that are very old (>2 hours only)
      // Don't auto-abandon based on time remaining - user might want to complete it
      const twoHoursInSeconds = 2 * 60 * 60
      if (elapsedSeconds > twoHoursInSeconds) {
        console.log('Auto-abandoning very old session:', session.id, 'elapsed:', elapsedSeconds, 'hours')
        try {
          await sessionAPI.abandon(session.id)
          // Don't set any state - leave everything cleared
        } catch (err) {
          console.error('Failed to auto-abandon session:', err)
        }
        return
      }

      // Restore session even if it has little time left - user might want to complete it
      console.log('Restoring active session with', Math.floor(remainingSeconds / 60), 'minutes remaining')

      // Restore the session state
      setActiveSession(session)
      setSessionDuration(duration)
      setSessionStartMs(createdAt)
      setTimeLeft(remainingSeconds)
      setIsTimerRunning(true)
      
      console.log(`Restored active session ${session.id}: ${remainingSeconds}s remaining of ${plannedSeconds}s`)
    } catch (error) {
      console.error('Failed to load active session:', error)
    }
  }

  const startTimer = (session: Session, duration: number) => {
    console.log('Starting timer for session:', session.id, 'duration:', duration)
    setActiveSession(session)
    setSessionDuration(duration)
    // Start timer from NOW, not from backend created_at
    const startMs = Date.now()
    setSessionStartMs(startMs)
    setTimeLeft(duration * 60)
    setIsTimerRunning(true)
    lastPlantTimeRef.current = 0 // Reset plant tracker
  }

  const setPlannedDuration = (duration: number) => {
    // Only adjust planned duration if no active session
    if (activeSession) return
    setSessionDuration(duration)
    setTimeLeft(duration * 60)
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
    // When pausing, adjust the start time so when we resume, the countdown continues from current timeLeft
    if (sessionStartMs && timeLeft > 0) {
      const newStartMs = Date.now() - ((sessionDuration * 60 - timeLeft) * 1000)
      setSessionStartMs(newStartMs)
    }
  }

  const resumeTimer = () => {
    if (activeSession && timeLeft > 0) {
      // Recalculate start time based on current remaining time
      const elapsedSeconds = sessionDuration * 60 - timeLeft
      const newStartMs = Date.now() - (elapsedSeconds * 1000)
      setSessionStartMs(newStartMs)
      setIsTimerRunning(true)
    }
  }

  const stopTimer = () => {
    setActiveSession(null)
    setIsTimerRunning(false)
    setTimeLeft(25 * 60)
    setSessionDuration(25)
    setSessionStartMs(null)
  }

  const refreshActiveSession = async () => {
    await loadActiveSession()
  }

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        timeLeft,
        isTimerRunning,
        sessionDuration,
        setPlannedDuration,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        setActiveSession,
        refreshActiveSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
