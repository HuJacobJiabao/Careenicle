"use client"

import type React from "react"
import { useEffect } from "react"
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

  // Paths that are not protected
  const isPublicPage = pathname === "/login" || pathname === "/reset-password" || pathname.startsWith("/auth/")

  useEffect(() => {
    // Only redirect if not on a public page and using Supabase without authentication
    if (!isPublicPage && !loading && currentProvider === "supabase" && !user) {
      router.push("/login")
    }
  }, [isPublicPage, loading, currentProvider, user, router])

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

  if (currentProvider === "supabase" && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Render normally in other cases
  return <>{children}</>
}
