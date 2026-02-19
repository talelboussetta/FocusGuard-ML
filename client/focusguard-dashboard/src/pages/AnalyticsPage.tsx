import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'
import { Progress } from '../components/ui/Progress'
import { Badge } from '../components/ui/Badge'
import { statsAPI, userAPI, getErrorMessage } from '../services/api'
import type { DailyStats, UserStats } from '../services/api'

const AnalyticsPage = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [trends, setTrends] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
    
    // Refresh analytics when page becomes visible (user navigates to it)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Analytics page visible, refreshing data')
        loadAnalytics()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [dailyData, stats, trendsData] = await Promise.all([
        statsAPI.getDailyStats(7),
        userAPI.getStats(),
        statsAPI.getTrends()
      ])
      
      setDailyStats(dailyData.daily_stats)
      setUserStats(stats)
      setTrends(trendsData)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load analytics'))
    } finally {
      setLoading(false)
    }
  }

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return '+100%'
    const change = ((current - previous) / previous) * 100
    return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
  }

  const getDayName = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  const maxHours = Math.max(...dailyStats.map((d) => d.focus_min / 60), 1)
  
  const thisWeekFocus = trends?.this_week?.total_focus_min || 0
  // const lastWeekFocus = trends?.last_week?.total_focus_min || 0  // Unused for now
  const thisWeekSessions = trends?.this_week?.sessions_completed || 0
  const lastWeekSessions = trends?.last_week?.sessions_completed || 0
  const thisWeekScore = trends?.this_week?.avg_focus_score || 0
  const lastWeekScore = trends?.last_week?.avg_focus_score || 0

  const stats = [
    { 
      label: 'Total Focus Time', 
      value: formatMinutes(userStats?.total_focus_min || 0), 
      change: thisWeekFocus > 0 ? `${formatMinutes(thisWeekFocus)} this week` : 'No data', 
      icon: Clock, 
      color: 'primary' 
    },
    { 
      label: 'Avg. Session Quality', 
      value: `${Math.round(userStats?.avg_focus_per_session || 0)}%`, 
      change: calculateChange(thisWeekScore, lastWeekScore), 
      icon: Target, 
      color: 'emerald' 
    },
    { 
      label: 'Current Streak', 
      value: `${userStats?.current_streak || 0} days`, 
      change: userStats?.current_streak ? '🔥' : '---', 
      icon: Award, 
      color: 'yellow' 
    },
    { 
      label: 'Total Sessions', 
      value: `${userStats?.total_sessions || 0}`, 
      change: calculateChange(thisWeekSessions, lastWeekSessions), 
      icon: Zap, 
      color: 'purple' 
    },
  ]

  const insights = [
    {
      icon: TrendingUp,
      title: 'Weekly Progress',
      description: `${thisWeekSessions} sessions completed this week`,
      color: 'blue',
    },
    {
      icon: Clock,
      title: 'Focus Time',
      description: `${formatMinutes(thisWeekFocus)} focused this week`,
      color: 'emerald',
    },
    {
      icon: Target,
      title: 'Quality Score',
      description: `Average ${Math.round(thisWeekScore)}% focus quality`,
      color: 'yellow',
    },
  ]

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-display font-bold mb-2">
              Focus <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-slate-400">
              Track your productivity trends and insights
            </p>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="gradient" hover>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 bg-${stat.color}-500/20 rounded-xl`}>
                      <stat.icon className={`text-${stat.color}-400`} size={20} />
                    </div>
                  </div>
                  <Badge variant={stat.change.startsWith('+') ? 'success' : 'info'} size="sm">
                    {stat.change}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Weekly Overview</h3>
                    <p className="text-sm text-slate-400">Focus hours and sessions</p>
                  </div>
                  <Calendar className="text-slate-600" size={24} />
                </div>

                {/* Chart */}
                <div className="space-y-4">
                  {dailyStats.length > 0 ? (
                    dailyStats.map((day, index) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-slate-400 w-12">
                            {getDayName(day.date)}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="flex-1 bg-slate-800 rounded-full h-8 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((day.focus_min / 60) / maxHours) * 100}%` }}
                                  transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-end pr-3"
                                >
                                  {day.focus_min > 0 && (
                                    <span className="text-xs font-bold text-white">
                                      {formatMinutes(day.focus_min)}
                                    </span>
                                  )}
                                </motion.div>
                              </div>
                              <Badge
                                variant={day.sessions_completed > 3 ? 'success' : day.sessions_completed > 0 ? 'info' : 'default'}
                                size="sm"
                              >
                                {day.sessions_completed} sessions
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      No data available yet. Complete some sessions to see your analytics!
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <Card>
                <h3 className="text-lg font-bold text-white mb-4">This Week</h3>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={insight.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className={`p-2 bg-${insight.color}-500/20 rounded-lg h-fit`}>
                        <insight.icon className={`text-${insight.color}-400`} size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">
                          {insight.title}
                        </p>
                        <p className="text-xs text-slate-400">{insight.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Streak Info */}
              <Card variant="gradient">
                <h3 className="text-lg font-bold text-white mb-4">Streak Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Current Streak</span>
                      <span className="text-white font-semibold">{userStats?.current_streak || 0} days</span>
                    </div>
                    <Progress 
                      value={userStats?.current_streak || 0} 
                      max={userStats?.longest_streak || 1} 
                      variant="primary" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Longest Streak</span>
                      <span className="text-white font-semibold">{userStats?.longest_streak || 0} days</span>
                    </div>
                    <Progress 
                      value={userStats?.longest_streak || 0} 
                      max={30} 
                      variant="success" 
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
