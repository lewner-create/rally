import { getGroupWithMembers } from '@/lib/actions/groups'
import { GroupSettingsForm } from './group-settings-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

  // Fetch Podium status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_podium')
    .eq('id', user.id)
    .single()

  const isPodium = !!(profile as any)?.is_podium

  return (
    <div style={{ minHeight: '100vh', background: '#F9F8F5' }}>
      <div style={{ maxWidth: '620px', padding: '32px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <Link
            href={`/groups/${groupId}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: '#aaa', textDecoration: 'none',
              marginBottom: '16px', transition: 'color 0.15s',
            }}
          >
            <ArrowLeft size={13} /> Back to group
          </Link>
          <h1 style={{
            fontSize: '22px', fontWeight: 700, color: '#111',
            margin: '0 0 4px', letterSpacing: '-0.2px',
          }}>
            Group settings
          </h1>
          <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>
            {group.name}
            {!isAdmin && ' · You have member access'}
          </p>
        </div>

        <GroupSettingsForm
          groupId={groupId}
          name={group.name}
          description={(group as any).description ?? null}
          themeColor={(group as any).theme_color ?? '#7F77DD'}
          bannerUrl={(group as any).banner_url ?? null}
          interests={(group as any).interests ?? []}
          members={group.group_members as any}
          currentUserId={user.id}
          isAdmin={isAdmin}
          isPodium={isPodium}
        />

      </div>
    </div>
  )
}
