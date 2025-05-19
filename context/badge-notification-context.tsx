"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import BadgeToast from "@/components/badge-toast"

type Badge = {
  id: string;
  name: string;
  icon: string;
  xp_reward: number;
}

interface BadgeNotificationContextType {
  showBadgeNotification: (badge: Badge) => void;
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType | undefined>(undefined)

export function BadgeNotificationProvider({ children }: { children: ReactNode }) {
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null)
  
  const showBadgeNotification = (badge: Badge) => {
    // If there's already a notification, replace it
    setCurrentBadge(badge)
  }
  
  return (
    <BadgeNotificationContext.Provider value={{ showBadgeNotification }}>
      {children}
      <BadgeToast 
        badge={currentBadge} 
        onClose={() => setCurrentBadge(null)} 
      />
    </BadgeNotificationContext.Provider>
  )
}

export function useBadgeNotification() {
  const context = useContext(BadgeNotificationContext)
  
  if (context === undefined) {
    throw new Error("useBadgeNotification must be used within a BadgeNotificationProvider")
  }
  
  return context
}
