"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Award, ArrowRight, Calendar, CheckCircle, Clock, Code, FileText, LineChart, List, LogOut, Plus, Save, Smile, Star, Trophy, XCircle } from "lucide-react"
import MoodSelector from "@/components/mood-selector"

// Client-side only component to handle user greeting
function UserGreeting({ user }: { user: any }) {
  const [handle, setHandle] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  
  useEffect(() => {
    // Only run on client side
    const storedHandle = localStorage.getItem('userHandle')
    setHandle(storedHandle)
    
    // Get the current user's email
    const getEmail = async () => {
      const supabase = getBrowserClient()
      const { data } = await supabase.auth.getUser()
      setEmail(data?.user?.email || null)
    }
    
    getEmail()
  }, [])
  
  // Special case for the specific user with crazy bookworm email
  if (email?.includes('crazybookworm')) {
    return (
      <h1 className="text-3xl font-bold tracking-tight text-green-500">
        Welcome back, Trinity
      </h1>
    )
  }
  
  return (
    <h1 className="text-3xl font-bold tracking-tight text-green-500">
      Welcome back, {user?.username || handle || user?.email?.split('@')[0] || 'Learner'}
    </h1>
  )
}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import { TasksService } from "@/services/tasks-service"
import { UserService } from "@/services/user-service"
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

interface User {
  id: string;
  username?: string;
  email?: string;
  level?: number;
  xp?: number;
  streak_count?: number;
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
  const [isMobile, setIsMobile] = useState(false)
  const [reflectionText, setReflectionText] = useState("")
  const [reflectionError, setReflectionError] = useState<string | null>(null)
  const [reflectionSuccess, setReflectionSuccess] = useState<string | null>(null)
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false)
  
  // Function to save reflection
  const saveReflection = async () => {
    if (!user?.id) {
      setReflectionError("User not authenticated. Please log in again.")
      return
    }
    
    if (!reflectionText.trim()) {
      setReflectionError("Reflection content cannot be empty")
      return
    }
    
    setIsSubmittingReflection(true)
    setReflectionError(null)
    
    try {
      // Import the ReflectionsService
      const { ReflectionsService } = await import("@/services/reflections-service")
      
      // Create new reflection
      await ReflectionsService.createReflection({
        user_id: user.id,
        content: reflectionText.trim(),
        tags: [] // Provide empty tags array to match schema
      })
      
      // Show success message
      setReflectionSuccess("Reflection saved successfully!")
      setReflectionText("") // Clear the text area
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setReflectionSuccess(null)
      }, 3000)
    } catch (err: any) {
      console.error("Error saving reflection:", err)
      setReflectionError(`Failed to save reflection: ${err?.message || 'Unknown error'}. Please try again.`)
    } finally {
      setIsSubmittingReflection(false)
    }
  }
  
  // Check if the screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = getBrowserClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
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
        const todaysTasks = await TasksService.getTasksForDate(currentUser.id, today)
        
        // Split tasks into completed and pending
        const completed = todaysTasks.filter((task: Task) => task.completed)
        const pending = todaysTasks.filter((task: Task) => !task.completed)
        
        setTasks(pending)
        setCompletedTasks(completed)
        
        // Calculate today's XP
        const xpHistory = await UserService.getUserXpHistory(currentUser.id, 10)
        const todayXpTotal = xpHistory
          .filter(entry => format(new Date(entry.earned_at), "yyyy-MM-dd") === today)
          .reduce((sum, entry) => sum + (entry.xp_amount || 0), 0)
        
        setTodayXp(todayXpTotal)
        
        // Set up realtime subscriptions
        const unsubscribeTasks = TasksService.subscribeToTasks(currentUser.id, (payload: any) => {
          // Refresh tasks when there's a change
          TasksService.getTasksForDate(currentUser.id, today).then((updatedTasks: Task[]) => {
            setTasks(updatedTasks.filter((task: Task) => !task.completed))
            setCompletedTasks(updatedTasks.filter((task: Task) => task.completed))
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
      await TasksService.completeTask(taskId, user.id)
      
      // Update user XP and streak
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
      
      await MoodService.recordMood(user.id, moodType)
      
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
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      {/* Header with user info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <UserGreeting user={user} />
          <p className="text-green-300/60 text-sm sm:text-base">
            {format(new Date(), "EEEE, MMMM do, yyyy")} • Level {user?.level || 1} • {user?.streak_count || 0} day streak
          </p>
        </div>
        {/* Top action buttons removed as requested */}
      </div>
      
      {/* Getting Started - shown only for new users with no tasks or languages */}
      {tasks.length === 0 && completedTasks.length === 0 && (
        <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
          <CardHeader>
            <CardTitle className="text-green-400">Getting Started</CardTitle>
            <CardDescription>
              Welcome to your Cybersecurity Learning Tracker! Here's how to get started:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border border-green-500/10 bg-black/30 rounded-md">
                <div className="bg-green-900/30 text-green-400 p-2 rounded-full">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-green-300">1. Schedule Your First Task</h3>
                  <p className="text-sm text-green-300/60">Create tasks to track your learning activities and earn XP</p>
                  <Button 
                    className="mt-2 bg-green-600 hover:bg-green-700 text-black" 
                    onClick={() => router.push("/tasks/schedule")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Task
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border border-green-500/10 bg-black/30 rounded-md">
                <div className="bg-green-900/30 text-green-400 p-2 rounded-full">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-green-300">2. Add Programming Languages</h3>
                  <p className="text-sm text-green-300/60">Track your progress in different programming languages</p>
                  <Button 
                    className="mt-2 bg-black border-green-500/20 hover:bg-green-900/20 text-green-400" 
                    onClick={() => router.push("/languages/add")}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Add Language
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border border-green-500/10 bg-black/30 rounded-md">
                <div className="bg-green-900/30 text-green-400 p-2 rounded-full">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-green-300">3. Record Daily Reflections</h3>
                  <p className="text-sm text-green-300/60">Write about what you've learned to reinforce knowledge</p>
                  <Button 
                    className="mt-2 bg-black border-green-500/20 hover:bg-green-900/20 text-green-400" 
                    onClick={() => router.push("/reflect")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Write Reflection
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Stats overview */}
      <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
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
        <TabsList className="bg-black/50 border border-green-500/20 w-full overflow-x-auto flex-nowrap scrollbar-hide">
          <TabsTrigger 
            value="tasks" 
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400 text-xs sm:text-sm flex-1 min-w-[80px]"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="mood" 
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400 text-xs sm:text-sm flex-1 min-w-[80px]"
          >
            Mood
          </TabsTrigger>
          <TabsTrigger 
            value="languages" 
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400 text-xs sm:text-sm flex-1 min-w-[80px]"
          >
            Languages
          </TabsTrigger>
          <TabsTrigger 
            value="reflection" 
            className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400 text-xs sm:text-sm flex-1 min-w-[80px]"
          >
            Reflect
          </TabsTrigger>
        </TabsList>
        
        {/* Tasks tab */}
        <TabsContent value="tasks">
          <div className="space-y-4">
            {/* Quick Add Task Button */}
            <div className="flex justify-end">
              <Button 
                onClick={() => router.push("/tasks/schedule")} 
                className="bg-green-600 hover:bg-green-700 text-black text-xs sm:text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Schedule New Task
              </Button>
            </div>
            
            {/* Task Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
              <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-green-400">Pending Tasks</CardTitle>
                    <CardDescription>
                      Tasks scheduled for today
                    </CardDescription>
                  </div>
                  <div className="bg-green-900/30 text-green-400 p-2 rounded-full">
                    <Calendar className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="inline-flex p-4 rounded-full bg-green-900/20 text-green-400">
                        <Calendar className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-medium text-green-300">No Tasks Scheduled</h3>
                      <p className="text-green-300/60 max-w-md mx-auto">
                        Schedule tasks to track your learning progress and earn XP as you complete them.
                      </p>
                      <Button 
                        className="mt-2 bg-green-600 hover:bg-green-700 text-black" 
                        onClick={() => router.push("/tasks/schedule")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Your First Task
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <div key={task.id} className="mb-4 p-3 sm:p-4 border border-green-500/30 bg-green-900/10 rounded-md">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <h3 className="font-medium text-green-300 text-sm sm:text-base">{task.title}</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-400 h-8 px-2 self-end sm:self-auto" 
                              onClick={() => handleCompleteTask(task.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          </div>
                          {task.description && (
                            <p className="text-xs sm:text-sm text-green-300/60 mb-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center text-xs text-green-300/60 gap-y-1">
                            <div className="flex items-center mr-4">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.scheduled_for ? format(new Date(task.scheduled_for), "h:mm a") : "Anytime"}
                            </div>
                            <div className="flex items-center mr-4">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.duration_minutes} mins
                            </div>
                            <div className="flex items-center">
                              <Award className="h-3 w-3 mr-1" />
                              {task.xp_reward} XP
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t border-green-500/20 pt-4">
                  <div className="text-sm text-green-300/60">
                    <span className="text-green-400 font-medium">Tip:</span> Complete tasks to earn XP and maintain your streak
                  </div>
                </CardFooter>
              </Card>

              <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-green-400">Completed Tasks</CardTitle>
                    <CardDescription>
                      Tasks you've finished today
                    </CardDescription>
                  </div>
                  <div className="bg-green-900/30 text-green-400 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {completedTasks.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <div className="inline-flex p-4 rounded-full bg-green-900/20 text-green-400/50">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-medium text-green-300">No Completed Tasks</h3>
                      <p className="text-green-300/60 max-w-md mx-auto">
                        Complete tasks to see them appear here and earn XP rewards.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border border-green-500/30 bg-green-900/20 rounded-md">
                          <div>
                            <div className="font-medium text-green-300 line-through">{task.title}</div>
                            <div className="text-sm text-green-300/60 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-400" />
                              Completed at {task.completed_at && format(new Date(task.completed_at), "h:mm a")}
                            </div>
                          </div>
                          <div className="text-sm bg-green-900/40 text-green-400 px-2 py-1 rounded-md font-medium">+{task.xp_reward} XP</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t border-green-500/20 pt-4">
                  <Button variant="outline" className="w-full border-green-500/20 bg-black hover:bg-green-900/20 text-green-400" onClick={() => router.push("/tasks")}>
                    <List className="mr-2 h-4 w-4" />
                    View Task History
                  </Button>
                </CardFooter>
              </Card>
            </div>
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
              {/* Use our enhanced MoodSelector component */}
              <MoodSelector onMoodSelect={handleRecordMood} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Languages tab */}
        <TabsContent value="languages">
          <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-green-400 text-base sm:text-lg">Programming Languages</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Track your progress in different programming languages
                </CardDescription>
              </div>
              <Button 
                onClick={() => router.push("/languages/add")} 
                className="bg-green-600 hover:bg-green-700 text-black text-xs sm:text-sm self-end sm:self-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Language
              </Button>
            </CardHeader>
            <CardContent>
              {/* If no languages, show prompt to add languages */}
              {(true) ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1">
                      <div className="font-medium text-green-300 text-sm sm:text-base">Python</div>
                      <div className="text-xs text-green-300/60">Intermediate · 120 XP</div>
                    </div>
                    <Progress value={60} className="bg-green-900/20" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1">
                      <div className="font-medium text-green-300 text-sm sm:text-base">JavaScript</div>
                      <div className="text-xs text-green-300/60">Beginner · 80 XP</div>
                    </div>
                    <Progress value={40} className="bg-green-900/20" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1">
                      <div className="font-medium text-green-300 text-sm sm:text-base">Bash</div>
                      <div className="text-xs text-green-300/60">Beginner · 50 XP</div>
                    </div>
                    <Progress value={25} className="bg-green-900/20" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-green-900/20 text-green-400">
                    <Code className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-medium text-green-300">No Languages Added Yet</h3>
                  <p className="text-green-300/60 max-w-md mx-auto">
                    Add programming languages you're learning to track your progress and earn XP as you improve your skills.
                  </p>
                  <Button 
                    onClick={() => router.push("/languages/add")} 
                    className="mt-2 bg-green-600 hover:bg-green-700 text-black"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Language
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col xs:flex-row justify-between items-start xs:items-center border-t border-green-500/20 pt-4 gap-3">
              <div className="text-xs sm:text-sm text-green-300/60">
                <span className="text-green-400 font-medium">Tip:</span> Track multiple languages to diversify your cybersecurity skills
              </div>
              <Button onClick={() => router.push("/languages")} className="bg-black border-green-500/20 hover:bg-green-900/20 text-green-400 text-xs sm:text-sm self-end xs:self-auto">
                <Code className="mr-2 h-4 w-4" />
                View All Languages
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Reflection tab */}
        <TabsContent value="reflection">
          <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-400 text-base sm:text-lg">Daily Reflection</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                What did you learn today? What challenges did you face?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 space-y-3">
                {reflectionError && (
                  <div className="p-3 rounded-md bg-red-900/20 border border-red-500/30 text-red-300 text-xs sm:text-sm">
                    {reflectionError}
                  </div>
                )}
                
                {reflectionSuccess && (
                  <div className="p-3 rounded-md bg-green-900/20 border border-green-500/30 text-green-300 text-xs sm:text-sm">
                    {reflectionSuccess}
                  </div>
                )}
                
                <textarea 
                  className="w-full h-28 sm:h-32 bg-black border-green-500/20 text-green-300 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500/50 text-sm sm:text-base" 
                  placeholder="Today I learned..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                />
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mt-2 text-xs sm:text-sm text-green-300/60 gap-2">
                  <div>{reflectionText.length} characters</div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-green-400 h-8 px-2 text-xs sm:text-sm self-end xs:self-auto"
                    onClick={saveReflection}
                    disabled={isSubmittingReflection || !reflectionText.trim()}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSubmittingReflection ? "Saving..." : "Save Reflection"}
                  </Button>
                </div>
                <div className="mt-3 text-green-300/60 text-xs sm:text-sm">
                  <span className="text-green-400 font-medium">Tip:</span> Regular reflection helps reinforce learning and identify areas for improvement.
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col xs:flex-row justify-between gap-2 xs:gap-4">
              <Button 
                variant="outline" 
                className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400 text-xs sm:text-sm w-full xs:w-auto order-2 xs:order-1"
                onClick={() => router.push("/reflect")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Write Reflection
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-black text-xs sm:text-sm w-full xs:w-auto order-1 xs:order-2"
                onClick={() => router.push("/badges")}
              >
                <Award className="mr-2 h-4 w-4" />
                View Badges
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Logout button at the bottom */}
      <div className="mt-8 mb-16 sm:mb-4 flex justify-center">
        <button 
          onClick={async () => {
            const supabase = getBrowserClient();
            await supabase.auth.signOut();
            router.push('/login');
          }} 
          className="w-full max-w-md py-3 flex items-center justify-center space-x-2 border border-green-500/30 bg-black/70 text-green-400 hover:bg-green-900/20 rounded-md transition-all duration-200 group backdrop-blur-sm overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
          <LogOut className="h-5 w-5 mr-2 group-hover:animate-pulse" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
