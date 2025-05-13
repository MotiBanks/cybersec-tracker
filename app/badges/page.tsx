"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Award, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Badge = Database["public"]["Tables"]["badges"]["Row"] & {
  user_earned?: boolean;
  earned_at?: string | null;
}

export default function BadgesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

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
        
        return {
          ...badge,
          user_earned: !!earned,
          earned_at: earned?.earned_at || null
        }
      })
      
      // Sort badges: earned first, then by XP reward
      badgesWithStatus.sort((a, b) => {
        if (a.user_earned && !b.user_earned) return -1
        if (!a.user_earned && b.user_earned) return 1
        return b.xp_reward - a.xp_reward
      })
      
      setBadges(badgesWithStatus)
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
      
      // Reload badges
      await loadBadges(userId)
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
              {badges.map(badge => (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
