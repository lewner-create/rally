'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Settings, LogOut, MessageSquare, Plus, ChevronDown, LayoutDashboard, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Group { id: string; name: string; slug: string; theme_color: string | null }
interface SidebarProps { groups: Group[]; currentUserId: string; initialUnread: number }

const BG = '#1a1333'; const BORDER = '#2a1f4a'; const MUTED = '#7b6fa0'; const ACCENT = '#9b8fcc'
const BG_HOVER = '#251b42'; const BG_ACTIVE = '#2d2250'

function initials(name: string) { return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() }

export function Sidebar({ groups, currentUserId, initialUnread }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [groupsOpen,  setGroupsOpen]  = useState(true)
  const [collapsed,   setCollapsed]   = useState(false)
  const [unread,      setUnread]      = useState(initialUnread)
  const [ready,       setReady]       = useState(false)
  const [lastGroupId, setLastGroupId] = useState<string | null>(null)

  useEffect(() => {
    try { if (localStorage.getItem('sidebar-collapsed') === 'true') setCollapsed(true) } catch {}
    try { setLastGroupId(localStorage.getItem('last-group-id')) } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    const match = pathname.match(/^\/groups\/([^/]+)/)
    if (match) {
      try { localStorage.setItem('last-group-id', match[1]) } catch {}
      setLastGroupId(match[1])
    }
  }, [pathname])

  function toggleCollapse() {
    setCollapsed(p => { try { localStorage.setItem('sidebar-collapsed', String(!p)) } catch {}; return !p })
  }

  useEffect(() => { if (pathname.startsWith('/messages')) setUnread(0) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase.channel('sidebar-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const msg = payload.new as { user_id: string }
        if (msg.user_id !== currentUserId && !pathname.startsWith('/messages')) setUnread(n => n + 1)
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [currentUserId, pathname])

  async function handleSignOut() {
    const supabase = createClient(); await supabase.auth.signOut(); router.push('/login')
  }

  const isGroupActive = (id: string) => {
    if (pathname.startsWith(`/groups/${id}`)) return true
    if ((pathname.startsWith('/events/') || pathname.startsWith('/plans/')) && lastGroupId === id) return true
    return false
  }

  const w = ready ? (collapsed ? '68px' : '224px') : '224px'

  return (
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
        transition: 'opacity 0.15s ease', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 12px 12px 18px', flexShrink: 0 }}>
          <span style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', color: '#9b8fcc', whiteSpace: 'nowrap' }}>rally</span>
          <button onClick={toggleCollapse} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: '4px', borderRadius: '6px', display: 'flex', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = ACCENT} onMouseLeave={e => e.currentTarget.style.color = MUTED}>
            <ChevronLeft size={16} />
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            { href: '/dashboard', icon: <LayoutDashboard size={19} />, label: 'Dashboard', active: pathname === '/dashboard' },
            { href: '/messages',  icon: <MessageSquare size={19} />,   label: 'Messages',  active: pathname.startsWith('/messages'), badge: unread },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 10px', borderRadius: '8px',
              textDecoration: 'none', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap',
              background: item.active ? BG_ACTIVE : 'transparent',
              color: item.active ? '#c4b8f0' : MUTED, transition: 'background .15s, color .15s',
            }}
              onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = BG_HOVER; e.currentTarget.style.color = ACCENT } }}
              onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED } }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '99px', background: '#7F77DD', color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}

          <div style={{ marginTop: '8px' }}>
            <button onClick={() => setGroupsOpen(p => !p)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
              color: MUTED, fontFamily: 'inherit', borderRadius: '6px', transition: 'color .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = ACCENT}
              onMouseLeave={e => e.currentTarget.style.color = MUTED}>
              <span>Groups</span>
              <ChevronDown size={12} style={{ transform: groupsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .2s' }} />
            </button>
            {groupsOpen && (
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {groups.map(g => {
                  const active = isGroupActive(g.id)
                  const color  = g.theme_color ?? '#7F77DD'
                  return (
                    <Link key={g.id} href={`/groups/${g.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px',
                      borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                      background: active ? BG_ACTIVE : 'transparent', color: active ? '#d0c8f0' : MUTED,
                      transition: 'background .15s, color .15s', whiteSpace: 'nowrap',
                    }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = BG_HOVER; e.currentTarget.style.color = ACCENT } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED } }}
                    >
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0, background: color, boxShadow: active ? `0 0 6px ${color}90` : 'none' }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</span>
                    </Link>
                  )
                })}
                <Link href="/groups/new" style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', marginTop: '2px',
                  borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#9b8fcc',
                  background: 'rgba(127,119,221,0.12)', border: '1px solid rgba(127,119,221,0.22)', transition: 'background .15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(127,119,221,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(127,119,221,0.12)'}
                >
                  <Plus size={14} /> New group
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div style={{ padding: '8px', borderTop: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {(() => { const active = pathname === '/settings'; return (
            <Link href="/settings" style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 10px', borderRadius: '8px',
              textDecoration: 'none', fontSize: '14px', fontWeight: 500,
              background: active ? BG_ACTIVE : 'transparent', color: active ? '#c4b8f0' : MUTED, transition: 'background .15s, color .15s',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = BG_HOVER; e.currentTarget.style.color = ACCENT } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED } }}
            ><Settings size={19} /><span style={{ marginLeft: '12px' }}>Settings</span></Link>
          )})()}
          <button onClick={handleSignOut} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 10px', borderRadius: '8px',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
            color: MUTED, fontFamily: 'inherit', width: '100%', transition: 'background .15s, color .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = BG_HOVER; e.currentTarget.style.color = '#e07070' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = MUTED }}
          ><LogOut size={19} style={{ flexShrink: 0 }} /> Sign out</button>
        </div>
      </div>

      {/* COLLAPSED */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 0', gap: '4px',
        opacity: collapsed ? 1 : 0, pointerEvents: collapsed ? 'auto' : 'none',
        transition: 'opacity 0.15s ease',
      }}>
        <button onClick={toggleCollapse} title="Expand" style={{
          width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(127,119,221,0.15)', border: 'none', cursor: 'pointer',
          color: '#9b8fcc', fontSize: '18px', fontWeight: 700, fontFamily: 'inherit', marginBottom: '4px', flexShrink: 0,
        }}>r</button>
        <div style={{ width: '32px', height: '1px', background: BORDER, margin: '2px 0' }} />
        {[
          { href: '/dashboard', icon: <LayoutDashboard size={21} />, active: pathname === '/dashboard', title: 'Dashboard' },
          { href: '/messages',  icon: <MessageSquare size={21} />,   active: pathname.startsWith('/messages'), title: 'Messages', badge: unread },
        ].map(item => (
          <Link key={item.href} href={item.href} title={item.title} style={{
            width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', position: 'relative', flexShrink: 0,
            background: item.active ? BG_ACTIVE : 'transparent', color: item.active ? '#c4b8f0' : MUTED,
            transition: 'background .15s, color .15s',
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = BG_HOVER; e.currentTarget.style.color = ACCENT } }}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED } }}
          >
            {item.icon}
            {item.badge != null && item.badge > 0 && (
              <span style={{ position: 'absolute', top: '6px', right: '6px', width: '9px', height: '9px', borderRadius: '50%', background: '#7F77DD', border: `2px solid ${BG}` }} />
            )}
          </Link>
        ))}
        <div style={{ width: '32px', height: '1px', background: BORDER, margin: '4px 0' }} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
          {groups.map(g => {
            const active = isGroupActive(g.id)
            const color  = g.theme_color ?? '#7F77DD'
            return (
              <Link key={g.id} href={`/groups/${g.id}`} title={g.name} style={{
                width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                borderRadius: active ? '12px' : '16px',
                background: active ? color : `${color}30`,
                boxShadow: active ? `0 0 10px ${color}50` : 'none',
                transition: 'background .15s, box-shadow .15s, border-radius .15s',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderRadius = '12px'; e.currentTarget.style.background = `${color}60` } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderRadius = '16px'; e.currentTarget.style.background = `${color}30` } }}
              >{initials(g.name)}</Link>
            )
          })}
          <Link href="/groups/new" title="New group" style={{
            width: '44px', height: '44px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', color: '#7F77DD', background: 'rgba(127,119,221,0.12)',
            border: '1px solid rgba(127,119,221,0.25)', transition: 'border-radius .15s, background .15s', flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderRadius = '12px'; e.currentTarget.style.background = 'rgba(127,119,221,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.borderRadius = '16px'; e.currentTarget.style.background = 'rgba(127,119,221,0.12)' }}
          ><Plus size={20} /></Link>
        </div>
        <div style={{ width: '32px', height: '1px', background: BORDER, margin: '4px 0' }} />
        {(() => { const active = pathname === '/settings'; return (
          <Link href="/settings" title="Settings" style={{
            width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', background: active ? BG_ACTIVE : 'transparent', color: active ? '#c4b8f0' : MUTED,
            transition: 'background .15s, color .15s', flexShrink: 0,
          }}><Settings size={21} /></Link>
        )})()}
        <button onClick={handleSignOut} title="Sign out" style={{
          width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer', color: MUTED, transition: 'color .15s', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#e07070'} onMouseLeave={e => e.currentTarget.style.color = MUTED}
        ><LogOut size={21} /></button>
      </div>
    </aside>
  )
}