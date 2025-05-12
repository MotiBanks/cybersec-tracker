"use client"

import { getBrowserClient } from "@/lib/supabase"
import type { Provider } from "@supabase/supabase-js"
import { z } from "zod"

// Validation schemas
export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>
export type SignInFormValues = z.infer<typeof signInSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>

export const AuthService = {
  // Sign up with email and password
  async signUp({ email, password }: SignUpFormValues) {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error("Error signing up:", error.message)
      throw error
    }
    
    return data
  },
  
  // Sign in with email and password
  async signIn({ email, password }: SignInFormValues) {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error("Error signing in:", error.message)
      throw error
    }
    
    return data
  },
  
  // Sign in with magic link
  async signInWithMagicLink(email: string) {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error("Error sending magic link:", error.message)
      throw error
    }
    
    return data
  },
  
  // Sign in with OAuth provider
  async signInWithProvider(provider: Provider) {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error(`Error signing in with ${provider}:`, error.message)
      throw error
    }
    
    return data
  },
  
  // Sign out
  async signOut() {
    const supabase = getBrowserClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error("Error signing out:", error.message)
      throw error
    }
  },
  
  // Reset password
  async resetPassword(email: string) {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) {
      console.error("Error resetting password:", error.message)
      throw error
    }
    
    return data
  },
  
  // Update password
  async updatePassword(password: string) {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase.auth.updateUser({
      password,
    })
    
    if (error) {
      console.error("Error updating password:", error.message)
      throw error
    }
    
    return data
  },
  
  // Get current session
  async getSession() {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Error getting session:", error.message)
      throw error
    }
    
    return data.session
  },
  
  // Get current user
  async getUser() {
    const supabase = getBrowserClient()
    
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error("Error getting user:", error.message)
      throw error
    }
    
    return data.user
  },
}
