'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateInviteToken, slugify } from '@/lib/name-generator'

export type EventType   = 'game_night' | 'hangout' | 'meetup' | 'day_trip' | 'road_trip' | 'moto_trip' | 'vacation'
export type RsvpStatus  = 'yes' | 'maybe' | 'no'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

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
    .neq('status', 'completed')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5)

  return (data ?? []) as any[]
}

export async function getCompletedEventsForGroup(groupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, event_type, starts_at, ends_at')
    .eq('group_id', groupId)
    .lt('ends_at', new Date().toISOString())
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: false })
    .limit(20)

  return (data ?? []) as { id: string; title: string; event_type: string; starts_at: string | null; ends_at: string | null }[]
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

// ─── Completed state ───────────────────────────────────────────────────────

export async function markEventCompleted(eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('events')
    .update({ status: 'completed' })
    .eq('id', eventId)
  if (error) console.error('Failed to mark event completed:', error.message)
}

// ─── Photos ────────────────────────────────────────────────────────────────

export async function getEventPhotos(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_photos')
    .select('id, public_url, created_at, uploader:uploader_id(display_name, username)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  return (data ?? []) as {
    id: string
    public_url: string
    created_at: string
    uploader: { display_name: string | null; username: string } | null
  }[]
}

export async function saveEventPhoto(eventId: string, publicUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('event_photos')
    .insert({ event_id: eventId, uploader_id: user.id, public_url: publicUrl })
    .select()
    .single()

  if (error) {
    console.error('Failed to save photo:', error.message)
    return null
  }
  revalidatePath(`/events/${eventId}`)
  return data
}

export async function deleteEventPhoto(photoId: string, eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('event_photos')
    .delete()
    .eq('id', photoId)

  if (error) console.error('Failed to delete photo:', error.message)
  else revalidatePath(`/events/${eventId}`)
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

  const { data: event } = await supabase
    .from('events')
    .select('id, group_id')
    .eq('invite_slug', inviteSlug)
    .eq('invite_group_slug', groupSlug)
    .eq('status', 'published')
    .single()

  if (!event) return { error: 'This invite link is invalid or has expired.' }

  const groupId = event.group_id

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect(`/invite/${groupSlug}/${inviteSlug}`)

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
