"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CyberToastProps {
  message: string
  description?: string
  variant?: "default" | "success" | "warning" | "error" | "info"
  duration?: number
  onClose?: () => void
}

export function CyberToast({ message, description, variant = "default", duration = 5000, onClose }: CyberToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const dismissTimeout = setTimeout(() => {
      setIsVisible(false)
      if (onClose) setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(dismissTimeout)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) setTimeout(onClose, 300)
  }

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-green-500" />
    }
  }

  if (!isVisible) return null

  const variantStyles = {
    default: "border-green-500/50 bg-black/80 text-green-400",
    success: "border-green-500/50 bg-green-900/20 text-green-400",
    warning: "border-yellow-500/50 bg-yellow-900/20 text-yellow-400",
    error: "border-red-500/50 bg-red-900/20 text-red-400",
    info: "border-blue-500/50 bg-blue-900/20 text-blue-400",
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-start gap-2 rounded border p-3 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out max-w-xs",
        variantStyles[variant],
      )}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 mr-2">
        <h4 className="font-mono text-xs font-medium">{message}</h4>
        {description && <p className="mt-1 text-xs opacity-80">{description}</p>}
      </div>
      <button onClick={handleClose} className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-green-900/20">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
