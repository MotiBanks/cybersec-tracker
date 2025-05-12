import { getBrowserClient, subscribeToChanges } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Reflection = Database["public"]["Tables"]["reflections"]["Row"]
type InsertReflection = Database["public"]["Tables"]["reflections"]["Insert"]
type UpdateReflection = Database["public"]["Tables"]["reflections"]["Update"]

export const ReflectionsService = {
  // Get all reflections for a user
  async getUserReflections(userId: string): Promise<Reflection[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("reflections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reflections:", error)
      throw error
    }

    return data || []
  },

  // Get reflections for a specific date range
  async getReflectionsForDateRange(userId: string, startDate: string, endDate: string): Promise<Reflection[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("reflections")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reflections for date range:", error)
      throw error
    }

    return data || []
  },

  // Get reflections by tag
  async getReflectionsByTag(userId: string, tag: string): Promise<Reflection[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("reflections")
      .select("*")
      .eq("user_id", userId)
      .contains("tags", [tag])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reflections by tag:", error)
      throw error
    }

    return data || []
  },

  // Get all unique tags used by a user
  async getUserTags(userId: string): Promise<string[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("reflections")
      .select("tags")
      .eq("user_id", userId)
      .not("tags", "is", null)

    if (error) {
      console.error("Error fetching user tags:", error)
      throw error
    }
    
    // Extract and deduplicate tags
    const allTags = new Set<string>()
    data?.forEach((reflection: { tags: string[] | null }) => {
      reflection.tags?.forEach((tag: string) => {
        allTags.add(tag)
      })
    })
    
    return Array.from(allTags).sort()
  },

  // Create a new reflection
  async createReflection(reflection: InsertReflection): Promise<Reflection> {
    const supabase = getBrowserClient()
    
    // Ensure created_at is set
    const reflectionWithDate = {
      ...reflection,
      created_at: reflection.created_at || new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from("reflections")
      .insert([reflectionWithDate])
      .select()
      .single()

    if (error) {
      console.error("Error creating reflection:", error)
      throw error
    }

    // The database trigger will handle updating the streak and XP

    return data
  },

  // Update a reflection
  async updateReflection(id: string, userId: string, updates: Partial<InsertReflection>): Promise<Reflection> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("reflections")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId) // Security check
      .select()
      .single()

    if (error) {
      console.error("Error updating reflection:", error)
      throw error
    }

    return data
  },

  // Delete a reflection
  async deleteReflection(id: string, userId: string): Promise<void> {
    const supabase = getBrowserClient()
    const { error } = await supabase
      .from("reflections")
      .delete()
      .eq("id", id)
      .eq("user_id", userId) // Security check

    if (error) {
      console.error("Error deleting reflection:", error)
      throw error
    }
  },
  
  // Search reflections by content
  async searchReflections(userId: string, query: string): Promise<Reflection[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("reflections")
      .select("*")
      .eq("user_id", userId)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching reflections:", error)
      throw error
    }

    return data || []
  },
  
  // Subscribe to reflection changes for a user
  subscribeToReflections(userId: string, callback: (payload: any) => void) {
    return subscribeToChanges(
      "reflections",
      callback,
      { event: 'INSERT', schema: 'public', filter: `user_id=eq.${userId}` }
    )
  }
}
