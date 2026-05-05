'use server'

import { createClient } from '@/lib/supabase/server'

export type BlockSource = 'manual' | 'google' | 'event'

export type AvailabilityBlock = {
  id: string
  user_id: string
  start_time: string
  end_time: string
  label: string | null
  source: BlockSource
  event_id: string | null
  created_at: string
}

export async function getMyBlocks(): Promise<AvailabilityBlock[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('user_id', user.id)
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })

  return (data ?? []) as AvailabilityBlock[]
}

export async function createBlock(params: {
  startsAt: string
  endsAt: string
  label?: string
  source?: BlockSource
  eventId?: string
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { id: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('availability_blocks')
    .insert({
      user_id:   user.id,
      start_time: params.startsAt,
      end_time:   params.endsAt,
      label:     params.label ?? null,
      source:    params.source ?? 'manual',
      event_id:  params.eventId ?? null,
    })
    .select('id')
    .single()

  if (error) return { id: null, error: error.message }
  return { id: data.id, error: null }
}

export async function deleteBlock(blockId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', blockId)
  return { error: error?.message ?? null }
}

// Used by windows engine — get blocks for a set of user IDs in a time range
export async function getBlocksForUsers(
  userIds: string[],
  from: Date,
  to: Date
): Promise<{ user_id: string; start_time: string; end_time: string }[]> {
  if (userIds.length === 0) return []
  const supabase = await createClient()

  const { data } = await supabase
    .from('availability_blocks')
    .select('user_id, start_time, end_time')
    .in('user_id', userIds)
    .lt('start_time', to.toISOString())
    .gt('end_time', from.toISOString())

  return (data ?? []) as { user_id: string; start_time: string; end_time: string }[]
}

// Upsert an event block — called when user RSVPs yes to a locked event
export async function upsertEventBlock(params: {
  userId: string
  eventId: string
  startsAt: string
  endsAt: string
  label: string
}): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('availability_blocks')
    .upsert({
      user_id:   params.userId,
      start_time: params.startsAt,
      end_time:   params.endsAt,
      label:     params.label,
      source:    'event',
      event_id:  params.eventId,
    }, { onConflict: 'user_id,event_id', ignoreDuplicates: false })
}
