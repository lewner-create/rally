import { getGroupWithMembers, getGroupInvites } from '@/lib/actions/groups'
import { getEventsForGroup } from '@/lib/actions/events'
import { getActivePlanCards } from '@/lib/actions/plan-cards'
import { getProactivePrompt } from '@/lib/actions/prompts'
import { getGroupAvailability } from '@/lib/actions/availability'
import { OpenWindows } from '@/components/windows/open-windows'
import { GroupPageClient } from '@/components/groups/group-page-client'
import { GroupSidebar } from '@/components/groups/group-sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [group, invites, events, activeCards, prompt, availResult] = await Promise.all([
    getGroupWithMembers(groupId),
    getGroupInvites(groupId),
    getEventsForGroup(groupId),
    getActivePlanCards(groupId),
    getProactivePrompt(groupId),
    getGroupAvailability(groupId),
  ])

  if (!group) redirect('/dashboard')

  const isAdmin    = group.group_members.some(
    (m: { user_id: string; role: string }) => m.user_id === user.id && m.role === 'admin'
  )
  const themeColor = (group as any).theme_color ?? '#7F77DD'

  return (
    <div style={{ display:'flex', height:'100%' }}>
      <style>{`
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <GroupSidebar
        groupId={groupId}
        groupName={group.name}
        themeColor={themeColor}
        description={(group as any).description}
        members={group.group_members}
        currentUserId={user.id}
        isAdmin={isAdmin}
        invites={invites}
        initialAvailability={availResult.availability}
        initialIsCustom={availResult.isCustom}
      />

      <div style={{ flex:1, minWidth:0, animation:'pageFadeIn 0.2s ease forwards' }}>
        <GroupPageClient
          groupId={groupId}
          themeColor={themeColor}
          events={events}
          activeCards={activeCards}
          prompt={prompt}
          currentUserId={user.id}
          tier={group.tier}
          openWindowsSlot={<OpenWindows groupId={group.id} tier={group.tier} />}
          groupName={group.name}
        />
      </div>
    </div>
  )
}