import { createServiceClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"

// Input validation schema
const updateStreakSchema = z.object({
  userId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { userId } = updateStreakSchema.parse(body)
    
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
    
    // Call the database function to update the streak
    const { error: streakError } = await supabase.rpc("update_user_streak", {
      user_id: userId
    })
    
    if (streakError) {
      console.error("Error updating streak:", streakError)
      return NextResponse.json(
        { error: "Failed to update streak" },
        { status: 500 }
      )
    }
    
    // Get the updated user profile
    const { data: updatedUser, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()
    
    if (profileError) {
      console.error("Error fetching updated user profile:", profileError)
      return NextResponse.json(
        { error: "Failed to fetch updated profile" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: "Streak updated successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error in streak update API:", error)
    
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
