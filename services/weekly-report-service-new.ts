import { getBrowserClient, subscribeToChanges } from "@/lib/supabase"
import type { Database } from "@/types/database.types"

type WeeklyReport = Database["public"]["Tables"]["weekly_reports"]["Row"]

export const WeeklyReportService = {
  // Generate a weekly report for a user
  async generateWeeklyReport(userId: string, date?: Date): Promise<WeeklyReport> {
    const supabase = getBrowserClient()
    const reportDate = date || new Date()
    
    // Call the database function to generate the weekly summary
    const { data: reportId, error: rpcError } = await supabase.rpc('generate_weekly_summary', {
      user_id: userId,
      week_start_date: reportDate.toISOString()
    })
    
    if (rpcError) {
      console.error("Error generating weekly report:", rpcError)
      throw rpcError
    }
    
    // Get the generated report
    const { data: report, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("id", reportId)
      .single()
      
    if (error) {
      console.error("Error fetching generated report:", error)
      throw error
    }
    
    return report
  },

  // Get all weekly reports for a user
  async getUserWeeklyReports(userId: string): Promise<WeeklyReport[]> {
    const supabase = getBrowserClient()

    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })

    if (error) {
      console.error("Error fetching weekly reports:", error)
      throw error
    }

    return data || []
  },
  
  // Get a specific weekly report
  async getWeeklyReport(reportId: string, userId: string): Promise<WeeklyReport | null> {
    const supabase = getBrowserClient()

    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", userId) // Security check
      .single()

    if (error) {
      console.error("Error fetching weekly report:", error)
      return null
    }

    return data
  },

  // Export a report as markdown
  async exportReportAsMarkdown(reportId: string, userId: string): Promise<string> {
    const supabase = getBrowserClient()
    
    // Get the report with its markdown content
    const { data: report, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", userId) // Security check
      .single()
      
    if (error) {
      console.error("Error fetching report for markdown export:", error)
      throw error
    }
    
    // Return the pre-generated markdown content
    return report.markdown_content || this.generateMarkdownFromReport(report)
  },
  
  // Export a report as CSV
  async exportReportAsCSV(reportId: string, userId: string): Promise<string> {
    const supabase = getBrowserClient()
    
    // Get the report with its CSV content
    const { data: report, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", userId) // Security check
      .single()
      
    if (error) {
      console.error("Error fetching report for CSV export:", error)
      throw error
    }
    
    // Return the pre-generated CSV content
    return report.csv_content || this.generateCSVFromReport(report)
  },
  
  // Export a report as JSON
  async exportReportAsJSON(reportId: string, userId: string): Promise<string> {
    const supabase = getBrowserClient()
    
    // Get the report with its JSON data
    const { data: report, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", userId) // Security check
      .single()
      
    if (error) {
      console.error("Error fetching report for JSON export:", error)
      throw error
    }
    
    // Return the report data as JSON string
    return JSON.stringify(report.report_data || {}, null, 2)
  },
  
  // Generate markdown from report (fallback if pre-generated content is not available)
  generateMarkdownFromReport(report: WeeklyReport): string {
    // Format dates
    const weekStart = new Date(report.week_start)
    const weekEnd = new Date(report.week_end)
    const formattedStart = weekStart.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    const formattedEnd = weekEnd.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    // Generate markdown
    let markdown = `# Weekly Learning Report\n\n`
    markdown += `**Week of ${formattedStart} to ${formattedEnd}**\n\n`
    markdown += `## Summary\n\n`
    markdown += `- XP Gained: ${report.xp_gained || 0}\n`
    markdown += `- Tasks Completed: ${report.tasks_completed || 0}\n`
    markdown += `- Reflections Written: ${report.reflections_count || 0}\n`

    if (report.languages_practiced && report.languages_practiced.length > 0) {
      markdown += `- Languages Practiced: ${report.languages_practiced.join(", ")}\n`
    } else {
      markdown += `- Languages Practiced: None\n`
    }

    return markdown
  },
  
  // Generate CSV from report (fallback if pre-generated content is not available)
  generateCSVFromReport(report: WeeklyReport): string {
    let csv = "Metric,Value\n"
    csv += `XP Gained,${report.xp_gained || 0}\n`
    csv += `Tasks Completed,${report.tasks_completed || 0}\n`
    csv += `Reflections Written,${report.reflections_count || 0}\n`
    
    if (report.languages_practiced && report.languages_practiced.length > 0) {
      csv += `Languages Practiced,"${report.languages_practiced.join(", ")}"\n`
    } else {
      csv += `Languages Practiced,"None"\n`
    }
    
    return csv
  },
  
  // Subscribe to weekly report changes for a user
  subscribeToWeeklyReports(userId: string, callback: (payload: any) => void) {
    return subscribeToChanges(
      "weekly_reports",
      callback,
      { event: 'INSERT', schema: 'public', filter: `user_id=eq.${userId}` }
    )
  }
}
