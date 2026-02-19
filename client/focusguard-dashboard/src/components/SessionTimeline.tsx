import { motion } from 'framer-motion'
import { Session } from '../services/api'

interface SessionTimelineProps {
  sessions: Session[]
  maxSessions?: number
}

const SessionTimeline = ({ sessions, maxSessions = 7 }: SessionTimelineProps) => {
  // Get last N sessions, ordered by date
  const recentSessions = sessions
    .sort((a, b) => new Date(b.start_time || b.created_at).getTime() - new Date(a.start_time || a.created_at).getTime())
    .slice(0, maxSessions)
    .reverse() // Show oldest to newest left-to-right

  const maxDuration = Math.max(...recentSessions.map(s => (s.duration_minutes || 25) * 60), 1)

  const getColor = (focusScore: number | null) => {
    if (!focusScore) return '#d1d5db' // gray-300
    if (focusScore >= 80) return '#16a34a' // green-600
    if (focusScore >= 60) return '#ca8a04' // yellow-600
    if (focusScore >= 40) return '#ea580c' // orange-600
    return '#dc2626' // red-600
  }

  if (recentSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-sm text-gray-400">
        No sessions yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Recent Sessions</span>
        <span>{recentSessions.length} of {maxSessions}</span>
      </div>
      
      {/* Sparkline */}
      <div className="flex items-end justify-between gap-1 h-12">
        {recentSessions.map((session, index) => {
          const durationSeconds = (session.duration_minutes || 25) * 60
          const heightPercentage = (durationSeconds / maxDuration) * 100
          const focusScore = session.focus_score || 0
          const date = new Date(session.start_time || session.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
          
          return (
            <motion.div
              key={session.id}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex-1 relative group"
              style={{ transformOrigin: 'bottom' }}
            >
              {/* Bar */}
              <div
                className="w-full rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${Math.max(heightPercentage, 10)}%`,
                  backgroundColor: getColor(session.focus_score)
                }}
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 shadow-lg whitespace-nowrap">
                  <div className="font-semibold">{date}</div>
                  <div>{session.duration_minutes || 25}min</div>
                  {focusScore > 0 && <div>Focus: {focusScore.toFixed(0)}%</div>}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Date Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {new Date(recentSessions[0].start_time || recentSessions[0].created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
        <span>
          {new Date(recentSessions[recentSessions.length - 1].start_time || recentSessions[recentSessions.length - 1].created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>
    </div>
  )
}

export default SessionTimeline
