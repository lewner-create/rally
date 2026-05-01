'use server'

import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface MessageWithProfile {
  id: string
  group_id: string
  event_id: string | null
  user_id: string
  content: string
  message_type: 'user' | 'radio' | 'plan_card'
  plan_card_id: string | null
  created_at: string
  profiles: {
    id: string
    display_name: string | null
    username: string | null
  } | null
  // Joined event — present when message is tagged to an event
  event: {
    id: string
    title: string
    event_type: string
  } | null
}

export async function getMessages(
  groupId: string,
  eventId?: string | null,
  limit = 50
): Promise<MessageWithProfile[]> {
  if (!UUID_RE.test(groupId)) return []
  if (eventId && !UUID_RE.test(eventId)) return []

  const supabase = await createClient()

  let query = supabase
    .from('chat_messages')
    .select('*, profiles(id, display_name, username), event:event_id(id, title, event_type)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (eventId) {
    // Lens mode — only messages tagged to this specific event
    query = query.eq('event_id', eventId)
  }
  // Group chat mode — intentionally no event_id filter.
  // All messages for this group are shown; event-tagged messages
  // render with a context pill so the conversation stays unified.

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as MessageWithProfile[]
}

export async function sendMessage(
  groupId: string,
  content: string,
  eventId?: string | null
): Promise<{ id: string }> {
  if (!UUID_RE.test(groupId)) throw new Error('Invalid groupId')
  if (eventId && !UUID_RE.test(eventId)) throw new Error('Invalid eventId')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      group_id:     groupId,
      event_id:     eventId ?? null,
      user_id:      user.id,
      content:      content.trim(),
      message_type: 'user',
      plan_card_id: null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function sendRadioMessage(
  groupId: string,
  content: string,
  eventId?: string | null
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('chat_messages').insert({
    group_id:     groupId,
    event_id:     eventId ?? null,
    user_id:      user.id,
    content,
    message_type: 'radio',
    plan_card_id: null,
  })
}
