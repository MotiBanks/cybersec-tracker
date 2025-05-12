"use client"

import { useState, useEffect } from "react"
import { Shield, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const formattedDate = currentTime.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <header className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <Shield className="w-8 h-8 mr-2 text-green-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-green-500">CyberTrack</h1>
          <p className="text-xs text-green-300 opacity-80">
            {formattedDate} | {formattedTime}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-green-400 hover:text-green-300 hover:bg-green-900/20">
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-gray-900 border-green-500/50 text-green-400">
          <DropdownMenuItem className="hover:bg-green-900/30 cursor-pointer">Profile</DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-green-900/30 cursor-pointer">Settings</DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-green-900/30 cursor-pointer">Export Data</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
