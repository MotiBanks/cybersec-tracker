import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  
  if (code) {
    const supabase = createServerClient()
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
    
    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  
  // If no code is present, redirect to login
  return NextResponse.redirect(new URL("/login", request.url))
}
