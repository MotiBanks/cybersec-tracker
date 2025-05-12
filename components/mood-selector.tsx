"use client"

import { useState, useEffect } from "react"
import { Lightbulb, Shuffle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUser, getBrowserClient } from "@/lib/supabase"

// Client-side only component to handle time display
function TimeDisplay() {
  const [time, setTime] = useState<string>('')
  
  useEffect(() => {
    // Only run on client side
    setTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
    
    // Update time every minute
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])
  
  return <span className="text-green-300/60 text-xs">{time}</span>
}

type MediaRecommendation = {
  type: 'video' | 'article' | 'podcast' | 'game' | 'tutorial' | 'tip'
  title: string
  content: string
}

type MoodData = {
  id: string
  icon: string
  image: string
  label: string
  color: string
  intro: (name: string) => string
  suggestions: string[]
  media: MediaRecommendation
}

interface MoodSelectorProps {
  onMoodSelect?: (moodId: string) => void;
}

export default function MoodSelector({ onMoodSelect }: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([])
  const [userHandle, setUserHandle] = useState<string>("")

  // Get user's handle when component mounts
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get user from Supabase auth
        const supabase = getBrowserClient()
        const { data } = await supabase.auth.getUser()
        
        // Get handle from user metadata
        const handle = data?.user?.user_metadata?.handle || localStorage.getItem('userHandle')
        
        if (handle) {
          setUserHandle(handle)
        } else {
          // Fallback to regular user data
          const userData = await getCurrentUser()
          // Use user_metadata or just default to Cyberpunk
          setUserHandle(userData?.user_metadata?.handle || 'Cyberpunk')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    
    fetchUserData()
  }, [])

  const moods: MoodData[] = [
    {
      id: "happy",
      icon: "😃", // This is just a fallback
      image: "/assets/moods/happy.png",
      label: "Happy",
      color: "bg-yellow-500 hover:bg-yellow-600",
      intro: (name: string) => `You're in a great mood today, ${name}! Let's make the most of your positive energy.`,
      suggestions: [
        "Challenge yourself: Try a harder CTF challenge than you normally would.",
        "Learn something new: Pick an advanced topic you've been curious about.",
        "Create: Start a small cybersecurity project you've been thinking about.",
        "Connect: Share your knowledge with someone else who's learning.",
        "Experiment: Try a new hacking technique in your lab environment.",
        "Document: Write about something you've learned recently to solidify your knowledge."
      ],
      media: {
        type: "tip",
        title: "Happy Hacker Tip",
        content: "Your positive energy is perfect for tackling those challenging CTF problems you've been putting off. Your brain is primed for creative solutions right now!"
      }
    },
    {
      id: "productive",
      icon: "💪", // Flexed bicep emoji
      image: "/assets/moods/productive.png",
      label: "Productive",
      color: "bg-green-500 hover:bg-green-600",
      intro: (name: string) => `I can tell you're ready to crush it today, ${name}! Let's make something amazing happen.`,
      suggestions: [
        "Build: Create a custom tool to automate a repetitive security task.",
        "Code: Write a script that helps with reconnaissance or vulnerability scanning.",
        "Practice: Set up a vulnerable machine and try to exploit it methodically.",
        "Analyze: Dissect a piece of malware in a safe environment.",
        "Secure: Audit one of your own projects for security vulnerabilities.",
        "Learn: Deep dive into a specific exploit technique you want to master."
      ],
      media: {
        type: "tutorial",
        title: "Productive Mode Activated!",
        content: "Your brain is in the perfect state for deep work right now. This is the ideal time to tackle that challenging security problem you've been thinking about. I believe in you!"
      }
    },
    {
      id: "tired",
      icon: "😪", // Sleepy face emoji
      image: "/assets/moods/tired.png",
      label: "Tired",
      color: "bg-blue-500 hover:bg-blue-600",
      intro: (name: string) => `I understand you're feeling drained today, ${name}. Let's focus on lighter activities that still move you forward.`,
      suggestions: [
        "Review: Go through your notes from previous learning sessions.",
        "Watch: Check out a short cybersecurity video that doesn't require much energy.",
        "Read: Browse some lighter cybersecurity articles or news.",
        "Organize: Clean up your digital workspace or learning resources.",
        "Connect: Join a cybersecurity community chat and just observe.",
        "Rest: Take a proper break. Sometimes the best thing for learning is recovery."
      ],
      media: {
        type: "tip",
        title: "It's OK to Take it Easy",
        content: "Even on low-energy days, small steps forward still count. Your brain is processing what you've already learned, even when you don't feel productive."
      }
    },
    {
      id: "frustrated",
      icon: "😤", // Face with steam emoji
      image: "/assets/moods/frustrated.png",
      label: "Frustrated",
      color: "bg-red-500 hover:bg-red-600",
      intro: (name: string) => `I hear you, ${name}. Cybersecurity can be challenging. Let's find a way through this together.`,
      suggestions: [
        "Break it down: Divide the problem into smaller, more manageable pieces.",
        "Switch gears: Try a different topic or approach for a while.",
        "Seek help: Post your question in a forum or community.",
        "Take a walk: Physical movement can help clear mental blocks.",
        "Review basics: Sometimes going back to fundamentals reveals what you're missing.",
        "Document: Write out exactly what's frustrating you - the act of explaining often leads to solutions."
      ],
      media: {
        type: "article",
        title: "Frustration is Part of Growth",
        content: "The challenges that frustrate you today are building your problem-solving muscles for tomorrow. Every expert has faced the exact same feelings you're experiencing right now."
      }
    }
  ]

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId)
    setShowSuggestions(true)

    // Get the selected mood
    const mood = moods.find((m) => m.id === moodId)
    if (mood) {
      // Get 3 random suggestions
      const randomSuggestions = [...mood.suggestions].sort(() => 0.5 - Math.random()).slice(0, 3)
      setCurrentSuggestions(randomSuggestions)
      
      // Call the onMoodSelect prop if provided
      if (onMoodSelect) {
        onMoodSelect(moodId);
      }
      
      // Log the mood selection
      console.log(`Mood selected: ${moodId}`);
      
      // Force the suggestions to be visible immediately
      setTimeout(() => {
        const suggestionsElement = document.getElementById('mood-suggestions');
        if (suggestionsElement) {
          suggestionsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }

  const shuffleSuggestions = () => {
    const mood = moods.find((m) => m.id === selectedMood)
    if (mood) {
      const randomSuggestions = [...mood.suggestions].sort(() => 0.5 - Math.random()).slice(0, 3)
      setCurrentSuggestions(randomSuggestions)
    }
  }

  const getSelectedMood = () => {
    return moods.find((m) => m.id === selectedMood)
  }

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {moods.map((mood) => (
          <Button
            key={mood.id}
            variant="outline"
            size="sm"
            className={`flex flex-col items-center justify-center h-20 p-1 border-green-500/20 ${selectedMood === mood.id ? mood.color + " text-white" : "bg-black hover:bg-green-900/20"}`}
            onClick={() => handleMoodSelect(mood.id)}
          >
            <div className="mb-2 flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-black/30">
              {/* Use custom mood icons */}
              <img 
                src={`/assets/moods/${mood.id}.png`} 
                alt={mood.label} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('span');
                    fallback.className = 'text-2xl';
                    fallback.textContent = mood.icon;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <span className="text-xs">{mood.label}</span>
          </Button>
        ))}
      </div>

      {selectedMood && (
        <div className="mt-3 text-xs text-green-300/80">
          <p className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="text-green-400 font-medium">{userHandle || 'Cyberpunk'}</span>
            <span>•</span>
            <TimeDisplay />
          </p>
        </div>
      )}

      {selectedMood && (
        <div id="mood-suggestions" className="mt-3 pt-3 border-t border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Lightbulb className="w-4 h-4 mr-1 text-yellow-500" />
              <span className="text-xs font-medium text-green-300">Personal Suggestions</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-green-400 hover:bg-green-900/20"
              onClick={shuffleSuggestions}
            >
              <Shuffle className="w-3 h-3 mr-1" />
              Shuffle
            </Button>
          </div>

          {getSelectedMood() && (
            <div
              className={`p-3 rounded-md border border-${selectedMood === "productive" ? "green" : selectedMood === "curious" ? "blue" : selectedMood === "tired" ? "yellow" : "red"}-500/50 bg-black/60`}
            >
              <p className="text-xs mb-2 text-green-300/90">
                {getSelectedMood()?.intro ? getSelectedMood()?.intro(userHandle || 'Cyberpunk') : ''}
              </p>
              
              <ul className="space-y-2">
                {currentSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-xs text-green-300/80 flex items-start">
                    <span className="mr-1 text-green-400">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
              
              {getSelectedMood()?.media && (
                <div className="mt-3 pt-3 border-t border-green-500/20">
                  <p className="text-xs font-medium text-green-400 mb-1">
                    {getSelectedMood()?.media?.type === "video" && "🎬 Personal Note"}
                    {getSelectedMood()?.media?.type === "article" && "📚 Personal Note"}
                    {getSelectedMood()?.media?.type === "podcast" && "🎧 Personal Note"}
                    {getSelectedMood()?.media?.type === "game" && "🎮 Personal Note"}
                    {getSelectedMood()?.media?.type === "tutorial" && "✨ Personal Note"}
                    {getSelectedMood()?.media?.type === "tip" && "💡 Personal Note"}
                  </p>
                  <div className="text-xs text-green-300 flex items-start">
                    <p className="font-medium mb-1">{getSelectedMood()?.media?.title}</p>
                  </div>
                  <p className="text-xs text-green-300/80 italic">
                    {getSelectedMood()?.media?.content}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
