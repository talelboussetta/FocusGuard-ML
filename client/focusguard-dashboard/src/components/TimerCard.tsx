import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TimerCardProps {
  time: number
  isRunning: boolean
  onToggle: () => void
  onReset: () => void
}

const TimerCard = ({ time, isRunning, onToggle, onReset }: TimerCardProps) => {
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus')
  const [localTime, setLocalTime] = useState(time)

  useEffect(() => {
    setLocalTime(time)
  }, [time])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && localTime > 0) {
      interval = setInterval(() => {
        setLocalTime((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, localTime])

  const minutes = Math.floor(localTime / 60)
  const seconds = localTime % 60
  const progress = (localTime / time) * 100

  const sessionTypes = [
    { value: 'focus', label: 'Focus', duration: 25 },
    { value: 'break', label: 'Break', duration: 5 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="card-soft relative overflow-hidden"
    >
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-nature-500/10 rounded-2xl"
        animate={{
          opacity: isRunning ? [0.5, 0.7, 0.5] : 0.3,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10">
        {/* Session Type Selector */}
        <div className="flex gap-2 mb-6">
          {sessionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setSessionType(type.value as 'focus' | 'break')
                setLocalTime(type.duration * 60)
              }}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                sessionType === type.value
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'glass text-slate-400 hover:text-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <motion.div
            className="text-8xl font-display font-bold mb-4 gradient-text"
            animate={{
              scale: isRunning ? [1, 1.02, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </motion.div>

          {/* Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-800"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                initial={{ strokeDashoffset: 0 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100),
                }}
                transition={{ duration: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-semibold text-slate-400">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <motion.button
              onClick={onReset}
              className="btn-secondary w-14 h-14 !p-0 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: -180 }}
              whileTap={{ scale: 0.9 }}
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={onToggle}
              className="btn-primary w-20 h-20 !p-0 flex items-center justify-center text-2xl"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isRunning ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </motion.button>

            <div className="w-14 h-14" /> {/* Spacer for symmetry */}
          </div>
        </div>

        {/* Session Info */}
        <div className="text-center text-slate-400">
          <p className="text-sm">
            {isRunning ? '🎯 Stay focused...' : '💡 Ready when you are'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default TimerCard
