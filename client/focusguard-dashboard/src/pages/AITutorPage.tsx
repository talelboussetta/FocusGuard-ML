import { motion } from 'framer-motion'
import { Brain, Wrench, Sparkles, Zap, Target, Rocket } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'

const AITutorPage = () => {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <h1 className="text-5xl font-display font-bold mb-4">
              AI <span className="gradient-text">Tutor</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Your personal focus coach and productivity mentor
            </p>
          </motion.div>

          {/* Under Construction Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden">
              {/* Gradient Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-purple-500/5 to-emerald-500/5" />
              
              <div className="relative p-12 text-center">
                {/* Animated Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
                    <div className="relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700">
                      <Brain className="text-primary-400 w-20 h-20" />
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-4"
                >
                  Under Construction 🚧
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto"
                >
                  We're building something amazing for you! The AI Tutor is currently being optimized 
                  to provide you with the best personalized coaching experience.
                </motion.p>

                {/* Feature Pills */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap justify-center gap-3 mb-8"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full">
                    <Sparkles size={16} className="text-primary-400" />
                    <span className="text-sm text-primary-300 font-medium">Context-Aware AI</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
                    <Brain size={16} className="text-purple-400" />
                    <span className="text-sm text-purple-300 font-medium">Personalized Coaching</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                    <Target size={16} className="text-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">Productivity Insights</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                    <Zap size={16} className="text-yellow-400" />
                    <span className="text-sm text-yellow-300 font-medium">Real-time Help</span>
                  </div>
                </motion.div>

                {/* Coming Soon Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30 rounded-full"
                >
                  <Rocket className="text-primary-400" size={20} />
                  <span className="text-white font-semibold">Coming Soon</span>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* What to Expect Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 grid md:grid-cols-3 gap-6"
          >
            <Card variant="glass" className="group hover:border-primary-500/50 transition-all">
              <div className="p-6">
                <div className="p-3 bg-primary-500/20 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="text-primary-400" size={24} />
                </div>
                <h3 className="text-white font-semibold mb-2">Smart Analysis</h3>
                <p className="text-sm text-slate-400">
                  Get AI-powered insights on your focus patterns and productivity trends
                </p>
              </div>
            </Card>

            <Card variant="glass" className="group hover:border-purple-500/50 transition-all">
              <div className="p-6">
                <div className="p-3 bg-purple-500/20 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="text-purple-400" size={24} />
                </div>
                <h3 className="text-white font-semibold mb-2">Personalized Tips</h3>
                <p className="text-sm text-slate-400">
                  Receive custom recommendations based on your unique work style
                </p>
              </div>
            </Card>

            <Card variant="glass" className="group hover:border-emerald-500/50 transition-all">
              <div className="p-6">
                <div className="p-3 bg-emerald-500/20 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Target className="text-emerald-400" size={24} />
                </div>
                <h3 className="text-white font-semibold mb-2">Goal Tracking</h3>
                <p className="text-sm text-slate-400">
                  Interactive conversations to help you stay on track with your goals
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Info Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Card variant="glass" className="border-slate-700/50">
              <div className="p-4 flex items-start gap-3">
                <Wrench className="text-slate-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm text-slate-300 mb-1">
                    <span className="font-semibold">In the meantime...</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    All your other productivity features are fully functional! Track your sessions, 
                    grow your garden, compete on leaderboards, and collaborate with your team.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AITutorPage
