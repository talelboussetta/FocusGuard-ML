import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface CircularTimerPickerProps {
  duration: number // in minutes
  onDurationChange: (minutes: number) => void
  disabled?: boolean
}

const CircularTimerPicker = ({ duration, onDurationChange, disabled = false }: CircularTimerPickerProps) => {
  const maxMinutes = 120
  const progress = (duration / maxMinutes) * 100

  const adjustTime = (amount: number) => {
    const newDuration = Math.max(5, Math.min(maxMinutes, duration + amount))
    onDurationChange(newDuration)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Circular Progress Ring */}
      <div className="relative w-64 h-64">
        {/* Background Circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={duration}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl font-bold text-gray-900"
          >
            {duration}
          </motion.div>
          <div className="text-lg text-gray-600 font-medium">minutes</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={() => adjustTime(-5)}
          disabled={disabled || duration <= 5}
          className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: disabled || duration <= 5 ? 1 : 1.1 }}
          whileTap={{ scale: disabled || duration <= 5 ? 1 : 0.9 }}
        >
          <Minus className="w-6 h-6 text-gray-700" />
        </motion.button>

        <div className="text-sm text-gray-600 font-medium min-w-[60px] text-center">
          {disabled ? 'Active' : '± 5 min'}
        </div>

        <motion.button
          onClick={() => adjustTime(5)}
          disabled={disabled || duration >= maxMinutes}
          className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: disabled || duration >= maxMinutes ? 1 : 1.1 }}
          whileTap={{ scale: disabled || duration >= maxMinutes ? 1 : 0.9 }}
        >
          <Plus className="w-6 h-6 text-gray-700" />
        </motion.button>
      </div>

      {/* Quick Presets */}
      {!disabled && (
        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
          {[15, 25, 30, 45, 60, 90].map(preset => (
            <motion.button
              key={preset}
              onClick={() => onDurationChange(preset)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                duration === preset
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {preset}m
            </motion.button>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-sm text-gray-500 text-center max-w-xs">
        {disabled 
          ? 'Session is currently active'
          : 'Use +/- buttons or select a preset time'
        }
      </p>
    </div>
  )
}

export default CircularTimerPicker
