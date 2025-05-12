"use client"

import { useState, useEffect } from "react"
import { Terminal, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getBrowserClient } from "@/lib/supabase"
import { useUser } from "@/context/user-context"
import { useNotification } from "@/context/notification-context"

export default function HackChallenges() {
  const { user } = useUser()
  const { showNotification } = useNotification()
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      fetchChallenges()
    }
  }, [user])

  const fetchChallenges = async () => {
    setLoading(true)
    const supabase = getBrowserClient()

    try {
      // Fetch all hack challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("hack_challenges")
        .select("*")
        .order("xp_reward", { ascending: true })

      if (challengesError) throw challengesError

      // Fetch completed challenges for the user
      if (user) {
        const { data: completedData, error: completedError } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("user_id", user.id)
          .eq("task_type", "hack_challenge")
          .eq("completed", true)

        if (completedError) throw completedError

        // Extract the titles of completed challenges
        const completedTitles = completedData?.map((task) => task.title) || []
        setCompletedChallenges(completedTitles)
      }

      setChallenges(challengesData || [])
    } catch (error) {
      console.error("Error fetching hack challenges:", error)
      showNotification({
        message: "Error",
        description: "Failed to load hack challenges",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const completeChallenge = async (challenge: any) => {
    if (!user) return

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
      setCompletedChallenges([...completedChallenges, challenge.title])

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
      <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center mb-4">
        <Terminal className="w-5 h-5 mr-2 text-green-500" />
        <h3 className="text-sm font-medium text-green-300">Hack Challenges</h3>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-4 text-green-300/60">No challenges available yet</div>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const isCompleted = completedChallenges.includes(challenge.title)

            return (
              <div
                key={challenge.id}
                className={`p-3 rounded border ${
                  isCompleted ? "border-green-500/30 bg-green-900/20" : "border-green-500/10 bg-black/30"
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-medium ${
                          isCompleted ? "text-green-300 line-through" : "text-green-400"
                        }`}
                      >
                        {challenge.title}
                      </h4>
                      <span className="text-xs text-green-300/60">+{challenge.xp_reward} XP</span>
                    </div>

                    <p className="mt-1 text-xs text-green-300/80">{challenge.description}</p>

                    {challenge.code_snippet && (
                      <div className="mt-2 p-2 bg-black rounded border border-green-500/20 font-mono text-xs overflow-x-auto">
                        <code>{challenge.code_snippet}</code>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  {isCompleted ? (
                    <div className="flex items-center text-green-500 text-xs">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 bg-black hover:bg-green-900/20 border-green-500/20"
                      onClick={() => completeChallenge(challenge)}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
