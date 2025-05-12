import { getBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Badge = Database["public"]["Tables"]["badges"]["Row"]
type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"] & { badge: Badge }

export const BadgesService = {
  // Get all available badges
  async getAllBadges(): Promise<Badge[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase.from("badges").select("*").order("xp_reward", { ascending: true })

    if (error) {
      console.error("Error fetching badges:", error)
      throw error
    }

    return data || []
  },

  // Get badges a user has unlocked
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("user_badges")
      .select(`
        *,
        badge:badge_id (*)
      `)
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user badges:", error)
      throw error
    }

    return data || []
  },

  // Unlock a badge for a user
  async unlockBadge(userId: string, badgeId: string): Promise<void> {
    const supabase = getBrowserClient()

    // First check if the user already has this badge
    const { data: existingBadge } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .maybeSingle()

    if (existingBadge) {
      // User already has this badge
      return
    }

    // Get the badge details to award XP
    const { data: badge, error: badgeError } = await supabase
      .from("badges")
      .select("xp_reward")
      .eq("id", badgeId)
      .single()

    if (badgeError) {
      console.error("Error fetching badge:", badgeError)
      throw badgeError
    }

    // Insert the user badge
    const { error } = await supabase.from("user_badges").insert([{ user_id: userId, badge_id: badgeId }])

    if (error) {
      console.error("Error unlocking badge:", error)
      throw error
    }

    // Award XP for the badge
    try {
      await supabase.rpc("increment_user_xp", {
        user_id: userId,
        xp_amount: badge.xp_reward,
      })
    } catch (xpError) {
      console.error("Error updating XP:", xpError)
      // Continue anyway, badge was unlocked
    }
  },

  // Check for new badges a user might have earned
  async checkForNewBadges(userId: string): Promise<Badge[]> {
    // In a real app, this would be a server function that checks various criteria
    // For now, we'll just simulate by unlocking the first badge if the user has none

    const supabase = getBrowserClient()

    // Get user's current badges
    const { data: userBadges, error: userBadgesError } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId)

    if (userBadgesError) {
      console.error("Error fetching user badges:", userBadgesError)
      throw userBadgesError
    }

    // If user has no badges, unlock the first one
    if (userBadges.length === 0) {
      const { data: allBadges, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .order("xp_reward", { ascending: true })
        .limit(1)

      if (badgesError) {
        console.error("Error fetching badges:", badgesError)
        throw badgesError
      }

      if (allBadges && allBadges.length > 0) {
        await this.unlockBadge(userId, allBadges[0].id)
        return allBadges
      }
    }

    return []
  },
}
