"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import { ReflectionsService } from "@/services/reflections-service"

export default function ReflectionHistoryPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [reflections, setReflections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      
      setUserId(currentUser.id)
      loadReflections(currentUser.id)
    }
    
    loadUser()
  }, [router])

  const loadReflections = async (uid: string) => {
    try {
      setIsLoading(true)
      const userReflections = await ReflectionsService.getUserReflections(uid)
      setReflections(userReflections)
    } catch (err) {
      console.error("Error loading reflections:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a")
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} className="text-green-500 border-green-500/20">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-green-500">Reflection History</h1>
      </div>
      
      <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-500" />
            <CardTitle className="text-green-400">Your Learning Journey</CardTitle>
          </div>
          <CardDescription>
            Review your past reflections to see how far you've come
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-900/20">
                <div className="h-4 w-4 border-2 border-green-500 border-t-transparent animate-spin rounded-full"></div>
              </div>
              <p className="mt-2 text-green-300/60">Loading your reflections...</p>
            </div>
          ) : reflections.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="inline-flex p-4 rounded-full bg-green-900/20 text-green-400/50">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-green-300">No Reflections Yet</h3>
              <p className="text-green-300/60 max-w-md mx-auto">
                Start recording your daily learning experiences to build your reflection history.
              </p>
              <Button 
                onClick={() => router.push("/reflect")} 
                className="mt-4 bg-green-600 hover:bg-green-700 text-black"
              >
                <FileText className="h-4 w-4 mr-2" />
                Write Your First Reflection
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reflections.map((reflection) => (
                <div key={reflection.id} className="p-4 border border-green-500/30 bg-green-900/10 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-green-300">
                      {formatDate(reflection.created_at)}
                    </h3>
                  </div>
                  <p className="text-green-300/80 whitespace-pre-wrap">{reflection.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400"
            onClick={() => router.push("/reflect")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Write New Reflection
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
