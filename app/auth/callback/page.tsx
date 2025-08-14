"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const type = searchParams.get("type")
        const accessToken = searchParams.get("access_token")
        const refreshToken = searchParams.get("refresh_token")

        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          router.push("/login?error=callback_error")
          return
        }

        if (data.session) {
          if (type === "invite") {
            // User clicked invitation link - redirect to set password
            router.push("/reset-password?type=invite")
          } else if (type === "recovery") {
            // User clicked password reset link - redirect to reset password
            router.push("/reset-password?type=recovery")
          } else {
            // Regular login callback - redirect to main app
            router.push("/")
          }
        } else {
          // No session, redirect to login
          router.push("/login")
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error)
        router.push("/login?error=unexpected_error")
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  )
}
