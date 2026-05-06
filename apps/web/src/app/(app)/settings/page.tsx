import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/actions/profile'
import { SettingsForm } from '@/components/settings/settings-form'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Settings – Volta' }

export default async function SettingsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  // Fetch invite_credits separately (may not be on Profile type yet)
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('invite_credits')
    .eq('id', profile.id)
    .single()

  return <SettingsForm profile={{ ...profile, invite_credits: data?.invite_credits ?? 5 }} />
}
