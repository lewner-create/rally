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

  // ── 1. Same-group events on the same date ─────────────────────────────────
  // Flag any published event in this group on the same calendar day
  const date = startsAt.split('T')[0]
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
      group_name:    '',   // same group, label handled in UI
      conflict_type: 'same_group',
    })
  }

  // ── 2. Personal conflicts — events the user RSVPd yes to that time-overlap ─
  // Overlap condition: existing.starts_at < new.ends_at AND existing.ends_at > new.starts_at
  const { data: rsvps } = await supabase
    .from('event_attendees')
    .select(`
      events (
        id, title, starts_at, ends_at,
        groups ( name )
      )
    `)
    .eq('user_id', user.id)
    .eq('rsvp_status', 'yes')
    .neq('events.group_id', groupId)   // exclude same group (already covered above)
    .lt('events.starts_at', endsAt)
    .gt('events.ends_at', startsAt)

  for (const row of rsvps ?? []) {
    const ev    = row.events as any
    const group = ev?.groups as any
    if (!ev?.id) continue
    conflicts.push({
      id:            ev.id,
      title:         ev.title,
      starts_at:     ev.starts_at,
      ends_at:       ev.ends_at,
      group_name:    group?.name ?? 'another group',
      conflict_type: 'personal',
    })
  }

  return conflicts
}
