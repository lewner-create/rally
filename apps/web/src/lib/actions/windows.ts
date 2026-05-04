'use server'

import { createClient } from '@/lib/supabase/server'
import type { DayKey, WeeklyAvailability } from './availability'

export interface MemberProfile {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

export interface OpenWindow {
  start: Date
  end: Date
  availableCount: number
  totalCount: number
  availableUserIds: string[]
  members: MemberProfile[]
}

// day index (getDay()) → DayKey
const DAY_KEYS: Record<number, DayKey> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

// Generate 3-hour candidate slots for weekday evenings + weekend blocks
function generateCandidateSlots(from: Date, days: number): { start: Date; end: Date }[] {
  const slots: { start: Date; end: Date }[] = []

  for (let d = 0; d < days; d++) {
    const date = new Date(from)
    date.setDate(date.getDate() + d)
    date.setHours(0, 0, 0, 0)

    const dow       = date.getDay()
    const isWeekend = dow === 0 || dow === 6

    const windows = isWeekend
      ? [[10, 13], [13, 16], [16, 19], [19, 22]]
      : [[17, 20], [18, 21], [19, 22]]

    for (const [startH, endH] of windows) {
      const start = new Date(date); start.setHours(startH, 0, 0, 0)
      const end   = new Date(date); end.setHours(endH,   0, 0, 0)
      slots.push({ start, end })
    }
  }

  return slots
}

export async function getOpenWindows(groupId: string): Promise<OpenWindow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get members + their profile-level availability
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, display_name, username, avatar_url, weekly_availability)')
    .eq('group_id', groupId)

  if (!members || members.length === 0) return []

  // ── Group-scoped availability (session 21) ──────────────────────────────────
  // Fetch any group-specific overrides. Members who have set this override their
  // profile-level availability for this group's windows calculation.
  const { data: groupAvailRows } = await supabase
    .from('group_availability')
    .select('user_id, weekly_availability')
    .eq('group_id', groupId)

  // Map: user_id → group-specific WeeklyAvailability (if set)
  const groupAvailMap = new Map<string, WeeklyAvailability>(
    (groupAvailRows ?? []).map(r => [
      r.user_id,
      r.weekly_availability as WeeklyAvailability,
    ])
  )
  // ───────────────────────────────────────────────────────────────────────────

  const totalCount = members.length

  // Look ahead 14 days starting tomorrow
  const from = new Date()
  from.setDate(from.getDate() + 1)
  from.setHours(0, 0, 0, 0)

  const candidates = generateCandidateSlots(from, 14)

  const windows: OpenWindow[] = candidates.map(({ start, end }) => {
    const dayKey = DAY_KEYS[start.getDay()]
    const startH = start.getHours()
    const endH   = end.getHours()

    const availableMembers = members.filter(m => {
      // Fallback chain: group-specific → profile-level → empty
      const groupSpecific = groupAvailMap.get(m.user_id)
      const profile       = m.profiles as any
      const avail: Partial<WeeklyAvailability> =
        groupSpecific ?? (profile?.weekly_availability ?? {})

      const dayHours = (avail[dayKey] ?? []) as number[]

      // Member is available for this slot if every hour in [startH, endH) is marked free
      for (let h = startH; h < endH; h++) {
        if (!dayHours.includes(h)) return false
      }
      return true
    })

    return {
      start,
      end,
      availableCount: availableMembers.length,
      totalCount,
      availableUserIds: availableMembers.map(m => m.user_id),
      members: availableMembers.map(m => {
        const p = m.profiles as any
        return {
          id:           m.user_id,
          display_name: p?.display_name ?? null,
          username:     p?.username     ?? null,
          avatar_url:   p?.avatar_url   ?? null,
        }
      }),
    }
  })

  // Sort by most available, then soonest
  const sorted = windows
    .filter(w => w.availableCount > 0)
    .sort((a, b) => {
      if (b.availableCount !== a.availableCount) return b.availableCount - a.availableCount
      return a.start.getTime() - b.start.getTime()
    })

  // Deduplicate: skip slots that start within 1 hour of an already-included slot on same day
  const deduped: OpenWindow[] = []
  for (const w of sorted) {
    const conflict = deduped.some(
      d =>
        d.start.toDateString() === w.start.toDateString() &&
        Math.abs(d.start.getHours() - w.start.getHours()) < 2
    )
    if (!conflict) deduped.push(w)
  }

  // Cap by tier
  const { data: group } = await supabase
    .from('groups')
    .select('tier')
    .eq('id', groupId)
    .single()

  const cap = (group?.tier ?? 0) === 0 ? 3 : 10
  return deduped.slice(0, cap)
}
