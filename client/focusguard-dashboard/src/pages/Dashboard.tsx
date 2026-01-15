import { motion } from 'framer-motion'
import { useState } from 'react'
import { Play, Pause, Square, Leaf, Camera, Brain, BarChart3, MessageSquare } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TimerCard from '../components/TimerCard'
import StatsCard from '../components/StatsCard'

const Dashboard = () => {
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [time, setTime] = useState(25 * 60) // 25 minutes in seconds

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-display font-bold mb-2">
              Welcome back, <span className="gradient-text">Focus Warrior</span>
            </h1>
            <p className="text-slate-400">
              Let's make today productive. Your garden is waiting to grow.
            </p>
          </motion.div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Timer Card - Takes 2 columns */}
            <div className="lg:col-span-2">
              <TimerCard
                time={time}
                isRunning={isTimerRunning}
                onToggle={() => setIsTimerRunning(!isTimerRunning)}
                onReset={() => {
                  setTime(25 * 60)
                  setIsTimerRunning(false)
                }}
              />
            </div>

            {/* Stats Column */}
            <div className="space-y-6">
              <StatsCard
                title="Today's Focus"
                value="2h 45m"
                icon={<Leaf className="w-6 h-6" />}
                gradient="from-nature-500 to-emerald-600"
                trend="+15%"
              />
              <StatsCard
                title="Current Streak"
                value="7 days"
                icon={<Leaf className="w-6 h-6" />}
                gradient="from-primary-500 to-primary-600"
                trend="🔥"
              />
              <StatsCard
                title="Garden Progress"
                value="Level 12"
                icon={<Leaf className="w-6 h-6" />}
                gradient="from-purple-500 to-pink-600"
                trend="3 new plants"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-display font-semibold mb-4">
              Motivational Insight
            </h2>
            <div className="glass rounded-2xl p-6">
              <p className="text-slate-300 text-lg leading-relaxed">
                "You've been consistently focusing for 7 days straight. Your morning sessions
                show the highest quality focus. Consider scheduling your most important work
                between 9-11 AM. 🌟"
              </p>
            </div>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-display font-semibold mb-4">
              Recent Sessions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { time: '25 min', quality: 95, type: 'Deep Work' },
                { time: '25 min', quality: 88, type: 'Study' },
                { time: '25 min', quality: 92, type: 'Deep Work' },
                { time: '15 min', quality: 85, type: 'Break' },
              ].map((session, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="card-soft hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-slate-400 text-sm">{session.type}</span>
                    <span className="text-2xl font-bold gradient-text">
                      {session.quality}%
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">{session.time}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
