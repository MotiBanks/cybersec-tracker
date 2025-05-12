"use client"

import { useEffect, useState } from "react"
import { Award, Lock, CheckCircle, Info } from "lucide-react"
import { useUser } from "@/context/user-context"
import { getBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function BadgesView() {
  const { user, userProfile, refreshUserProfile } = useUser()
  const [badges, setBadges] = useState<any[]>([])
  const [userBadges, setUserBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchBadges()
    }
  }, [user])

  const fetchBadges = async () => {
    if (!user) return
    setLoading(true)

    // Fetch all badges
    const { data: allBadges, error: badgesError } = await getBrowserClient()
      .from("badges")
      .select("*")
      .order("xp_reward", { ascending: true })

    if (badgesError) {
      console.error("Error fetching badges:", badgesError)
      setLoading(false)
      return
    }

    // Fetch user's unlocked badges
    const { data: unlockedBadges, error: userBadgesError } = await getBrowserClient()
      .from("user_badges")
      .select("*, badge:badge_id(*)")
      .eq("user_id", user.id)

    if (userBadgesError) {
      console.error("Error fetching user badges:", userBadgesError)
      setLoading(false)
      return
    }

    setBadges(allBadges || [])
    setUserBadges(unlockedBadges || [])
    setLoading(false)
  }

  const checkForNewBadges = async () => {
    if (!user || !userProfile) return

    // This is where we would implement badge unlocking logic
    // For example, checking if the user has completed enough tasks, reflections, etc.

    // For demonstration, let's unlock a badge if none are unlocked yet
    if (userBadges.length === 0 && badges.length > 0) {
      const firstBadge = badges[0]

      const { error } = await getBrowserClient()
        .from("user_badges")
        .insert([
          {
            user_id: user.id,
            badge_id: firstBadge.id,
          },
        ])

      if (error) {
        console.error("Error unlocking badge:", error)
        return
      }

      // Award XP for the badge
      await getBrowserClient()
        .from("users")
        .update({
          xp: userProfile.xp + firstBadge.xp_reward,
        })
        .eq("id", user.id)

      await refreshUserProfile()
      fetchBadges()
    }
  }

  const isUnlocked = (badgeId: string) => {
    return userBadges.some((ub) => ub.badge_id === badgeId)
  }

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Award className="w-5 h-5 mr-2 text-green-500" />
          <h3 className="text-sm font-medium text-green-300">Badges & Achievements</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400 text-xs"
          onClick={checkForNewBadges}
        >
          Check for New
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-green-300/60 text-sm">Loading badges...</div>
      ) : badges.length === 0 ? (
        <div className="text-center py-4 text-green-300/60 text-sm">No badges available yet</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => {
            const unlocked = isUnlocked(badge.id)
            return (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-3 border rounded-lg flex flex-col items-center justify-center h-24 ${
                        unlocked ? "border-green-500/50 bg-green-900/20" : "border-green-500/10 bg-black/30 opacity-70"
                      }`}
                    >
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <div className="text-xs font-medium text-center">{badge.name}</div>
                      <div className="mt-1">
                        {unlocked ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-green-500/50" />
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 border-green-500/50 text-green-400 p-3 max-w-xs">
                    <div className="space-y-2">
                      <div className="font-medium">{badge.name}</div>
                      <div className="text-xs text-green-300/80">{badge.description}</div>
                      <div className="text-xs flex items-center text-green-300/60">
                        <Info className="w-3 h-3 mr-1" />
                        {unlocked ? "Unlocked" : badge.requirement}
                      </div>
                      {!unlocked && (
                        <div className="text-xs text-green-300/60">+{badge.xp_reward} XP when unlocked</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      )}

      <div className="mt-4 text-xs text-green-300/60">
        <p>Unlock badges by completing challenges and making progress in your cybersecurity journey.</p>
      </div>
    </div>
  )
}
