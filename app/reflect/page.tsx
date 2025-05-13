"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, Save, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import { ReflectionsService } from "@/services/reflections-service"

export default function ReflectionPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [charCount, setCharCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [todaysReflection, setTodaysReflection] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      
      setUserId(currentUser.id)
      checkTodaysReflection(currentUser.id)
    }
    
    loadUser()
  }, [router])

  const checkTodaysReflection = async (uid: string) => {
    try {
      const today = format(new Date(), "yyyy-MM-dd")
      const supabase = getBrowserClient()
      
      const { data, error } = await supabase
        .from("reflections")
        .select("*")
        .eq("user_id", uid)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`)
        .order("created_at", { ascending: false })
        .limit(1)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setTodaysReflection(data[0])
        setContent(data[0].content)
        setCharCount(data[0].content.length)
      }
    } catch (err) {
      console.error("Error checking today's reflection:", err)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setCharCount(newContent.length)
    console.log("Content updated, new length:", newContent.length)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) {
      setError("User not authenticated. Please log in again.")
      return
    }
    
    if (!content.trim()) {
      setError("Reflection content cannot be empty")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (todaysReflection) {
        // Update existing reflection
        await ReflectionsService.updateReflection(todaysReflection.id, userId, {
          content: content.trim()
        })
        setSuccess("Reflection updated successfully!")
      } else {
        // Create new reflection directly using the ReflectionsService
        await ReflectionsService.createReflection({
          user_id: userId,
          content: content.trim(),
          tags: [] // Provide empty tags array to match schema
        })
        setSuccess("Reflection saved successfully!")
      }
      
      // Clear any previous errors
      setError(null)
      
      // Wait a moment to show success before redirecting
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (err: any) {
      console.error("Error saving reflection:", err)
      setError(`Failed to save reflection: ${err?.message || 'Unknown error'}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()} className="text-green-500 border-green-500/20 text-xs sm:text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-green-500">Daily Reflection</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push("/reflect/history")} 
          className="text-green-500 border-green-500/20 text-xs sm:text-sm self-end sm:self-auto"
        >
          <Calendar className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>
      
      <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-green-500" />
            <CardTitle className="text-green-400 text-base sm:text-lg">What did you learn today? What challenges did you face?</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Regular reflection helps reinforce learning and identify areas for improvement
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-900/20 border border-red-500/30 text-red-300">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 rounded-md bg-green-900/20 border border-green-500/30 text-green-300">
                {success}
              </div>
            )}
            
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Today I learned..."
              className="bg-black border-green-500/20 text-green-300 min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base"
            />
            
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center text-sm text-green-300/60 gap-2">
              <div>{charCount} characters</div>
              <div className="flex items-center self-end xs:self-auto">
                <Save className="h-4 w-4 mr-1 text-green-500" />
                <Button 
                  type="submit" 
                  variant="ghost" 
                  size="sm"
                  disabled={isSubmitting}
                  className="text-green-400 h-8 px-2 text-xs sm:text-sm"
                >
                  Save Reflection
                </Button>
              </div>
            </div>
            
            <div className="p-3 border border-green-500/20 bg-black/30 rounded-md">
              <p className="text-green-300/60 text-xs sm:text-sm">
                <span className="text-green-400 font-medium">Tip:</span> Regular reflection helps reinforce learning and identify areas for improvement.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="bg-green-600 hover:bg-green-700 text-black text-xs sm:text-sm w-full sm:w-auto px-3 py-2 h-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : todaysReflection ? "Update Reflection" : "Save Reflection"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
