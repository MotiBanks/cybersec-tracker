"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getBrowserClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

type UserContextType = {
  user: User | null
  loading: boolean
  userProfile: any | null
  refreshUserProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  userProfile: null,
  refreshUserProfile: async () => {},
})

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await getBrowserClient().auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = getBrowserClient().auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await getBrowserClient().from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return
    }

    if (data) {
      setUserProfile(data)
    } else {
      // Create a new user profile if it doesn't exist
      const { data: newUser, error: createError } = await getBrowserClient()
        .from("users")
        .insert([{ id: userId }])
        .select()
        .single()

      if (createError) {
        console.error("Error creating user profile:", createError)
        return
      }

      setUserProfile(newUser)
    }
  }

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, userProfile, refreshUserProfile }}>{children}</UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
