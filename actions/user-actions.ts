"use server"

import { createServerClient } from "@/lib/supabase"

// Increment user XP (used by client components)
export async function incrementUserXP(userId: string, xpAmount: number) {
  const supabase = createServerClient()

  // Get current user profile
  const { data: currentProfile, error: profileError } = await supabase
    .from("users")
    .select("xp, level")
    .eq("id", userId)
    .single()

  if (profileError) {
    return { success: false, error: "Failed to fetch user profile" }
  }

  // Calculate new XP and level
  const newXP = (currentProfile.xp || 0) + xpAmount
  let newLevel = currentProfile.level || 1

  // Simple level calculation (adjust as needed)
  const xpPerLevel = 1000 // XP needed per level
  newLevel = Math.floor(newXP / xpPerLevel) + 1

  // Update the profile
  const { error } = await supabase
    .from("users")
    .update({
      xp: newXP,
      level: newLevel,
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: "Failed to update XP" }
  }

  return {
    success: true,
    data: {
      xp: newXP,
      level: newLevel,
      leveledUp: newLevel > currentProfile.level,
    },
  }
}

// Check and update user streak
export async function checkAndUpdateStreak(userId: string) {
  const supabase = createServerClient()

  // Get current user profile
  const { data: currentProfile, error: profileError } = await supabase
    .from("users")
    .select("streak_count, last_active_date")
    .eq("id", userId)
    .single()

  if (profileError) {
    return { success: false, error: "Failed to fetch user profile" }
  }

  const today = new Date().toISOString().split("T")[0]
  const lastActive = currentProfile.last_active_date

  let newStreak = currentProfile.streak_count || 0
  let streakUpdated = false

  // If last active was yesterday, increment streak
  if (lastActive) {
    const lastActiveDate = new Date(lastActive)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (lastActiveDate.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0]) {
      newStreak += 1
      streakUpdated = true
    } else if (lastActiveDate.toISOString().split("T")[0] !== today) {
      // If last active was not yesterday and not today, reset streak
      newStreak = 1
      streakUpdated = true
    }
  } else {
    // First time user is active
    newStreak = 1
    streakUpdated = true
  }

  // Only update if the streak changed
  if (streakUpdated) {
    const { error } = await supabase
      .from("users")
      .update({
        streak_count: newStreak,
        last_active_date: today,
      })
      .eq("id", userId)

    if (error) {
      return { success: false, error: "Failed to update streak" }
    }
  } else {
    // Just update the last active date
    const { error } = await supabase
      .from("users")
      .update({
        last_active_date: today,
      })
      .eq("id", userId)

    if (error) {
      return { success: false, error: "Failed to update last active date" }
    }
  }

  return {
    success: true,
    data: {
      streak: newStreak,
      streakUpdated,
    },
  }
}

// Generate and save weekly report
export async function generateWeeklyReport(userId: string, weekStartDate: string) {
  const supabase = createServerClient()

  // Parse the date
  const startDate = new Date(weekStartDate)

  // Calculate end of week (6 days after start)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)

  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  // Get completed tasks for the week
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("scheduled_for", `${startDateStr}T00:00:00`)
    .lte("scheduled_for", `${endDateStr}T23:59:59`)

  if (tasksError) {
    return { success: false, error: "Failed to fetch tasks" }
  }

  // Get reflections for the week
  const { data: reflections, error: reflectionsError } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", `${startDateStr}T00:00:00`)
    .lte("created_at", `${endDateStr}T23:59:59`)

  if (reflectionsError) {
    return { success: false, error: "Failed to fetch reflections" }
  }

  // Get languages practiced this week
  const { data: languages, error: languagesError } = await supabase
    .from("user_languages")
    .select(`
      *,
      language:language_id (name)
    `)
    .eq("user_id", userId)
    .gte("last_practiced", startDateStr)
    .lte("last_practiced", endDateStr)

  if (languagesError) {
    return { success: false, error: "Failed to fetch languages" }
  }

  // Calculate total XP from tasks
  const taskXP = tasks ? tasks.reduce((sum, task) => sum + (task.xp_reward || 0), 0) : 0

  // Prepare language names
  const languageNames = languages ? (languages.map((l) => l.language?.name).filter(Boolean) as string[]) : []

  // Create the report data
  const reportData = {
    tasks: tasks || [],
    reflections: reflections || [],
    languages: languages || [],
    totalXP: taskXP,
    tasksCompleted: tasks ? tasks.length : 0,
    reflectionsCount: reflections ? reflections.length : 0,
    languagesPracticed: languageNames,
  }

  // Save the report to the database
  const { data: report, error } = await supabase
    .from("weekly_reports")
    .insert([
      {
        user_id: userId,
        week_start: startDateStr,
        week_end: endDateStr,
        xp_gained: taskXP,
        tasks_completed: tasks ? tasks.length : 0,
        reflections_count: reflections ? reflections.length : 0,
        languages_practiced: languageNames,
        report_data: reportData,
      },
    ])
    .select()
    .single()

  if (error) {
    return { success: false, error: "Failed to save report" }
  }

  return { success: true, data: report }
}
