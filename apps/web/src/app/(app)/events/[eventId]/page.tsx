import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EventPageClient } from '@/components/events/event-page-client'

type Props = {
  params: Promise<{ eventId: string }>
}

export default async function EventPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      id, title, description, event_type, starts_at, ends_at,
      created_by, group_id, banner_url, location, status,
      games,
      groups ( id, name, slug, theme_color )
    `)
    .eq('id', eventId)
    .single()

  if (error || !event) notFound()

  // Auto-complete if past end time
  if (
    event.status === 'published' &&
    event.ends_at &&
    new Date(event.ends_at) < new Date()
  ) {
    await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId)
    event.status = 'completed'
  }

  const { data: rsvps } = await supabase
    .from('event_attendees')
    .select('user_id, rsvp_status, profiles:user_id(id, display_name, username, avatar_url)')
    .eq('event_id', eventId)

  const { data: groupMembers } = await supabase
    .from('group_members')
    .select('profiles(id, display_name, username, avatar_url)')
    .eq('group_id', event.group_id)

  const members = (groupMembers ?? [])
    .map((m: any) => m.profiles)
    .filter(Boolean) as { id: string; display_name: string | null; username: string; avatar_url: string | null }[]

  const userRsvp   = (rsvps ?? []).find(r => r.user_id === user.id)?.rsvp_status ?? null
  const isCreator  = event.created_by === user.id

  return (
    <EventPageClient
      event={event as any}
      rsvps={rsvps as any ?? []}
      members={members}
      userRsvp={userRsvp}
      isCreator={isCreator}
      currentUserId={user.id}
    />
  )
}
