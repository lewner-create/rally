'use server'

import { createClient } from '@/lib/supabase/server'

export type EventPhoto = {
  id: string
  event_id: string
  uploader_id: string
  public_url: string
  created_at: string
  profiles: {
    display_name: string | null
    username: string
    avatar_url: string | null
  } | null
}

export async function getEventPhotos(eventId: string): Promise<EventPhoto[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_photos')
    .select('*, profiles:uploader_id(display_name, username, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  return (data ?? []) as EventPhoto[]
}

export async function saveEventPhoto(
  eventId: string,
  publicUrl: string
): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { id: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('event_photos')
    .insert({ event_id: eventId, uploader_id: user.id, public_url: publicUrl })
    .select('id')
    .single()

  if (error) return { id: null, error: error.message }
  return { id: data.id, error: null }
}

export async function deleteEventPhoto(
  photoId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('event_photos')
    .delete()
    .eq('id', photoId)
  return { error: error?.message ?? null }
}
