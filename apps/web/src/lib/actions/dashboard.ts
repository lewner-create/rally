'use server'

import { createClient } from '@/lib/supabase/server'
import { getOpenWindows } from '@/lib/actions/windows'

export type MemberPreview = {
  id: string
  display_name: string | null
  username: string
  avatar_url: string | null
}

export type GroupWithWindows = {
  id: string
  name: string
  slug: string
  theme_color: string | null
  banner_url: string | null
  description: string | null
  member_count: number
  members: MemberPreview[]
  next_window: {
    label: string
    day: string
    start_hour: number
    end_hour: number
    members: MemberPreview[]
  } | null
}

export type UpcomingEvent = {
  id: string
  title: string
  event_type: string
  starts_at: string
  ends_at: string | null
  location: string | null
  banner_url: string | null
  group_id: string
  group_name: string
  group_theme_color: string | null
  going_count: number
  total_count: number
  user_rsvp: string | null  // 'yes' | 'maybe' | 'no' | null
}

// ─── Upcoming events across all groups ──────────────────────────────────────

export async function getUpcomingEventsForUser(userId: string, groupIds: string[]): Promise<UpcomingEvent[]> {
  if (groupIds.length === 0) return []

  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select(`
      id, title, event_type, starts_at, ends_at, location, banner_url, group_id,
      groups ( id, name, theme_color ),
      event_attendees ( user_id, rsvp_status )
    `)
    .in('group_id', groupIds)
    .in('status', ['published'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(6)

  if (!events) return []

  return events.map((e: any) => {
    const attendees: { user_id: string; rsvp_status: string }[] = e.event_attendees ?? []
    const goingCount = attendees.filter(a => a.rsvp_status === 'yes').length
    const userRsvp   = attendees.find(a => a.user_id === userId)?.rsvp_status ?? null

    return {
      id:                e.id,
      title:             e.title,
      event_type:        e.event_type,
      starts_at:         e.starts_at,
      ends_at:           e.ends_at,
      location:          e.location ?? null,
      banner_url:        e.banner_url ?? null,
      group_id:          e.group_id,
      group_name:        e.groups?.name ?? '',
      group_theme_color: e.groups?.theme_color ?? null,
      going_count:       goingCount,
      total_count:       attendees.length,
      user_rsvp:         userRsvp,
    }
  })
}

// ─── Groups with windows ─────────────────────────────────────────────────────

export async function getGroupsWithWindows(userId: string): Promise<GroupWithWindows[]> {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups (
        id, name, slug, theme_color, banner_url, description
      )
    `)
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return []

  const groups = memberships
    .map((m) => m.groups)
    .filter(Boolean) as Array<{
      id: string; name: string; slug: string;
      theme_color: string | null; banner_url: string | null; description: string | null
    }>

  const results: GroupWithWindows[] = []

  for (const group of groups) {
    const { data: members } = await supabase
      .from('group_members')
      .select('profiles(id, display_name, username, avatar_url)')
      .eq('group_id', group.id)
      .limit(6)

    const memberProfiles: MemberPreview[] = (members ?? [])
      .map((m) => m.profiles)
      .filter(Boolean) as MemberPreview[]

    let nextWindow: GroupWithWindows['next_window'] = null
    try {
      const windows = await getOpenWindows(group.id)
      if (windows && windows.length > 0) {
        const w = windows[0] as any
        const startHour = w.start_hour ?? w.startHour ?? w.start ?? 0
        const endHour   = w.end_hour   ?? w.endHour   ?? w.end   ?? 0
        nextWindow = {
          label:      w.label ?? '',
          day:        w.day ?? '',
          start_hour: Number(startHour),
          end_hour:   Number(endHour),
          members:    (w.members ?? []) as MemberPreview[],
        }
      }
    } catch {
      // no windows yet
    }

    results.push({
      id:           group.id,
      name:         group.name,
      slug:         group.slug,
      theme_color:  group.theme_color,
      banner_url:   group.banner_url,
      description:  group.description,
      member_count: memberProfiles.length,
      members:      memberProfiles,
      next_window:  nextWindow,
    })
  }

  return results
}
