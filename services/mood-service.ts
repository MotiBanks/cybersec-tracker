import { getBrowserClient, subscribeToChanges } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Mood = Database["public"]["Tables"]["moods"]["Row"]
type MoodSuggestion = Database["public"]["Tables"]["mood_suggestions"]["Row"]

export const MoodService = {
  // Record a new mood
  async recordMood(userId: string, moodType: string): Promise<Mood> {
    const supabase = getBrowserClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("moods")
      .insert([{
        user_id: userId,
        mood_type: moodType,
        recorded_at: now,
      }])
      .select()
      .single()

    if (error) {
      console.error("Error recording mood:", error)
      throw error
    }
    
    // The database trigger will handle updating the streak and XP
    
    return data
  },

  // Get the latest mood for a user
  async getLatestMood(userId: string): Promise<Mood | null> {
    const supabase = getBrowserClient()

    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Error fetching latest mood:", error)
      throw error
    }

    return data
  },
  
  // Get mood history for a user
  async getMoodHistory(userId: string, limit: number = 30): Promise<Mood[]> {
    const supabase = getBrowserClient()

    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching mood history:", error)
      throw error
    }

    return data || []
  },
  
  // Get mood distribution for analytics
  async getMoodDistribution(userId: string, days: number = 30): Promise<{[key: string]: number}> {
    const supabase = getBrowserClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from("moods")
      .select("mood_type")
      .eq("user_id", userId)
      .gte("recorded_at", startDate.toISOString())
    
    if (error) {
      console.error("Error fetching mood distribution:", error)
      throw error
    }
    
    // Count occurrences of each mood type
    const distribution: {[key: string]: number} = {}
    
    for (const mood of data || []) {
      if (distribution[mood.mood_type]) {
        distribution[mood.mood_type]++
      } else {
        distribution[mood.mood_type] = 1
      }
    }
    
    return distribution
  },

  // Get random mood suggestions for a specific mood type
  async getRandomSuggestions(moodType: string, count: number = 3): Promise<MoodSuggestion[]> {
    const supabase = getBrowserClient()

    const { data, error } = await supabase
      .from("mood_suggestions")
      .select("*")
      .eq("mood_type", moodType)
      .limit(count)

    if (error) {
      console.error("Error fetching mood suggestions:", error)
      throw error
    }

    return data || []
  },
  
  // Add a custom mood suggestion
  async addMoodSuggestion(moodType: string, suggestion: string): Promise<MoodSuggestion> {
    const supabase = getBrowserClient()

    const { data, error } = await supabase
      .from("mood_suggestions")
      .insert([{
        mood_type: moodType,
        suggestion: suggestion
      }])
      .select()
      .single()

    if (error) {
      console.error("Error adding mood suggestion:", error)
      throw error
    }

    return data
  },
  
  // Subscribe to mood changes for a user
  subscribeToMoods(userId: string, callback: (payload: any) => void) {
    return subscribeToChanges(
      "moods",
      callback,
      { event: 'INSERT', schema: 'public', filter: `user_id=eq.${userId}` }
    )
  }
}
