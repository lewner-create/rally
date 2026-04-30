'use server'

import { createClient } from '@/lib/supabase/server'

export interface DMMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  sender: { id: string; display_name: string | null; username: string | null; avatar_url: string | null } | null
}

export interface DMThread {
  otherId: string
  otherName: string
  otherAvatar: string | null
  lastMessage: string
  lastAt: string
}

export async function getDMThreads(): Promise<DMThread[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('direct_messages')
    .select('*, sender:sender_id(id, display_name, username, avatar_url), receiver:receiver_id(id, display_name, username, avatar_url)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (!data) return []

  const seen = new Map<string, DMThread>()
  for (const msg of data) {
    const other   = msg.sender_id === user.id ? msg.receiver : msg.sender
    const otherId = other?.id
    if (!otherId || seen.has(otherId)) continue
    seen.set(otherId, {
      otherId,
      otherName:   other?.display_name ?? other?.username ?? 'User',
      otherAvatar: other?.avatar_url ?? null,
      lastMessage: msg.content,
      lastAt:      msg.created_at,
    })
  }
  return Array.from(seen.values())
}

export async function getDMMessages(otherId: string, limit = 50): Promise<DMMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('direct_messages')
    .select('*, sender:sender_id(id, display_name, username, avatar_url)')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(limit)

  return (data ?? []) as DMMessage[]
}

export async function sendDM(receiverId: string, content: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: user.id, receiver_id: receiverId, content: content.trim() })

  if (error) throw new Error(error.message)
}

export async function searchUsers(query: string): Promise<Array<{ id: string; display_name: string | null; username: string | null; avatar_url: string | null }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .neq('id', user.id)
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(8)

  return data ?? []
}