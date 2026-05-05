import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGroupsWithWindows, getUpcomingPlans, getNeedsYouItems, getGroupsActivity } from '@/lib/actions/dashboard'
import DashboardClient from '@/components/dashboard/dashboard-client'

export const metadata = { title: 'Dashboard — Rally' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, preferences, username')
    .eq('id', user.id)
    .single()

  if (!profile?.preferences?.onboarded) {
    redirect('/onboarding')
  }

  // Fetch everything in parallel
  const [groupsWithWindows, upcomingPlans, needsYouItems, groupsActivity] = await Promise.all([
    getGroupsWithWindows(user.id),
    getUpcomingPlans(user.id),
    getNeedsYouItems(user.id),
    getGroupsActivity(user.id),
  ])

  return (
    <DashboardClient
      profile={profile as any}
      groupsWithWindows={groupsWithWindows}
      upcomingPlans={upcomingPlans}
      needsYouItems={needsYouItems}
      groupsActivity={groupsActivity}
    />
  )
}
