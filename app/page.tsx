"use client"

import Link from "next/link"

// Temporarily commenting out components that may be causing errors
// We'll add them back one by one after fixing the basic structure
/*
import { useState } from "react"
import DashboardHeader from "@/components/dashboard-header"
import MoodSelector from "@/components/mood-selector"
import DailySchedule from "@/components/daily-schedule"
import ProgressTracker from "@/components/progress-tracker"
import HackOfTheDay from "@/components/hack-of-the-day"
import LevelProgress from "@/components/level-progress"
import ReflectionPrompt from "@/components/reflection-prompt"
import LanguageSkills from "@/components/language-skills"
import MobileNavigation from "@/components/mobile-navigation"
import BadgesView from "@/components/badges-view"
import CalendarView from "@/components/calendar-view"
import WeeklyReportExport from "@/components/weekly-report-export"
import { UserProvider } from "@/context/user-context"
import { NotificationProvider } from "@/context/notification-context"
*/

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-green-500 glitch-text">
          Cybersecurity Learning Tracker
        </h1>
        <p className="text-lg mb-8 max-w-2xl text-green-400 opacity-80">
          Track your cybersecurity learning journey, monitor progress,
          and maintain motivation through gamification.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-xs sm:max-w-md">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-green-500 bg-opacity-20 text-green-400 border border-green-500 rounded hover:bg-green-500 hover:bg-opacity-30 transition-colors w-full text-center"
          >
            Login
          </Link>
          <Link 
            href="/dashboard" 
            className="px-6 py-3 bg-transparent text-green-400 border border-green-500 rounded hover:bg-green-500 hover:bg-opacity-10 transition-colors w-full text-center"
          >
            View Dashboard
          </Link>
        </div>
        
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
          <div className="p-4 sm:p-6 bg-gray-900 bg-opacity-50 border border-green-500 border-opacity-30 rounded text-left">
            <h2 className="text-xl font-semibold mb-2 text-green-500">Track Progress</h2>
            <p className="text-green-400 opacity-80 text-sm sm:text-base">Monitor your learning journey with XP, streaks, and level progression.</p>
          </div>
          
          <div className="p-4 sm:p-6 bg-gray-900 bg-opacity-50 border border-green-500 border-opacity-30 rounded text-left">
            <h2 className="text-xl font-semibold mb-2 text-green-500">Reflect & Learn</h2>
            <p className="text-green-400 opacity-80 text-sm sm:text-base">Document insights and track your emotional state during learning.</p>
          </div>
          
          <div className="p-4 sm:p-6 bg-gray-900 bg-opacity-50 border border-green-500 border-opacity-30 rounded text-left">
            <h2 className="text-xl font-semibold mb-2 text-green-500">Build Skills</h2>
            <p className="text-green-400 opacity-80 text-sm sm:text-base">Track your programming language proficiency and practice history.</p>
          </div>
        </div>

        <div className="mt-8 text-xs text-green-500 opacity-60">
          © {new Date().getFullYear()} Cybersecurity Learning Tracker
        </div>
      </div>

      {/* Add some cyberpunk-style decorative elements */}
      <div className="fixed top-0 left-0 w-full h-1 bg-green-500 opacity-70"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-green-500 opacity-70"></div>
      <div className="fixed top-4 left-4 text-green-500 opacity-30 text-xs hidden sm:block">[SYS:ONLINE]</div>
      <div className="fixed bottom-4 right-4 text-green-500 opacity-30 text-xs hidden sm:block">[SECURE:CONN]</div>
    </main>
  )
}
