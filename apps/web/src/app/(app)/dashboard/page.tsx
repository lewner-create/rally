import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getGroupsWithWindows } from '@/lib/actions/dashboard'
import DashboardClient from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, preferences')
    .eq('id', user.id)
    .single()

  if (!profile?.display_name || !profile?.preferences?.onboarded) redirect('/onboarding')

  const groupsWithWindows = await getGroupsWithWindows(user.id)

  return (
    <DashboardClient
      profile={profile}
      groupsWithWindows={groupsWithWindows}
    />
  )
}
