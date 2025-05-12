import { getBrowserClient, subscribeToChanges } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

export const NotificationsService = {
  // Get all notifications for a user
  async getUserNotifications(userId: string, includeRead: boolean = false, limit: number = 20): Promise<Notification[]> {
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
      console.error("Error fetching notifications:", error)
      throw error
    }
    
    return data || []
  },
  
  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    const supabase = getBrowserClient()
    
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false)
    
    if (error) {
      console.error("Error fetching unread count:", error)
      throw error
    }
    
    return count || 0
  },
  
  // Mark a notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
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
  async markAllAsRead(userId: string): Promise<void> {
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
  
  // Create a notification (usually done by server-side triggers, but useful for testing)
  async createNotification(notification: Omit<Database["public"]["Tables"]["notifications"]["Insert"], "id" | "created_at">): Promise<Notification> {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase
      .from("notifications")
      .insert([{
        ...notification,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error("Error creating notification:", error)
      throw error
    }
    
    return data
  },
  
  // Delete a notification
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const supabase = getBrowserClient()
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId) // Security check
    
    if (error) {
      console.error("Error deleting notification:", error)
      throw error
    }
  },
  
  // Subscribe to notification changes for a user
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return subscribeToChanges(
      "notifications",
      callback,
      { event: 'INSERT', schema: 'public', filter: `user_id=eq.${userId}` }
    )
  }
}
