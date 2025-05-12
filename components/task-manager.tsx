"use client"

import { useState, useEffect } from "react"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, CheckCircle } from "lucide-react"

export default function TaskManager() {
  const { getTasks, createTask, completeTask } = useSupabaseData()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDate, setNewTaskDate] = useState("")

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    const fetchedTasks = await getTasks()
    setTasks(fetchedTasks)
    setLoading(false)
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return

    await createTask({
      title: newTaskTitle,
      task_type: "custom",
      scheduled_for: newTaskDate ? `${newTaskDate}T12:00:00` : null,
      xp_reward: 50,
    })

    setNewTaskTitle("")
    setNewTaskDate("")
    loadTasks()
  }

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId)
    loadTasks()
  }

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center mb-4">
        <Calendar className="w-5 h-5 mr-2 text-green-500" />
        <h3 className="text-sm font-medium text-green-300">Task Manager</h3>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New task title"
          className="bg-black border-green-500/20 text-green-300"
        />
        <Input
          type="date"
          value={newTaskDate}
          onChange={(e) => setNewTaskDate(e.target.value)}
          className="bg-black border-green-500/20 text-green-300 w-40"
        />
        <Button
          variant="outline"
          size="sm"
          className="border-green-500/20 bg-black hover:bg-green-900/20 text-green-400"
          onClick={handleCreateTask}
        >
          Add
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-green-300/60">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-4 text-green-300/60">No tasks yet. Create your first task!</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded border ${
                task.completed ? "border-green-500/30 bg-green-900/20" : "border-green-500/10 bg-black/30"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-medium ${
                        task.completed ? "text-green-300 line-through" : "text-green-400"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <span className="text-xs text-green-300/60">+{task.xp_reward} XP</span>
                  </div>

                  {task.scheduled_for && (
                    <div className="flex items-center mt-1 text-xs text-green-300/60">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{new Date(task.scheduled_for).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {!task.completed && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2 bg-black hover:bg-green-900/20 border-green-500/20"
                    onClick={() => handleCompleteTask(task.id)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
