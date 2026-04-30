import { getGroupWithMembers, getGroupInvites } from '@/lib/actions/groups'
import { getEventsForGroup } from '@/lib/actions/events'
import { getActivePlanCards } from '@/lib/actions/plan-cards'
import { getProactivePrompt } from '@/lib/actions/prompts'
import { OpenWindows } from '@/components/windows/open-windows'
import { MemberList } from '@/components/groups/member-list'
import { InvitePanel } from '@/components/groups/invite-panel'
import { GroupPageClient } from '@/components/groups/group-page-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Users, Settings } from 'lucide-react'
import Link from 'next/link'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, letterSpacing: '.08em',
  textTransform: 'uppercase', color: '#555', margin: '0 0 12px',
}

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [group, invites, events, activeCards, prompt] = await Promise.all([
    getGroupWithMembers(groupId),
    getGroupInvites(groupId),
    getEventsForGroup(groupId),
    getActivePlanCards(groupId),
    getProactivePrompt(groupId),
  ])

  if (!group) redirect('/dashboard')

  const isAdmin    = group.group_members.some(
    (m: { user_id: string; role: string }) => m.user_id === user.id && m.role === 'admin'
  )
  const themeColor = (group as any).theme_color ?? '#7F77DD'

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ── Left sidebar ──────────────────────────────────────────────── */}
      <div style={{
        width: '240px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', borderRight: '1px solid #1e1e1e',
        padding: '20px 16px', background: '#131313',
      }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: '#555', textDecoration: 'none', marginBottom: '20px',
            transition: 'color 0.15s',
          }}
        >
          <ArrowLeft size={13} /> Dashboard
        </Link>

        {/* Group identity */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 800, marginBottom: '10px',
            background: `${themeColor}20`, color: themeColor,
          }}>
            {initials(group.name)}
          </div>
          <h1 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 3px', color: '#fff', letterSpacing: '-0.1px' }}>
            {group.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={11} color="#555" />
            <span style={{ fontSize: '12px', color: '#555' }}>
              {group.group_members.length} {group.group_members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
          {(group as any).description && (
            <p style={{ fontSize: '12px', color: '#555', marginTop: '6px', lineHeight: 1.6 }}>
              {(group as any).description}
            </p>
          )}
        </div>

        <div style={{ borderTop: '1px solid #1e1e1e', margin: '0 0 16px' }} />

        <div style={{ flex: 1 }}>
          <p style={SECTION_LABEL}>Members</p>
          <MemberList members={group.group_members} currentUserId={user.id} />
        </div>

        <div style={{ borderTop: '1px solid #1e1e1e', margin: '16px 0 12px' }} />

        <Link
          href={`/groups/${groupId}/settings`}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            fontSize: '13px', color: '#555', textDecoration: 'none', padding: '5px 0',
          }}
        >
          <Settings size={13} /> Group settings
        </Link>

        {isAdmin && (
          <>
            <div style={{ borderTop: '1px solid #1e1e1e', margin: '12px 0' }} />
            <div>
              <p style={SECTION_LABEL}>Invite people</p>
              <InvitePanel groupId={group.id} initialInvites={invites} />
            </div>
          </>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <GroupPageClient
        groupId={groupId}
        themeColor={themeColor}
        events={events}
        activeCards={activeCards}
        prompt={prompt}
        currentUserId={user.id}
        tier={group.tier}
        openWindowsSlot={<OpenWindows groupId={group.id} tier={group.tier} />}
      />
    </div>
  )
}
