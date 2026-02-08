import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Target, Zap, Sprout } from 'lucide-react'
import { Session } from '../services/api'

interface SessionSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session | null
  xpGained?: number
  plantsEarned?: number
}

const SessionSummaryModal = ({ 
  isOpen, 
  onClose, 
  session,
  xpGained = 0,
  plantsEarned = 0 
}: SessionSummaryModalProps) => {
  if (!session) return null

  const durationMinutes = session.duration 
    ? Math.round(session.duration / 60) 
    : session.duration_minutes || 25
  const focusScore = session.focus_score || 85

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Zap className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white text-center">
                  Session Complete!
                </h2>
                <p className="text-gray-300 text-center text-sm mt-1">
                  Great work staying focused
                </p>
              </div>

              {/* Stats Grid */}
              <div className="p-6 space-y-4">
                {/* Duration */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-xl font-bold text-gray-900">{durationMinutes} min</p>
                    </div>
                  </div>
                </motion.div>

                {/* Focus Score */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Focus Score</p>
                      <p className="text-xl font-bold text-gray-900">{focusScore.toFixed(0)}%</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${focusScore}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                    />
                  </div>
                </motion.div>

                {/* XP Gained */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-200 rounded-lg">
                      <Zap className="w-5 h-5 text-yellow-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">XP Earned</p>
                      <p className="text-xl font-bold text-yellow-700">+{xpGained} XP</p>
                    </div>
                  </div>
                </motion.div>

                {/* Plants Earned */}
                {plantsEarned > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-200 rounded-lg">
                        <Sprout className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Garden Plants</p>
                        <p className="text-xl font-bold text-green-700">+{plantsEarned} 🌱</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={onClose}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SessionSummaryModal
