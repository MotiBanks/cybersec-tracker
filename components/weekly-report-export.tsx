"use client"

import { useState, useEffect } from "react"
import { FileDown, BarChart2, CheckCircle, FileText, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/context/user-context"
import { getBrowserClient } from "@/lib/supabase"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"

export default function WeeklyReportExport() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [weeklyData, setWeeklyData] = useState<any>(null)
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())

  useEffect(() => {
    if (user) {
      fetchWeeklyData()
    }
  }, [user, selectedWeek])

  const fetchWeeklyData = async () => {
    if (!user) return
    setLoading(true)

    const startDate = startOfWeek(selectedWeek, { weekStartsOn: 0 })
    const endDate = endOfWeek(selectedWeek, { weekStartsOn: 0 })

    const startDateStr = format(startDate, "yyyy-MM-dd")
    const endDateStr = format(endDate, "yyyy-MM-dd")

    // Get completed tasks for the week
    const { data: tasks, error: tasksError } = await getBrowserClient()
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("scheduled_for", startDateStr)
      .lte("scheduled_for", endDateStr)

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError)
      setLoading(false)
      return
    }

    // Get reflections for the week
    const { data: reflections, error: reflectionsError } = await getBrowserClient()
      .from("reflections")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    if (reflectionsError) {
      console.error("Error fetching reflections:", reflectionsError)
      setLoading(false)
      return
    }

    // Get languages practiced this week
    const { data: languages, error: languagesError } = await getBrowserClient()
      .from("languages")
      .select("*")
      .eq("user_id", user.id)
      .gte("last_practiced", startDateStr)
      .lte("last_practiced", endDateStr)

    if (languagesError) {
      console.error("Error fetching languages:", languagesError)
      setLoading(false)
      return
    }

    // Calculate total XP from tasks
    const taskXP = tasks ? tasks.reduce((sum: number, task: any) => sum + (task.xp || 0), 0) : 0

    setWeeklyData({
      startDate,
      endDate,
      tasks: tasks || [],
      reflections: reflections || [],
      languages: languages || [],
      totalXP: taskXP,
      tasksCompleted: tasks ? tasks.length : 0,
      reflectionsCount: reflections ? reflections.length : 0,
      languagesPracticed: languages ? languages.map((l: any) => l.name) : [],
    })

    setLoading(false)
  }

  const previousWeek = () => {
    setSelectedWeek(subWeeks(selectedWeek, 1))
  }

  const currentWeek = () => {
    setSelectedWeek(new Date())
  }

  const generateReport = async () => {
    if (!user || !weeklyData) return

    // Save report to database
    const { error } = await getBrowserClient()
      .from("weekly_reports")
      .insert([
        {
          user_id: user.id,
          week_start: format(weeklyData.startDate, "yyyy-MM-dd"),
          week_end: format(weeklyData.endDate, "yyyy-MM-dd"),
          xp_gained: weeklyData.totalXP,
          tasks_completed: weeklyData.tasksCompleted,
          reflections_count: weeklyData.reflectionsCount,
          languages_practiced: weeklyData.languagesPracticed,
        },
      ])

    if (error) {
      console.error("Error saving report:", error)
      return
    }

    // Generate report text
    const reportText = `
# CyberTrack Weekly Report
## ${format(weeklyData.startDate, "MMM d")} - ${format(weeklyData.endDate, "MMM d, yyyy")}

### Summary
- XP Gained: ${weeklyData.totalXP}
- Tasks Completed: ${weeklyData.tasksCompleted}
- Reflections Written: ${weeklyData.reflectionsCount}
- Languages Practiced: ${weeklyData.languagesPracticed.join(", ") || "None"}

### Completed Tasks
${weeklyData.tasks.map((task: any) => `- ${task.title} (+${task.xp} XP)`).join("\n") || "- None"}

### Reflections
${
  weeklyData.reflections
    .map(
      (reflection: any, i: number) =>
        `#### ${format(new Date(reflection.created_at), "MMM d, yyyy")}
${reflection.content.substring(0, 100)}${reflection.content.length > 100 ? "..." : ""}`,
    )
    .join("\n\n") || "- None"
}
    `

    // Create a download link
    const blob = new Blob([reportText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cybertrack-report-${format(weeklyData.startDate, "yyyy-MM-dd")}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FileDown className="w-5 h-5 mr-2 text-green-500" />
          <h3 className="text-sm font-medium text-green-300">Weekly Report</h3>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400 text-xs"
            onClick={previousWeek}
          >
            Previous Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400 text-xs"
            onClick={currentWeek}
          >
            Current Week
          </Button>
        </div>
      </div>

      <div className="text-xs text-green-300 mb-3">
        {weeklyData && (
          <span>
            Week of {format(weeklyData.startDate, "MMM d")} - {format(weeklyData.endDate, "MMM d, yyyy")}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4 text-green-300/60 text-sm">Loading data...</div>
      ) : weeklyData ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-green-500/20 rounded bg-black/30 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-green-400" />
              <div>
                <div className="text-xs text-green-300/60">XP Gained</div>
                <div className="text-sm font-medium text-green-300">{weeklyData.totalXP}</div>
              </div>
            </div>
            <div className="p-3 border border-green-500/20 rounded bg-black/30 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
              <div>
                <div className="text-xs text-green-300/60">Tasks Completed</div>
                <div className="text-sm font-medium text-green-300">{weeklyData.tasksCompleted}</div>
              </div>
            </div>
            <div className="p-3 border border-green-500/20 rounded bg-black/30 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-400" />
              <div>
                <div className="text-xs text-green-300/60">Reflections</div>
                <div className="text-sm font-medium text-green-300">{weeklyData.reflectionsCount}</div>
              </div>
            </div>
            <div className="p-3 border border-green-500/20 rounded bg-black/30 flex items-center">
              <Code className="w-5 h-5 mr-2 text-green-400" />
              <div>
                <div className="text-xs text-green-300/60">Languages Practiced</div>
                <div className="text-sm font-medium text-green-300">{weeklyData.languagesPracticed.length}</div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full border-green-500/20 bg-black hover:bg-green-900/20 text-green-400"
            onClick={generateReport}
            disabled={weeklyData.tasksCompleted === 0 && weeklyData.reflectionsCount === 0}
          >
            <FileDown className="w-4 h-4 mr-1" />
            Export Weekly Report
          </Button>
        </div>
      ) : (
        <div className="text-center py-4 text-green-300/60 text-sm">No data available for this week</div>
      )}

      <div className="mt-4 text-xs text-green-300/60">
        <p>Export your weekly progress report to track your cybersecurity learning journey over time.</p>
      </div>
    </div>
  )
}
