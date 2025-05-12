"use client"

import { Home, BarChart3, FileText, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileNavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function MobileNavigation({ activeTab, setActiveTab }: MobileNavigationProps) {
  const navItems = [
    { id: "dashboard", icon: <Home className="w-5 h-5" />, label: "Home" },
    { id: "progress", icon: <BarChart3 className="w-5 h-5" />, label: "Progress" },
    { id: "reflect", icon: <FileText className="w-5 h-5" />, label: "Reflect" },
    { id: "badges", icon: <Award className="w-5 h-5" />, label: "Badges" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-green-500/30 px-2 py-2">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center justify-center h-16 w-full hover-scale ${
              activeTab === item.id
                ? "text-green-400 bg-green-900/20 subtle-bounce"
                : "text-green-500/60 hover:text-green-400 hover:bg-green-900/10"
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
