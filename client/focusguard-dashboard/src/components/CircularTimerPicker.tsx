import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface CircularTimerPickerProps {
  duration: number // in minutes
  onDurationChange: (minutes: number) => void
  onStart?: () => void
  disabled?: boolean
}

const CircularTimerPicker = ({ duration, onDurationChange, onStart, disabled = false }: CircularTimerPickerProps) => {
  const maxMinutes = 120
  const progress = (duration / maxMinutes) * 100
  const containerRef = useRef<HTMLDivElement>(null)

  const adjustTime = (amount: number) => {
    const newDuration = Math.max(5, Math.min(maxMinutes, duration + amount))
    onDurationChange(newDuration)
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          e.preventDefault()
          adjustTime(5)
          break
        case 'ArrowDown':
        case 'ArrowLeft':
          e.preventDefault()
          adjustTime(-5)
          break
        case 'Enter':
          e.preventDefault()
          onStart?.()
          break
        case '+':
        case '=':
          e.preventDefault()
          adjustTime(1)
          break
        case '-':
        case '_':
          e.preventDefault()
          adjustTime(-1)
          break
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [disabled, duration, onStart])

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-8 focus:outline-none"
      tabIndex={disabled ? -1 : 0}
      role="group"
      aria-label="Timer duration picker"
    >
      {/* Circular Progress Ring */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64">
        {/* Background Circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
          
          {/* Progress */}
          <motion.circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="#374151"
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 85}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
            animate={{ 
              strokeDashoffset: 2 * Math.PI * 85 * (1 - progress / 100)
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            key={duration}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900"
          >
            {duration}
          </motion.div>
          <div className="text-sm sm:text-base md:text-lg text-gray-600 font-medium">minutes</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        <motion.button
          onClick={() => adjustTime(-5)}
          disabled={disabled || duration <= 5}
          className="p-2 sm:p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: disabled || duration <= 5 ? 1 : 1.1 }}
          whileTap={{ scale: disabled || duration <= 5 ? 1 : 0.9 }}
          aria-label="Decrease by 5 minutes"
        >
          <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        </motion.button>

        <div className="text-xs sm:text-sm text-gray-600 font-medium min-w-[50px] sm:min-w-[60px] text-center">
          {disabled ? 'Active' : '± 5 min'}
        </div>

        <motion.button
          onClick={() => adjustTime(5)}
          disabled={disabled || duration >= maxMinutes}
          className="p-2 sm:p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: disabled || duration >= maxMinutes ? 1 : 1.1 }}
          whileTap={{ scale: disabled || duration >= maxMinutes ? 1 : 0.9 }}
          aria-label="Increase by 5 minutes"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        </motion.button>
      </div>

      {/* Quick Presets */}
      {!disabled && (
        <div className="flex flex-wrap gap-2 justify-center max-w-xs sm:max-w-sm">
          {[15, 25, 30, 45, 60, 90].map(preset => (
            <motion.button
              key={preset}
              onClick={() => onDurationChange(preset)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                duration === preset
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Set ${preset} minutes`}
            >
              {preset}m
            </motion.button>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs sm:text-sm text-gray-500 text-center max-w-xs px-4">
        {disabled 
          ? 'Session is currently active'
          : 'Use arrow keys, +/- buttons, or presets. Press Enter to start.'
        }
      </p>
    </div>
  )
}

export default CircularTimerPicker
