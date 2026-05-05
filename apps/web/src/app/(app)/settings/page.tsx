import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings/settings-form'

export const metadata = { title: 'Settings — Volta' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, preferences, invite_credits')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return <SettingsForm profile={profile as any} />
}
