'use server'
import { defaultWeekly, type DayKey, type WeeklyAvailability } from './availability-utils'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Legacy block types (kept for backward compat) ────────────────────────────

export type BlockType = 'busy' | 'free'

export interface AvailabilityBlock {
  id: string
  user_id: string
  start_time: string
  end_time: string
  block_type: BlockType
  label: string | null
  created_at: string
}


// ─── Profile-level availability ───────────────────────────────────────────────

export async function getWeeklyAvailability(): Promise<WeeklyAvailability> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return defaultWeekly()

  const { data } = await supabase
    .from('profiles')
    .select('weekly_availability')
    .eq('id', user.id)
    .single()

  const raw = data?.weekly_availability as Partial<WeeklyAvailability> | null
  return { ...defaultWeekly(), ...(raw ?? {}) }
}

export async function saveWeeklyAvailability(availability: WeeklyAvailability) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({ weekly_availability: availability })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/availability')
  return { success: true }
}

// ─── Group-scoped availability ────────────────────────────────────────────────

/**
 * Returns the current user's availability for a specific group.
 * Falls back to their profile-level availability if no group-specific row exists.
 */
export async function getGroupAvailability(groupId: string): Promise<{
  availability: WeeklyAvailability
  isCustom: boolean
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { availability: defaultWeekly(), isCustom: false }

  const { data: groupRow } = await supabase
    .from('group_availability')
    .select('weekly_availability')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .maybeSingle()

  if (groupRow?.weekly_availability) {
    return {
      availability: { ...defaultWeekly(), ...(groupRow.weekly_availability as Partial<WeeklyAvailability>) },
      isCustom: true,
    }
  }

  // Fall back to profile availability
  const profileAvail = await getWeeklyAvailability()
  return { availability: profileAvail, isCustom: false }
}

/**
 * Upsert group-specific availability for the current user.
 */
export async function saveGroupAvailability(groupId: string, availability: WeeklyAvailability) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('group_availability')
    .upsert(
      {
        user_id:             user.id,
        group_id:            groupId,
        weekly_availability: availability,
        updated_at:          new Date().toISOString(),
      },
      { onConflict: 'user_id,group_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Delete the group-specific override so the user falls back to their profile default.
 */
export async function clearGroupAvailability(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('group_availability')
    .delete()
    .eq('user_id', user.id)
    .eq('group_id', groupId)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── Unread messages ──────────────────────────────────────────────────────────

/**
 * Total unread message count across all groups for the current user.
 * Counts messages posted after last_read_at for each group membership.
 */
export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, last_read_at')
    .eq('user_id', user.id)

  if (!memberships?.length) return 0

  // One query per group — groups list is typically small (< 20)
  let total = 0
  for (const m of memberships) {
    let q = supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', m.group_id)
      .neq('user_id', user.id)

    if (m.last_read_at) {
      q = q.gt('created_at', m.last_read_at)
    }

    const { count } = await q
    total += count ?? 0
  }

  return total
}

/**
 * Mark all messages in a group as read (sets last_read_at = now).
 */
export async function markGroupRead(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('group_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('group_id', groupId)
}

// ─── Legacy block functions (kept, not used in new UI) ────────────────────────

export async function getMyBlocks(): Promise<AvailabilityBlock[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const now    = new Date().toISOString()
  const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', now)
    .lte('start_time', future)
    .order('start_time', { ascending: true })

  return (data ?? []) as AvailabilityBlock[]
}

export async function getBlocksForUsers(
  userIds: string[],
  from: Date,
  to: Date
): Promise<AvailabilityBlock[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('availability_blocks')
    .select('*')
    .in('user_id', userIds)
    .gte('start_time', from.toISOString())
    .lte('end_time', to.toISOString())

  return (data ?? []) as AvailabilityBlock[]
}

export async function addBlock(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const date      = formData.get('date') as string
  const startHour = formData.get('start_hour') as string
  const endHour   = formData.get('end_hour') as string
  const blockType = (formData.get('block_type') as BlockType) ?? 'busy'
  const label     = (formData.get('label') as string)?.trim() || null

  if (!date || !startHour || !endHour) return { error: 'Date and times are required' }

  const start = new Date(`${date}T${startHour}:00`)
  const end   = new Date(`${date}T${endHour}:00`)
  if (end <= start) return { error: 'End time must be after start time' }

  const { error } = await supabase.from('availability_blocks').insert({
    user_id:    user.id,
    start_time: start.toISOString(),
    end_time:   end.toISOString(),
    block_type: blockType,
    label,
  })

  if (error) return { error: error.message }
  revalidatePath('/availability')
  return { success: true }
}

export async function deleteBlock(blockId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', blockId)
    .eq('user_id', user.id)

  revalidatePath('/availability')
}
