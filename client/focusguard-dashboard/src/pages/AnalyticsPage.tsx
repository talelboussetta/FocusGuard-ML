import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'

const AnalyticsPage = () => {
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card-soft"
          >
            <p className="text-slate-400">Analytics dashboard coming soon...</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
