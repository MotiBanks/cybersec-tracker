import { getBrowserClient, subscribeToChanges } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Language = Database["public"]["Tables"]["languages"]["Row"]
type UserLanguage = Database["public"]["Tables"]["user_languages"]["Row"]
type LanguagePractice = Database["public"]["Tables"]["language_practice_history"]["Row"]

export const LanguageService = {
  // Get all available languages
  async getAllLanguages(): Promise<Language[]> {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase
      .from("languages")
      .select("*")
      .order("name", { ascending: true })
    
    if (error) {
      console.error("Error fetching languages:", error)
      throw error
    }
    
    return data || []
  },
  
  // Get languages for a user
  async getUserLanguages(userId: string): Promise<(UserLanguage & { language: Language })[]> {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase
      .from("user_languages")
      .select(`
        *,
        language:language_id(*)
      `)
      .eq("user_id", userId)
      .order("proficiency", { ascending: false })
    
    if (error) {
      console.error("Error fetching user languages:", error)
      throw error
    }
    
    return data || []
  },
  
  // Add a language to a user's profile
  async addUserLanguage(userId: string, languageId: string, proficiency: number = 1): Promise<UserLanguage> {
    const supabase = getBrowserClient()
    
    // Check if the user already has this language
    const { data: existingLanguage } = await supabase
      .from("user_languages")
      .select("*")
      .eq("user_id", userId)
      .eq("language_id", languageId)
      .maybeSingle()
    
    if (existingLanguage) {
      // Update the existing language
      const { data, error } = await supabase
        .from("user_languages")
        .update({ proficiency })
        .eq("id", existingLanguage.id)
        .select()
        .single()
      
      if (error) {
        console.error("Error updating user language:", error)
        throw error
      }
      
      return data
    } else {
      // Create a new user language
      const { data, error } = await supabase
        .from("user_languages")
        .insert([{
          user_id: userId,
          language_id: languageId,
          proficiency,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        console.error("Error adding user language:", error)
        throw error
      }
      
      return data
    }
  },
  
  // Update language proficiency
  async updateProficiency(userLanguageId: string, userId: string, proficiency: number): Promise<UserLanguage> {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase
      .from("user_languages")
      .update({ proficiency })
      .eq("id", userLanguageId)
      .eq("user_id", userId) // Security check
      .select()
      .single()
    
    if (error) {
      console.error("Error updating proficiency:", error)
      throw error
    }
    
    return data
  },
  
  // Record language practice
  async recordPractice(userLanguageId: string, userId: string, durationMinutes: number, xpEarned?: number): Promise<LanguagePractice> {
    const supabase = getBrowserClient()
    
    // First verify that this user language belongs to the user
    const { data: userLanguage, error: verifyError } = await supabase
      .from("user_languages")
      .select("*")
      .eq("id", userLanguageId)
      .eq("user_id", userId) // Security check
      .single()
    
    if (verifyError) {
      console.error("Error verifying user language:", verifyError)
      throw verifyError
    }
    
    // Calculate XP if not provided (1 XP per minute, with a minimum of 5)
    const calculatedXp = xpEarned || Math.max(5, Math.floor(durationMinutes))
    
    // Record the practice
    const { data, error } = await supabase
      .from("language_practice_history")
      .insert([{
        user_language_id: userLanguageId,
        practice_date: new Date().toISOString(),
        duration_minutes: durationMinutes,
        xp_earned: calculatedXp
      }])
      .select()
      .single()
    
    if (error) {
      console.error("Error recording practice:", error)
      throw error
    }
    
    // Update the last practiced date
    await supabase
      .from("user_languages")
      .update({ 
        last_practiced: new Date().toISOString(),
        // Increase proficiency by 0.1 for each practice, up to a maximum of 10
        proficiency: Math.min(10, userLanguage.proficiency + 0.1)
      })
      .eq("id", userLanguageId)
    
    // The database trigger will handle updating XP and streak
    
    return data
  },
  
  // Get practice history for a language
  async getPracticeHistory(userLanguageId: string, userId: string, limit: number = 30): Promise<LanguagePractice[]> {
    const supabase = getBrowserClient()
    
    // First verify that this user language belongs to the user
    const { error: verifyError } = await supabase
      .from("user_languages")
      .select("id")
      .eq("id", userLanguageId)
      .eq("user_id", userId) // Security check
      .single()
    
    if (verifyError) {
      console.error("Error verifying user language:", verifyError)
      throw verifyError
    }
    
    // Get the practice history
    const { data, error } = await supabase
      .from("language_practice_history")
      .select("*")
      .eq("user_language_id", userLanguageId)
      .order("practice_date", { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error("Error fetching practice history:", error)
      throw error
    }
    
    return data || []
  },
  
  // Remove a language from a user's profile
  async removeUserLanguage(userLanguageId: string, userId: string): Promise<void> {
    const supabase = getBrowserClient()
    
    // Delete all practice history first
    await supabase
      .from("language_practice_history")
      .delete()
      .eq("user_language_id", userLanguageId)
    
    // Then delete the user language
    const { error } = await supabase
      .from("user_languages")
      .delete()
      .eq("id", userLanguageId)
      .eq("user_id", userId) // Security check
    
    if (error) {
      console.error("Error removing user language:", error)
      throw error
    }
  },
  
  // Subscribe to user language changes
  subscribeToUserLanguages(userId: string, callback: (payload: any) => void) {
    return subscribeToChanges(
      "user_languages",
      callback,
      { event: 'INSERT', schema: 'public', filter: `user_id=eq.${userId}` }
    )
  },
  
  // Subscribe to language practice history
  subscribeToPracticeHistory(userLanguageId: string, callback: (payload: any) => void) {
    return subscribeToChanges(
      "language_practice_history",
      callback,
      { event: 'INSERT', schema: 'public', filter: `user_language_id=eq.${userLanguageId}` }
    )
  }
}
