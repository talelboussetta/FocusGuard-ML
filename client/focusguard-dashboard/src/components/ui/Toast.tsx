import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { Notification, NotificationType } from '../../hooks/useNotification'

interface ToastProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

const icons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  info: <Info size={20} />,
  warning: <AlertTriangle size={20} />,
}

const variantStyles: Record<NotificationType, string> = {
  success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
  error: 'bg-red-500/20 border-red-500/30 text-red-400',
  info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
}

export function Toast({ notifications, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`
              flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl
              ${variantStyles[notification.type]}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {icons[notification.type]}
            </div>
            
            <p className="flex-1 text-sm font-medium text-white">
              {notification.message}
            </p>

            <button
              onClick={() => onRemove(notification.id)}
              className="flex-shrink-0 hover:bg-white/10 rounded-lg p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
