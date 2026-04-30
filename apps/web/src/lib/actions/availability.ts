'use server'

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

// ─── Weekly availability types ────────────────────────────────────────────────

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type WeeklyAvailability = Record<DayKey, number[]>

function defaultWeekly(): WeeklyAvailability {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
}

// ─── Weekly availability: get ─────────────────────────────────────────────────

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

// ─── Weekly availability: save ────────────────────────────────────────────────

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

// ─── Legacy block functions (kept, not used in new UI) ────────────────────────

export async function getMyBlocks(): Promise<AvailabilityBlock[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const now = new Date().toISOString()
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
