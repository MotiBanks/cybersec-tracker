"use client"

import { useState, useEffect } from "react"
import { Terminal, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getBrowserClient } from "@/lib/supabase"
import { useUser } from "@/context/user-context"
import { useNotification } from "@/context/notification-context"

export default function HackOfTheDay() {
  const { user } = useUser()
  const { showNotification } = useNotification()
  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (user) {
      fetchRandomChallenge()
    }
  }, [user])

  const fetchRandomChallenge = async () => {
    if (!user) return
    setLoading(true)

    const supabase = getBrowserClient()

    try {
      // Get all challenges
      const { data: challenges, error: challengesError } = await supabase.from("hack_challenges").select("*")

      if (challengesError) throw challengesError

      if (!challenges || challenges.length === 0) {
        setLoading(false)
        return
      }

      // Get completed challenges
      const { data: completedChallenges, error: completedError } = await supabase
        .from("tasks")
        .select("title")
        .eq("user_id", user.id)
        .eq("task_type", "hack_challenge")
        .eq("completed", true)

      if (completedError) throw completedError

      // Filter out completed challenges
      const completedTitles = completedChallenges?.map((c) => c.title) || []
      const availableChallenges = challenges.filter((c) => !completedTitles.includes(c.title))

      // If all challenges are completed, just pick a random one
      const challengePool = availableChallenges.length > 0 ? availableChallenges : challenges

      // Select a random challenge
      const randomChallenge = challengePool[Math.floor(Math.random() * challengePool.length)]
      setChallenge(randomChallenge)
      setCompleted(completedTitles.includes(randomChallenge.title))
    } catch (error) {
      console.error("Error fetching hack challenge:", error)
    } finally {
      setLoading(false)
    }
  }

  const completeChallenge = async () => {
    if (!user || !challenge) return

    const supabase = getBrowserClient()

    try {
      // Create a completed task for this challenge
      const { error } = await supabase.from("tasks").insert([
        {
          user_id: user.id,
          title: challenge.title,
          description: challenge.description,
          task_type: "hack_challenge",
          completed: true,
          completed_at: new Date().toISOString(),
          xp_reward: challenge.xp_reward,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      // Update local state
      setCompleted(true)

      // Show notification
      showNotification({
        message: "Challenge completed!",
        description: `You earned +${challenge.xp_reward} XP`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error completing challenge:", error)
      showNotification({
        message: "Error",
        description: "Failed to complete challenge",
        variant: "error",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center mb-2">
          <Terminal className="w-5 h-5 mr-2 text-green-500" />
          <h3 className="text-sm font-medium text-green-300">Hack of the Day</h3>
        </div>
        <p className="text-xs text-green-300/80">No challenges available. Try seeding the database first.</p>
      </div>
    )
  }

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm relative overflow-hidden hover-scale">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 to-transparent pointer-events-none" />

      <div className="flex items-center mb-2">
        <Terminal className="w-5 h-5 mr-2 text-green-500 micro-movement" />
        <h3 className="text-sm font-medium text-green-300">Hack of the Day</h3>
      </div>

      <div className="text-sm text-green-400 font-medium mb-2">{challenge.title}</div>

      <p className="text-xs text-green-300/80 mb-3">{challenge.description}</p>

      {challenge.code_snippet && (
        <div className="text-xs bg-green-900/20 p-2 rounded border border-green-500/20 font-mono hover-scale">
          <code>{challenge.code_snippet}</code>
        </div>
      )}

      <div className="mt-3 text-xs text-green-300/60 flex justify-between">
        <span>+{challenge.xp_reward} XP on completion</span>
        {completed ? (
          <span className="text-green-400 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-green-400 hover:text-green-300 hover:bg-green-900/20 p-0 h-auto"
            onClick={completeChallenge}
          >
            Mark Complete
          </Button>
        )}
      </div>
    </div>
  )
}
