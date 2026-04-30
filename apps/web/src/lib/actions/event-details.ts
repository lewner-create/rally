'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CostCategory = 'lodging' | 'food' | 'gas' | 'activities' | 'other'

export interface BookingLink {
  label: string
  url:   string
}

export interface EventDetailsRow {
  id:            string
  event_id:      string
  address:       string | null
  location_url:  string | null
  booking_links: BookingLink[]
  notes:         string | null
  confirmation:  string | null
  pay_by:        string | null
}

export interface EventCost {
  id:                  string
  event_id:            string
  label:               string
  category:            CostCategory
  amount:              number
  responsible_user_id: string | null
  paid:                boolean
  payment_url:         string | null
  created_at:          string
  profiles?: {
    id:           string
    display_name: string | null
    username:     string | null
  } | null
}

// ─── Get details + costs ──────────────────────────────────────────────────────

export async function getEventDetails(eventId: string): Promise<EventDetailsRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_details')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle()

  if (!data) return null
  return {
    ...data,
    booking_links: (data.booking_links ?? []) as BookingLink[],
  }
}

export async function getEventCosts(eventId: string): Promise<EventCost[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_costs')
    .select('*, profiles:responsible_user_id(id, display_name, username)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  return (data ?? []) as EventCost[]
}

// ─── Save info hub ────────────────────────────────────────────────────────────

export async function saveEventDetails(eventId: string, fields: {
  address?:       string | null
  location_url?:  string | null
  booking_links?: BookingLink[]
  notes?:         string | null
  confirmation?:  string | null
  pay_by?:        string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('event_details')
    .upsert(
      { event_id: eventId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'event_id' }
    )

  if (error) return { error: error.message }
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

// ─── Cost CRUD ────────────────────────────────────────────────────────────────

export async function addEventCost(eventId: string, fields: {
  label:               string
  category:            CostCategory
  amount:              number
  responsible_user_id: string | null
  payment_url?:        string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('event_costs')
    .insert({ event_id: eventId, paid: false, ...fields })

  if (error) return { error: error.message }
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function toggleCostPaid(costId: string, paid: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('event_costs')
    .update({ paid })
    .eq('id', costId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteEventCost(costId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('event_costs').delete().eq('id', costId)
  return { success: true }
}
