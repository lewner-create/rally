'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Settings, LogOut, MessageSquare, Plus, ChevronDown,
  LayoutDashboard, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Group {
  id: string
  name: string
  slug: string
  theme_color: string | null
}

interface SidebarProps {
  groups: Group[]
}

const LAST_GROUP_KEY    = 'rally_last_group_id'
const COLLAPSED_KEY     = 'rally_sidebar_collapsed'
const BG_MAIN           = '#1a1333'
const BORDER_MAIN       = '#2a1f4a'
const TEXT_MUTED        = '#7b6fa0'
const TEXT_ACTIVE       = '#e0d9f7'
const ACTIVE_BG         = '#2d2250'
const HOVER_BG          = '#251b42'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function Sidebar({ groups }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const [groupsOpen,  setGroupsOpen]  = useState(true)
  const [collapsed,   setCollapsed]   = useState(false)
  const [lastGroupId, setLastGroupId] = useState<string | null>(null)

  // Restore collapse state
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY)
    if (stored === 'true') setCollapsed(true)
    setLastGroupId(localStorage.getItem(LAST_GROUP_KEY))
  }, [])

  // Track last visited group
  useEffect(() => {
    const match = pathname.match(/\/groups\/([0-9a-f-]{36})/)
    if (match) {
      localStorage.setItem(LAST_GROUP_KEY, match[1])
      setLastGroupId(match[1])
    } else {
      setLastGroupId(localStorage.getItem(LAST_GROUP_KEY))
    }
  }, [pathname])

  function toggleCollapsed() {
    setCollapsed(prev => {
      localStorage.setItem(COLLAPSED_KEY, String(!prev))
      return !prev
    })
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isGroupActive = (id: string) => {
    if (pathname.startsWith(`/groups/${id}`)) return true
    if (pathname.startsWith('/events/') || pathname.startsWith('/plans/')) {
      return lastGroupId === id
    }
    return false
  }

  const isSettingsActive =
    pathname === '/settings' ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/availability')

  const isDashboardActive = pathname === '/dashboard'
  const isMessagesActive  = pathname.startsWith('/messages')

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '10px',
    padding: collapsed ? '10px 0' : '8px 10px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: '9px', cursor: 'pointer',
    background: active ? ACTIVE_BG : 'transparent',
    color: active ? TEXT_ACTIVE : TEXT_MUTED,
    fontSize: '13px', fontWeight: active ? 600 : 500,
    textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
    width: '100%', border: 'none', fontFamily: 'inherit',
  })

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      width: collapsed ? '64px' : '224px',
      background: BG_MAIN,
      borderRight: `1px solid ${BORDER_MAIN}`,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0, overflow: 'hidden', position: 'relative',
    }}>

      {/* Wordmark + collapse toggle */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '18px 0' : '18px 14px 14px',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <span style={{
            fontSize: '22px', fontWeight: 500,
            letterSpacing: '-0.03em', color: '#9b8fcc', lineHeight: 1,
          }}>
            rally
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          style={{
            width: '26px', height: '26px', borderRadius: '8px',
            background: HOVER_BG, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: TEXT_MUTED, flexShrink: 0, transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = TEXT_ACTIVE)}
          onMouseLeave={e => (e.currentTarget.style.color = TEXT_MUTED)}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <ChevronLeft size={14} />
          }
        </button>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '4px 8px' : '4px 10px' }}>

        {/* Dashboard */}
        <Link href="/dashboard" style={navItemStyle(isDashboardActive)}
          onMouseEnter={e => { if (!isDashboardActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
          onMouseLeave={e => { if (!isDashboardActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Messages */}
        <Link href="/messages" style={{ ...navItemStyle(isMessagesActive), marginTop: '2px' }}
          onMouseEnter={e => { if (!isMessagesActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
          onMouseLeave={e => { if (!isMessagesActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          title={collapsed ? 'Messages' : undefined}
        >
          <MessageSquare size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Messages</span>}
        </Link>

        {/* Groups section */}
        <div style={{ marginTop: '16px' }}>
          {!collapsed && (
            <button
              onClick={() => setGroupsOpen(p => !p)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '4px 10px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: TEXT_MUTED, fontFamily: 'inherit',
                marginBottom: '4px',
              }}
            >
              <span>Groups</span>
              <ChevronDown
                size={12}
                style={{ transition: 'transform 0.15s', transform: groupsOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              />
            </button>
          )}

          {(groupsOpen || collapsed) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {groups.map(g => {
                const active = isGroupActive(g.id)
                const color  = g.theme_color ?? '#7F77DD'
                return (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                    title={collapsed ? g.name : undefined}
                    style={navItemStyle(active)}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    {collapsed ? (
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: `${color}25`, color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 800, flexShrink: 0,
                      }}>
                        {initials(g.name)}
                      </div>
                    ) : (
                      <>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: color, flexShrink: 0,
                        }} />
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {g.name}
                        </span>
                      </>
                    )}
                  </Link>
                )
              })}

              {/* New group */}
              <Link
                href="/groups/new"
                title={collapsed ? 'New group' : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : '8px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px 0' : '8px 10px',
                  borderRadius: '9px', marginTop: '4px',
                  background: 'rgba(127,119,221,0.12)',
                  border: '1px solid rgba(127,119,221,0.2)',
                  color: '#9b8fcc', fontSize: '13px', fontWeight: 600,
                  textDecoration: 'none', transition: 'background 0.15s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(127,119,221,0.2)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(127,119,221,0.12)')}
              >
                <Plus size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span>New group</span>}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom actions */}
      <div style={{
        padding: collapsed ? '8px' : '8px 10px',
        borderTop: `1px solid ${BORDER_MAIN}`,
        display: 'flex', flexDirection: 'column', gap: '2px',
        flexShrink: 0,
      }}>
        <Link
          href="/settings"
          title={collapsed ? 'Settings' : undefined}
          style={navItemStyle(isSettingsActive)}
          onMouseEnter={e => { if (!isSettingsActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
          onMouseLeave={e => { if (!isSettingsActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <Settings size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          style={navItemStyle(false)}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = HOVER_BG)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
