import { createContext, useContext, ReactNode } from 'react'
import { useNotification } from '../hooks/useNotification'
import { Toast } from '../components/ui/Toast'

interface NotificationContextType {
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { notifications, removeNotification, success, error, info, warning } = useNotification()

  return (
    <NotificationContext.Provider value={{ success, error, info, warning }}>
      {children}
      <Toast notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}
