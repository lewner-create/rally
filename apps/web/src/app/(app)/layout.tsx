import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileLayoutWrapper } from '@/components/layout/mobile-layout-wrapper'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (memberRows ?? []).map((r: any) => r.group_id).filter(Boolean)

  const userGroups: { id: string; name: string; slug: string; theme_color: string | null }[] = []
  if (groupIds.length > 0) {
    const { data: groupRows } = await supabase
      .from('groups')
      .select('id, name, slug, theme_color')
      .in('id', groupIds)
    userGroups.push(...(groupRows ?? []))
  }

  return (
    <MobileLayoutWrapper groups={userGroups}>
      {children}
    </MobileLayoutWrapper>
  )
}
