import { motion } from 'framer-motion'
import { Target } from 'lucide-react'

interface FocusScoreIndicatorProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

const FocusScoreIndicator = ({ 
  score, 
  size = 'md', 
  showLabel = true,
  animated = true 
}: FocusScoreIndicatorProps) => {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score))
  
  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200'
    return 'text-red-600 bg-red-100 border-red-200'
  }

  const getRingColor = (score: number) => {
    if (score >= 80) return '#16a34a' // green-600
    if (score >= 60) return '#ca8a04' // yellow-600
    if (score >= 40) return '#ea580c' // orange-600
    return '#dc2626' // red-600
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const svgSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  const colorClass = getColor(clampedScore)
  const svgSize = svgSizes[size]
  const radius = (svgSize - 4) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - clampedScore / 100)

  return (
    <motion.div
      initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      className={`inline-flex items-center ${sizeClasses[size]} ${colorClass} rounded-full border font-semibold shadow-sm`}
      role="status"
      aria-label={`Focus score: ${clampedScore.toFixed(0)}%`}
    >
      {/* Circular Progress */}
      <div className="relative flex items-center justify-center">
        <svg 
          width={svgSize} 
          height={svgSize} 
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.2"
          />
          {/* Progress circle */}
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={getRingColor(clampedScore)}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : undefined}
            animate={animated ? { strokeDashoffset } : { strokeDashoffset }}
            transition={animated ? { duration: 1, ease: 'easeOut' } : undefined}
          />
        </svg>
        <Target className={`${iconSizes[size]} absolute`} strokeWidth={2.5} />
      </div>

      {/* Score Text */}
      {showLabel && (
        <motion.span
          initial={animated ? { opacity: 0 } : undefined}
          animate={animated ? { opacity: 1 } : undefined}
          transition={animated ? { delay: 0.3 } : undefined}
        >
          {clampedScore.toFixed(0)}%
        </motion.span>
      )}
    </motion.div>
  )
}

export default FocusScoreIndicator
