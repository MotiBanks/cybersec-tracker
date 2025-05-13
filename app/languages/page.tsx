"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Plus, Code } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Language = Database["public"]["Tables"]["languages"]["Row"] & {
  progress?: number
  level?: string
  xp?: number
  last_practiced?: string
}

export default function LanguagesPage() {
  const router = useRouter()
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadLanguages() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      
      setIsLoading(true)
      
      try {
        const supabase = getBrowserClient()
        
        // Get all languages
        const { data: allLanguages, error: languagesError } = await supabase
          .from("languages")
          .select("*")
          .order("name")
        
        if (languagesError) throw languagesError
        
        // Get user's language progress
        const { data: userProgress, error: progressError } = await supabase
          .from("user_languages")
          .select("*")
          .eq("user_id", currentUser.id)
        
        if (progressError) throw progressError
        
        // Combine the data
        const languagesWithProgress = allLanguages.map(language => {
          const progress = userProgress?.find(p => p.language_id === language.id)
          
          return {
            ...language,
            progress: progress?.progress_percentage || 0,
            level: progress?.level || "Beginner",
            xp: progress?.xp || 0,
            last_practiced: progress?.last_practiced || null
          }
        })
        
        // Sort by progress (descending)
        languagesWithProgress.sort((a, b) => (b.progress || 0) - (a.progress || 0))
        
        setLanguages(languagesWithProgress)
      } catch (error) {
        console.error("Error loading languages:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadLanguages()
  }, [router])

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "text-blue-400"
      case "intermediate":
        return "text-green-400"
      case "advanced":
        return "text-purple-400"
      case "expert":
        return "text-yellow-400"
      default:
        return "text-green-300"
    }
  }

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Never"
    
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="text-green-500 border-green-500/20 text-xs sm:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-green-500">Languages</h1>
          </div>
          <Button 
            onClick={() => router.push("/languages/add")} 
            className="bg-green-600 hover:bg-green-700 text-black text-xs sm:text-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Language
          </Button>
        </div>
        
        <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
          <CardContent className="py-4 px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-green-900/30 text-green-400 p-2 rounded-full">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-green-300 font-medium">Track Your Programming Skills</h3>
                  <p className="text-green-300/60 text-sm">Add languages you're learning and monitor your progress</p>
                </div>
              </div>
              <Button 
                onClick={() => router.push("/languages/add")} 
                className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-black text-xs sm:text-sm hidden md:flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Language
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card className="border-green-500/20 bg-black/50">
            <CardContent className="pt-6">
              <div className="text-center py-8 text-green-300/60">Loading languages...</div>
            </CardContent>
          </Card>
        ) : languages.length === 0 ? (
          <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
            <CardContent className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="bg-green-900/30 text-green-400 p-4 sm:p-6 rounded-full">
                <Code className="h-8 w-8 sm:h-12 sm:w-12" />
              </div>
              <div className="text-center space-y-2 px-4">
                <h3 className="text-lg sm:text-xl font-medium text-green-300">No Languages Added Yet</h3>
                <p className="text-green-300/60 max-w-md text-sm sm:text-base">
                  Track your progress in different programming languages to enhance your cybersecurity skills.
                </p>
              </div>
              <Button 
                onClick={() => router.push("/languages/add")} 
                className="mt-4 bg-green-600 hover:bg-green-700 text-black px-4 sm:px-8 py-3 sm:py-6 h-auto text-sm sm:text-lg w-full sm:w-auto mx-4 sm:mx-0"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Add Your First Language
              </Button>
            </CardContent>
          </Card>
        ) : (
          languages.map(language => (
            <Card key={language.id} className="border-green-500/20 bg-black/50">
              <CardHeader className="pb-2">
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{language.icon || "💻"}</span>
                    <CardTitle className="text-green-400 text-base sm:text-lg">{language.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 self-end xs:self-auto">
                    <span className={`text-xs sm:text-sm font-medium ${getLevelColor(language.level || "Beginner")}`}>
                      {language.level || "Beginner"}
                    </span>
                    <span className="text-xs sm:text-sm text-green-300/60">· {language.xp || 0} XP</span>
                  </div>
                </div>
                <CardDescription className="flex flex-col xs:flex-row justify-between items-start xs:items-center mt-1 gap-1 xs:gap-0">
                  <span className="text-green-300/60 text-xs sm:text-sm">
                    Last practiced: {getTimeAgo(language.last_practiced || null)}
                  </span>
                  <span className="text-green-300/60 text-xs sm:text-sm">{language.progress || 0}%</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <Progress value={language.progress || 0} className="h-2" />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={() => router.push(`/languages/${language.id}`)}
                  variant="outline"
                  className="border-green-500/20 text-green-400 text-xs sm:text-sm w-full xs:w-auto"
                >
                  <Code className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      <Card className="border-green-500/20 bg-black/50">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg sm:text-xl">Weekly Report</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Track your language learning progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-green-300/60 text-sm sm:text-base">
            No data available for this week
          </div>
          <p className="text-xs sm:text-sm text-green-300/60 mt-4">
            Export your weekly progress report to track your cybersecurity learning journey over time.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col xs:flex-row justify-between gap-2 xs:gap-0">
          <Button variant="outline" className="border-green-500/20 text-green-400 text-xs sm:text-sm w-full xs:w-auto">
            Previous Week
          </Button>
          <Button variant="outline" className="border-green-500/20 text-green-400 text-xs sm:text-sm w-full xs:w-auto">
            Current Week
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
