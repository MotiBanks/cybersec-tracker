import { BookOpen } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function ProgressTracker() {
  const courses = [
    {
      id: 1,
      title: "Introduction to Cybersecurity Tools & Cyber Attacks",
      progress: 100,
      completed: true,
    },
    {
      id: 2,
      title: "Cybersecurity Roles, Processes & Operating System Security",
      progress: 75,
      completed: false,
    },
    {
      id: 3,
      title: "Cybersecurity Compliance Framework & System Administration",
      progress: 30,
      completed: false,
    },
    {
      id: 4,
      title: "Network Security & Database Vulnerabilities",
      progress: 0,
      completed: false,
    },
    {
      id: 5,
      title: "Penetration Testing, Incident Response and Forensics",
      progress: 0,
      completed: false,
    },
  ]

  const overallProgress = courses.reduce((sum, course) => sum + course.progress, 0) / courses.length

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-green-500" />
          <h3 className="text-sm font-medium text-green-300">IBM Cybersecurity Certificate</h3>
        </div>
        <span className="text-xs text-green-300/80">{Math.round(overallProgress)}% complete</span>
      </div>

      <Progress
        value={overallProgress}
        className="h-2 mb-4 bg-green-900/30"
        indicatorClassName="bg-gradient-to-r from-green-500 to-cyan-500"
      />

      <div className="space-y-3">
        {courses.map((course) => (
          <div key={course.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <h4 className={`text-xs ${course.completed ? "text-green-300" : "text-green-400"}`}>{course.title}</h4>
              <span className="text-xs text-green-300/80">{course.progress}%</span>
            </div>
            <Progress
              value={course.progress}
              className="h-1.5 bg-green-900/30"
              indicatorClassName={`${
                course.completed ? "bg-green-500" : "bg-gradient-to-r from-green-500/80 to-cyan-500/80"
              }`}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-center text-green-300/60">9 more courses to complete</div>
    </div>
  )
}
