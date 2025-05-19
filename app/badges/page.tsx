"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Award, RefreshCw } from "lucide-react"
import { useBadgeNotification } from "@/context/badge-notification-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Badge = Database["public"]["Tables"]["badges"]["Row"] & {
  user_earned?: boolean;
  earned_at?: string | null;
  is_epic?: boolean; // Flag for epic achievements
}

export default function BadgesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0)
  const { showBadgeNotification } = useBadgeNotification()

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      
      setUserId(currentUser.id)
      loadBadges(currentUser.id)
    }
    
    loadUser()
  }, [router])

  const loadBadges = async (uid: string) => {
    setIsLoading(true)
    try {
      const supabase = getBrowserClient()
      
      // Get all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .order("xp_reward", { ascending: false })
      
      if (badgesError) throw badgesError
      
      // Get user's earned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", uid)
      
      if (userBadgesError) throw userBadgesError
      
      // Combine the data
      const badgesWithStatus = allBadges.map(badge => {
        const earned = userBadges?.find(ub => ub.badge_id === badge.id)
        
        // Identify epic achievements (those with XP reward >= 500)
        const isEpic = badge.xp_reward >= 500
        
        return {
          ...badge,
          user_earned: !!earned,
          earned_at: earned?.earned_at || null,
          is_epic: isEpic
        }
      })
      
      // Sort badges: earned first, then by XP reward
      badgesWithStatus.sort((a, b) => {
        if (a.user_earned && !b.user_earned) return -1
        if (!a.user_earned && b.user_earned) return 1
        return b.xp_reward - a.xp_reward
      })
      
      setBadges(badgesWithStatus)
      
      // Count earned badges
      const earnedCount = badgesWithStatus.filter(b => b.user_earned).length
      setPreviousBadgeCount(earnedCount)
    } catch (error) {
      console.error("Error loading badges:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkForNewBadges = async () => {
    if (!userId || isChecking) return
    
    setIsChecking(true)
    try {
      const supabase = getBrowserClient()
      
      // Call the server function to check for new badges
      await supabase.rpc("check_user_badges", {
        user_id: userId
      })
      
      // Store previous count before reloading
      const prevCount = previousBadgeCount
      
      // Reload badges
      await loadBadges(userId)
      
      // Check if any new badges were earned
      const currentEarnedBadges = badges.filter(b => b.user_earned)
      const newEarnedCount = currentEarnedBadges.length
      
      // If new badges were earned, show notifications
      if (newEarnedCount > prevCount) {
        // Find newly earned badges
        const newlyEarnedBadges = currentEarnedBadges
          .filter(badge => {
            // Find this badge in the previous state
            const prevBadge = badges.find(b => b.id === badge.id && !b.user_earned)
            // If it exists in previous state but wasn't earned, it's new
            return !!prevBadge
          })
        
        // Show notification for each new badge (one at a time)
        if (newlyEarnedBadges.length > 0) {
          // Show the first new badge
          const newBadge = newlyEarnedBadges[0]
          showBadgeNotification({
            id: newBadge.id,
            name: newBadge.name,
            icon: newBadge.icon,
            xp_reward: newBadge.xp_reward
          })
        }
      }
    } catch (error) {
      console.error("Error checking for new badges:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard")} className="text-green-500 border-green-500/20 text-xs sm:text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-green-500">Badges & Achievements</h1>
        </div>
        
        <Button 
          onClick={checkForNewBadges}
          disabled={isChecking}
          variant="outline"
          className="border-green-500/20 text-green-400 text-xs sm:text-sm self-end xs:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Check for New Badges
        </Button>
      </div>
      
      <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-green-500" />
            <CardTitle className="text-green-400 text-base sm:text-lg">Your Achievements</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Unlock badges by completing challenges and making progress in your cybersecurity journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-green-300/60">Loading badges...</div>
          ) : badges.length === 0 ? (
            <div className="text-center py-8 text-green-300/60">
              No badges found. Complete challenges to earn badges!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Group badges by type */}
              <div className="col-span-full mb-2">
                <h2 className="text-green-400 text-sm sm:text-base font-medium">Standard Achievements</h2>
                <div className="h-px bg-green-500/20 mt-2"></div>
              </div>
              
              {/* Standard achievements */}
              {badges.filter(badge => !badge.is_epic).map(badge => (
                <div 
                  key={badge.id} 
                  className={`p-3 sm:p-4 rounded-lg border ${
                    badge.user_earned 
                      ? 'border-green-500/30 bg-green-900/20' 
                      : 'border-green-500/10 bg-black/30 opacity-70'
                  }`}
                >

                  <div className="flex items-center gap-3">
                    <div className="text-2xl sm:text-3xl">{badge.icon}</div>
                    <div>
                      <h3 className={`font-medium text-sm sm:text-base ${badge.user_earned ? 'text-green-300' : 'text-green-300/60'}`}>
                        {badge.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-green-300/60">{badge.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 xs:gap-0">
                    <div className="text-green-300/60 text-xs sm:text-sm">
                      {badge.user_earned 
                        ? `Earned on ${formatDate(badge.earned_at || null)}` 
                        : `Requirement: ${badge.requirement}`}
                    </div>
                    <div className="text-green-400 text-xs sm:text-sm self-end xs:self-auto">+{badge.xp_reward} XP</div>
                  </div>
                </div>
              ))}
              
              {/* Epic achievements section */}
              {badges.some(badge => badge.is_epic) && (
                <>
                  <div className="col-span-full mt-8 mb-2">
                    <h2 className="text-green-400 text-sm sm:text-base font-medium flex items-center">
                      <span className="mr-2">🔥</span>
                      Epic Achievements
                      <span className="ml-2 text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-md">Extreme Challenge</span>
                    </h2>
                    <div className="h-px bg-green-500/20 mt-2"></div>
                  </div>
                  
                  {badges.filter(badge => badge.is_epic).map(badge => (
                    <div 
                      key={badge.id} 
                      className={`p-3 sm:p-4 rounded-lg border relative overflow-hidden ${badge.user_earned 
                        ? 'border-green-500/50 bg-green-900/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]' 
                        : 'border-green-500/20 bg-black/40 opacity-90'
                      }`}
                    >
                      {/* Animated background effect for epic badges */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/10 pointer-events-none"></div>
                      
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="text-2xl sm:text-3xl">{badge.icon}</div>
                        <div>
                          <h3 className={`font-medium text-sm sm:text-base ${badge.user_earned ? 'text-green-300' : 'text-green-300/70'}`}>
                            {badge.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-green-300/60">{badge.description}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 xs:gap-0 relative z-10">
                        <div className="text-green-300/60 text-xs sm:text-sm">
                          {badge.user_earned 
                            ? `Earned on ${formatDate(badge.earned_at || null)}` 
                            : `Requirement: ${badge.requirement}`}
                        </div>
                        <div className="text-green-400 font-medium text-xs sm:text-sm self-end xs:self-auto">+{badge.xp_reward} XP</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
