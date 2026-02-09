import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { sessionAPI, gardenAPI, type Session } from '../services/api'
import { useNotificationContext } from './NotificationContext'
import { useSound } from '../hooks/useSound'

interface SessionContextType {
  activeSession: Session | null
  timeLeft: number
  isTimerRunning: boolean
  sessionDuration: number
  plantsEarned: number
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
  const [plantsEarned, setPlantsEarned] = useState(0)
  const lastPlantTimeRef = useRef<number>(0) // Track last time we planted
  const { success: showSuccess } = useNotificationContext()
  const { playNotification } = useSound()

  // Load active session on mount
  useEffect(() => {
    loadActiveSession()
  }, []) // Run only once on mount to avoid infinite loops

  // Timer effect - tick every second when running
  useEffect(() => {
    if (!isTimerRunning || !sessionStartMs || !activeSession) return

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - sessionStartMs) / 1000)
      const plannedSeconds = sessionDuration * 60
      const remaining = Math.max(0, plannedSeconds - elapsedSeconds)
      setTimeLeft(remaining)

      // Pause timer when it reaches zero
      if (remaining === 0) {
        setIsTimerRunning(false)
      }

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
      
      // Increment plants counter
      setPlantsEarned(prev => prev + 1)
      
      // Play success sound
      playNotification()
      
      // Show notification based on rarity
      const rarityEmoji = {
        legendary: '✨',
        rare: '🌳',
        uncommon: '🌿',
        regular: '🌱'
      }[result.rarity] || '🌱'
      
      showSuccess(`${rarityEmoji} ${result.message}`)
    } catch (error) {
      console.error('Failed to plant:', error)
    }
  }

  const loadActiveSession = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    try {
      const session = await sessionAPI.getActive().catch(() => null)
      if (!session) {
        console.log('No active session found on backend')
        // Clear any stale session state
        if (activeSession) {
          stopTimer()
        }
        return
      }

      console.log('Found active session:', session.id)
      const duration = session.duration_minutes || 25
      const createdAt = new Date(session.created_at).getTime()
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - createdAt) / 1000)
      const plannedSeconds = duration * 60
      const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds)

      // Restore session even if it has little time left - user might want to complete it
      console.log('Restoring active session with', Math.floor(remainingSeconds / 60), 'minutes remaining')

      // Restore the session state - force update even if activeSession exists
      setActiveSession(session)
      setSessionDuration(duration)
      setSessionStartMs(createdAt)
      setTimeLeft(remainingSeconds)
      // Only set timer running if there's time remaining
      setIsTimerRunning(remainingSeconds > 0)
      
      console.log(`Restored active session ${session.id}: ${remainingSeconds}s remaining of ${plannedSeconds}s`)
    } catch (error) {
      console.error('Failed to load active session:', error)
    }
  }

  const startTimer = (session: Session, duration: number) => {
    console.log('Starting timer for session:', session.id, 'duration:', duration)
    setActiveSession(session)
    setSessionDuration(duration)
    // Use session's actual creation time from backend, not current time
    const sessionCreatedAt = new Date(session.created_at).getTime()
    setSessionStartMs(sessionCreatedAt)
    
    // Calculate remaining time from session creation
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - sessionCreatedAt) / 1000)
    const plannedSeconds = duration * 60
    const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds)
    
    setTimeLeft(remainingSeconds)
    setIsTimerRunning(remainingSeconds > 0)
    setPlantsEarned(0) // Reset plants counter
    lastPlantTimeRef.current = 0 // Reset plant tracker
    
    console.log(`Timer started: ${remainingSeconds}s remaining of ${plannedSeconds}s (created ${Math.floor(elapsedSeconds)}s ago)`)
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
    setPlantsEarned(0)
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
        plantsEarned,
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
