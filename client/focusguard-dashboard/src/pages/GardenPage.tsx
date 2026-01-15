import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'

const GardenPage = () => {
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
              Your <span className="gradient-text">Personal Garden</span>
            </h1>
            <p className="text-slate-400">
              Watch your dedication bloom into a beautiful garden
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card-soft min-h-[600px] flex items-center justify-center"
          >
            <p className="text-slate-400">Garden visualization coming soon...</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default GardenPage
