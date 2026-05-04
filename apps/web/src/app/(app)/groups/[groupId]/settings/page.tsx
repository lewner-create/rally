import { getGroupWithMembers } from '@/lib/actions/groups'
import { GroupSettingsForm } from './group-settings-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const group = await getGroupWithMembers(groupId)
  return { title: `${group?.name ?? 'Group'} settings — Rally` }
}

export default async function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const group = await getGroupWithMembers(groupId)
  if (!group) redirect('/dashboard')

  const isAdmin = group.group_members.some(
    (m: { user_id: string; role: string }) => m.user_id === user.id && m.role === 'admin'
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_podium')
    .eq('id', user.id)
    .single()

  const isPodium = !!(profile as any)?.is_podium

  return (
    <GroupSettingsForm
      group={{
        id: group.id,
        name: group.name,
        description: (group as any).description ?? null,
        theme_color: (group as any).theme_color ?? '#7F77DD',
        banner_url: (group as any).banner_url ?? null,
        interests: (group as any).interests ?? [],
        group_members: group.group_members as any,
      }}
      currentUserId={user.id}
      isAdmin={isAdmin}
      isPodium={isPodium}
    />
  )
}
