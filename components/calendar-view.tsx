"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/context/user-context"
import { getBrowserClient } from "@/lib/supabase"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"

export default function CalendarView() {
  const { user } = useUser()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateTasks, setSelectedDateTasks] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user, currentMonth])

  useEffect(() => {
    if (selectedDate) {
      const tasksForDate = tasks.filter((task) => isSameDay(new Date(task.scheduled_for), selectedDate))
      setSelectedDateTasks(tasksForDate)
    } else {
      setSelectedDateTasks([])
    }
  }, [selectedDate, tasks])

  const fetchTasks = async () => {
    if (!user) return
    setLoading(true)

    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd")
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd")

    const { data, error } = await getBrowserClient()
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .gte("scheduled_for", start)
      .lte("scheduled_for", end)

    if (error) {
      console.error("Error fetching tasks:", error)
      setLoading(false)
      return
    }

    setTasks(data || [])
    setLoading(false)
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
    setSelectedDate(null)
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate as Date) ? null : date)
  }

  const getDaysInMonth = () => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    })
  }

  const getTaskCountForDate = (date: Date) => {
    return tasks.filter((task) => isSameDay(new Date(task.scheduled_for), date)).length
  }

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-green-500" />
          <h3 className="text-sm font-medium text-green-300">Calendar</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8 text-green-400" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-green-300">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8 text-green-400" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-xs text-green-300/60 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth().map((date) => {
          const taskCount = getTaskCountForDate(date)
          const isSelected = selectedDate && isSameDay(date, selectedDate)

          return (
            <Button
              key={date.toString()}
              variant="ghost"
              size="sm"
              className={`h-10 p-0 relative ${
                isSelected
                  ? "bg-green-900/30 text-green-300 border border-green-500/50"
                  : "hover:bg-green-900/20 text-green-300/80"
              }`}
              onClick={() => handleDateClick(date)}
            >
              <span>{format(date, "d")}</span>
              {taskCount > 0 && <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-green-500"></span>}
            </Button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 pt-3 border-t border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-300">{format(selectedDate, "MMMM d, yyyy")}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Task
            </Button>
          </div>

          {selectedDateTasks.length === 0 ? (
            <div className="text-center py-3 text-green-300/60 text-xs">No tasks scheduled for this day</div>
          ) : (
            <div className="space-y-2">
              {selectedDateTasks.map((task) => (
                <div key={task.id} className="p-2 rounded border border-green-500/20 bg-black/30 text-xs">
                  <div className="font-medium text-green-300">{task.title}</div>
                  <div className="text-green-300/60 mt-1">
                    {task.time_start} - {task.time_end}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
