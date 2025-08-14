"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { DataService } from "@/lib/dataService"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updatePassword: (password: string) => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Persistent storage key
const AUTH_STORAGE_KEY = "job_tracker_auth_state"

// Restore authentication state from local storage
const restoreAuthState = () => {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Save authentication state to local storage
const saveAuthState = (user: User | null, session: Session | null) => {
  if (typeof window === "undefined") return
  try {
    if (user && session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, session }))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch (error) {
    console.warn("Failed to save auth state:", error)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // The initial state does not depend on local storage to avoid hydration errors
  const [authState, setAuthState] = useState({
    user: null as User | null,
    session: null as Session | null,
    loading: true,
  })

  const [isInitialized, setIsInitialized] = useState(false)

  // Unified method to update authentication state
  const updateAuthState = useCallback((user: User | null, session: Session | null) => {
    setAuthState({ user, session, loading: false })
    saveAuthState(user, session)
  }, [])

  useEffect(() => {
    // Only initialize authentication state on the client side
    const initializeAuth = async () => {
      try {
        // First try to restore state from local storage
        const restored = restoreAuthState()
        if (restored?.user && restored?.session) {
          setAuthState({
            user: restored.user,
            session: restored.session,
            loading: true, // Still need to verify session validity
          })
        }

        // Get current session from Supabase
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.warn("Failed to get session:", error)
          updateAuthState(null, null)
        } else {
          updateAuthState(session?.user ?? null, session)

          // If the user is logged in, automatically switch to Supabase
          if (session?.user) {
            DataService.setDatabaseProvider("supabase")
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("dataSourceChanged"))
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        updateAuthState(null, null)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [updateAuthState])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.session) {
        // On successful login, update state
        updateAuthState(data.user, data.session)

        // After successful login, automatically switch to Supabase
        DataService.setDatabaseProvider("supabase")
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("dataSourceChanged"))
        }
      }

      return { error }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      DataService.setDatabaseProvider("mock")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dataSourceChanged"))
      }

      // Small delay to allow components to process the provider change
      await new Promise((resolve) => setTimeout(resolve, 100))

      await supabase.auth.signOut()
      // Clear state after logout
      updateAuthState(null, null)
    } catch (error) {
      console.error("Sign out error:", error)
      // Ensure we still switch to mock data even if signOut fails
      DataService.setDatabaseProvider("mock")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dataSourceChanged"))
      }
      updateAuthState(null, null)
    }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    })
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    return { error }
  }

  const value = {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signIn,
    signOut,
    updatePassword,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
