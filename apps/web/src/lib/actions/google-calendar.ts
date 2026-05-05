'use server'

import { createClient } from '@/lib/supabase/server'

// ── Sign in with Google ──────────────────────────────────────────────
export async function signInWithGoogle(next?: string): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly',
      queryParams: {
        access_type: 'offline',
        prompt:      'consent',
      },
    },
  })

  if (error || !data.url) return { url: null, error: error?.message ?? 'Failed to start Google sign-in' }
  return { url: data.url, error: null }
}

// ── Sync Google Calendar → availability_blocks ────────────────────────
export async function syncGoogleCalendar(): Promise<{ synced: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { synced: 0, error: 'Not authenticated' }

  const { data: connection } = await supabase
    .from('calendar_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single()

  if (!connection?.access_token) {
    return { synced: 0, error: 'No Google Calendar connected. Sign in with Google first.' }
  }

  // Fetch next 4 weeks of events
  const now     = new Date()
  const in4weeks = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

  const params = new URLSearchParams({
    timeMin:      now.toISOString(),
    timeMax:      in4weeks.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '250',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${connection.access_token}` } }
  )

  if (!res.ok) {
    if (res.status === 401) {
      await supabase.from('calendar_connections').delete()
        .eq('user_id', user.id).eq('provider', 'google')
      return { synced: 0, error: 'Google Calendar access expired. Please sign in with Google again.' }
    }
    const err = await res.json().catch(() => ({}))
    return { synced: 0, error: (err as any).error?.message ?? 'Failed to fetch calendar' }
  }

  const { items = [] } = await res.json()

  // Delete existing Google-sourced blocks for this user (refresh)
  await supabase
    .from('availability_blocks')
    .delete()
    .eq('user_id', user.id)
    .eq('source', 'google')
    .gte('end_time', now.toISOString())

  // Insert new blocks from calendar events
  const blocksToInsert: {
    user_id: string
    start_time: string
    end_time: string
    label: string | null
    source: string
    event_id: null
  }[] = []

  for (const event of items) {
    if (!event.start?.dateTime) continue // skip all-day events

    blocksToInsert.push({
      user_id:   user.id,
      start_time: event.start.dateTime,
      end_time:   event.end?.dateTime ?? event.start.dateTime,
      label:     event.summary ?? null,
      source:    'google',
      event_id:  null,
    })
  }

  if (blocksToInsert.length > 0) {
    const { error } = await supabase.from('availability_blocks').insert(blocksToInsert)
    if (error) return { synced: 0, error: error.message }
  }

  return { synced: blocksToInsert.length, error: null }
}

// ── Check if user has Google Calendar connected ──────────────────────
export async function getCalendarConnection(): Promise<{ connected: boolean; provider: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { connected: false, provider: null }

  const { data } = await supabase
    .from('calendar_connections')
    .select('provider')
    .eq('user_id', user.id)
    .single()

  return { connected: !!data, provider: data?.provider ?? null }
}

// ── Save provider token client-side after OAuth ──────────────────────
export async function saveCalendarToken(
  accessToken: string,
  refreshToken: string | null
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('calendar_connections')
    .upsert({
      user_id:       user.id,
      provider:      'google',
      access_token:  accessToken,
      refresh_token: refreshToken,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })
}
