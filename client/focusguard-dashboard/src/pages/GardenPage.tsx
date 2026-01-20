import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Leaf, Play, Sparkles, Clock, Sprout, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { gardenAPI, userAPI } from '../services/api'
import type { Garden, UserStats } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const GardenPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [garden, setGarden] = useState<Garden | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    loadGarden()
  }, [])

  const loadGarden = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [gardenData, statsData] = await Promise.all([
        gardenAPI.get(),
        userAPI.getStats()
      ])
      
      setGarden(gardenData)
      setStats(statsData)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load garden'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetGarden = async () => {
    if (!confirm('Are you sure you want to reset your garden? This will remove all plants!')) {
      return
    }
    
    try {
      setResetting(true)
      setError(null)
      await gardenAPI.reset()
      await loadGarden()
    } catch (err: any) {
      setError(err.message || 'Failed to reset garden')
    } finally {
      setResetting(false)
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

  const getPlantEmoji = (type: string): string => {
    const plants: { [key: string]: string } = {
      common: '🌱',
      rare: '🌿',
      epic: '🌳',
      legendary: '✨',
    }
    return plants[type] || '🌱'
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
              <div className="flex gap-3">
                <motion.button
                  onClick={handleResetGarden}
                  disabled={resetting}
                  className="btn-secondary flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {resetting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                  <span>Reset Garden</span>
                </motion.button>
                <motion.button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" />
                  <span>Start Focus Session</span>
                </motion.button>
              </div>
            </div>
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
                  <div className="text-2xl font-bold gradient-text">{garden?.total_plants || 0}</div>
                  <div className="text-sm text-slate-400">Total Plants</div>
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold gradient-text">{garden?.rare_plants || 0}</div>
                  <div className="text-sm text-slate-400">Rare Plants</div>
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
                  <div className="text-2xl font-bold gradient-text">{garden?.epic_plants || 0}</div>
                  <div className="text-sm text-slate-400">Epic Plants</div>
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold gradient-text">{garden?.legendary_plants || 0}</div>
                  <div className="text-sm text-slate-400">Legendary Plants</div>
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

            {/* Garden Content */}
            <div className="relative z-10 p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Common Plants */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass rounded-xl p-6 text-center"
                >
                  <div className="text-6xl mb-3">{getPlantEmoji('common')}</div>
                  <h3 className="text-lg font-semibold mb-1">Common</h3>
                  <p className="text-3xl font-bold gradient-text">
                    {(garden?.total_plants || 0) - (garden?.rare_plants || 0) - (garden?.epic_plants || 0) - (garden?.legendary_plants || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Regular plants</p>
                </motion.div>

                {/* Rare Plants */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass rounded-xl p-6 text-center"
                >
                  <div className="text-6xl mb-3">{getPlantEmoji('rare')}</div>
                  <h3 className="text-lg font-semibold mb-1">Rare</h3>
                  <p className="text-3xl font-bold text-blue-400">
                    {garden?.rare_plants || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">30% chance</p>
                </motion.div>

                {/* Epic Plants */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass rounded-xl p-6 text-center"
                >
                  <div className="text-6xl mb-3">{getPlantEmoji('epic')}</div>
                  <h3 className="text-lg font-semibold mb-1">Epic</h3>
                  <p className="text-3xl font-bold text-purple-400">
                    {garden?.epic_plants || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">15% chance</p>
                </motion.div>

                {/* Legendary Plants */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass rounded-xl p-6 text-center"
                >
                  <div className="text-6xl mb-3">{getPlantEmoji('legendary')}</div>
                  <h3 className="text-lg font-semibold mb-1">Legendary</h3>
                  <p className="text-3xl font-bold text-yellow-400">
                    {garden?.legendary_plants || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">5% chance</p>
                </motion.div>
              </div>

              {/* Additional Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 glass rounded-xl p-6"
              >
                <h3 className="text-xl font-display font-semibold mb-4">Garden Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Sessions</p>
                    <p className="text-2xl font-bold">{stats?.total_sessions || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Focus Time</p>
                    <p className="text-2xl font-bold">{formatMinutes(stats?.total_focus_min || 0)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Last Plant</p>
                    <p className="text-2xl font-bold">
                      {garden?.last_plant_at 
                        ? new Date(garden.last_plant_at).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Empty State */}
              {(garden?.total_plants || 0) === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center mt-12"
                >
                  <Sprout className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Your garden is empty!</h3>
                  <p className="text-slate-400 mb-6">
                    Complete focus sessions to grow beautiful plants
                  </p>
                  <motion.button
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary flex items-center space-x-2 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Your First Session</span>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default GardenPage
