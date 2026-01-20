import { useState, useCallback } from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

/**
 * Hook for managing toast notifications
 */
export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const addNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration = 3000) => {
      const id = Math.random().toString(36).substr(2, 9)
      const notification: Notification = { id, message, type, duration }

      setNotifications((prev) => [...prev, notification])

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id)
        }, duration)
      }

      return id
    },
    [removeNotification]
  )

  const success = useCallback(
    (message: string, duration?: number) => addNotification(message, 'success', duration),
    [addNotification]
  )

  const error = useCallback(
    (message: string, duration?: number) => addNotification(message, 'error', duration),
    [addNotification]
  )

  const info = useCallback(
    (message: string, duration?: number) => addNotification(message, 'info', duration),
    [addNotification]
  )

  const warning = useCallback(
    (message: string, duration?: number) => addNotification(message, 'warning', duration),
    [addNotification]
  )

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
  }
}
