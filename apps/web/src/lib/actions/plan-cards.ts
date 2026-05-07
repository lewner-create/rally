'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createEvent } from './events'
import { notifyGroupMembers, createNotification } from './notifications'
import type { EventType } from './events'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanCardStatus   = 'open' | 'locked' | 'cancelled'
export type PlanCardResponse = 'in' | 'maybe' | 'cant'

export interface PlanCard {
  id: string
  group_id: string
  created_by: string
  title: string
  event_type: string
  proposed_date:  string | null
  proposed_start: string | null
  proposed_end:   string | null
  status:   PlanCardStatus
  event_id: string | null
  created_at: string
}

export interface PlanCardResponseRow {
  id: string
  plan_card_id: string
  user_id: string
  response: PlanCardResponse
  created_at: string
  profiles?: {
    id: string
    display_name: string | null
    username:     string | null
    avatar_url:   string | null
  } | null
}

// ─── Post "Check who's in" ────────────────────────────────────────────────────

export async function postCheckWhosIn(params: {
  groupId:        string
  title:          string
  eventType:      EventType
  proposedDate?:  string
  proposedStart?: string
  proposedEnd?:   string
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Create plan card
  const { data: card, error: cardErr } = await supabase
    .from('plan_cards')
    .insert({
      group_id:       params.groupId,
      created_by:     user.id,
      title:          params.title,
      event_type:     params.eventType,
      proposed_date:  params.proposedDate  ?? null,
      proposed_start: params.proposedStart ?? null,
      proposed_end:   params.proposedEnd   ?? null,
      status:         'open',
    })
    .select()
    .single()

  if (cardErr || !card) return { error: cardErr?.message ?? 'Failed to create plan' }

  // 2. Post to group chat
  const { error: msgErr } = await supabase
    .from('chat_messages')
    .insert({
      group_id:     params.groupId,
      user_id:      user.id,
      content:      params.title,
      message_type: 'plan_card',
      plan_card_id: card.id,
    })

  if (msgErr) return { error: msgErr.message }

  // 3. Fetch actor display name for notification copy
  const { data: actor } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .single()

  const actorName = actor?.display_name ?? actor?.username ?? 'Someone'

  // 4. Notify group members
  notifyGroupMembers({
    groupId:     params.groupId,
    excludeUserId: user.id,
    type:        'new_plan',
    title:       `${actorName} started a plan`,
    body:        params.title,
    planCardId:  card.id,
    actorId:     user.id,
  })

  revalidatePath(`/groups/${params.groupId}`)
  return {}
}

// ─── Respond to a plan card ───────────────────────────────────────────────────

export async function respondToPlanCard(
  planCardId: string,
  response:   PlanCardResponse
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('plan_card_responses')
    .upsert(
      { plan_card_id: planCardId, user_id: user.id, response },
      { onConflict: 'plan_card_id,user_id' }
    )

  if (error) return { error: error.message }
  return {}
}

// ─── Lock it in → creates a real event ───────────────────────────────────────

export async function lockInPlanCard(planCardId: string): Promise<{ eventId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: card } = await supabase
    .from('plan_cards')
    .select('*, groups(name)')
    .eq('id', planCardId)
    .single()

  if (!card) return { error: 'Plan not found' }
  if (card.status === 'locked') return { error: 'Already locked in' }

  const date  = card.proposed_date  ?? new Date().toISOString().split('T')[0]
  const start = card.proposed_start ?? '18:00:00'
  const end   = card.proposed_end   ?? '21:00:00'

  const groupName = (card.groups as any)?.name ?? 'group'

  try {
    const event = await createEvent({
      groupId:   card.group_id,
      title:     card.title,
      eventType: card.event_type as EventType,
      startsAt:  `${date}T${start}`,
      endsAt:    `${date}T${end}`,
      groupName,
    })

    await supabase
      .from('plan_cards')
      .update({ status: 'locked', event_id: event.id })
      .eq('id', planCardId)

    // Notify members who voted 'in' or 'maybe'
    const { data: voters } = await supabase
      .from('plan_card_responses')
      .select('user_id')
      .eq('plan_card_id', planCardId)
      .in('response', ['in', 'maybe'])
      .neq('user_id', user.id)

    if (voters?.length) {
      const { data: actor } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single()

      const actorName = actor?.display_name ?? actor?.username ?? 'Someone'

      for (const voter of voters) {
        createNotification({
          userId:      voter.user_id,
          type:        'plan_locked',
          title:       'Plan locked in! ',
          body:        `${actorName} locked in "${card.title}"`,
          groupId:     card.group_id,
          eventId:     event.id,
          planCardId:  card.id,
          actorId:     user.id,
        })
      }
    }

    revalidatePath(`/groups/${card.group_id}`)
    return { eventId: event.id }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ─── Get active plan cards for a group ────────────────────────────────────────

export async function getActivePlanCards(groupId: string): Promise<{ id: string; title: string; event_type: string }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('plan_cards')
    .select('id, title, event_type')
    .eq('group_id', groupId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (data ?? []) as { id: string; title: string; event_type: string }[]
}
