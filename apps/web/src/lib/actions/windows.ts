'use server'

import { createClient } from '@/lib/supabase/server'
import { getBlocksForUsers } from '@/lib/actions/availability-blocks'
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

const DAY_KEYS: Record<number, DayKey> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

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

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, display_name, username, avatar_url, weekly_availability)')
    .eq('group_id', groupId)

  if (!members || members.length === 0) return []

  const totalCount = members.length
  const userIds    = members.map(m => m.user_id)

  // Look ahead 14 days starting tomorrow
  const from = new Date()
  from.setDate(from.getDate() + 1)
  from.setHours(0, 0, 0, 0)

  const to = new Date(from)
  to.setDate(to.getDate() + 14)

  const candidates = generateCandidateSlots(from, 14)

  // Fetch all blocks for all members in this window
  const blocks = await getBlocksForUsers(userIds, from, to)

  // Build a map: userId → array of {start, end} busy intervals
  const busyMap = new Map<string, { start: Date; end: Date }[]>()
  for (const block of blocks) {
    if (!busyMap.has(block.user_id)) busyMap.set(block.user_id, [])
    busyMap.get(block.user_id)!.push({
      start: new Date(block.start_time),
      end:   new Date(block.end_time),
    })
  }

  const windows: OpenWindow[] = candidates.map(({ start, end }) => {
    const dayKey = DAY_KEYS[start.getDay()]
    const startH = start.getHours()
    const endH   = end.getHours()

    const availableMembers = members.filter(m => {
      const profile  = m.profiles as any
      const avail    = (profile?.weekly_availability ?? {}) as Partial<WeeklyAvailability>
      const dayHours = (avail[dayKey] ?? []) as number[]

      // 1. Check recurring availability — every hour must be marked free
      for (let h = startH; h < endH; h++) {
        if (!dayHours.includes(h)) return false
      }

      // 2. Check one-off blocks — any overlap means unavailable
      const userBlocks = busyMap.get(m.user_id) ?? []
      for (const block of userBlocks) {
        // Overlap if block starts before window ends AND block ends after window starts
        if (block.start < end && block.end > start) return false
      }

      return true
    })

    return {
      start,
      end,
      availableCount:  availableMembers.length,
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

  const sorted = windows
    .filter(w => w.availableCount > 0)
    .sort((a, b) => {
      if (b.availableCount !== a.availableCount) return b.availableCount - a.availableCount
      return a.start.getTime() - b.start.getTime()
    })

  const deduped: OpenWindow[] = []
  for (const w of sorted) {
    const conflict = deduped.some(
      d =>
        d.start.toDateString() === w.start.toDateString() &&
        Math.abs(d.start.getHours() - w.start.getHours()) < 2
    )
    if (!conflict) deduped.push(w)
  }

  const { data: group } = await supabase
    .from('groups')
    .select('tier')
    .eq('id', groupId)
    .single()

  const cap = (group?.tier ?? 0) === 0 ? 3 : 10
  return deduped.slice(0, cap)
}
