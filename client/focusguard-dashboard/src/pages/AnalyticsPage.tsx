import { motion } from 'framer-motion'
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  Zap,
  Eye,
  Brain,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'
import { Progress } from '../components/ui/Progress'
import { Badge } from '../components/ui/Badge'

const AnalyticsPage = () => {
  // Mock data for analytics
  const weeklyData = [
    { day: 'Mon', hours: 4.5, quality: 85 },
    { day: 'Tue', hours: 6.2, quality: 92 },
    { day: 'Wed', hours: 5.1, quality: 78 },
    { day: 'Thu', hours: 7.3, quality: 88 },
    { day: 'Fri', hours: 5.8, quality: 81 },
    { day: 'Sat', hours: 3.2, quality: 75 },
    { day: 'Sun', hours: 4.1, quality: 83 },
  ]

  const stats = [
    { label: 'Total Focus Time', value: '36.2h', change: '+12%', icon: Clock, color: 'primary' },
    { label: 'Avg. Session Quality', value: '83%', change: '+5%', icon: Target, color: 'emerald' },
    { label: 'Current Streak', value: '7 days', change: '🔥', icon: Award, color: 'yellow' },
    { label: 'Blink Rate', value: '18/min', change: 'Normal', icon: Eye, color: 'purple' },
  ]

  const insights = [
    {
      icon: Brain,
      title: 'Peak Performance Time',
      description: 'You focus best between 9 AM - 11 AM',
      color: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'Productivity Trend',
      description: 'Your focus quality improved 15% this week',
      color: 'emerald',
    },
    {
      icon: Zap,
      title: 'Optimal Session Length',
      description: 'Your sweet spot is 45-minute sessions',
      color: 'yellow',
    },
  ]

  const maxHours = Math.max(...weeklyData.map((d) => d.hours))

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
                    {stat.change} from last week
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
                    <p className="text-sm text-slate-400">Focus hours and quality score</p>
                  </div>
                  <Calendar className="text-slate-600" size={24} />
                </div>

                {/* Chart */}
                <div className="space-y-4">
                  {weeklyData.map((day, index) => (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-400 w-12">{day.day}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="flex-1 bg-slate-800 rounded-full h-8 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(day.hours / maxHours) * 100}%` }}
                                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-end pr-3"
                              >
                                <span className="text-xs font-bold text-white">
                                  {day.hours}h
                                </span>
                              </motion.div>
                            </div>
                            <Badge
                              variant={day.quality > 85 ? 'success' : day.quality > 75 ? 'info' : 'warning'}
                              size="sm"
                            >
                              {day.quality}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
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
                <h3 className="text-lg font-bold text-white mb-4">AI Insights</h3>
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

              {/* Monthly Goals */}
              <Card variant="gradient">
                <h3 className="text-lg font-bold text-white mb-4">Monthly Goals</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Focus Time</span>
                      <span className="text-white font-semibold">145/160h</span>
                    </div>
                    <Progress value={145} max={160} variant="primary" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Quality Score</span>
                      <span className="text-white font-semibold">83/90%</span>
                    </div>
                    <Progress value={83} max={90} variant="success" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Active Days</span>
                      <span className="text-white font-semibold">22/25 days</span>
                    </div>
                    <Progress value={22} max={25} variant="warning" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card>
              <h3 className="text-xl font-bold text-white mb-4">Activity Heatmap</h3>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const intensity = Math.random()
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.01 }}
                      className={`aspect-square rounded-lg ${
                        intensity > 0.7
                          ? 'bg-emerald-500'
                          : intensity > 0.4
                          ? 'bg-emerald-500/50'
                          : intensity > 0.2
                          ? 'bg-emerald-500/20'
                          : 'bg-slate-800/50'
                      }`}
                      title={`Day ${i + 1}: ${(intensity * 100).toFixed(0)}% productivity`}
                    />
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-slate-800/50 rounded" />
                  <div className="w-4 h-4 bg-emerald-500/20 rounded" />
                  <div className="w-4 h-4 bg-emerald-500/50 rounded" />
                  <div className="w-4 h-4 bg-emerald-500 rounded" />
                </div>
                <span>More</span>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
