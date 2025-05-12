"use client"

import { useState, useEffect } from "react"
import { FileText, Save, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/context/user-context"
import { getBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"

export default function ReflectionPrompt() {
  const { user, userProfile } = useUser()
  const [reflection, setReflection] = useState("")
  const [saving, setSaving] = useState(false)
  const [pastReflections, setPastReflections] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [viewingPast, setViewingPast] = useState(false)

  useEffect(() => {
    if (user) {
      fetchReflections()
    }
  }, [user])

  const fetchReflections = async () => {
    if (!user) return

    const { data, error } = await getBrowserClient()
      .from("reflections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reflections:", error)
      return
    }

    setPastReflections(data || [])
  }

  const saveReflection = async () => {
    if (!user || !reflection.trim()) return

    setSaving(true)

    const { data, error } = await getBrowserClient()
      .from("reflections")
      .insert([
        {
          user_id: user.id,
          content: reflection,
        },
      ])

    setSaving(false)

    if (error) {
      console.error("Error saving reflection:", error)
      return
    }

    // Clear the form and refresh reflections
    setReflection("")
    fetchReflections()

    // Award XP for completing a reflection
    if (userProfile) {
      await getBrowserClient()
        .from("users")
        .update({
          xp: userProfile.xp + 25,
        })
        .eq("id", user.id)
    }
  }

  const toggleView = () => {
    setViewingPast(!viewingPast)
    setCurrentPage(0)
  }

  const nextPage = () => {
    if (currentPage < pastReflections.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FileText className="w-5 h-5 mr-2 text-green-500" />
          <h3 className="text-sm font-medium text-green-300">Daily Reflection</h3>
        </div>
        {pastReflections.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400 text-xs"
            onClick={toggleView}
          >
            {viewingPast ? "New Entry" : "View Past"}
          </Button>
        )}
      </div>

      {viewingPast && pastReflections.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2 text-xs text-green-300/80">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-8 text-green-400"
              onClick={prevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{format(new Date(pastReflections[currentPage].created_at), "MMM d, yyyy 'at' HH:mm")}</span>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-8 text-green-400"
              onClick={nextPage}
              disabled={currentPage === pastReflections.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-black border border-green-500/20 rounded-md p-3 text-green-300 text-sm min-h-[150px]">
            {pastReflections[currentPage].content.split("\n").map((line: string, i: number) => (
              <p key={i} className="mb-2">
                {line}
              </p>
            ))}
          </div>
          <div className="flex justify-between text-xs text-green-300/60">
            <span>
              Entry {pastReflections.length - currentPage} of {pastReflections.length}
            </span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {format(new Date(pastReflections[currentPage].created_at), "HH:mm")}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 text-xs text-green-300/80">
            <p>What did you learn today? What challenges did you face?</p>
          </div>

          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Today I learned..."
            className="min-h-[150px] bg-black border-green-500/20 text-green-300 placeholder:text-green-500/40 text-sm"
          />

          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-green-300/60">{reflection.length} characters</span>
            <Button
              variant="outline"
              size="sm"
              className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400"
              onClick={saveReflection}
              disabled={saving || !reflection.trim()}
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save Reflection"}
            </Button>
          </div>

          <div className="mt-4 text-xs text-green-300/60">
            <p>Tip: Regular reflection helps reinforce learning and identify areas for improvement.</p>
          </div>
        </>
      )}
    </div>
  )
}
