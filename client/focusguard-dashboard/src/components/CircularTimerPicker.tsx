import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

interface CircularTimerPickerProps {
  duration: number // in minutes
  onDurationChange: (minutes: number) => void
  disabled?: boolean
}

const CircularTimerPicker = ({ duration, onDurationChange, disabled = false }: CircularTimerPickerProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredMinute, setHoveredMinute] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  
  const maxMinutes = 120 // Max 2 hours
  const radius = 140
  const centerX = 160
  const centerY = 160
  const viewBoxPadding = 24
  const strokeWidth = 32

  // Calculate angle from minutes (0 minutes = top, clockwise)
  const minutesToAngle = (minutes: number) => {
    return (minutes / maxMinutes) * 360 - 90 // -90 to start from top
  }

  // Calculate minutes from mouse position
  const getMinutesFromEvent = (clientX: number, clientY: number) => {
    if (!svgRef.current) return duration

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const x = clientX - rect.left - centerX
    const y = clientY - rect.top - centerY
    
    // Calculate angle in degrees
    let angle = Math.atan2(y, x) * (180 / Math.PI)
    angle = (angle + 90 + 360) % 360 // Normalize to 0-360, starting from top
    
    // Convert angle to minutes
    const minutes = Math.round((angle / 360) * maxMinutes)
    return Math.max(1, Math.min(maxMinutes, minutes)) // Clamp between 1 and maxMinutes
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    setIsDragging(true)
    const minutes = getMinutesFromEvent(e.clientX, e.clientY)
    onDurationChange(minutes)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const minutes = getMinutesFromEvent(e.clientX, e.clientY)
    setHoveredMinute(minutes)
    
    if (isDragging && !disabled) {
      onDurationChange(minutes)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setHoveredMinute(null)
    if (isDragging) {
      setIsDragging(false)
    }
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  // Calculate arc path for the selected duration
  const angle = minutesToAngle(duration)
  const endAngle = angle * (Math.PI / 180)
  const startAngle = -90 * (Math.PI / 180)
  
  const largeArcFlag = angle > 180 ? 1 : 0
  const endX = centerX + radius * Math.cos(endAngle)
  const endY = centerY + radius * Math.sin(endAngle)
  const startX = centerX + radius * Math.cos(startAngle)
  const startY = centerY + radius * Math.sin(startAngle)

  // Generate tick marks for every 15 minutes
  const tickMarks = []
  for (let i = 0; i <= maxMinutes; i += 15) {
    if (i === 0) continue // Skip 0
    const tickAngle = minutesToAngle(i) * (Math.PI / 180)
    const innerRadius = radius - strokeWidth / 2 - 8
    const outerRadius = radius - strokeWidth / 2 + 8
    const x1 = centerX + innerRadius * Math.cos(tickAngle)
    const y1 = centerY + innerRadius * Math.sin(tickAngle)
    const x2 = centerX + outerRadius * Math.cos(tickAngle)
    const y2 = centerY + outerRadius * Math.sin(tickAngle)
    
    tickMarks.push({ i, x1, y1, x2, y2, tickAngle })
  }

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={svgRef}
        width="320"
        height="320"
        viewBox={`${-viewBoxPadding} ${-viewBoxPadding} ${320 + viewBoxPadding * 2} ${320 + viewBoxPadding * 2}`}
        className={`${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} select-none`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Gradient for the track */}
          <linearGradient id="track-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0e0e0" />
            <stop offset="100%" stopColor="#c0c0c0" />
          </linearGradient>
          
          {/* Gradient for selected arc */}
          <linearGradient id="selected-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#606060" />
            <stop offset="50%" stopColor="#404040" />
            <stop offset="100%" stopColor="#202020" />
          </linearGradient>

          {/* Hover gradient */}
          <linearGradient id="hover-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#808080" />
            <stop offset="100%" stopColor="#606060" />
          </linearGradient>
        </defs>

        {/* Background circle (track) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="url(#track-gradient)"
          strokeWidth={strokeWidth}
          opacity="0.2"
        />

        {/* Tick marks */}
        {tickMarks.map(({ i, x1, y1, x2, y2 }) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#a0a0a0"
            strokeWidth="2"
            opacity="0.5"
          />
        ))}

        {/* Tick labels */}
        {tickMarks.map(({ i, tickAngle }) => {
          const labelRadius = radius - strokeWidth / 2 - 24
          const labelX = centerX + labelRadius * Math.cos(tickAngle)
          const labelY = centerY + labelRadius * Math.sin(tickAngle)
          
          return (
            <text
              key={`label-${i}`}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium fill-gray-600"
            >
              {i}
            </text>
          )
        })}

        {/* Hover preview arc (if hovering and not dragging) */}
        {hoveredMinute !== null && !isDragging && !disabled && hoveredMinute !== duration && (
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            d={`
              M ${startX} ${startY}
              A ${radius} ${radius} 0 ${hoveredMinute > maxMinutes / 2 ? 1 : 0} 1 
              ${centerX + radius * Math.cos(minutesToAngle(hoveredMinute) * (Math.PI / 180))} 
              ${centerY + radius * Math.sin(minutesToAngle(hoveredMinute) * (Math.PI / 180))}
            `}
            fill="none"
            stroke="url(#hover-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Selected duration arc */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          d={duration > 0 ? `
            M ${startX} ${startY}
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
          ` : ''}
          fill="none"
          stroke="url(#selected-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* End point indicator */}
        {duration > 0 && (
          <motion.circle
            cx={endX}
            cy={endY}
            r={strokeWidth / 2 - 2}
            fill="white"
            stroke="#404040"
            strokeWidth="3"
            initial={{ scale: 0 }}
            animate={{ scale: isDragging ? 1.1 : 1 }}
            className="drop-shadow-lg"
          />
        )}

        {/* Center content */}
        <g>
          {/* Duration text */}
          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            className="text-6xl font-display font-bold fill-gray-900"
          >
            {duration}
          </text>
          <text
            x={centerX}
            y={centerY + 30}
            textAnchor="middle"
            className="text-lg font-medium fill-gray-600"
          >
            minutes
          </text>
        </g>
      </svg>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-gray-600 mt-4 text-center"
      >
        {disabled 
          ? 'Session in progress'
          : isDragging 
            ? 'Release to set duration'
            : 'Click or drag on the circle to set session duration'
        }
      </motion.p>

      {/* Quick presets */}
      {!disabled && (
        <div className="flex gap-2 mt-4">
          {[15, 25, 45, 60, 90].map(preset => (
            <motion.button
              key={preset}
              onClick={() => onDurationChange(preset)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                duration === preset
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {preset}m
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CircularTimerPicker
