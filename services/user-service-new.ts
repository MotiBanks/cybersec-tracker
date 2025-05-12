import { getBrowserClient, createServerClient } from "@/lib/supabase"
import type { Database } from "@/types/database.types"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export type UserProfile = Database["public"]["Tables"]["users"]["Row"]

export const UserService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  },

  // Create or update user profile
  async upsertUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("users")
      .upsert(profile)
      .select()
      .single()

    if (error) {
      console.error("Error upserting user profile:", error)
      throw error
    }

    return data
  },

  // Update user streak using the database function
  async updateUserStreak(userId: string): Promise<UserProfile> {
    const supabase = getBrowserClient()
    
    // Call the database function to update the streak
    const { error: rpcError } = await supabase.rpc('update_user_streak', {
      user_id: userId
    })
    
    if (rpcError) {
      console.error("Error updating user streak:", rpcError)
      throw rpcError
    }
    
    // Get the updated user profile
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()
    
    if (error) {
      console.error("Error fetching updated user profile:", error)
      throw error
    }
    
    return data
  },
  
  // Get user's XP history
  async getUserXpHistory(userId: string, limit = 10): Promise<Database["public"]["Tables"]["xp_tracker"]["Row"][]> {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase
      .from("xp_tracker")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error("Error fetching user XP history:", error)
      throw error
    }
    
    return data || []
  },
  
  // Get user's notifications
  async getUserNotifications(userId: string, limit = 10, includeRead = false): Promise<Database["public"]["Tables"]["notifications"]["Row"][]> {
    const supabase = getBrowserClient()
    
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
    
    if (!includeRead) {
      query = query.eq("read", false)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error("Error fetching user notifications:", error)
      throw error
    }
    
    return data || []
  },
  
  // Mark notification as read
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    const supabase = getBrowserClient()
    
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId) // Security check
    
    if (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }
  },
  
  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const supabase = getBrowserClient()
    
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)
    
    if (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  },
  
  // Subscribe to user profile changes
  subscribeToUserProfile(userId: string, callback: (payload: RealtimePostgresChangesPayload<UserProfile>) => void) {
    const supabase = getBrowserClient()
    
    const channel = supabase
      .channel(`public:users:id=eq.${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, (payload: RealtimePostgresChangesPayload<UserProfile>) => {
        callback(payload)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  },
  
  // Subscribe to user notifications
  subscribeToNotifications(userId: string, callback: (payload: RealtimePostgresChangesPayload<Database["public"]["Tables"]["notifications"]["Row"]>) => void) {
    const supabase = getBrowserClient()
    
    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload: RealtimePostgresChangesPayload<Database["public"]["Tables"]["notifications"]["Row"]>) => {
        callback(payload)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }
}
