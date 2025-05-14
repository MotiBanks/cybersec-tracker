import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

// Create a single supabase client for the browser
const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

// Singleton pattern for client-side Supabase client
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const getBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient should only be called in the browser')
  }
  
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}

// Admin client with service role for privileged operations
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Singleton pattern for server-side admin client
let serviceClient: ReturnType<typeof createAdminClient> | null = null

// Get or create the service client with admin privileges
export const getServiceClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getServiceClient should only be called on the server')
  }
  
  if (!serviceClient) {
    serviceClient = createAdminClient()
  }
  return serviceClient
}

// Helper function to get the current user
export const getCurrentUser = async () => {
  const supabase = getBrowserClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error("Error getting session:", error.message)
    return null
  }
  
  return session?.user || null
}

// Helper function to subscribe to realtime changes
export const subscribeToChanges = (
  table: string,
  callback: (payload: any) => void,
  filter?: { event: 'INSERT' | 'UPDATE' | 'DELETE'; schema: string; filter: string }
) => {
  const supabase = getBrowserClient()
  
  const channel = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes' as any, // Type assertion to fix TypeScript error
      filter || { event: '*', schema: 'public', table },
      (payload: any) => { // Explicitly type the payload parameter
        callback(payload)
      }
    )
    .subscribe()
    
  return () => {
    supabase.removeChannel(channel)
  }
}

// Helper function to handle auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  const supabase = getBrowserClient()
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  
  return () => {
    subscription.unsubscribe()
  }
}
