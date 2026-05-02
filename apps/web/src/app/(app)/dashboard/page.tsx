import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGroupsWithWindows, getUpcomingEventsForUser } from '@/lib/actions/dashboard'
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

  // Get group IDs first so we can pass to both fetches
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (memberRows ?? []).map((r: any) => r.group_id).filter(Boolean)

  const [groupsWithWindows, upcomingEvents] = await Promise.all([
    getGroupsWithWindows(user.id),
    getUpcomingEventsForUser(user.id, groupIds),
  ])

  return (
    <DashboardClient
      profile={profile}
      groupsWithWindows={groupsWithWindows}
      upcomingEvents={upcomingEvents}
    />
  )
}
