'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveCalendarToken } from '@/lib/actions/google-calendar'

export function OAuthTokenCapture() {
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
          session?.provider_token &&
          session?.user?.app_metadata?.provider === 'google'
        ) {
          // Save the provider token that's only available client-side
          await saveCalendarToken(
            session.provider_token,
            session.provider_refresh_token ?? null
          )
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return null
}
