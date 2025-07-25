import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { BadgeNotificationProvider } from "@/context/badge-notification-context"

export const metadata: Metadata = {
  title: "CyberTrack - Cybersecurity Learning Tracker",
  description: "Track your cybersecurity learning journey with gamification and adaptive learning",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <BadgeNotificationProvider>
            {children}
          </BadgeNotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
