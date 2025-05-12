import { Code } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function LanguageSkills() {
  const languages = [
    { id: 1, name: "Python", progress: 65, lastPracticed: "2 days ago" },
    { id: 2, name: "Bash", progress: 40, lastPracticed: "1 week ago" },
    { id: 3, name: "JavaScript", progress: 55, lastPracticed: "3 days ago" },
    { id: 4, name: "SQL", progress: 30, lastPracticed: "5 days ago" },
    { id: 5, name: "PowerShell", progress: 25, lastPracticed: "2 weeks ago" },
    { id: 6, name: "C", progress: 15, lastPracticed: "3 weeks ago" },
    { id: 7, name: "C++", progress: 10, lastPracticed: "1 month ago" },
    { id: 8, name: "Go", progress: 5, lastPracticed: "Never" },
    { id: 9, name: "Assembly", progress: 0, lastPracticed: "Never" },
    { id: 10, name: "HTML/CSS", progress: 70, lastPracticed: "1 day ago" },
  ]

  return (
    <div className="p-4 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-sm">
      <div className="flex items-center mb-4">
        <Code className="w-5 h-5 mr-2 text-green-500" />
        <h3 className="text-sm font-medium text-green-300">Programming Languages</h3>
      </div>

      <div className="space-y-3">
        {languages.map((language) => (
          <div key={language.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <h4 className="text-xs text-green-400">{language.name}</h4>
              <div className="flex items-center">
                <span className="text-xs text-green-300/80 mr-2">{language.progress}%</span>
                <span className="text-xs text-green-300/60">{language.lastPracticed}</span>
              </div>
            </div>
            <Progress
              value={language.progress}
              className="h-1.5 bg-green-900/30"
              indicatorClassName={getColorForLanguage(language.name)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function getColorForLanguage(language: string): string {
  const colors: Record<string, string> = {
    Python: "bg-blue-500",
    Bash: "bg-gray-500",
    JavaScript: "bg-yellow-500",
    SQL: "bg-orange-500",
    PowerShell: "bg-blue-400",
    C: "bg-purple-500",
    "C++": "bg-purple-600",
    Go: "bg-cyan-500",
    Assembly: "bg-red-500",
    "HTML/CSS": "bg-pink-500",
  }

  return colors[language] || "bg-green-500"
}
