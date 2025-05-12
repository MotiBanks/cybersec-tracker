"use client"

import { useState } from "react"
import { Calendar, Clock, BookOpen, Code, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useNotification } from "@/context/notification-context"

export default function DailySchedule() {
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [animatingTask, setAnimatingTask] = useState<number | null>(null)
  const [showXpGain, setShowXpGain] = useState<{ id: number; xp: number } | null>(null)
  const { showNotification } = useNotification()

  const tasks = [
    {
      id: 1,
      time: "09:00 - 10:30",
      title: "edX Course: Network Security Basics",
      type: "course",
      icon: <BookOpen className="w-4 h-4 text-blue-400" />,
      xp: 100,
    },
    {
      id: 2,
      time: "11:00 - 12:00",
      title: "Python: Build a Port Scanner",
      type: "coding",
      icon: <Code className="w-4 h-4 text-purple-400" />,
      xp: 150,
    },
    {
      id: 3,
      time: "14:00 - 15:30",
      title: "Bash Scripting: Automate Log Analysis",
      type: "project",
      icon: <Terminal className="w-4 h-4 text-green-400" />,
      xp: 200,
    },
  ]

  const toggleTaskCompletion = (taskId: number) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter((id) => id !== taskId))
    } else {
      setAnimatingTask(taskId)
      const task = tasks.find((t) => t.id === taskId)

      setTimeout(() => {
        setCompletedTasks([...completedTasks, taskId])
        setShowXpGain({ id: taskId, xp: task?.xp || 0 })

        showNotification({
          message: "Task completed!",
          description: `You earned +${task?.xp || 0} XP`,
          variant: "success",
        })

        setTimeout(() => {
          setAnimatingTask(null)
          setTimeout(() => setShowXpGain(null), 1500)
        }, 500)
      }, 300)
    }
  }

  const completionPercentage = (completedTasks.length / tasks.length) * 100

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-500 micro-movement" />
          <h3 className="text-sm font-medium text-green-300">Today's Schedule</h3>
        </div>
        <span className="text-xs text-green-300/80">
          {completedTasks.length}/{tasks.length} completed
        </span>
      </div>

      <Progress
        value={completionPercentage}
        className="h-1.5 mb-4 bg-green-900/30"
        indicatorClassName="bg-gradient-to-r from-green-500 to-cyan-500"
      />

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-3 rounded border relative ${
              completedTasks.includes(task.id)
                ? "border-green-500/30 bg-green-900/20"
                : "border-green-500/10 bg-black/30 hover-scale"
            } ${animatingTask === task.id ? "task-complete" : ""}`}
          >
            <div className="flex items-start">
              <div className="mr-3 mt-0.5 hover-scale">{task.icon}</div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-medium ${
                      completedTasks.includes(task.id) ? "text-green-300 line-through" : "text-green-400"
                    }`}
                  >
                    {task.title}
                  </h4>
                  <span className="text-xs text-green-300/60">+{task.xp} XP</span>
                </div>

                <div className="flex items-center mt-1 text-xs text-green-300/60">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{task.time}</span>
                </div>
              </div>
            </div>

            {showXpGain && showXpGain.id === task.id && (
              <div className="absolute top-0 right-4 text-green-400 font-bold text-sm xp-gain">+{showXpGain.xp} XP</div>
            )}

            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className={`text-xs h-7 px-2 hover-scale ${
                  completedTasks.includes(task.id)
                    ? "bg-green-900/30 hover:bg-green-900/40 border-green-500/30"
                    : "bg-black hover:bg-green-900/20 border-green-500/20"
                }`}
                onClick={() => toggleTaskCompletion(task.id)}
              >
                {completedTasks.includes(task.id) ? "Completed" : "Mark Complete"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-4 border-green-500/20 bg-black hover:bg-green-900/20 text-green-400 hover-scale"
      >
        Adjust Schedule
      </Button>
    </div>
  )
}
