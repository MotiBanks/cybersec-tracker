"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar, Clock, Plus, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import { TasksService } from "@/services/tasks-service"

export default function ScheduleTaskPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [taskType, setTaskType] = useState("learning")
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [scheduledTime, setScheduledTime] = useState("12:00")
  const [duration, setDuration] = useState("30")
  const [xpReward, setXpReward] = useState("50")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      
      setUserId(currentUser.id)
    }
    
    loadUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) return
    
    if (!title.trim()) {
      setError("Task title is required")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const scheduledFor = `${scheduledDate}T${scheduledTime}:00`
      
      await TasksService.createTask({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        task_type: taskType,
        scheduled_for: scheduledFor,
        duration_minutes: parseInt(duration, 10) || 30,
        xp_reward: parseInt(xpReward, 10) || 50,
        completed: false,
        completed_at: null,
        recurring_pattern: null
      })
      
      router.push("/dashboard")
    } catch (err) {
      console.error("Error creating task:", err)
      setError("Failed to create task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} className="text-green-500 border-green-500/20">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-green-500">Schedule New Task</h1>
      </div>
      
      <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-green-400">Task Details</CardTitle>
          <CardDescription>
            Schedule a new task for your cybersecurity learning journey
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-900/20 border border-red-500/30 text-red-300">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-green-300">
                Task Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complete Nmap Tutorial"
                className="bg-black border-green-500/20 text-green-300"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-green-300">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about the task"
                className="bg-black border-green-500/20 text-green-300 min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="taskType" className="text-sm font-medium text-green-300">
                  Task Type
                </label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger className="bg-black border-green-500/20 text-green-300">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500/20 text-green-300">
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="xpReward" className="text-sm font-medium text-green-300">
                  XP Reward
                </label>
                <Input
                  id="xpReward"
                  type="number"
                  min="10"
                  max="500"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  className="bg-black border-green-500/20 text-green-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="scheduledDate" className="text-sm font-medium text-green-300">
                  Date
                </label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-500" />
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-black border-green-500/20 text-green-300"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="scheduledTime" className="text-sm font-medium text-green-300">
                  Time
                </label>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-black border-green-500/20 text-green-300"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium text-green-300">
                  Duration (minutes)
                </label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="480"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-black border-green-500/20 text-green-300"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-green-500/20 text-green-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Creating..." : "Schedule Task"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
