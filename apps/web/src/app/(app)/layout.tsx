import { redirect } from 'next/navigation'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'

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
    <div className="flex h-screen overflow-hidden">
      <Sidebar groups={userGroups} userId={user.id} />
      <main className="flex-1 overflow-y-auto" style={{ background: '#0f0f0f' }}>
        {children}
        <ChatBubble />
      </main>
    </div>
  )
}
