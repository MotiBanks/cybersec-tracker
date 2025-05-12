import { createServiceClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"

// Input validation schema
const generateReportSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().optional(),
  format: z.enum(["json", "markdown", "csv"]).optional().default("json")
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { userId, date, format } = generateReportSchema.parse(body)
    
    // Create server client with admin privileges
    const supabase = createServiceClient()
    
    // Verify the user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // Call the database function to generate the weekly summary
    const { data: reportId, error: rpcError } = await supabase.rpc("generate_weekly_summary", {
      user_id: userId,
      week_start_date: date || new Date().toISOString()
    })
    
    if (rpcError) {
      console.error("Error generating report:", rpcError)
      return NextResponse.json(
        { error: "Failed to generate report" },
        { status: 500 }
      )
    }
    
    // Get the generated report
    const { data: report, error: reportError } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("id", reportId)
      .single()
    
    if (reportError) {
      console.error("Error fetching generated report:", reportError)
      return NextResponse.json(
        { error: "Failed to fetch generated report" },
        { status: 500 }
      )
    }
    
    // Return the report in the requested format
    if (format === "markdown") {
      return new NextResponse(report.markdown_content || "", {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="weekly-report-${report.week_start.split("T")[0]}.md"`
        }
      })
    } else if (format === "csv") {
      return new NextResponse(report.csv_content || "", {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="weekly-report-${report.week_start.split("T")[0]}.csv"`
        }
      })
    } else {
      // Default to JSON
      return NextResponse.json(report)
    }
  } catch (error) {
    console.error("Error in report generation API:", error)
    
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
