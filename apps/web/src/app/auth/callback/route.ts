import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data.session) {
      // Store provider token for Calendar API access
      const providerToken        = data.session.provider_token
      const providerRefreshToken = data.session.provider_refresh_token

      if (providerToken) {
        // Upsert calendar connection with tokens
        await supabase.from('calendar_connections').upsert({
          user_id:       data.session.user.id,
          provider:      'google',
          access_token:  providerToken,
          refresh_token: providerRefreshToken ?? null,
          updated_at:    new Date().toISOString(),
        }, { onConflict: 'user_id,provider' })
      }

      // Check if new user needs onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, preferences')
        .eq('id', data.session.user.id)
        .single()

      const needsOnboarding = !profile?.preferences?.onboarded
      const redirectTo = needsOnboarding ? '/onboarding' : next

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
