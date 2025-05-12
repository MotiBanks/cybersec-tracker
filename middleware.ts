import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/auth/callback"]

export async function middleware(request: NextRequest) {
  // Check if the route is public
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  try {
    // Create a Supabase client
    const supabase = createServerClient()
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    // If there's no session and the route requires authentication, redirect to login
    if (!session && !publicRoutes.includes(request.nextUrl.pathname)) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Continue with the request
    return NextResponse.next()
  } catch (error) {
    console.error("Error in middleware:", error)
    
    // In case of an error, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
