'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateInviteToken, slugify } from '@/lib/name-generator'

export type EventType   = 'game_night' | 'hangout' | 'meetup' | 'day_trip' | 'road_trip' | 'moto_trip' | 'vacation'
export type RsvpStatus  = 'yes' | 'maybe' | 'no'
export type EventStatus = 'draft' | 'published' | 'cancelled'

// ─── Create ────────────────────────────────────────────────────────────────

export async function createEvent(params: {
  groupId: string
  title: string
  eventType: EventType
  startsAt: string
  endsAt: string
  description?: string
  status?: EventStatus
  bannerUrl?: string
  groupName?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('events')
    .insert({
      group_id:          params.groupId,
      created_by:        user.id,
      title:             params.title,
      event_type:        params.eventType,
      starts_at:         params.startsAt,
      ends_at:           params.endsAt,
      description:       params.description ?? null,
      status:            params.status ?? 'published',
      banner_url:        params.bannerUrl ?? null,
      invite_slug:       generateInviteToken(),
      invite_group_slug: slugify(params.groupName ?? 'group'),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/groups/${params.groupId}`)
  return data
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function getEvent(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      *,
      organizer:created_by (id, display_name, username, avatar_url),
      groups (id, name)
    `)
    .eq('id', eventId)
    .single()

  return data as (typeof data & {
    organizer: { id: string; display_name: string | null; username: string | null; avatar_url: string | null } | null
    groups: { id: string; name: string } | null
  }) | null
}

export async function getEventPreview(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_event_preview', { p_event_id: eventId })
  return (data as any[])?.[0] ?? null
}

export async function getEventsForGroup(groupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      *,
      event_attendees (user_id, rsvp_status, profiles:user_id (id, display_name, username, avatar_url))
    `)
    .eq('group_id', groupId)
    .neq('status', 'cancelled')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5)

  return (data ?? []) as any[]
}

export async function getEventAttendees(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_attendees')
    .select(`
      rsvp_status,
      profiles:user_id (id, display_name, username, avatar_url)
    `)
    .eq('event_id', eventId)

  return (data ?? []) as Array<{
    rsvp_status: string
    profiles: { id: string; display_name: string | null; username: string | null; avatar_url: string | null } | null
  }>
}

// ─── RSVP ──────────────────────────────────────────────────────────────────

export async function upsertRsvp(eventId: string, rsvp: RsvpStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('event_attendees')
    .upsert(
      {
        event_id:     eventId,
        user_id:      user.id,
        rsvp_status:  rsvp,
        responded_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,user_id' }
    )

  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}`)
}

// ─── Membership check ──────────────────────────────────────────────────────

export async function checkGroupMembership(groupId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  return !!data
}

// ─── Join group via event invite ───────────────────────────────────────────

export async function joinGroupViaEventInvite(groupSlug: string, inviteSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/${groupSlug}/${inviteSlug}`)

  // Look up the event to get group_id — event invites live on the events table,
  // not group_invites, so joinGroupBySlug was querying the wrong table entirely
  const { data: event } = await supabase
    .from('events')
    .select('id, group_id')
    .eq('invite_slug', inviteSlug)
    .eq('invite_group_slug', groupSlug)
    .eq('status', 'published')
    .single()

  if (!event) return { error: 'This invite link is invalid or has expired.' }

  const groupId = event.group_id

  // Already a member — send back to invite page to RSVP
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect(`/invite/${groupSlug}/${inviteSlug}`)

  // Capacity check
  const { count } = await supabase
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)

  const { data: group } = await supabase
    .from('groups')
    .select('tier')
    .eq('id', groupId)
    .single()

  const maxMembers = (group?.tier ?? 0) >= 3 ? 20 : 6
  if ((count ?? 0) >= maxMembers) return { error: 'This group is full.' }

  const { error } = await supabase.from('group_members').insert({
    group_id:     groupId,
    user_id:      user.id,
    role:         'member',
    boost_active: false,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect(`/invite/${groupSlug}/${inviteSlug}`)
}