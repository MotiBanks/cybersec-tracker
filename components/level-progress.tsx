"use client"

import { useEffect, useState, useRef } from "react"
import { Trophy, Flame } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useNotification } from "@/context/notification-context"

interface LevelProgressProps {
  level: number
  xp: number
  nextLevelXp: number
  streak: number
}

export default function LevelProgress({ level, xp, nextLevelXp, streak }: LevelProgressProps) {
  const progress = (xp / nextLevelXp) * 100
  const { showNotification } = useNotification()
  const [isStreakAnimating, setIsStreakAnimating] = useState(false)

  // Use refs to track state without causing re-renders
  const notificationShownRef = useRef(false)
  const lastActiveRef = useRef<Date | null>(null)

  const ranks = ["Script Kiddie", "Code Crafter", "Cyber Ninja", "Packet Ghost", "Kernel Lord"]
  const currentRank = ranks[Math.min(Math.floor(level / 5), ranks.length - 1)]

  // Set up last active date once on mount
  useEffect(() => {
    // This would normally be fetched from the database
    // For demo, we'll set it to 3 weeks ago to trigger the streak warning
    const threeWeeksAgo = new Date()
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)
    lastActiveRef.current = threeWeeksAgo
  }, [])

  // Handle streak risk notification
  useEffect(() => {
    // Skip if we've already shown the notification
    if (notificationShownRef.current) return

    // Check if user hasn't been active in weeks
    if (lastActiveRef.current && streak > 1) {
      const daysSinceLastActive = Math.floor(
        (new Date().getTime() - lastActiveRef.current.getTime()) / (1000 * 3600 * 24),
      )

      // Only show streak at risk notification if it's been more than 14 days
      if (daysSinceLastActive > 14) {
        // Use setTimeout to avoid showing immediately on load
        const timer = setTimeout(() => {
          showNotification({
            message: "Streak at risk!",
            description: "You haven't been active in weeks. Log in daily to maintain your streak.",
            variant: "warning",
          })
          notificationShownRef.current = true
        }, 3000)

        return () => clearTimeout(timer)
      }
    }
  }, []) // Empty dependency array - only run once on mount

  // Milestone celebration for streaks divisible by 5
  useEffect(() => {
    if (streak > 0 && streak % 5 === 0) {
      setIsStreakAnimating(true)
      const timer = setTimeout(() => setIsStreakAnimating(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [streak])

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm relative overflow-hidden hover-scale">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 to-transparent pointer-events-none" />

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500 micro-movement" />
          <span className="text-sm font-medium">Level {level}</span>
        </div>
        <div className="flex items-center">
          <Flame className={`w-5 h-5 mr-1 text-orange-500 ${isStreakAnimating ? "animate-pulse" : "micro-movement"}`} />
          <span className="text-sm font-medium">{streak} day streak</span>
        </div>
      </div>

      <div className="mb-1">
        <div className="text-xs text-green-300/80 mb-1 flex justify-between">
          <span>
            XP: {xp}/{nextLevelXp}
          </span>
          <span className="text-green-400/90">{currentRank}</span>
        </div>
        <Progress
          value={progress}
          className="h-2 bg-green-900/30"
          indicatorClassName="bg-gradient-to-r from-green-500 to-cyan-500"
        />
      </div>

      <div className="mt-2 text-xs text-green-300/60">{nextLevelXp - xp} XP until next level</div>
    </div>
  )
}
