"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface BadgeToastProps {
  badge: {
    name: string;
    icon: string;
    xp_reward: number;
  } | null;
  onClose: () => void;
}

export default function BadgeToast({ badge, onClose }: BadgeToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (badge) {
      setIsVisible(true)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Allow time for exit animation
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [badge, onClose])
  
  if (!badge) return null
  
  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 max-w-sm transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-black/90 border border-green-500/30 rounded-lg shadow-lg p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{badge.icon}</div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-green-400 text-sm">Badge Unlocked!</h3>
              <button 
                onClick={() => {
                  setIsVisible(false)
                  setTimeout(onClose, 300)
                }}
                className="text-green-400/60 hover:text-green-400 -mt-1 -mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-green-300 text-xs sm:text-sm">{badge.name}</p>
            <p className="text-green-400 text-xs font-medium mt-1">+{badge.xp_reward} XP</p>
          </div>
        </div>
      </div>
    </div>
  )
}
