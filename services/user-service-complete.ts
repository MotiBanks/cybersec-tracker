import { getBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

export type UserProfile = Database["public"]["Tables"]["users"]["Row"]

export const UserService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getBrowserClient()
    
    try {
      // Get the user's metadata to retrieve their handle
      const { data: userData } = await supabase.auth.getUser()
      const userHandle = userData?.user?.user_metadata?.handle || localStorage.getItem('userHandle')
      
      // First check if the user exists
      const { data: checkUser, error: checkError } = await supabase
        .from("users")
        .select("id, username")
        .eq("id", userId)
      
      // If no user found, create a basic profile
      if (!checkError && (!checkUser || checkUser.length === 0)) {
        console.log("Creating new user profile for ID:", userId)
        // Create a basic profile for the user
        const defaultProfile = {
          id: userId,
          username: userHandle || `user_${userId.substring(0, 6)}`,
          xp: 0,
          level: 1,
          streak_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Try multiple approaches to ensure the user profile is created
        let profileCreated = false;
        
        // First attempt: insert
        try {
          const { data: newProfile, error: insertError } = await supabase
            .from("users")
            .insert(defaultProfile)
            
          if (!insertError) {
            profileCreated = true;
            console.log("User profile created successfully via insert");
          }
        } catch (insertErr) {
          console.error("Error in insert attempt:", insertErr);
        }
        
        // Second attempt: upsert
        if (!profileCreated) {
          try {
            const { data: upsertResult, error: upsertError } = await supabase
              .from("users")
              .upsert(defaultProfile)
              
            if (!upsertError) {
              profileCreated = true;
              console.log("User profile created successfully via upsert");
            }
          } catch (upsertErr) {
            console.error("Error in upsert attempt:", upsertErr);
          }
        }
        
        // Third attempt: direct SQL (as a last resort)
        if (!profileCreated) {
          try {
            const { error: rpcError } = await supabase.rpc('create_user_profile', {
              user_id: userId,
              user_name: userHandle || `user_${userId.substring(0, 6)}`,
              initial_xp: 0,
              initial_level: 1
            });
            
            if (!rpcError) {
              profileCreated = true;
              console.log("User profile created successfully via RPC");
            }
          } catch (rpcErr) {
            console.error("Error in RPC attempt:", rpcErr);
          }
        }
        
        // Make sure the handle is stored in user metadata
        if (userHandle) {
          const { error: updateMetadataError } = await supabase.auth.updateUser({
            data: { handle: userHandle }
          })
          
          if (updateMetadataError) {
            console.error("Error updating user metadata:", updateMetadataError)
          }
        }
        
        // Verify the profile exists now
        const { data: verifyProfile, error: verifyError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single()
          
        if (verifyError) {
          console.error("Failed to verify user profile creation:", verifyError);
          return null;
        }
        
        return verifyProfile;
      } else if (checkUser && checkUser.length > 0 && userHandle) {
        // If the user exists, make sure their handle is in metadata
        const { error: updateMetadataError } = await supabase.auth.updateUser({
          data: { handle: userHandle }
        })
        
        if (updateMetadataError) {
          console.error("Error updating user metadata:", updateMetadataError)
        }
      }
      
      // Get the full user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()
      
      if (profileError) {
        console.error("Error fetching user profile:", profileError)
        
        // If the profile doesn't exist, try to create it one more time
        if (profileError.code === "PGRST116") {
          console.log("Profile not found, creating a basic one...")
          
          const basicProfile = {
            id: userId,
            username: userHandle || `user_${userId.substring(0, 6)}`,
            xp: 0,
            level: 1,
            streak_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .upsert(basicProfile)
            .select()
            .single()
          
          if (createError) {
            console.error("Failed to create basic profile:", createError)
            return null
          }
          
          return newProfile
        }
        
        return null
      }
      
      return profile
    } catch (err) {
      console.error("Unexpected error in getUserProfile:", err)
      return null
    }
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
  subscribeToUserProfile(userId: string, callback: (payload: any) => void) {
    const supabase = getBrowserClient()
    
    const channel = supabase
      .channel(`public:users:id=eq.${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, (payload) => {
        callback(payload)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  },
  
  // Subscribe to user notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    const supabase = getBrowserClient()
    
    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }
}
