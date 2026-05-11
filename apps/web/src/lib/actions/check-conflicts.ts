'use server'

import { createClient } from '@/lib/supabase/server'

export interface ConflictEvent {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  group_name: string
  conflict_type: 'same_group' | 'personal'
}

export async function checkEventConflicts(
  groupId: string,
  startsAt: string,  // ISO e.g. "2026-05-15T18:00:00"
  endsAt: string,
): Promise<ConflictEvent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const conflicts: ConflictEvent[] = []

  // ── 1. Same-group events on the same calendar day ─────────────────────────
  const date     = startsAt.split('T')[0]
  const dayStart = `${date}T00:00:00`
  const dayEnd   = `${date}T23:59:59`

  const { data: groupEvents } = await supabase
    .from('events')
    .select('id, title, starts_at, ends_at')
    .eq('group_id', groupId)
    .eq('status', 'published')
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)

  for (const ev of groupEvents ?? []) {
    conflicts.push({
      id:            ev.id,
      title:         ev.title,
      starts_at:     ev.starts_at,
      ends_at:       ev.ends_at,
      group_name:    '',
      conflict_type: 'same_group',
    })
  }

  // ── 2. Personal conflicts — events user RSVPd yes to that overlap ─────────
  // First: get IDs of events user is going to (excluding this group)
  const { data: rsvps } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('user_id', user.id)
    .eq('rsvp_status', 'yes')

  const rsvpEventIds = (rsvps ?? []).map(r => r.event_id).filter(Boolean)
  if (rsvpEventIds.length === 0) return conflicts

  // Then: fetch those events that overlap in time and are in a different group
  const { data: overlapping } = await supabase
    .from('events')
    .select('id, title, starts_at, ends_at, group_id, groups(name)')
    .in('id', rsvpEventIds)
    .neq('group_id', groupId)
    .eq('status', 'published')
    .lt('starts_at', endsAt)
    .gt('ends_at', startsAt)

  for (const ev of overlapping ?? []) {
    const groupName = (ev.groups as any)?.name ?? 'another group'
    conflicts.push({
      id:            ev.id,
      title:         ev.title,
      starts_at:     ev.starts_at,
      ends_at:       ev.ends_at,
      group_name:    groupName,
      conflict_type: 'personal',
    })
  }

  return conflicts
}
