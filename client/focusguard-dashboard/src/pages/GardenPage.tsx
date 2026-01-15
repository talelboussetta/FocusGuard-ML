import { motion } from 'framer-motion'
import { useState } from 'react'
import { Leaf, Play, Plus, Sparkles, Clock, Sprout } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const GardenPage = () => {
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(25)
  const [trees, setTrees] = useState([
    { id: 1, type: 'oak', level: 3, x: 20, y: 30 },
    { id: 2, type: 'pine', level: 2, x: 60, y: 40 },
    { id: 3, type: 'maple', level: 1, x: 40, y: 60 },
  ])

  const startSession = () => {
    setShowSessionModal(false)
    // Navigate to camera/session page - you can add navigation here
    window.location.href = '/camera'
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-nature-500/10 rounded-full blur-3xl"
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

        <div className="relative z-10 p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-display font-bold mb-2">
                  Your <span className="gradient-text">Personal Garden</span>
                </h1>
                <p className="text-slate-400">
                  Watch your dedication bloom into a beautiful garden
                </p>
              </div>
              <motion.button
                onClick={() => setShowSessionModal(true)}
                className="btn-primary flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-5 h-5" />
                <span>Start Focus Session</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-soft"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nature-500 to-emerald-600 flex items-center justify-center">
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold gradient-text">{trees.length}</div>
                  <div className="text-sm text-slate-400">Trees Planted</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-soft"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold gradient-text">12</div>
                  <div className="text-sm text-slate-400">Garden Level</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-soft"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Sprout className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold gradient-text">5</div>
                  <div className="text-sm text-slate-400">Seeds Available</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card-soft"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold gradient-text">48h</div>
                  <div className="text-sm text-slate-400">Total Focus Time</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Garden Visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card-soft min-h-[600px] relative overflow-hidden"
          >
            {/* Sky gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-green-900/20" />
            
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-950/50 to-transparent" />

            {/* Trees */}
            {trees.map((tree, index) => (
              <motion.div
                key={tree.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.2, type: 'spring' }}
                className="absolute"
                style={{
                  left: `${tree.x}%`,
                  bottom: `${tree.y}%`,
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="cursor-pointer"
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.5,
                  }}
                >
                  <Leaf 
                    className={`w-${tree.level * 8} h-${tree.level * 8} text-nature-400`} 
                    style={{ width: `${tree.level * 32}px`, height: `${tree.level * 32}px` }}
                  />
                  <div className="text-center mt-1 text-xs text-slate-400">
                    Level {tree.level}
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {/* Empty state or plant new tree button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: trees.length < 5 ? 1 : 0 }}
                className="text-center pointer-events-auto"
              >
                <motion.button
                  onClick={() => setShowSessionModal(true)}
                  className="btn-secondary flex items-center space-x-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Complete a session to plant more trees</span>
                </motion.button>
              </motion.div>
            </div>

            {/* Decorative particles */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-nature-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>

          {/* Garden Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 glass rounded-2xl p-6"
          >
            <h3 className="text-xl font-display font-semibold mb-3 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary-400" />
              Garden Tips
            </h3>
            <p className="text-slate-300">
              Complete focus sessions to earn seeds and grow your garden. Each 25-minute session 
              earns you one seed. Plant seeds to grow trees, and watch them level up as you maintain 
              your focus streak. The more consistent you are, the more beautiful your garden becomes! 🌱
            </p>
          </motion.div>
        </div>
      </div>

      {/* Session Start Modal */}
      {showSessionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSessionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-soft max-w-lg w-full mx-4 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-display font-bold mb-4">
              Start a <span className="gradient-text">Focus Session</span>
            </h2>
            <p className="text-slate-400 mb-6">
              Choose your session duration and get ready to plant a new tree in your garden!
            </p>

            {/* Duration selector */}
            <div className="space-y-4 mb-8">
              <label className="block text-sm text-slate-400">Session Duration</label>
              <div className="grid grid-cols-3 gap-4">
                {[15, 25, 45].map((duration) => (
                  <motion.button
                    key={duration}
                    onClick={() => setSessionDuration(duration)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      sessionDuration === duration
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-2xl font-bold gradient-text">{duration}</div>
                    <div className="text-sm text-slate-400">minutes</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <motion.button
                onClick={() => setShowSessionModal(false)}
                className="btn-secondary flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={startSession}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                <span>Start Session</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default GardenPage
