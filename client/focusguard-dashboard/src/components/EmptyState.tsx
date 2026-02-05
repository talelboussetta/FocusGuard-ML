import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center"
    >
      {/* Icon with animated circle background */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative mb-6"
      >
        {/* Animated background rings */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gray-200 rounded-full blur-xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute inset-0 bg-gray-300 rounded-full blur-2xl"
        />
        
        {/* Icon container */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
          <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 max-w-sm"
      >
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600">
          {description}
        </p>
      </motion.div>

      {/* Optional action button */}
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={action.onClick}
          className="mt-6 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {action.label}
        </motion.button>
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-10 right-10 w-32 h-32 bg-gray-100 rounded-full blur-3xl opacity-50"
        />
        <motion.div
          animate={{ 
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-10 left-10 w-40 h-40 bg-gray-100 rounded-full blur-3xl opacity-50"
        />
      </div>
    </motion.div>
  )
}

export default EmptyState
