import { getBrowserClient, subscribeToChanges } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type Task = Database["public"]["Tables"]["tasks"]["Row"]
type InsertTask = Database["public"]["Tables"]["tasks"]["Insert"]
type UpdateTask = Database["public"]["Tables"]["tasks"]["Update"]

export const TasksService = {
  // Get all tasks for a user
  async getUserTasks(userId: string): Promise<Task[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_for", { ascending: true })

    if (error) {
      console.error("Error fetching tasks:", error)
      throw error
    }

    return data || []
  },

  // Get tasks for a specific date
  async getTasksForDate(userId: string, date: string): Promise<Task[]> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .gte("scheduled_for", `${date}T00:00:00`)
      .lt("scheduled_for", `${date}T23:59:59`)

    if (error) {
      console.error("Error fetching tasks for date:", error)
      throw error
    }

    return data || []
  },

  // Get upcoming tasks
  async getUpcomingTasks(userId: string, limit = 5): Promise<Task[]> {
    const supabase = getBrowserClient()
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .gte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching upcoming tasks:", error)
      throw error
    }

    return data || []
  },

  // Create a new task
  async createTask(task: InsertTask): Promise<Task> {
    const supabase = getBrowserClient()
    
    try {
      // First, ensure the user profile exists
      const { data: userCheck, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", task.user_id)
        .single()
      
      if (userCheckError || !userCheck) {
        console.log("User profile doesn't exist, creating it first...")
        
        // Create a basic user profile
        const defaultProfile = {
          id: task.user_id,
          username: `user_${task.user_id.substring(0, 6)}`,
          xp: 0,
          level: 1,
          streak_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Try to create the user profile
        const { error: insertError } = await supabase
          .from("users")
          .insert(defaultProfile)
        
        if (insertError) {
          console.error("Error creating user profile before task:", insertError)
          
          // Try upsert as fallback
          const { error: upsertError } = await supabase
            .from("users")
            .upsert(defaultProfile)
          
          if (upsertError) {
            console.error("Failed to create user profile, cannot create task:", upsertError)
            throw new Error("Failed to create user profile before task")
          }
        }
      }
      
      // Now create the task
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .insert([task])
        .select()
        .single()

      if (taskError) {
        console.error("Error creating task:", taskError)
        throw taskError
      }
      
      // If the task is scheduled for today, create a calendar event for it
      if (taskData && task.scheduled_for) {
        const today = new Date()
        const taskDate = new Date(task.scheduled_for)
        
        if (taskDate.getDate() === today.getDate() && 
            taskDate.getMonth() === today.getMonth() && 
            taskDate.getFullYear() === today.getFullYear()) {
          try {
            await supabase.from("calendar_events").insert([{
              user_id: task.user_id,
              title: task.title,
              description: task.description || null,
              start_time: task.scheduled_for,
              end_time: task.duration_minutes ? 
                new Date(new Date(task.scheduled_for).getTime() + (task.duration_minutes * 60000)).toISOString() : 
                null,
              event_type: "task",
              task_id: taskData.id
            }])
          } catch (calendarError) {
            console.error("Error creating calendar event:", calendarError)
            // Continue anyway, task was created
          }
        }
      }
      
      return taskData
    } catch (err) {
      console.error("Unexpected error in createTask:", err)
      throw err
    }
  },

  // Update a task
  async updateTask(id: string, updates: UpdateTask): Promise<Task> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating task:", error)
      throw error
    }

    // If the task's scheduled_for date was updated, update any associated calendar event
    if (updates.scheduled_for) {
      try {
        const { data: calendarEvent } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("task_id", id)
          .single()
        
        if (calendarEvent) {
          await supabase
            .from("calendar_events")
            .update({
              start_time: updates.scheduled_for,
              end_time: updates.duration_minutes ? 
                new Date(new Date(updates.scheduled_for).getTime() + (updates.duration_minutes * 60000)).toISOString() : 
                calendarEvent.end_time
            })
            .eq("task_id", id)
        }
      } catch (calendarError) {
        console.error("Error updating calendar event:", calendarError)
        // Continue anyway, task was updated
      }
    }

    return data
  },

  // Mark a task as complete
  async completeTask(id: string, userId: string): Promise<Task> {
    const supabase = getBrowserClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("tasks")
      .update({
        completed: true,
        completed_at: now
      })
      .eq("id", id)
      .eq("user_id", userId) // Security check
      .select()
      .single()

    if (error) {
      console.error("Error completing task:", error)
      throw error
    }

    // Update user XP and streak using database functions
    try {
      // Add XP for task completion
      await supabase.rpc("increment_user_xp", {
        user_id: userId,
        xp_amount: data.xp_reward,
        source: "task",
        source_id: id
      })
      
      // Update user streak
      await supabase.rpc("update_user_streak", {
        user_id: userId
      })
    } catch (dbError) {
      console.error("Error updating XP or streak:", dbError)
      // Continue anyway, task was marked complete
    }

    return data
  },

  // Delete a task
  async deleteTask(id: string, userId: string): Promise<void> {
    const supabase = getBrowserClient()
    
    // Delete associated calendar events first
    try {
      await supabase
        .from("calendar_events")
        .delete()
        .eq("task_id", id)
        .eq("user_id", userId) // Security check
    } catch (calendarError) {
      console.error("Error deleting calendar events:", calendarError)
      // Continue with task deletion anyway
    }
    
    // Delete the task
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId) // Security check

    if (error) {
      console.error("Error deleting task:", error)
      throw error
    }
  },
  
  // Get recurring tasks and create new instances
  async processRecurringTasks(userId: string): Promise<void> {
    const supabase = getBrowserClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get all recurring tasks for the user
    const { data: recurringTasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .not("recurring_pattern", "is", null)
    
    if (error) {
      console.error("Error fetching recurring tasks:", error)
      throw error
    }
    
    // Process each recurring task
    for (const task of recurringTasks || []) {
      if (!task.recurring_pattern) continue
      
      // Parse the recurring pattern (e.g., "daily", "weekly", "monthly")
      const pattern = task.recurring_pattern.toLowerCase()
      const lastScheduled = task.scheduled_for ? new Date(task.scheduled_for) : null
      
      if (!lastScheduled) continue
      
      let nextDate: Date | null = null
      
      // Calculate the next occurrence based on the pattern
      if (pattern === "daily") {
        nextDate = new Date(lastScheduled)
        nextDate.setDate(nextDate.getDate() + 1)
      } else if (pattern === "weekly") {
        nextDate = new Date(lastScheduled)
        nextDate.setDate(nextDate.getDate() + 7)
      } else if (pattern === "monthly") {
        nextDate = new Date(lastScheduled)
        nextDate.setMonth(nextDate.getMonth() + 1)
      }
      
      // If we have a next date and it's today or in the past, create a new task instance
      if (nextDate && nextDate <= today) {
        try {
          // Create a new task instance
          await supabase.from("tasks").insert([{
            user_id: task.user_id,
            title: task.title,
            description: task.description,
            task_type: task.task_type,
            scheduled_for: nextDate.toISOString(),
            duration_minutes: task.duration_minutes,
            completed: false,
            completed_at: null,
            xp_reward: task.xp_reward,
            recurring_pattern: task.recurring_pattern
          }])
          
          // Update the original task's scheduled_for to the next date
          await supabase
            .from("tasks")
            .update({ scheduled_for: nextDate.toISOString() })
            .eq("id", task.id)
        } catch (createError) {
          console.error("Error creating recurring task instance:", createError)
          // Continue with other tasks
        }
      }
    }
  },
  
  // Subscribe to task changes for a user
  subscribeToTasks(userId: string, callback: (payload: any) => void) {
    return subscribeToChanges(
      "tasks",
      callback,
      { event: 'INSERT', schema: 'public', filter: `user_id=eq.${userId}` }
    )
  }
}
