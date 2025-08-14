"use client"

import React, { useEffect } from "react"
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

  // Ensure Supabase is used when user is logged in
  useEffect(() => {
    if (user && currentProvider !== 'supabase') {
      DataService.setDatabaseProvider("supabase")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dataSourceChanged"))
      }
    }
  }, [user, currentProvider])

  // Paths that are not protected
  const isPublicPage = pathname === '/login' || pathname === '/reset-password' || pathname.startsWith('/auth/')

  // If it is a public page, render directly
  if (isPublicPage) {
    return <>{children}</>
  }

  // Show loading state during authentication status loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login page when using Supabase but not logged in
  if (currentProvider === 'supabase' && !user) {
    router.push('/login')
    return null
  }

  // Render normally in other cases
  return <>{children}</>
}
