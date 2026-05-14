'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { sendInviteEmail } from '@/lib/resend'
import { nanoid } from 'nanoid'

export const GUEST_CAP_FREE           = 10
export const GUEST_ACCESS_GRACE_HOURS = 72
export const INVITE_TOKEN_LENGTH      = 12

export interface EventInvite {
  id: string; event_id: string; invited_by: string; email: string
  token: string; status: 'pending' | 'accepted' | 'declined'
  created_at: string; expires_at: string | null
}

export interface GuestMessage {
  id: string; event_id: string; sender_invite_id: string | null
  sender_profile_id: string | null; sender_display_name: string | null
  recipient_profile_id: string; body: string; created_at: string
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isEventFrozen(endsAt: string | null): boolean {
  if (!endsAt) return false
  return Date.now() > new Date(endsAt).getTime() + GUEST_ACCESS_GRACE_HOURS * 3600000
}

export async function sendEventInvites(eventId: string, emails: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { count } = await supabase
    .from('event_invites')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)

  if ((count ?? 0) + emails.length > GUEST_CAP_FREE)
    return { error: `Guest cap reached. Free plan allows ${GUEST_CAP_FREE} external guests per event.` }

  const { data: event } = await supabase
    .from('events').select('title, starts_at').eq('id', eventId).single()
  if (!event) return { error: 'Event not found' }

  const { data: inviter } = await supabase
    .from('profiles').select('display_name, username').eq('id', user.id).single()
  const inviterName = (inviter as any)?.display_name ?? (inviter as any)?.username ?? 'Someone'

  const rows = emails.map(email => ({
    event_id: eventId, invited_by: user.id,
    email: email.trim().toLowerCase(),
    token: nanoid(INVITE_TOKEN_LENGTH), status: 'pending' as const,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('event_invites').insert(rows).select('token, email')
  if (insertError) return { error: insertError.message }

  for (const inv of inserted ?? []) {
    await sendInviteEmail({
      to: inv.email, inviterName,
      eventTitle: (event as any).title,
      eventDate:  (event as any).starts_at,
      token: inv.token, eventId,
    }).catch(() => {})
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true, sent: (inserted ?? []).length }
}

export async function getEventInvites(eventId: string): Promise<EventInvite[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_invites').select('*').eq('event_id', eventId)
    .order('created_at', { ascending: false })
  return (data ?? []) as EventInvite[]
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: invite } = await supabase
    .from('event_invites').select('event_id, invited_by').eq('id', inviteId).single()
  if (!invite || (invite as any).invited_by !== user.id) return { error: 'Unauthorized' }

  await supabase.from('event_invites').update({ status: 'declined' }).eq('id', inviteId)
  revalidatePath(`/events/${(invite as any).event_id}`)
  return { success: true }
}

export async function getEventByToken(token: string) {
  const supabase = serviceClient()

  const { data: invite } = await supabase
    .from('event_invites')
    .select('*, events(id, title, description, event_type, starts_at, ends_at, created_by, group_id, groups(name, theme_color))')
    .eq('token', token).single()
  if (!invite) return null

  const event  = (invite as any).events
  const frozen = isEventFrozen(event?.ends_at ?? null)

  const { data: host } = await supabase
    .from('profiles').select('id, display_name, username, avatar_url')
    .eq('id', event?.created_by).single()

  const { data: attendees } = await supabase
    .from('event_attendees')
    .select('user_id, rsvp_status, is_guest, guest_display_name, profiles:user_id(id, display_name, username, avatar_url)')
    .eq('event_id', event?.id)

  return {
    invite: { id: invite.id, token: invite.token, email: invite.email, status: invite.status },
    event: {
      id: event.id, title: event.title, description: event.description,
      event_type: event.event_type, starts_at: event.starts_at, ends_at: event.ends_at,
      group_name: (event.groups as any)?.name ?? '',
      accent:     (event.groups as any)?.theme_color ?? '#7F77DD',
    },
    host, attendees: (attendees ?? []) as any[], frozen,
  }
}

export async function rsvpAsGuest(token: string, displayName: string, status: 'yes' | 'maybe' | 'no') {
  const supabase = serviceClient()

  const { data: invite } = await supabase
    .from('event_invites').select('id, event_id, status').eq('token', token).single()
  if (!invite) return { error: 'Invalid invite' }
  if ((invite as any).status === 'declined') return { error: 'This invite has been revoked' }

  await supabase.from('event_invites').update({ status: 'accepted' }).eq('id', (invite as any).id)

  await supabase.from('event_attendees').upsert({
    event_id:           (invite as any).event_id,
    user_id:            (invite as any).id,
    rsvp_status:        status,
    is_guest:           true,
    guest_display_name: displayName,
    source_invite_id:   (invite as any).id,
  }, { onConflict: 'event_id,user_id' })

  return { success: true }
}

export async function sendGuestMessage(token: string, body: string, senderName: string) {
  const supabase = serviceClient()

  const { data: invite } = await supabase
    .from('event_invites')
    .select('id, event_id, events(created_by)')
    .eq('token', token).single()
  if (!invite) return { error: 'Invalid invite' }

  await supabase.from('event_guest_messages').insert({
    event_id:             (invite as any).event_id,
    sender_invite_id:     (invite as any).id,
    sender_display_name:  senderName,
    recipient_profile_id: (invite as any).events.created_by,
    body,
  })
  return { success: true }
}

export async function getGuestMessages(eventId: string): Promise<GuestMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('event_guest_messages').select('*')
    .eq('event_id', eventId).eq('recipient_profile_id', user.id)
    .order('created_at', { ascending: true })
  return (data ?? []) as GuestMessage[]
}

export async function replyToGuest(eventId: string, inviteId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('event_guest_messages').insert({
    event_id: eventId, sender_profile_id: user.id,
    recipient_profile_id: user.id, sender_invite_id: inviteId, body,
  })
  return { success: true }
}
