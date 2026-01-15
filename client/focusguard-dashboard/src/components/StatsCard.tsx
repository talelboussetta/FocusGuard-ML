import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string
  icon: ReactNode
  gradient: string
  trend?: string
}

const StatsCard = ({ title, value, icon, gradient, trend }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="card-soft cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        {trend && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-sm font-semibold text-nature-400"
          >
            {trend}
          </motion.span>
        )}
      </div>

      <h3 className="text-slate-400 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-display font-bold gradient-text">{value}</p>
    </motion.div>
  )
}

export default StatsCard
