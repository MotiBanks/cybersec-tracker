import { getBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"]
type InsertCalendarEvent = Database["public"]["Tables"]["calendar_events"]["Insert"]
type UpdateCalendarEvent = Database["public"]["Tables"]["calendar_events"]["Update"]

export const CalendarService = {
  // Get events for a specific month
  async getEventsForMonth(userId: string, year: number, month: number): Promise<CalendarEvent[]> {
    const supabase = getBrowserClient()

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", `${startDate}T00:00:00`)
      .lte("start_time", `${endDate}T23:59:59`)

    if (error) {
      console.error("Error fetching calendar events:", error)
      throw error
    }

    return data || []
  },

  // Get events for a specific date
  async getEventsForDate(userId: string, date: string): Promise<CalendarEvent[]> {
    const supabase = getBrowserClient()

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", `${date}T00:00:00`)
      .lt("start_time", `${date}T23:59:59`)

    if (error) {
      console.error("Error fetching events for date:", error)
      throw error
    }

    return data || []
  },

  // Create a new event
  async createEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase.from("calendar_events").insert([event]).select().single()

    if (error) {
      console.error("Error creating event:", error)
      throw error
    }

    return data
  },

  // Update an event
  async updateEvent(id: string, updates: UpdateCalendarEvent): Promise<CalendarEvent> {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from("calendar_events")
      .update(updates)
      .eq("id", id)
      .eq("user_id", updates.user_id) // Security check
      .select()
      .single()

    if (error) {
      console.error("Error updating event:", error)
      throw error
    }

    return data
  },

  // Delete an event
  async deleteEvent(id: string, userId: string): Promise<void> {
    const supabase = getBrowserClient()
    const { error } = await supabase.from("calendar_events").delete().eq("id", id).eq("user_id", userId) // Security check

    if (error) {
      console.error("Error deleting event:", error)
      throw error
    }
  },
}
