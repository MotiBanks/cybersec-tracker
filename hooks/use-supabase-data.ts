"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/context/user-context"
import { TasksService } from "@/services/tasks-service"
import { ReflectionsService } from "@/services/reflections-service"
import { BadgesService } from "@/services/badges-service"
import { MoodService } from "@/services/mood-service"
import { CalendarService } from "@/services/calendar-service"
import { WeeklyReportService } from "@/services/weekly-report-service"
import { UserService, type UserProfile } from "@/services/user-service"
import type { Database } from "@/types/database.types"

// Types
type Task = Database["public"]["Tables"]["tasks"]["Row"]
type Reflection = Database["public"]["Tables"]["reflections"]["Row"]
type Badge = Database["public"]["Tables"]["badges"]["Row"]
type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"] & { badge: Badge }
type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"]
type WeeklyReport = Database["public"]["Tables"]["weekly_reports"]["Row"]

export function useSupabaseData() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!user) return null

    try {
      setLoading(true)
      const profile = await UserService.getUserProfile(user.id)

      if (!profile) {
        // Create a new profile if it doesn't exist
        const newProfile = await UserService.upsertUserProfile({
          id: user.id,
          username: user.email?.split("@")[0] || null,
          email: user.email,
          level: 1,
          xp: 0,
          streak_count: 0,
          last_active_date: null,
          profile_image_url: null,
        })
        setUserProfile(newProfile)
      } else {
        setUserProfile(profile)
      }

      return profile
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update user streak
  const updateStreak = useCallback(async () => {
    if (!user) return null

    try {
      const updatedProfile = await UserService.updateUserStreak(user.id)
      setUserProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    }
  }, [user])

  // Tasks
  const getTasks = useCallback(async () => {
    if (!user) return []

    try {
      return await TasksService.getUserTasks(user.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    }
  }, [user])

  const getTasksForDate = useCallback(
    async (date: string) => {
      if (!user) return []

      try {
        return await TasksService.getTasksForDate(user.id, date)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return []
      }
    },
    [user],
  )

  const createTask = useCallback(
    async (task: Omit<Database["public"]["Tables"]["tasks"]["Insert"], "user_id">) => {
      if (!user) return null

      try {
        return await TasksService.createTask({
          ...task,
          user_id: user.id,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return null
      }
    },
    [user],
  )

  const completeTask = useCallback(
    async (taskId: string) => {
      if (!user) return null

      try {
        const task = await TasksService.completeTask(taskId, user.id)

        // Refresh user profile to get updated XP
        await loadUserProfile()

        return task
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return null
      }
    },
    [user, loadUserProfile],
  )

  // Reflections
  const getReflections = useCallback(async () => {
    if (!user) return []

    try {
      return await ReflectionsService.getUserReflections(user.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    }
  }, [user])

  const createReflection = useCallback(
    async (content: string, tags?: string[]) => {
      if (!user) return null

      try {
        const reflection = await ReflectionsService.createReflection({
          user_id: user.id,
          content,
          tags,
        })

        // Refresh user profile to get updated XP
        await loadUserProfile()

        return reflection
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return null
      }
    },
    [user, loadUserProfile],
  )

  // Badges
  const getBadges = useCallback(async () => {
    try {
      return await BadgesService.getAllBadges()
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    }
  }, [])

  const getUserBadges = useCallback(async () => {
    if (!user) return []

    try {
      return await BadgesService.getUserBadges(user.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    }
  }, [user])

  const checkForNewBadges = useCallback(async () => {
    if (!user) return []

    try {
      return await BadgesService.checkForNewBadges(user.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    }
  }, [user])

  // Moods
  const recordMood = useCallback(
    async (moodType: string) => {
      if (!user) return null

      try {
        return await MoodService.recordMood(user.id, moodType)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return null
      }
    },
    [user],
  )

  const getLatestMood = useCallback(async () => {
    if (!user) return null

    try {
      return await MoodService.getLatestMood(user.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    }
  }, [user])

  const getMoodSuggestions = useCallback(async (moodType: string, count?: number) => {
    try {
      return await MoodService.getRandomSuggestions(moodType, count)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    }
  }, [])

  // Calendar
  const getEventsForMonth = useCallback(
    async (year: number, month: number) => {
      if (!user) return []

      try {
        return await CalendarService.getEventsForMonth(user.id, year, month)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return []
      }
    },
    [user],
  )

  const getEventsForDate = useCallback(
    async (date: string) => {
      if (!user) return []

      try {
        return await CalendarService.getEventsForDate(user.id, date)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return []
      }
    },
    [user],
  )

  const createEvent = useCallback(
    async (event: Omit<Database["public"]["Tables"]["calendar_events"]["Insert"], "user_id">) => {
      if (!user) return null

      try {
        return await CalendarService.createEvent({
          ...event,
          user_id: user.id,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return null
      }
    },
    [user],
  )

  // Weekly Reports
  const generateWeeklyReport = useCallback(
    async (date?: Date) => {
      if (!user) return null

      try {
        return await WeeklyReportService.generateWeeklyReport(user.id, date)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return null
      }
    },
    [user],
  )

  const getUserWeeklyReports = useCallback(async () => {
    if (!user) return []

    try {
      return await WeeklyReportService.getUserWeeklyReports(user.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    }
  }, [user])

  const exportReportAsMarkdown = useCallback(async (report: WeeklyReport) => {
    try {
      return await WeeklyReportService.exportReportAsMarkdown(report)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return ""
    }
  }, [])

  // Load user profile on mount
  useEffect(() => {
    if (user) {
      loadUserProfile()
      updateStreak()
    }
  }, [user, loadUserProfile, updateStreak])

  return {
    loading,
    error,
    userProfile,
    loadUserProfile,
    updateStreak,

    // Tasks
    getTasks,
    getTasksForDate,
    createTask,
    completeTask,

    // Reflections
    getReflections,
    createReflection,

    // Badges
    getBadges,
    getUserBadges,
    checkForNewBadges,

    // Moods
    recordMood,
    getLatestMood,
    getMoodSuggestions,

    // Calendar
    getEventsForMonth,
    getEventsForDate,
    createEvent,

    // Weekly Reports
    generateWeeklyReport,
    getUserWeeklyReports,
    exportReportAsMarkdown,
  }
}
