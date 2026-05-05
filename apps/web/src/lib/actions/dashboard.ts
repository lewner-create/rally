'use server'

import { createClient } from '@/lib/supabase/server'
import { getOpenWindows } from '@/lib/actions/windows'

// ── Shared types ─────────────────────────────────────────────────

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

export type UpcomingPlan = {
  id: string
  title: string
  starts_at: string
  group_name: string
  group_color: string | null
  group_banner: string | null
  going_count: number
  maybe_count: number
  my_rsvp: string | null
  attendees: MemberPreview[]
}

export type NeedsYouItem = {
  id: string
  title: string
  sub: string
  group_name: string
  group_color: string | null
}

export type GroupActivity = {
  id: string
  name: string
  theme_color: string | null
  member_count: number
  last_activity: string | null
  unread: number
}

// ── Groups with availability windows ─────────────────────────────

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
          label: w.label ?? '',
          day: w.day ?? '',
          start_hour: Number(startHour),
          end_hour: Number(endHour),
          members: (w.members ?? []) as MemberPreview[],
        }
      }
    } catch {
      // no windows yet
    }

    results.push({
      id: group.id,
      name: group.name,
      slug: group.slug,
      theme_color: group.theme_color,
      banner_url: group.banner_url,
      description: group.description,
      member_count: memberProfiles.length,
      members: memberProfiles,
      next_window: nextWindow,
    })
  }

  return results
}

// ── Upcoming plans (all events across user's groups) ─────────────

export async function getUpcomingPlans(userId: string): Promise<UpcomingPlan[]> {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  const groupIds = (memberships ?? []).map(m => m.group_id).filter(Boolean)
  if (groupIds.length === 0) return []

  const { data: events } = await supabase
    .from('events')
    .select(`
      id, title, starts_at, group_id,
      groups ( id, name, theme_color, banner_url ),
      event_attendees (
        user_id, rsvp_status,
        profiles:user_id ( id, display_name, username, avatar_url )
      )
    `)
    .in('group_id', groupIds)
    .gt('starts_at', new Date().toISOString())
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: true })
    .limit(10)

  return (events ?? []).map(e => {
    const attendees = (e.event_attendees ?? []) as any[]
    const g         = e.groups as any
    const myRsvp    = attendees.find(a => a.user_id === userId)?.rsvp_status ?? null
    const going     = attendees.filter(a => a.rsvp_status === 'yes')

    return {
      id:           e.id,
      title:        e.title,
      starts_at:    e.starts_at ?? '',
      group_name:   g?.name ?? '',
      group_color:  g?.theme_color ?? null,
      group_banner: g?.banner_url ?? null,
      going_count:  going.length,
      maybe_count:  attendees.filter(a => a.rsvp_status === 'maybe').length,
      my_rsvp:      myRsvp,
      attendees:    going.map((a: any) => a.profiles).filter(Boolean) as MemberPreview[],
    }
  })
}

// ── Needs you (unanswered events + plan cards) ───────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export async function getNeedsYouItems(userId: string): Promise<NeedsYouItem[]> {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  const groupIds = (memberships ?? []).map(m => m.group_id).filter(Boolean)
  if (groupIds.length === 0) return []

  // ── 1. Events the user hasn't RSVPd to ──────────────────────────
  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at, group_id, groups(name, theme_color)')
    .in('group_id', groupIds)
    .gt('starts_at', new Date().toISOString())
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: true })
    .limit(30)

  const eventIds = (events ?? []).map(e => e.id)

  const { data: myRsvps } = eventIds.length > 0
    ? await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', userId)
        .in('event_id', eventIds)
    : { data: [] }

  const rsvpdIds = new Set((myRsvps ?? []).map(r => r.event_id))

  const unrsvpdEvents: NeedsYouItem[] = (events ?? [])
    .filter(e => !rsvpdIds.has(e.id))
    .slice(0, 5)
    .map(e => {
      const g = e.groups as any
      return {
        id:         e.id,
        title:      e.title,
        sub:        fmtDate(e.starts_at),
        group_name: g?.name ?? '',
        group_color: g?.theme_color ?? null,
      }
    })

  // ── 2. Open plan cards the user hasn't responded to ─────────────
  const { data: planCards } = await supabase
    .from('plan_cards')
    .select('id, title, proposed_date, group_id, groups(name, theme_color)')
    .in('group_id', groupIds)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(30)

  const cardIds = (planCards ?? []).map(p => p.id)

  const { data: myResponses } = cardIds.length > 0
    ? await supabase
        .from('plan_card_responses')
        .select('plan_card_id')
        .eq('user_id', userId)
        .in('plan_card_id', cardIds)
    : { data: [] }

  const respondedIds = new Set((myResponses ?? []).map(r => r.plan_card_id))

  const unrespondedCards: NeedsYouItem[] = (planCards ?? [])
    .filter(p => !respondedIds.has(p.id))
    .slice(0, 5)
    .map(p => {
      const g = p.groups as any
      return {
        id:          p.id,
        title:       p.title,
        sub:         fmtDate((p as any).proposed_date),
        group_name:  g?.name ?? '',
        group_color: g?.theme_color ?? null,
      }
    })

  // Plan cards first (more urgent — waiting on a response), then events
  return [...unrespondedCards, ...unrsvpdEvents].slice(0, 6)
}
