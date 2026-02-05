import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakProgressRingProps {
  currentStreak: number
  goalStreak?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const StreakProgressRing = ({ 
  currentStreak, 
  goalStreak = 7, 
  size = 'md',
  showLabel = true 
}: StreakProgressRingProps) => {
  const progress = Math.min((currentStreak / goalStreak) * 100, 100)
  
  const sizes = {
    sm: { container: 'w-16 h-16', svg: 64, radius: 26, stroke: 6, text: 'text-lg', label: 'text-xs' },
    md: { container: 'w-24 h-24', svg: 96, radius: 40, stroke: 8, text: 'text-2xl', label: 'text-sm' },
    lg: { container: 'w-32 h-32', svg: 128, radius: 54, stroke: 10, text: 'text-3xl', label: 'text-base' }
  }

  const config = sizes[size]
  const circumference = 2 * Math.PI * config.radius
  const strokeDashoffset = circumference * (1 - progress / 100)

  // Color based on progress
  const getColor = () => {
    if (progress >= 100) return '#16a34a' // green-600
    if (progress >= 70) return '#ca8a04' // yellow-600
    if (progress >= 40) return '#ea580c' // orange-600
    return '#6b7280' // gray-500
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${config.container}`}>
        {/* SVG Progress Ring */}
        <svg 
          width={config.svg} 
          height={config.svg} 
          className="-rotate-90"
          aria-label={`Streak progress: ${currentStreak} of ${goalStreak} days`}
        >
          {/* Background circle */}
          <circle
            cx={config.svg / 2}
            cy={config.svg / 2}
            r={config.radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.stroke}
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={config.svg / 2}
            cy={config.svg / 2}
            r={config.radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Flame 
            className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'}`}
            style={{ color: getColor() }}
            fill={progress > 0 ? getColor() : 'none'}
          />
          <span className={`${config.text} font-bold text-gray-900`}>
            {currentStreak}
          </span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <p className={`${config.label} font-semibold text-gray-700`}>
            {currentStreak === 1 ? '1 Day' : `${currentStreak} Days`}
          </p>
          <p className={`${config.label} text-gray-500`}>
            Goal: {goalStreak}
          </p>
        </div>
      )}
    </div>
  )
}

export default StreakProgressRing
