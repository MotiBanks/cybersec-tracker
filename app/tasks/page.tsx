"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar, Clock, Plus, CheckCircle, ArrowLeft, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import { TasksService } from "@/services/tasks-service"

// Define Task interface
interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  task_type: string;
  scheduled_for: string | null;
  duration_minutes: number | null;
  completed: boolean;
  completed_at: string | null;
  xp_reward: number;
  recurring_pattern: string | null;
  created_at: string;
}

export default function TasksPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      
      setUserId(currentUser.id)
      loadTasks(currentUser.id)
    }
    
    loadUser()
  }, [router])

  const loadTasks = async (uid: string) => {
    setIsLoading(true)
    try {
      const allTasks = await TasksService.getUserTasks(uid)
      
      // Filter tasks
      const pending = allTasks.filter(task => !task.completed)
      const completed = allTasks.filter(task => task.completed)
      
      setPendingTasks(pending)
      setCompletedTasks(completed)
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    if (!userId) return
    
    try {
      await TasksService.completeTask(taskId, userId)
      loadTasks(userId)
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  const getFilteredTasks = (tasks: Task[]) => {
    if (filter === "all") return tasks
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const weekLater = new Date(today)
    weekLater.setDate(weekLater.getDate() + 7)
    
    return tasks.filter(task => {
      const taskDate = task.scheduled_for ? new Date(task.scheduled_for) : null
      
      if (!taskDate) return filter === "unscheduled"
      
      switch (filter) {
        case "today":
          return taskDate >= today && taskDate < tomorrow
        case "week":
          return taskDate >= today && taskDate < weekLater
        default:
          return true
      }
    })
  }

  const formatTaskDate = (dateString: string | null) => {
    if (!dateString) return "Unscheduled"
    
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date >= today && date < tomorrow) {
      return `Today at ${format(date, "h:mm a")}`
    }
    
    return format(date, "MMM d, yyyy 'at' h:mm a")
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard")} className="text-green-500 border-green-500/20 text-xs sm:text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-green-500">Task Manager</h1>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => router.push("/tasks/schedule")}
            className="bg-green-600 hover:bg-green-700 text-black text-xs sm:text-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Task
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-green-400" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] sm:w-[180px] bg-black border-green-500/20 text-green-400 text-xs sm:text-sm">
              <SelectValue placeholder="Filter tasks" />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500/20">
              <SelectItem value="all" className="text-green-300 text-xs sm:text-sm">All Tasks</SelectItem>
              <SelectItem value="today" className="text-green-300 text-xs sm:text-sm">Today</SelectItem>
              <SelectItem value="week" className="text-green-300 text-xs sm:text-sm">This Week</SelectItem>
              <SelectItem value="unscheduled" className="text-green-300 text-xs sm:text-sm">Unscheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-black/50 border border-green-500/20 w-full">
          <TabsTrigger value="pending" className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400 text-xs sm:text-sm flex-1">
            Pending Tasks
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400 text-xs sm:text-sm flex-1">
            Completed Tasks
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <Card className="border-green-500/20 bg-black/50">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-green-300/60">Loading tasks...</div>
              </CardContent>
            </Card>
          ) : getFilteredTasks(pendingTasks).length === 0 ? (
            <Card className="border-green-500/20 bg-black/50">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-green-300/60">
                  No pending tasks found. Schedule a new task to get started!
                </div>
              </CardContent>
            </Card>
          ) : (
            getFilteredTasks(pendingTasks).map(task => (
              <Card key={task.id} className="border-green-500/20 bg-black/50">
                <CardHeader className="pb-2">
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 xs:gap-0">
                    <CardTitle className="text-green-400 text-base sm:text-lg">{task.title}</CardTitle>
                    <span className="text-xs sm:text-sm text-green-300/60">+{task.xp_reward} XP</span>
                  </div>
                  {task.scheduled_for && (
                    <CardDescription className="flex items-center text-green-300/60 text-xs sm:text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTaskDate(task.scheduled_for)}
                    </CardDescription>
                  )}
                </CardHeader>
                {task.description && (
                  <CardContent className="pb-2">
                    <p className="text-green-300 text-xs sm:text-sm">{task.description}</p>
                  </CardContent>
                )}
                <CardFooter className="flex flex-col xs:flex-row justify-between gap-2 xs:gap-0">
                  <div className="text-xs text-green-300/60 self-start">
                    Type: {task.task_type?.charAt(0).toUpperCase() + task.task_type?.slice(1) || "Custom"}
                  </div>
                  <Button 
                    onClick={() => handleCompleteTask(task.id)}
                    className="bg-green-600 hover:bg-green-700 text-black text-xs sm:text-sm w-full xs:w-auto"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {isLoading ? (
            <Card className="border-green-500/20 bg-black/50">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-green-300/60">Loading tasks...</div>
              </CardContent>
            </Card>
          ) : getFilteredTasks(completedTasks).length === 0 ? (
            <Card className="border-green-500/20 bg-black/50">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-green-300/60">
                  No completed tasks found. Complete some tasks to see them here!
                </div>
              </CardContent>
            </Card>
          ) : (
            getFilteredTasks(completedTasks).map(task => (
              <Card key={task.id} className="border-green-500/20 bg-black/50 opacity-80">
                <CardHeader className="pb-2">
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 xs:gap-0">
                    <CardTitle className="text-green-400 line-through text-base sm:text-lg">{task.title}</CardTitle>
                    <span className="text-xs sm:text-sm text-green-300/60">+{task.xp_reward} XP</span>
                  </div>
                  {task.completed_at && (
                    <CardDescription className="flex items-center text-green-300/60 text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed on {format(new Date(task.completed_at), "MMM d, yyyy 'at' h:mm a")}
                    </CardDescription>
                  )}
                </CardHeader>
                {task.description && (
                  <CardContent className="pb-2">
                    <p className="text-green-300 text-xs sm:text-sm">{task.description}</p>
                  </CardContent>
                )}
                <CardFooter>
                  <div className="text-xs text-green-300/60">
                    Type: {task.task_type?.charAt(0).toUpperCase() + task.task_type?.slice(1) || "Custom"}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
