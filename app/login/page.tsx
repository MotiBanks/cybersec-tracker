"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { getBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const signupSchema = z.object({
  handle: z.string().min(2, "Handle must be at least 2 characters").max(20, "Handle must be less than 20 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  
  // Signup form
  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      handle: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })
  
  // Magic link form
  const magicLinkForm = useForm<z.infer<typeof magicLinkSchema>>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  })
  
  // Handle login submission
  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    try {
      const supabase = getBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      
      if (error) {
        toast.error(error.message)
        return
      }
      
      toast.success("Logged in successfully")
      
      // Force a hard navigation to dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Login error:", error)
      toast.error("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle signup submission
  async function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true)
    try {
      const supabase = getBrowserClient()
      
      // Sign up the user with their email and password
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            // Store the handle in the user's metadata
            handle: values.handle,
            // Set display name to the handle for better visibility in Supabase dashboard
            name: values.handle
          }
        },
      })
      
      if (error) {
        toast.error(error.message)
        return
      }
      
      // Also store the handle in localStorage for immediate use
      localStorage.setItem('userHandle', values.handle)
      
      // If we have a user, create a profile in the users table
      if (data.user) {
        try {
          // Create a user profile with the handle using a special RPC function
          // This bypasses RLS policies by using server-side function
          const { error: rpcError } = await supabase.rpc('create_user_profile', {
            user_id: data.user.id,
            user_name: values.handle,
            initial_xp: 0,
            initial_level: 1
          });
          
          if (rpcError) {
            console.error("Error creating user profile via RPC:", rpcError)
            
            // Fallback: Try direct insert with service role key
            // Note: This would require a server-side API endpoint in production
            toast.warning("Creating user profile through alternative method...")
            
            // For now, we'll store this in localStorage as a flag
            localStorage.setItem('needsProfile', 'true')
            localStorage.setItem('profileData', JSON.stringify({
              id: data.user.id,
              username: values.handle,
              email: values.email
            }))
          } else {
            toast.success("Profile created successfully!")
          }
        } catch (profileErr) {
          console.error("Error creating profile:", profileErr)
          toast.error("Could not create profile, but you can still log in")
        }
      }
      
      toast.success("Account created successfully! Welcome, " + values.handle)
      
      // Force a hard navigation to dashboard
      window.location.href = "/dashboard"
      setActiveTab("login")
    } catch (error) {
      console.error("Signup error:", error)
      toast.error("An error occurred during signup")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle magic link submission
  async function onMagicLinkSubmit(values: z.infer<typeof magicLinkSchema>) {
    setIsLoading(true)
    try {
      const supabase = getBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        toast.error(error.message)
        return
      }
      
      toast.success("Check your email for the magic link")
      magicLinkForm.reset()
    } catch (error) {
      console.error("Magic link error:", error)
      toast.error("An error occurred sending the magic link")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4 px-4 sm:px-6">
      <Card className="w-full max-w-md border-green-500/20 bg-black/50 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Cybersecurity Learning Tracker
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-green-500/20">
              <TabsTrigger value="login" className="text-xs sm:text-sm data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400">Sign Up</TabsTrigger>
              <TabsTrigger value="magic" className="text-xs sm:text-sm data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400">Magic Link</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-black" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Sign Up Form */}
            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                  <FormField
                    control={signupForm.control}
                    name="handle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Handle</FormLabel>
                        <FormControl>
                          <Input placeholder="CyberNinja" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-green-400/70">This is how we'll address you in the app</p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-black" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Magic Link Form */}
            <TabsContent value="magic">
              <Form {...magicLinkForm}>
                <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
                  <FormField
                    control={magicLinkForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-black" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending link..." : "Send magic link"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
          <div className="text-center text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
              Back to home
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
