'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createEvent } from './events'
import type { EventType } from './events'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanCardStatus   = 'open' | 'locked' | 'cancelled'
export type PlanCardResponse = 'in' | 'maybe' | 'cant'

export interface PlanCard {
  id:             string
  group_id:       string
  created_by:     string
  title:          string
  event_type:     string
  proposed_date:  string | null
  proposed_start: string | null
  proposed_end:   string | null
  status:         PlanCardStatus
  event_id:       string | null
  created_at:     string
}

export interface PlanCardResponseRow {
  id:           string
  plan_card_id: string
  user_id:      string
  response:     PlanCardResponse
  created_at:   string
  profiles?: {
    id:           string
    display_name: string | null
    username:     string | null
    avatar_url:   string | null
  } | null
}

export interface ActivePlanCard {
  id:             string
  title:          string
  event_type:     string
  proposed_date:  string | null
  proposed_start: string | null
  proposed_end:   string | null
  status:         PlanCardStatus
  response_counts: { in: number; maybe: number; cant: number }
  creator_name:   string | null
  creator_avatar: string | null
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

  revalidatePath(`/groups/${params.groupId}`)
  return {}
}

// ─── Respond ──────────────────────────────────────────────────────────────────

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

// ─── Lock it in ───────────────────────────────────────────────────────────────

export async function lockInPlanCard(
  planCardId: string
): Promise<{ eventId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: card } = await supabase
    .from('plan_cards')
    .select('*, groups(name)')
    .eq('id', planCardId)
    .single()

  if (!card)                 return { error: 'Plan not found' }
  if (card.status === 'locked') return { error: 'Already locked in' }

  const date      = card.proposed_date  ?? new Date().toISOString().split('T')[0]
  const start     = card.proposed_start ?? '18:00:00'
  const end       = card.proposed_end   ?? '21:00:00'
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

    revalidatePath(`/groups/${card.group_id}`)
    return { eventId: event.id }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ─── Get active plan cards ────────────────────────────────────────────────────
// Returns full display data including response counts so the group page
// can render dates and response bars without a second fetch.

export async function getActivePlanCards(groupId: string): Promise<ActivePlanCard[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: cards } = await supabase
    .from('plan_cards')
    .select(`
      id, title, event_type,
      proposed_date, proposed_start, proposed_end,
      status, created_by,
      creator:created_by ( display_name, avatar_url ),
      plan_card_responses ( response )
    `)
    .eq('group_id', groupId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (!cards) return []

  return cards.map((card: any) => {
    const responses: { response: string }[] = card.plan_card_responses ?? []
    return {
      id:             card.id,
      title:          card.title,
      event_type:     card.event_type,
      proposed_date:  card.proposed_date,
      proposed_start: card.proposed_start,
      proposed_end:   card.proposed_end,
      status:         card.status,
      creator_name:   (card.creator as any)?.display_name ?? null,
      creator_avatar: (card.creator as any)?.avatar_url ?? null,
      response_counts: {
        in:    responses.filter(r => r.response === 'in').length,
        maybe: responses.filter(r => r.response === 'maybe').length,
        cant:  responses.filter(r => r.response === 'cant').length,
      },
    }
  })
}
