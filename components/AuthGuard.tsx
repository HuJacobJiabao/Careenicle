"use client"

import React from "react"
import { useAuth } from "@/lib/auth-context"
import { DataService } from "@/lib/dataService"
import { usePathname, useRouter } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const currentProvider = DataService.getDatabaseProvider()
  const pathname = usePathname()
  const router = useRouter()

  // Don't protect the login page itself
  const isLoginPage = pathname === '/login'

  // Show loading state
  if (loading && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If using Supabase and not authenticated, redirect to login page
  if (currentProvider === 'supabase' && !user && !isLoginPage) {
    router.push('/login')
    return null
  }

  // Otherwise, render the children (main app)
  return <>{children}</>
}
