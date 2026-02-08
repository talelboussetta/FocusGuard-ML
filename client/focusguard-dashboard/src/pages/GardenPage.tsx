import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Leaf, Play, Sparkles, Sprout, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { gardenAPI, userAPI, getErrorMessage } from '../services/api'
import type { Garden, UserStats } from '../services/api'
import gardenImage1 from '../assets/images/garden_images/GST DACAR 121-02.png'
import gardenImage2 from '../assets/images/garden_images/GST DACAR 121-03.png'
import gardenImage3 from '../assets/images/garden_images/GST DACAR 121-04.png'
import gardenImage4 from '../assets/images/garden_images/GST DACAR 121-05.png'

const GardenPage = () => {
  const navigate = useNavigate()
  const [garden, setGarden] = useState<Garden | null>(null)
  const [plants, setPlants] = useState<Array<{id: string, plant_num: number, plant_type: string, growth_stage: number}>>([])
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
      
      const [gardenData, plantsData, statsData] = await Promise.all([
        gardenAPI.get(),
        gardenAPI.getPlants(100),
        userAPI.getStats()
      ])
      
      setGarden(gardenData)
      setPlants(plantsData.gardens || [])
      setStats(statsData)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load garden'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetGarden = async () => {
    if (!confirm('Are you sure you want to reset your garden? This will permanently remove all plants!')) {
      return
    }
    
    try {
      setResetting(true)
      setError(null)
      await gardenAPI.reset()
      
      // Reload garden after reset
      await loadGarden()
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to reset garden'))
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
                  onClick={() => loadGarden()}
                  disabled={loading}
                  className="btn-secondary flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Leaf className="w-5 h-5" />
                  )}
                  <span>Refresh</span>
                </motion.button>
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
                  <span>Reset</span>
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

          {/* Plant System Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 glass rounded-2xl border border-primary-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-500/10 rounded-xl">
                <Sparkles className="w-6 h-6 text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Plant Collection System</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Earn <span className="text-primary-400 font-semibold">1 plant every 5 minutes</span> of focused study time! 
                  The more you study, the higher your chances of discovering rare plants.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <img src={gardenImage1} alt="Regular" className="w-8 h-8 object-contain" />
                    <div>
                      <p className="text-white font-medium">Regular</p>
                      <p className="text-slate-400 text-xs">Always available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={gardenImage2} alt="Uncommon" className="w-8 h-8 object-contain" />
                    <div>
                      <p className="text-white font-medium">Uncommon</p>
                      <p className="text-slate-400 text-xs">10% + study bonus</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={gardenImage3} alt="Rare" className="w-8 h-8 object-contain" />
                    <div>
                      <p className="text-white font-medium">Rare</p>
                      <p className="text-slate-400 text-xs">5% + study bonus</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={gardenImage4} alt="Legendary" className="w-8 h-8 object-contain" />
                    <div>
                      <p className="text-white font-medium">Legendary</p>
                      <p className="text-slate-400 text-xs">2% + study bonus</p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mt-3">
                  💡 <span className="text-primary-400">Pro tip:</span> Your rarity bonus increases by 0.5% for every 100 minutes studied (up to +20%)
                </p>
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nature-500 to-emerald-600 flex items-center justify-center p-2">
                  <img src={gardenImage1} alt="Total Plants" className="w-full h-full object-contain" />
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center p-2">
                  <img src={gardenImage2} alt="Rare Plants" className="w-full h-full object-contain" />
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-2">
                  <img src={gardenImage3} alt="Epic Plants" className="w-full h-full object-contain" />
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center p-2">
                  <img src={gardenImage4} alt="Legendary Plants" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-2xl font-bold gradient-text">{garden?.legendary_plants || 0}</div>
                  <div className="text-sm text-slate-400">Legendary Plants</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Garden Visualization - Floating Plants */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card-soft min-h-[600px] relative overflow-hidden"
          >
            {plants.length >= 20 && (
              <div className="absolute top-4 left-4 right-4 z-20">
                <div className="glass rounded-xl px-4 py-3 border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm flex items-center justify-between gap-3">
                  <span>🌱 You studied too much — consider a fresh garden to keep things smooth.</span>
                  <button
                    onClick={handleResetGarden}
                    disabled={resetting}
                    className="px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-semibold transition"
                  >
                    Reset Garden
                  </button>
                </div>
              </div>
            )}
            {/* Animated Sky Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-purple-900/20 to-green-900/30" />
            
            {/* Floating Stars/Sparkles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
            
            {/* Ground Layer */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-950/60 via-green-950/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-24">
              <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            </div>

            {/* Floating Plants Container */}
            {/* If the garden gets super full, consider offering a reset: "You studied too much — time for a fresh garden?" to avoid lag. */}
            <div className="relative z-10 p-8 min-h-[600px]">
              {plants.length > 0 ? (
                <div className="relative w-full h-[550px]">
                  {plants.map((plant, index) => {
                    const plantType = parseInt(plant.plant_type)
                    let plantImage = gardenImage1
                    let rarityColor = 'from-green-500 to-emerald-600'
                    
                    if (plantType >= 13 && plantType <= 15) {
                      plantImage = gardenImage2
                      rarityColor = 'from-blue-500 to-cyan-600'
                    } else if (plantType >= 16 && plantType <= 17) {
                      plantImage = gardenImage3
                      rarityColor = 'from-purple-500 to-pink-600'
                    } else if (plantType === 18) {
                      plantImage = gardenImage4
                      rarityColor = 'from-yellow-500 to-orange-600'
                    }

                    const xPos = (index * 37) % 90
                    const yPos = ((index * 53) % 80) + 10
                    
                    return (
                      <motion.div
                        key={plant.id}
                        className="absolute"
                        style={{
                          left: `${xPos}%`,
                          top: `${yPos}%`,
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: [0, -10, 0],
                          rotate: [-5, 5, -5],
                        }}
                        transition={{
                          opacity: { duration: 0.5, delay: index * 0.05 },
                          scale: { duration: 0.5, delay: index * 0.05 },
                          y: {
                            duration: 3 + (index % 3),
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: index * 0.1,
                          },
                          rotate: {
                            duration: 4 + (index % 2),
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: index * 0.15,
                          },
                        }}
                      >
                        <div className={`relative group cursor-pointer`}>
                          {/* Glow Effect */}
                          <div className={`absolute -inset-2 bg-gradient-to-r ${rarityColor} rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
                          
                          {/* Plant */}
                          <div className="relative">
                            <img 
                              src={plantImage} 
                              alt={`Plant ${plant.plant_num}`}
                              className="w-16 h-16 md:w-20 md:h-20 object-contain filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-200"
                            />
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="glass rounded-lg px-3 py-2 whitespace-nowrap text-xs">
                                <p className="font-semibold">Plant #{plant.plant_num}</p>
                                <p className="text-slate-300">Type: {plant.plant_type}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  
                  {/* Summary Cards */}
                  <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4 gap-2">
                    <div className="glass rounded-lg p-2 text-center backdrop-blur-md">
                      <img src={gardenImage1} alt="Regular" className="w-8 h-8 object-contain mx-auto mb-1" />
                      <div className="text-xs text-slate-400">Regular</div>
                      <div className="font-bold text-sm">
                        {plants.filter(p => parseInt(p.plant_type) < 13).length}
                      </div>
                    </div>
                    <div className="glass rounded-lg p-2 text-center backdrop-blur-md">
                      <img src={gardenImage2} alt="Uncommon" className="w-8 h-8 object-contain mx-auto mb-1" />
                      <div className="text-xs text-slate-400">Uncommon</div>
                      <div className="font-bold text-sm text-blue-400">
                        {plants.filter(p => {
                          const t = parseInt(p.plant_type)
                          return t >= 13 && t <= 15
                        }).length}
                      </div>
                    </div>
                    <div className="glass rounded-lg p-2 text-center backdrop-blur-md">
                      <img src={gardenImage3} alt="Rare" className="w-8 h-8 object-contain mx-auto mb-1" />
                      <div className="text-xs text-slate-400">Rare</div>
                      <div className="font-bold text-sm text-purple-400">
                        {plants.filter(p => {
                          const t = parseInt(p.plant_type)
                          return t >= 16 && t <= 17
                        }).length}
                      </div>
                    </div>
                    <div className="glass rounded-lg p-2 text-center backdrop-blur-md">
                      <img src={gardenImage4} alt="Legendary" className="w-8 h-8 object-contain mx-auto mb-1" />
                      <div className="text-xs text-slate-400">Legendary</div>
                      <div className="font-bold text-sm text-yellow-400">
                        {plants.filter(p => parseInt(p.plant_type) === 18).length}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-32"
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

          {/* Garden Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass rounded-xl p-6"
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
        </div>
      </div>
    </div>
  )
}

export default GardenPage
