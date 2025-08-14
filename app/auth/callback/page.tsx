'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=callback_error')
          return
        }

        if (data.session) {
          // Check if this is a new user (from invitation) who needs to set password
          const user = data.session.user
          
          // Check if user metadata indicates this is an invited user
          // Supabase sets email_confirmed_at when user confirms email from invitation
          const isNewUser = user.email_confirmed_at && !user.last_sign_in_at
          
          if (isNewUser) {
            // New invited user - redirect to set password page
            router.push('/reset-password')
          } else {
            // Existing user - redirect to main app
            router.push('/')
          }
        } else {
          // No session, redirect to login
          router.push('/login')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/login?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing invitation...</p>
      </div>
    </div>
  )
}
