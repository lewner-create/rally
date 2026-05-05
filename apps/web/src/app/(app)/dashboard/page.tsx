import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGroupsWithWindows, getUpcomingPlans, getNeedsYouItems } from '@/lib/actions/dashboard'
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

  const [groupsWithWindows, upcomingPlans, needsYouItems] = await Promise.all([
    getGroupsWithWindows(user.id),
    getUpcomingPlans(user.id),
    getNeedsYouItems(user.id),
  ])

  const groupsActivity = groupsWithWindows.map(g => ({
    id:            g.id,
    name:          g.name,
    theme_color:   g.theme_color,
    member_count:  g.member_count,
    last_activity: g.next_window ? `Free ${g.next_window.label.toLowerCase()}` : null,
    unread:        0,
  }))

  const tourCompleted = profile?.preferences?.tour_completed === true

  return (
    <DashboardClient
      profile={profile}
      groupsWithWindows={groupsWithWindows}
      groupsActivity={groupsActivity}
      upcomingPlans={upcomingPlans}
      needsYouItems={needsYouItems}
      tourCompleted={tourCompleted}
    />
  )
}
