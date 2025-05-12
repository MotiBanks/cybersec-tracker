"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { CyberToast, type CyberToastProps } from "@/components/ui/cyber-toast"
import { createPortal } from "react-dom"

type NotificationType = Omit<CyberToastProps, "onClose">

interface NotificationContextType {
  showNotification: (notification: NotificationType) => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  clearNotifications: () => {},
})

export const useNotification = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<(NotificationType & { id: string })[]>([])
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  // Set up portal container on client side
  useState(() => {
    if (typeof window !== "undefined") {
      setPortalContainer(document.body)
    }
  })

  const showNotification = useCallback((notification: NotificationType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications((prev) => [...prev, { ...notification, id }])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotifications }}>
      {children}
      {portalContainer &&
        createPortal(
          <>
            {notifications.map((notification) => (
              <CyberToast key={notification.id} {...notification} onClose={() => removeNotification(notification.id)} />
            ))}
          </>,
          portalContainer,
        )}
    </NotificationContext.Provider>
  )
}
