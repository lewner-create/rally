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
  textTransform: 'uppercase', color: '#666', margin: '0 0 12px',
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* â”€â”€ Mobile group header â€” hidden on md+ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/*
        Back button wraps the arrow AND group name as one big touch target.
        Settings icon is a separate link on the right.
        sticky top-14 = sits below the layout's mobile nav bar (h-14).
      */}
      <div
        className="md:hidden flex items-center gap-2 px-4 border-b sticky top-14 z-20"
        style={{ background: '#111', borderColor: '#222', minHeight: '52px' }}
      >
        {/* Large touch target: arrow + group name */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 flex-1 min-w-0 py-3"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={16} color="#555" className="flex-shrink-0" />
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: `${themeColor}25`, color: themeColor }}
          >
            {initials(group.name)}
          </div>
          <span
            className="text-sm font-semibold truncate"
            style={{ color: '#fff' }}
          >
            {group.name}
          </span>
        </Link>

        {/* Settings â€” right side */}
        <Link
          href={`/groups/${groupId}/settings`}
          className="p-2 rounded-lg flex-shrink-0"
          style={{ color: '#555', textDecoration: 'none' }}
          aria-label="Group settings"
        >
          <Settings size={16} />
        </Link>
      </div>

      {/* â”€â”€ Main row (left panel + content) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* â”€â”€ Left panel â€” hidden on mobile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div
          className="hidden md:flex"
          style={{
            width: '256px', flexShrink: 0,
            flexDirection: 'column',
            overflowY: 'auto', borderRight: '0.5px solid #222',
            padding: '24px 20px', background: '#111',
            minHeight: '100vh',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: '#555', textDecoration: 'none', marginBottom: '22px',
            }}
          >
            <ArrowLeft size={13} /> Dashboard
          </Link>

          {/* Group identity */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, marginBottom: '10px',
              background: `${themeColor}20`, color: themeColor,
            }}>
              {initials(group.name)}
            </div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 3px', color: '#fff', letterSpacing: '-0.1px' }}>
              {group.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={11} color="#555" />
              <span style={{ fontSize: '12px', color: '#555' }}>
                {group.group_members.length} of 6 members
              </span>
            </div>
            {(group as any).description && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px', lineHeight: 1.5 }}>
                {(group as any).description}
              </p>
            )}
          </div>

          <div style={{ borderTop: '0.5px solid #222', margin: '0 0 18px' }} />

          <div style={{ flex: 1 }}>
            <p style={SECTION_LABEL}>Members</p>
            <MemberList members={group.group_members} currentUserId={user.id} />
          </div>

          <div style={{ borderTop: '0.5px solid #222', margin: '18px 0 14px' }} />
          <Link
            href={`/groups/${groupId}/settings`}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              fontSize: '13px', color: '#666', textDecoration: 'none', padding: '5px 0',
            }}
          >
            <Settings size={13} /> Group settings
          </Link>

          {isAdmin && (
            <>
              <div style={{ borderTop: '0.5px solid #222', margin: '14px 0' }} />
              <div>
                <p style={SECTION_LABEL}>Invite people</p>
                <InvitePanel groupId={group.id} groupName={group.name} initialInvites={invites} />
              </div>
            </>
          )}
        </div>

        {/* â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
    </div>
  )
}
