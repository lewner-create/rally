import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  // ── Access gate ───────────────────────────────────────────────
  // Check if this email is approved in access_requests.
  // Admin client bypasses RLS so we can read any row.
  const admin = createAdminClient()
  const { data: request_ } = await admin
    .from('access_requests')
    .select('status')
    .eq('email', user.email?.toLowerCase() ?? '')
    .maybeSingle()

  // Also allow if they were invited directly via inviteUserByEmail
  // (those users are auto-confirmed by Supabase, check user metadata)
  const isInvited = user.user_metadata?.invited === true ||
                    user.app_metadata?.provider === 'email' && user.email_confirmed_at

  const isApproved = request_?.status === 'approved'

  if (!isApproved && !isInvited) {
    // Sign them out and delete the auto-created auth user
    await supabase.auth.signOut()
    try {
      await admin.auth.admin.deleteUser(user.id)
    } catch {
      // Best effort — don't fail the redirect if delete fails
    }
    return NextResponse.redirect(
      `${origin}/request-access?error=not_approved`
    )
  }

  // ── Calendar connections (existing logic) ─────────────────────
  try {
    const accessToken  = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    if (accessToken) {
      await supabase.from('calendar_connections').upsert({
        user_id:       user.id,
        provider:      'google',
        access_token:  accessToken,
        refresh_token: refreshToken,
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'user_id,provider' })
    }
  } catch {
    // calendar_connections may not exist yet — silent
  }

  return NextResponse.redirect(`${origin}${next}`)
}
