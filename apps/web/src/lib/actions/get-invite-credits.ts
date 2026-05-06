'use server'

import { createClient } from '@/lib/supabase/server'

export async function getMyInviteCredits(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data } = await supabase
    .from('profiles')
    .select('invite_credits')
    .eq('id', user.id)
    .single()

  return data?.invite_credits ?? 0
}
