import { useCallback, useRef } from 'react'

/**
 * Hook for playing sound effects
 * Useful for session complete, achievement unlocks, etc.
 */
export function useSound() {
  const audioRef = useRef<{ [key: string]: HTMLAudioElement }>({})

  const play = useCallback((soundUrl: string, volume = 0.5) => {
    try {
      if (!audioRef.current[soundUrl]) {
        audioRef.current[soundUrl] = new Audio(soundUrl)
      }
      
      const audio = audioRef.current[soundUrl]
      audio.volume = volume
      audio.currentTime = 0
      audio.play().catch((error) => {
        console.warn('Error playing sound:', error)
      })
    } catch (error) {
      console.warn('Error initializing sound:', error)
    }
  }, [])

  const playNotification = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }, [])

  return { play, playNotification }
}
