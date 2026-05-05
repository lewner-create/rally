'use server'

import { createClient } from '@/lib/supabase/server'

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
  tier?: number
}

export type UpcomingPlan = {
  id: string
  title: string
  event_type: string
  starts_at: string
  ends_at: string | null
  group_id: string
  group_name: string
  group_color: string | null
  group_banner: string | null
  my_rsvp: string | null
  going_count: number
  maybe_count: number
  attendees: MemberPreview[]
}

export type NeedsYouItem = {
  id: string
  kind: 'rsvp'
  group_id: string
  group_name: string
  group_color: string | null
  title: string
  sub: string
}

export type GroupActivity = {
  id: string
  name: string
  theme_color: string | null
  member_count: number
  last_activity: string | null
  unread: number
}

// ── Upcoming plans across all groups ────────────────────────────
export async function getUpcomingPlans(userId: string): Promise<UpcomingPlan[]> {
  const supabase = await createClient()

  // Get all group IDs the user belongs to
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  const groupIds = (memberships ?? []).map(m => m.group_id)
  if (groupIds.length === 0) return []

  const now = new Date().toISOString()

  const { data: events } = await supabase
    .from('events')
    .select(`
      id, title, event_type, starts_at, ends_at, group_id, banner_url,
      groups(id, name, theme_color, banner_url),
      event_attendees(user_id, rsvp_status, profiles:user_id(id, display_name, username, avatar_url))
    `)
    .in('group_id', groupIds)
    .eq('status', 'published')
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(10)

  return (events ?? []).map(e => {
    const attendees = (e.event_attendees ?? []) as any[]
    const myRsvp    = attendees.find(a => a.user_id === userId)?.rsvp_status ?? null
    const going     = attendees.filter(a => a.rsvp_status === 'yes')
    const maybe     = attendees.filter(a => a.rsvp_status === 'maybe')
    const group     = e.groups as any

    return {
      id:           e.id,
      title:        e.title,
      event_type:   e.event_type,
      starts_at:    e.starts_at,
      ends_at:      e.ends_at,
      group_id:     e.group_id,
      group_name:   group?.name ?? '',
      group_color:  group?.theme_color ?? null,
      group_banner: group?.banner_url ?? null,
      my_rsvp:      myRsvp,
      going_count:  going.length,
      maybe_count:  maybe.length,
      attendees:    going.slice(0, 5).map((a: any) => a.profiles).filter(Boolean),
    }
  })
}

// ── Events needing user's RSVP ──────────────────────────────────
export async function getNeedsYouItems(userId: string): Promise<NeedsYouItem[]> {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, theme_color)')
    .eq('user_id', userId)

  const groupIds = (memberships ?? []).map((m: any) => m.group_id)
  if (groupIds.length === 0) return []

  const now     = new Date().toISOString()
  const in2wks  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // Get upcoming published events in the user's groups
  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at, group_id, groups(name, theme_color)')
    .in('group_id', groupIds)
    .eq('status', 'published')
    .gte('starts_at', now)
    .lte('starts_at', in2wks)
    .order('starts_at', { ascending: true })

  if (!events || events.length === 0) return []

  // Check which ones the user has already RSVPed to
  const eventIds = events.map(e => e.id)
  const { data: rsvps } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('user_id', userId)
    .in('event_id', eventIds)

  const rsvpedIds = new Set((rsvps ?? []).map(r => r.event_id))

  return events
    .filter(e => !rsvpedIds.has(e.id))
    .slice(0, 3)
    .map(e => {
      const group = e.groups as any
      const dt    = new Date(e.starts_at)
      const today = new Date(); today.setHours(0,0,0,0)
      const diff  = Math.floor((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const when  = diff === 0 ? 'Tonight' : diff === 1 ? 'Tomorrow' :
        dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const time  = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

      return {
        id:         e.id,
        kind:       'rsvp' as const,
        group_id:   e.group_id,
        group_name: group?.name ?? '',
        group_color:group?.theme_color ?? null,
        title:      e.title,
        sub:        `${when} · ${time}`,
      }
    })
}

// ── Groups with last activity for compact list ──────────────────
export async function getGroupsActivity(userId: string): Promise<GroupActivity[]> {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, theme_color), last_read_at')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return []

  const results: GroupActivity[] = []

  for (const m of memberships) {
    const group = m.groups as any
    if (!group) continue

    const { count: memberCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)

    // Last message
    const { data: lastMsg } = await supabase
      .from('chat_messages')
      .select('content, created_at, message_type')
      .eq('group_id', group.id)
      .eq('message_type', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Unread count
    const lastRead = (m as any).last_read_at
    let unread = 0
    if (lastRead) {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)
        .gt('created_at', lastRead)
        .eq('message_type', 'user')
      unread = count ?? 0
    }

    const lastActivity = lastMsg?.content
      ? (lastMsg.content.length > 40 ? lastMsg.content.slice(0, 40) + '…' : lastMsg.content)
      : null

    results.push({
      id:            group.id,
      name:          group.name,
      theme_color:   group.theme_color,
      member_count:  memberCount ?? 0,
      last_activity: lastActivity,
      unread,
    })
  }

  return results
}

// ── Keep existing getGroupsWithWindows ──────────────────────────
export async function getGroupsWithWindows(userId: string): Promise<GroupWithWindows[]> {
  const supabase = await createClient()
  const { getOpenWindows } = await import('@/lib/actions/windows')

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, slug, theme_color, banner_url, description)')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return []

  const groups = memberships.map((m: any) => m.groups).filter(Boolean)
  const results: GroupWithWindows[] = []

  for (const group of groups) {
    const { data: members } = await supabase
      .from('group_members')
      .select('profiles(id, display_name, username, avatar_url)')
      .eq('group_id', group.id)
      .limit(6)

    const memberProfiles: MemberPreview[] = (members ?? [])
      .map((m: any) => m.profiles)
      .filter(Boolean) as MemberPreview[]

    let nextWindow: GroupWithWindows['next_window'] = null
    try {
      const windows = await getOpenWindows(group.id)
      if (windows && windows.length > 0) {
        const w = windows[0] as any
        nextWindow = {
          label:      w.label ?? '',
          day:        w.day ?? '',
          start_hour: Number(w.start_hour ?? w.startHour ?? 0),
          end_hour:   Number(w.end_hour ?? w.endHour ?? 0),
          members:    (w.members ?? []) as MemberPreview[],
        }
      }
    } catch {}

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
