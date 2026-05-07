'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { MemberList } from '@/components/groups/member-list'
import { InvitePanel } from '@/components/groups/invite-panel'
import { GroupAvailabilitySheet } from '@/components/availability/group-availability-sheet'
import type { WeeklyAvailability } from '@/lib/actions/availability-utils'

const BG = '#12102a'; const BORDER = '#221a3e'; const MUTED = '#7b6fa0'; const ACCENT = '#9b8fcc'
const BG_HOVER = '#1c1840'
const SECTION: React.CSSProperties = { fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED, margin: '0 0 8px' }

function gInitials(name: string) { return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() }
function mInitials(profile: any) {
  const name = profile?.display_name || profile?.username || '?'
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  groupId: string; groupName: string; themeColor: string; description?: string | null
  members: any[]; currentUserId: string; isAdmin: boolean; invites: any[]
  initialAvailability: WeeklyAvailability; initialIsCustom: boolean
}

export function GroupSidebar({ groupId, groupName, themeColor, description, members, currentUserId, isAdmin, invites, initialAvailability, initialIsCustom }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [availOpen, setAvailOpen] = useState(false)
  const [isCustom,  setIsCustom]  = useState(initialIsCustom)
  const [ready,     setReady]     = useState(false)

  useEffect(() => {
    try { if (localStorage.getItem('group-sidebar-collapsed') === 'true') setCollapsed(true) } catch {}
    setReady(true)
  }, [])

  function toggleCollapse() {
    setCollapsed(p => { try { localStorage.setItem('group-sidebar-collapsed', String(!p)) } catch {}; return !p })
  }

  const w = ready ? (collapsed ? '52px' : '256px') : '256px'

  return (
    <>
      <aside style={{
        width: w, minWidth: w, flexShrink: 0, height: '100%',
        borderRight: `1px solid ${BORDER}`, background: BG,
        display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
        transition: ready ? 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)' : 'none',
      }}>

        {/* EXPANDED */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          opacity: collapsed ? 0 : 1, pointerEvents: collapsed ? 'none' : 'auto',
          transition: 'opacity 0.15s ease', overflowY: 'auto', padding: '20px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED, textDecoration: 'none', transition: 'color .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.color = ACCENT} onMouseLeave={e => e.currentTarget.style.color = MUTED}>
              <ArrowLeft size={13} /> Dashboard
            </Link>
            <button onClick={toggleCollapse} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: '4px', borderRadius: '6px', display: 'flex', transition: 'color .15s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = ACCENT} onMouseLeave={e => e.currentTarget.style.color = MUTED}>
              <ChevronLeft size={15} />
            </button>
          </div>

          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, marginBottom: '10px', background: `${themeColor}25`, color: themeColor }}>
              {gInitials(groupName)}
            </div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 3px', color: themeColor, letterSpacing: '-0.1px' }}>{groupName}</h1>
            <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>{members.length} of 6 members</p>
            {description && <p style={{ fontSize: '12px', color: MUTED, marginTop: '5px', lineHeight: 1.5 }}>{description}</p>}
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '0 0 16px', flexShrink: 0 }} />

          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <p style={SECTION}>Members</p>
            <MemberList members={members} currentUserId={currentUserId} />
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '0 0 16px', flexShrink: 0 }} />

          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <p style={SECTION}>My availability</p>
            <button onClick={() => setAvailOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', fontFamily: 'inherit', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = BG_HOVER} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: isCustom ? themeColor : MUTED, boxShadow: isCustom ? `0 0 6px ${themeColor}80` : 'none' }} />
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: isCustom ? themeColor : '#888', margin: 0, lineHeight: 1.3 }}>{isCustom ? 'Custom for this group' : 'Using default'}</p>
                <p style={{ fontSize: '11px', color: MUTED, margin: 0, lineHeight: 1.3 }}>Tap to {isCustom ? 'adjust' : 'customise'}</p>
              </div>
              <span style={{ marginLeft: 'auto', color: MUTED, fontSize: '12px', flexShrink: 0 }}>â€º</span>
            </button>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '0 0 14px', flexShrink: 0 }} />

          <Link href={`/groups/${groupId}/settings`} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: MUTED, textDecoration: 'none', padding: '6px 8px', borderRadius: '8px', transition: 'background .15s, color .15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = BG_HOVER; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = MUTED }}>
            <Settings size={13} /> Group settings
          </Link>

          {isAdmin && (
            <>
              <div style={{ borderTop: `1px solid ${BORDER}`, margin: '14px 0', flexShrink: 0 }} />
              <div style={{ flexShrink: 0 }}>
                <p style={SECTION}>Invite people</p>
                <InvitePanel groupId={groupId} groupName={groupName} initialInvites={invites} />
              </div>
            </>
          )}
        </div>

        {/* COLLAPSED */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '12px 0', gap: '6px',
          opacity: collapsed ? 1 : 0, pointerEvents: collapsed ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
        }}>
          <button onClick={toggleCollapse} title="Expand" style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: '4px', borderRadius: '6px', display: 'flex', marginBottom: '4px', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = ACCENT} onMouseLeave={e => e.currentTarget.style.color = MUTED}>
            <ChevronRight size={15} />
          </button>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', background: themeColor, boxShadow: `0 0 8px ${themeColor}50`, flexShrink: 0 }}>
            {gInitials(groupName)}
          </div>
          <div style={{ width: '28px', height: '1px', background: BORDER, margin: '2px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            {members.slice(0, 5).map((m: any) => {
              const p = m.profiles; const isSelf = m.user_id === currentUserId
              return (
                <div key={m.user_id} title={p?.display_name || p?.username} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', background: isSelf ? themeColor : '#1e1a38', border: `1px solid ${isSelf ? themeColor + '80' : BORDER}`, flexShrink: 0 }}>
                  {mInitials(p)}
                </div>
              )
            })}
            {members.length > 5 && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: MUTED, background: BG, border: `1px solid ${BORDER}` }}>
                +{members.length - 5}
              </div>
            )}
          </div>
          <div style={{ width: '28px', height: '1px', background: BORDER, margin: '2px 0' }} />
          <button onClick={() => setAvailOpen(true)} title={isCustom ? 'Custom availability' : 'Default availability'} style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = BG_HOVER} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isCustom ? themeColor : MUTED, boxShadow: isCustom ? `0 0 6px ${themeColor}80` : 'none' }} />
          </button>
          <Link href={`/groups/${groupId}/settings`} title="Group settings" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: MUTED, transition: 'background .15s, color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = BG_HOVER; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = MUTED }}>
            <Settings size={16} />
          </Link>
        </div>
      </aside>

      <GroupAvailabilitySheet
        groupId={groupId} groupName={groupName} themeColor={themeColor}
        initialAvailability={initialAvailability} initialIsCustom={isCustom}
        open={availOpen} onClose={() => setAvailOpen(false)}
        onSaved={(custom) => setIsCustom(custom)}
      />
    </>
  )
}