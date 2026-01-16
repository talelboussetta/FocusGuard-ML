import { useState, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { useTimer } from './useTimer'

export interface FocusSession {
  id: string
  type: 'focus' | 'break'
  duration: number
  startTime: Date
  endTime?: Date
  quality?: number
  blinkCount?: number
  distractionCount?: number
  completed: boolean
}

export function useFocusSession() {
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>('focus-sessions', [])
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus')
  const [sessionDuration, setSessionDuration] = useState(25 * 60) // 25 minutes default

  const startSession = useCallback((type: 'focus' | 'break', duration: number) => {
    const session: FocusSession = {
      id: Date.now().toString(),
      type,
      duration,
      startTime: new Date(),
      completed: false,
    }
    setCurrentSession(session)
    setSessionType(type)
    setSessionDuration(duration)
  }, [])

  const completeSession = useCallback((quality?: number, blinkCount?: number, distractionCount?: number) => {
    if (!currentSession) return

    const completedSession: FocusSession = {
      ...currentSession,
      endTime: new Date(),
      quality,
      blinkCount,
      distractionCount,
      completed: true,
    }

    setSessions((prev) => [...prev, completedSession])
    setCurrentSession(null)
  }, [currentSession, setSessions])

  const cancelSession = useCallback(() => {
    setCurrentSession(null)
  }, [])

  const getSessionStats = useCallback(() => {
    const totalSessions = sessions.length
    const completedSessions = sessions.filter((s) => s.completed)
    const totalFocusTime = completedSessions
      .filter((s) => s.type === 'focus')
      .reduce((acc, s) => acc + s.duration, 0)
    
    const averageQuality = completedSessions.length > 0
      ? completedSessions.reduce((acc, s) => acc + (s.quality || 0), 0) / completedSessions.length
      : 0

    const todaySessions = completedSessions.filter((s) => {
      const today = new Date()
      const sessionDate = new Date(s.startTime)
      return (
        sessionDate.getDate() === today.getDate() &&
        sessionDate.getMonth() === today.getMonth() &&
        sessionDate.getFullYear() === today.getFullYear()
      )
    })

    return {
      totalSessions,
      totalFocusTime,
      averageQuality,
      todaySessions: todaySessions.length,
      todayFocusTime: todaySessions
        .filter((s) => s.type === 'focus')
        .reduce((acc, s) => acc + s.duration, 0),
    }
  }, [sessions])

  return {
    sessions,
    currentSession,
    sessionType,
    sessionDuration,
    startSession,
    completeSession,
    cancelSession,
    getSessionStats,
    setSessionDuration,
  }
}
