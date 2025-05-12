"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Save, Code as CodeIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBrowserClient, getCurrentUser } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Language = Database["public"]["Tables"]["languages"]["Row"]

const COMMON_LANGUAGES = [
  { name: "Python", icon: "🐍" },
  { name: "JavaScript", icon: "🟨" },
  { name: "Bash", icon: "🐚" },
  { name: "SQL", icon: "🗃️" },
  { name: "C", icon: "©️" },
  { name: "C++", icon: "➕" },
  { name: "Go", icon: "🔵" },
  { name: "Rust", icon: "🦀" },
  { name: "Java", icon: "☕" },
  { name: "PowerShell", icon: "💙" },
  { name: "HTML/CSS", icon: "🌐" },
  { name: "PHP", icon: "🐘" },
  { name: "Ruby", icon: "💎" },
  { name: "Swift", icon: "🦅" },
  { name: "Kotlin", icon: "🎯" },
  { name: "TypeScript", icon: "📘" },
  { name: "Assembly", icon: "⚙️" },
]

export default function AddLanguagePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [customLanguage, setCustomLanguage] = useState<string>("")
  const [customIcon, setCustomIcon] = useState<string>("")
  const [level, setLevel] = useState<string>("beginner")
  const [xp, setXp] = useState<string>("0")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        
        setUserId(currentUser.id)
        loadAvailableLanguages(currentUser.id)
      } catch (error) {
        console.error("Error loading user:", error)
        // Don't redirect, just show empty state
        setIsLoading(false)
      }
    }
    
    loadUser()
  }, [router])

  const loadAvailableLanguages = async (uid: string) => {
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
        .select("language_id")
        .eq("user_id", uid)
      
      if (progressError) throw progressError
      
      // Filter out languages the user already has
      const userLanguageIds = userProgress?.map(p => p.language_id) || []
      const availableLangs = allLanguages.filter(lang => !userLanguageIds.includes(lang.id))
      
      setAvailableLanguages(availableLangs)
    } catch (error) {
      console.error("Error loading languages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) return
    
    // Validate input
    if (!selectedLanguage && !customLanguage.trim()) {
      setError("Please select or enter a language name")
      return
    }
    
    if (customLanguage.trim() && !customIcon.trim()) {
      setError("Please provide an icon for your custom language")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const supabase = getBrowserClient()
      
      let languageId: string
      
      // If using existing language
      if (selectedLanguage) {
        languageId = selectedLanguage
      } else {
        console.log("Creating new language:", {
          name: customLanguage.trim(),
          icon: customIcon.trim()
        })
        
        // First check if this language already exists
        const { data: existingLang } = await supabase
          .from("languages")
          .select("id")
          .eq("name", customLanguage.trim())
          .maybeSingle()
          
        if (existingLang) {
          console.log("Language already exists, using existing ID:", existingLang.id)
          languageId = existingLang.id
        } else {
          // Create new language
          const { data: newLanguage, error: createError } = await supabase
            .from("languages")
            .insert({
              name: customLanguage.trim(),
              icon: customIcon.trim(),
            })
            .select()
            .single()
          
          if (createError) {
            console.error("Error creating language:", createError)
            throw createError
          }
          
          console.log("Created new language:", newLanguage)
          languageId = newLanguage.id
        }
      }
      
      console.log("Adding user progress for language ID:", languageId)
      
      // Check if user already has this language
      const { data: existingProgress } = await supabase
        .from("user_languages")
        .select("*")
        .eq("user_id", userId)
        .eq("language_id", languageId)
        .maybeSingle()
        
      if (existingProgress) {
        console.log("User already has this language, updating instead")
        // Simplified update with only essential fields
        await supabase
          .from("user_languages")
          .update({
            // Just update the timestamp to show it was updated
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)
          .eq("language_id", languageId)
      } else {
        // Add user's progress for this language - using only essential fields
        const { error: progressError } = await supabase
          .from("user_languages")
          .insert({
            user_id: userId,
            language_id: languageId
            // Only include these fields if you're sure they exist in your table
            // xp: parseInt(xp, 10) || 0,
            // last_practiced: new Date().toISOString()
          })
          
        if (progressError) {
          console.error("Error adding user progress:", progressError)
          throw progressError
        }
      }
      
      router.push("/languages")
    } catch (err) {
      console.error("Error adding language:", err)
      setError("Failed to add language. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} className="text-green-500 border-green-500/20 hover:bg-green-900/20 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-green-500">Add Programming Language</h1>
      </div>
      
      <Card className="border-green-500/20 bg-black/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="inline-flex p-4 rounded-full bg-green-900/20 text-green-400">
                <CodeIcon className="h-8 w-8" />
              </div>
              <CardTitle className="text-green-400">Add Programming Language</CardTitle>
            </div>
            <CardDescription>
              Track your progress in a new programming language to enhance your cybersecurity skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/20 text-red-300 rounded-md">
                {error}
              </div>
            )}
            
            {/* Step 1: Choose a language */}
            <div className="space-y-4 border border-green-500/10 rounded-md p-4 bg-black/30">
              <h3 className="text-lg font-medium text-green-300 flex items-center">
                <span className="bg-green-900/30 text-green-400 p-1 rounded-full mr-2 text-xs">1</span>
                Choose a Language
              </h3>
              
              {isLoading ? (
                <div className="text-center py-4 text-green-300/60">Loading available languages...</div>
              ) : availableLanguages.length > 0 ? (
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium text-green-300">
                    Select Existing Language
                  </label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="bg-black border-green-500/20 text-green-300">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-green-500/20 text-green-300">
                      {availableLanguages.map(lang => (
                        <SelectItem key={lang.id} value={lang.id}>
                          {lang.icon} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              
              <div className="flex items-center gap-2 my-3">
                <div className="h-px flex-1 bg-green-500/10"></div>
                <p className="text-xs text-green-300/60 font-medium">OR ADD CUSTOM</p>
                <div className="h-px flex-1 bg-green-500/10"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="customLanguage" className="text-sm font-medium text-green-300">
                    Custom Language Name
                  </label>
                  <Input
                    id="customLanguage"
                    value={customLanguage}
                    onChange={(e) => {
                      setCustomLanguage(e.target.value)
                      // Clear selected language if custom one is entered
                      if (e.target.value) {
                        setSelectedLanguage("")
                      }
                    }}
                    placeholder="e.g., Perl"
                    className="bg-black border-green-500/20 text-green-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="customIcon" className="text-sm font-medium text-green-300">
                    Icon (Emoji)
                  </label>
                  <Input
                    id="customIcon"
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    placeholder="e.g., 🐪"
                    className="bg-black border-green-500/20 text-green-300"
                  />
                </div>
              </div>
            </div>
            
            {/* Quick Selection */}
            <div className="space-y-3 border border-green-500/10 rounded-md p-4 bg-black/30 mt-4">
              <h3 className="text-md font-medium text-green-300">Quick Select Common Languages</h3>
              <p className="text-sm text-green-300/60">Click any language to quickly add it:</p>
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                {COMMON_LANGUAGES.map(lang => (
                  <Button
                    key={lang.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`border-green-500/20 hover:bg-green-900/20 text-green-300 hover:border-green-500/50 transition-all duration-200 h-auto py-2 px-1 ${customLanguage === lang.name ? 'bg-green-900/30 border-green-500/50' : 'bg-black'}`}
                    onClick={() => {
                      setCustomLanguage(lang.name)
                      setCustomIcon(lang.icon)
                      setSelectedLanguage("")
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>{lang.icon}</span>
                      <span className="text-xs">{lang.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Step 2: Set your proficiency */}
            <div className="space-y-4 border border-green-500/10 rounded-md p-4 bg-black/30 mt-4">
              <h3 className="text-lg font-medium text-green-300 flex items-center">
                <span className="bg-green-900/30 text-green-400 p-1 rounded-full mr-2 text-xs">2</span>
                Set Your Proficiency
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-4">
                  <label htmlFor="level" className="text-sm font-medium text-green-300">
                    Your Current Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={`border-green-500/20 hover:bg-green-900/20 text-green-300 hover:border-green-500/50 transition-all duration-200 h-auto py-2 ${level === 'beginner' ? 'bg-green-900/30 border-green-500/50' : 'bg-black'}`}
                      onClick={() => setLevel('beginner')}
                    >
                      <div className="flex items-center gap-2">
                        <span>🔰</span>
                        <span className="text-xs">Beginner</span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`border-green-500/20 hover:bg-green-900/20 text-green-300 hover:border-green-500/50 transition-all duration-200 h-auto py-2 ${level === 'intermediate' ? 'bg-green-900/30 border-green-500/50' : 'bg-black'}`}
                      onClick={() => setLevel('intermediate')}
                    >
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span className="text-xs">Intermediate</span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`border-green-500/20 hover:bg-green-900/20 text-green-300 hover:border-green-500/50 transition-all duration-200 h-auto py-2 ${level === 'advanced' ? 'bg-green-900/30 border-green-500/50' : 'bg-black'}`}
                      onClick={() => setLevel('advanced')}
                    >
                      <div className="flex items-center gap-2">
                        <span>🔥</span>
                        <span className="text-xs">Advanced</span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`border-green-500/20 hover:bg-green-900/20 text-green-300 hover:border-green-500/50 transition-all duration-200 h-auto py-2 ${level === 'expert' ? 'bg-green-900/30 border-green-500/50' : 'bg-black'}`}
                      onClick={() => setLevel('expert')}
                    >
                      <div className="flex items-center gap-2">
                        <span>👑</span>
                        <span className="text-xs">Expert</span>
                      </div>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <label htmlFor="xp" className="text-sm font-medium text-green-300 flex justify-between">
                    <span>Starting XP: <span className="text-green-400 font-bold">{xp}</span></span>
                    <span className="text-xs text-green-300/60">0-100</span>
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        id="xp"
                        type="range"
                        min="0"
                        max="100"
                        value={xp}
                        onChange={(e) => setXp(e.target.value)}
                        className="w-full h-2 bg-black border border-green-500/20 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${xp}%, rgba(16, 185, 129, 0.1) ${xp}%, rgba(16, 185, 129, 0.1) 100%)`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-green-300/60">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4 border-t border-green-500/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-green-500/20 text-green-400 hover:bg-green-900/20 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!selectedLanguage && !customLanguage)}
              className={`bg-green-600 hover:bg-green-700 text-black transition-all duration-200`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-1 h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Add Language
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
