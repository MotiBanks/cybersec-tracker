import { createServiceClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"

// Input validation schemas
const taskIdSchema = z.object({
  id: z.string().uuid()
})

const createTaskSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  task_type: z.string().min(1, "Task type is required"),
  scheduled_for: z.string().optional().nullable(),
  duration_minutes: z.number().int().positive().optional().nullable(),
  xp_reward: z.number().int().positive().default(10),
  recurring_pattern: z.string().optional().nullable()
})

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  task_type: z.string().min(1, "Task type is required").optional(),
  scheduled_for: z.string().optional().nullable(),
  duration_minutes: z.number().int().positive().optional().nullable(),
  xp_reward: z.number().int().positive().optional(),
  recurring_pattern: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  completed_at: z.string().optional().nullable()
})

// GET handler for fetching tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const date = searchParams.get("date")
    const taskId = searchParams.get("id")
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }
    
    const supabase = createServiceClient()
    
    // If a specific task ID is provided, return that task
    if (taskId) {
      const { data: task, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .eq("user_id", userId) // Security check
        .single()
      
      if (error) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        )
      }
      
      return NextResponse.json(task)
    }
    
    // If a date is provided, return tasks for that date
    if (date) {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .gte("scheduled_for", `${date}T00:00:00`)
        .lt("scheduled_for", `${date}T23:59:59`)
        .order("scheduled_for", { ascending: true })
      
      if (error) {
        console.error("Error fetching tasks for date:", error)
        return NextResponse.json(
          { error: "Failed to fetch tasks" },
          { status: 500 }
        )
      }
      
      return NextResponse.json(tasks || [])
    }
    
    // Otherwise, return all tasks for the user
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_for", { ascending: true })
    
    if (error) {
      console.error("Error fetching tasks:", error)
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(tasks || [])
  } catch (error) {
    console.error("Error in GET tasks API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST handler for creating a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const taskData = createTaskSchema.parse(body)
    
    const supabase = createServiceClient()
    
    // Create the task
    const { data: task, error } = await supabase
      .from("tasks")
      .insert([{
        user_id: taskData.userId,
        title: taskData.title,
        description: taskData.description,
        task_type: taskData.task_type,
        scheduled_for: taskData.scheduled_for,
        duration_minutes: taskData.duration_minutes,
        xp_reward: taskData.xp_reward,
        recurring_pattern: taskData.recurring_pattern,
        completed: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error("Error creating task:", error)
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 }
      )
    }
    
    // If the task is scheduled for today, create a calendar event for it
    if (taskData.scheduled_for) {
      const today = new Date()
      const taskDate = new Date(taskData.scheduled_for)
      
      if (
        taskDate.getDate() === today.getDate() &&
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getFullYear() === today.getFullYear()
      ) {
        try {
          await supabase.from("calendar_events").insert([{
            user_id: taskData.userId,
            title: taskData.title,
            description: taskData.description || null,
            start_time: taskData.scheduled_for,
            end_time: taskData.duration_minutes
              ? new Date(new Date(taskData.scheduled_for).getTime() + taskData.duration_minutes * 60000).toISOString()
              : null,
            event_type: "task",
            task_id: task.id
          }])
        } catch (calendarError) {
          console.error("Error creating calendar event:", calendarError)
          // Continue anyway, task was created
        }
      }
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error("Error in POST tasks API:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH handler for updating a task
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, ...updates } = updateTaskSchema.parse(body)
    
    const supabase = createServiceClient()
    
    // Update the task
    const { data: task, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId) // Security check
      .select()
      .single()
    
    if (error) {
      console.error("Error updating task:", error)
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 }
      )
    }
    
    // If the task is marked as complete, update streak and XP
    if (updates.completed === true) {
      try {
        // Add XP for task completion
        await supabase.rpc("increment_user_xp", {
          user_id: userId,
          xp_amount: task.xp_reward,
          source: "task",
          source_id: id
        })
        
        // Update user streak
        await supabase.rpc("update_user_streak", {
          user_id: userId
        })
      } catch (dbError) {
        console.error("Error updating XP or streak:", dbError)
        // Continue anyway, task was updated
      }
    }
    
    // If the scheduled time changed, update the calendar event
    if (updates.scheduled_for) {
      try {
        const { data: calendarEvents } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("task_id", id)
        
        if (calendarEvents && calendarEvents.length > 0) {
          await supabase
            .from("calendar_events")
            .update({
              start_time: updates.scheduled_for,
              end_time: updates.duration_minutes
                ? new Date(new Date(updates.scheduled_for).getTime() + updates.duration_minutes * 60000).toISOString()
                : calendarEvents[0].end_time
            })
            .eq("task_id", id)
        }
      } catch (calendarError) {
        console.error("Error updating calendar event:", calendarError)
        // Continue anyway, task was updated
      }
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error("Error in PATCH tasks API:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE handler for deleting a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")
    
    if (!id || !userId) {
      return NextResponse.json(
        { error: "Task ID and User ID are required" },
        { status: 400 }
      )
    }
    
    const supabase = createServiceClient()
    
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
      return NextResponse.json(
        { error: "Failed to delete task" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE tasks API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
