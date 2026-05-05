'use server'

import { createClient } from '@/lib/supabase/server'

export async function completeTour(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single()

  await supabase
    .from('profiles')
    .update({ preferences: { ...(data?.preferences ?? {}), tour_completed: true } })
    .eq('id', user.id)
}

export async function resetTour(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single()

  await supabase
    .from('profiles')
    .update({ preferences: { ...(data?.preferences ?? {}), tour_completed: false } })
    .eq('id', user.id)
}
