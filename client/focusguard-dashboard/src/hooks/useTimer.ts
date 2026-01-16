import { useState, useEffect, useCallback, useRef } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

interface UseTimerOptions {
  duration: number // in seconds
  onComplete?: () => void
  onTick?: (remaining: number) => void
  autoStart?: boolean
}

export function useTimer({
  duration,
  onComplete,
  onTick,
  autoStart = false,
}: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [status, setStatus] = useState<TimerStatus>(autoStart ? 'running' : 'idle')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    setStatus('running')
  }, [])

  const pause = useCallback(() => {
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    setStatus('running')
  }, [])

  const reset = useCallback(() => {
    setTimeRemaining(duration)
    setStatus('idle')
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [duration])

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => Math.max(0, prev + seconds))
  }, [])

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1
          onTick?.(newTime)
          
          if (newTime <= 0) {
            setStatus('completed')
            onComplete?.()
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            return 0
          }
          
          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [status, onComplete, onTick])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const progress = ((duration - timeRemaining) / duration) * 100

  return {
    timeRemaining,
    minutes,
    seconds,
    progress,
    status,
    start,
    pause,
    resume,
    reset,
    addTime,
    isRunning: status === 'running',
    isPaused: status === 'paused',
    isCompleted: status === 'completed',
  }
}
