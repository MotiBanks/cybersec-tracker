"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Award, Calendar, CheckCircle, Clock, Code, FileText, LineChart, List, Smile } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import { UserService } from "@/services/user-service-new"
import { TasksService } from "@/services/tasks-service"
import { MoodService } from "@/services/mood-service"
import { ReflectionsService } from "@/services/reflections-service"
import type { UserProfile } from "@/services/user-service-new"

// Define Task type directly since it's not exported from database.types
type Task = {
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

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [todayXp, setTodayXp] = useState(0)
  const [xpProgress, setXpProgress] = useState(0)
  const [nextLevelXp, setNextLevelXp] = useState(100)
  
  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        
        // Load user profile
        const profile = await UserService.getUserProfile(currentUser.id)
        if (profile) {
          setUser(profile)
          
          // Calculate XP progress
          const currentLevel = profile.level || 1
          const currentXp = profile.xp || 0
          const xpForNextLevel = currentLevel * 100
          setNextLevelXp(xpForNextLevel)
          setXpProgress(Math.min(100, (currentXp / xpForNextLevel) * 100))
        }
        
        // Load today's tasks
        const today = format(new Date(), "yyyy-MM-dd")
        const tasksService = new TasksService()
        const todaysTasks = await tasksService.getTasksForDate(currentUser.id, today)
        
        // Split tasks into completed and pending
        const completed = todaysTasks.filter(task => task.completed)
        const pending = todaysTasks.filter(task => !task.completed)
        
        setTasks(pending)
        setCompletedTasks(completed)
        
        // Calculate today's XP
        const xpHistory = await UserService.getUserXpHistory(currentUser.id, 10)
        const todayXpTotal = xpHistory
          .filter(entry => format(new Date(entry.earned_at), "yyyy-MM-dd") === today)
          .reduce((sum, entry) => sum + (entry.xp_amount || 0), 0)
        
        setTodayXp(todayXpTotal)
        
        // Set up realtime subscriptions
        const unsubscribeTasks = tasksService.subscribeToTasks(currentUser.id, (payload) => {
          // Refresh tasks when there's a change
          tasksService.getTasksForDate(currentUser.id, today).then(updatedTasks => {
            setTasks(updatedTasks.filter(task => !task.completed))
            setCompletedTasks(updatedTasks.filter(task => task.completed))
          })
        })
        
        const unsubscribeProfile = UserService.subscribeToUserProfile(currentUser.id, (payload) => {
          // Refresh user profile when there's a change
          UserService.getUserProfile(currentUser.id).then(updatedProfile => {
            if (updatedProfile) {
              setUser(updatedProfile)
              
              // Update XP progress
              const currentLevel = updatedProfile.level || 1
              const currentXp = updatedProfile.xp || 0
              const xpForNextLevel = currentLevel * 100
              setNextLevelXp(xpForNextLevel)
              setXpProgress(Math.min(100, (currentXp / xpForNextLevel) * 100))
            }
          })
        })
        
        setIsLoading(false)
        
        // Cleanup subscriptions when component unmounts
        return () => {
          unsubscribeTasks()
          unsubscribeProfile()
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setIsLoading(false)
      }
    }
    
    loadUserData()
  }, [router])
  
  // Handle task completion
  async function handleCompleteTask(taskId: string) {
    try {
      if (!user) return
      
      // Mark task as completed
      await TasksService.completeTask(taskId)
      
      // Update user XP
      await UserService.updateUserStreak(user.id)
      
      // Show toast or notification
      // toast.success("Task completed! XP earned.")
    } catch (error) {
      console.error("Error completing task:", error)
      // toast.error("Failed to complete task")
    }
  }
  
  // Handle recording mood
  async function handleRecordMood(moodType: string) {
    try {
      if (!user) return
      
      const moodService = new MoodService()
      await moodService.recordMood(user?.id || "", moodType)
      
      // Update user streak
      if (user) {
        await UserService.updateUserStreak(user.id)
        
        // Show toast or notification
        // toast.success("Mood recorded! Streak maintained.")
      }
    } catch (error) {
      console.error("Error recording mood:", error)
      // toast.error("Failed to record mood")
    }
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header with user info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-green-500">Welcome back, {user?.username || user?.email?.split('@')[0] || 'Learner'}</h1>
          <p className="text-green-300/60">
            {format(new Date(), "EEEE, MMMM do, yyyy")} · Level {user?.level || 1} · {user?.streak_count || 0} day streak
          </p>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-400">Today's XP</CardTitle>
            <LineChart className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">+{todayXp} XP</div>
            <p className="text-xs text-green-300/60">
              {user?.xp || 0} total XP · {nextLevelXp - (user?.xp || 0)} XP to next level
            </p>
            <Progress value={xpProgress} className="mt-2 bg-green-900/20" />
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-400">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{user?.streak_count || 0} days</div>
            <p className="text-xs text-green-300/60">
              {user?.streak_count || 0} days current streak
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-400">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{completedTasks.length}</div>
            <p className="text-xs text-green-300/60">
              {tasks.length} tasks remaining today
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-400">Time Studied</CardTitle>
            <Clock className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">
              {completedTasks.reduce((sum, task) => sum + (task.duration_minutes || 0), 0)} mins
            </div>
            <p className="text-xs text-green-300/60">
              Today's learning time
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main content */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="bg-black/50 border border-green-500/20">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400">Today's Tasks</TabsTrigger>
          <TabsTrigger value="mood" className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400">Daily Mood</TabsTrigger>
          <TabsTrigger value="languages" className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400">Languages</TabsTrigger>
          <TabsTrigger value="reflection" className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400">Reflection</TabsTrigger>
        </TabsList>
        
        {/* Tasks tab */}
        <TabsContent value="tasks">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-green-400">Pending Tasks</CardTitle>
                <CardDescription>
                  Tasks scheduled for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-4 text-green-300/60">
                    No pending tasks for today
                    <Button 
                      className="mt-4 w-full bg-green-600 hover:bg-green-700 text-black" 
                      onClick={() => router.push("/tasks/schedule")}
                    >
                      Schedule a Task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border border-green-500/10 bg-black/30 rounded-md">
                        <div>
                          <div className="font-medium text-green-300">{task.title}</div>
                          <div className="text-sm text-green-300/60">
                            {task.scheduled_for && format(new Date(task.scheduled_for), "h:mm a")}
                            {task.duration_minutes && (
                              <span className="ml-2">· {task.duration_minutes} mins</span>
                            )}
                            <span className="ml-2">· {task.xp_reward} XP</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteTask(task.id)}
                          className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-green-500/20 bg-black hover:bg-green-900/20 text-green-400" onClick={() => router.push("/tasks")}>
                  View All Tasks
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-green-400">Completed Tasks</CardTitle>
                <CardDescription>
                  Tasks you've finished today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedTasks.length === 0 ? (
                  <div className="text-center py-4 text-green-300/60">No completed tasks yet</div>
                ) : (
                  <div className="space-y-4">
                    {completedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border border-green-500/30 bg-green-900/20 rounded-md">
                        <div>
                          <div className="font-medium text-green-300 line-through">{task.title}</div>
                          <div className="text-sm text-green-300/60">
                            Completed at {task.completed_at && format(new Date(task.completed_at), "h:mm a")}
                          </div>
                        </div>
                        <div className="text-sm text-green-500">+{task.xp_reward} XP</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-green-500/20 bg-black hover:bg-green-900/20 text-green-400" onClick={() => router.push("/tasks/schedule")}>
                  Schedule New Task
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Mood tab */}
        <TabsContent value="mood">
          <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="text-green-400">Daily Mood</CardTitle>
              <CardDescription>
                How are you feeling today?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 border-green-500/20 bg-black/70 hover:bg-green-900/20 text-green-400 hover:text-green-300 hover:border-green-500/40 transition-all duration-300"
                  onClick={() => handleRecordMood("happy")}
                >
                  <div className="text-3xl mb-2">😊</div>
                  <div className="text-green-300">Happy</div>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 border-green-500/20 bg-black/70 hover:bg-green-900/20 text-green-400 hover:text-green-300 hover:border-green-500/40 transition-all duration-300"
                  onClick={() => handleRecordMood("productive")}
                >
                  <div className="text-3xl mb-2">💪</div>
                  <div className="text-green-300">Productive</div>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 border-green-500/20 bg-black/70 hover:bg-green-900/20 text-green-400 hover:text-green-300 hover:border-green-500/40 transition-all duration-300"
                  onClick={() => handleRecordMood("tired")}
                >
                  <div className="text-3xl mb-2">😴</div>
                  <div className="text-green-300">Tired</div>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 border-green-500/20 bg-black/70 hover:bg-green-900/20 text-green-400 hover:text-green-300 hover:border-green-500/40 transition-all duration-300"
                  onClick={() => handleRecordMood("frustrated")}
                >
                  <div className="text-3xl mb-2">😤</div>
                  <div className="text-green-300">Frustrated</div>
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <p className="text-sm text-green-300/60">
                Recording your mood helps track your learning journey and maintain your streak.
              </p>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent"></div>
              <div className="text-sm text-green-300/60">
                <span className="text-green-400 font-medium">Tip:</span> Your mood affects your learning efficiency. Take breaks when needed and celebrate your progress!
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Languages tab */}
        <TabsContent value="languages">
          <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-400">Programming Languages</CardTitle>
              <CardDescription>
                Track your progress in different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-green-300">Python</div>
                    <div className="text-sm text-green-300/60">Intermediate · 120 XP</div>
                  </div>
                  <Progress value={60} className="bg-green-900/20" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-green-300">JavaScript</div>
                    <div className="text-sm text-green-300/60">Beginner · 80 XP</div>
                  </div>
                  <Progress value={40} className="bg-green-900/20" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-green-300">Bash</div>
                    <div className="text-sm text-green-300/60">Beginner · 50 XP</div>
                  </div>
                  <Progress value={25} className="bg-green-900/20" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/languages/add")} className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400">
                <Code className="mr-2 h-4 w-4" />
                Add Language
              </Button>
              <Button onClick={() => router.push("/languages")} className="bg-green-600 hover:bg-green-700 text-black">
                View All Languages
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Reflection tab */}
        <TabsContent value="reflection">
          <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-400">Daily Reflection</CardTitle>
              <CardDescription>
                What did you learn today? What challenges did you face?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-green-500/20 bg-black/30 rounded-md">
                <textarea 
                  className="w-full h-32 bg-black border-green-500/20 text-green-300 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500/50" 
                  placeholder="Today I learned..."
                />
                <div className="flex justify-between items-center mt-2 text-sm text-green-300/60">
                  <div>0 characters</div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-green-400 h-8 px-2"
                    onClick={() => router.push("/reflect")}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Save Reflection
                  </Button>
                </div>
                <div className="mt-3 text-green-300/60 text-sm">
                  <span className="text-green-400 font-medium">Tip:</span> Regular reflection helps reinforce learning and identify areas for improvement.
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400"
                onClick={() => router.push("/reflect")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Write Reflection
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-black"
                onClick={() => router.push("/badges")}
              >
                <Award className="mr-2 h-4 w-4" />
                View Badges
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
