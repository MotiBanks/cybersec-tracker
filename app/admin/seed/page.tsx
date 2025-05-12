"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SeedDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const seedDatabase = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/seed-database")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-green-500/30 bg-black/50 backdrop-blur-sm text-green-400">
        <CardHeader>
          <CardTitle className="text-green-500">Seed Database</CardTitle>
          <CardDescription className="text-green-300/80">
            Populate your database with initial data for badges, languages, mood suggestions, and hack challenges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-300/80 mb-4">
            This will add sample data to your database. It's safe to run multiple times as it will update existing
            records rather than creating duplicates.
          </p>

          {result && (
            <div
              className={`p-3 rounded-md border ${
                result.success ? "border-green-500/50 bg-green-900/20" : "border-red-500/50 bg-red-900/20"
              } mb-4`}
            >
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <p className="text-sm">{result.success ? result.message : result.error}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={seedDatabase}
            disabled={loading}
            className="w-full border-green-500/20 bg-black hover:bg-green-900/20 text-green-400"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Database...
              </>
            ) : (
              "Seed Database"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
