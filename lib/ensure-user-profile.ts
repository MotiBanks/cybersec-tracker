import { getBrowserClient } from './supabase'
import { UserService } from '@/services/user-service'

/**
 * Ensures a user profile exists before performing operations that depend on it
 * This is critical for operations like creating tasks, adding languages, etc.
 */
export async function ensureUserProfile(userId: string): Promise<boolean> {
  if (!userId) return false
  
  try {
    // First, check if the user profile exists
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    // If the profile exists, we're good
    if (data && !error) {
      console.log('User profile exists:', userId)
      return true
    }
    
    // If not, create it
    console.log('User profile does not exist, creating it:', userId)
    const profile = await UserService.getUserProfile(userId)
    
    return !!profile
  } catch (err) {
    console.error('Error ensuring user profile exists:', err)
    return false
  }
}
