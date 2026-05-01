'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Settings, LogOut, MessageSquare, Plus, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { AvailabilitySheet } from '@/components/availability/availability-sheet'

interface Group {
  id:          string
  name:        string
  slug:        string
  theme_color: string | null
}

interface SidebarProps {
  groups: Group[]
}

export function Sidebar({ groups }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const [collapsed,   setCollapsed]   = useState(false)
  const [lastGroupId, setLastGroupId] = useState<string | null>(null)

  // Extract group ID from URL
  const groupIdFromPath = pathname.match(/\/groups\/([0-9a-f-]{36})/)?.[1] ?? null

  // Persist last visited group
  useEffect(() => {
    if (groupIdFromPath) {
      try { localStorage.setItem('rally_last_group', groupIdFromPath) } catch {}
      setLastGroupId(groupIdFromPath)
    } else {
      try { setLastGroupId(localStorage.getItem('rally_last_group')) } catch {}
    }
  }, [groupIdFromPath])

  // Restore collapsed state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rally_sidebar_collapsed')
      if (stored !== null) setCollapsed(stored === 'true')
    } catch {}
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('rally_sidebar_collapsed', String(next)) } catch {}
  }

  const activeGroupId = groupIdFromPath ?? lastGroupId
  const isGroupActive = (id: string) => id === activeGroupId

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Nav item class — compact centered square when collapsed, full row when expanded
  const navItemCn = (active: boolean) => cn(
    'flex items-center rounded-md text-sm font-medium transition-colors',
    collapsed
      ? 'justify-center w-9 h-9 mx-auto'
      : 'gap-2.5 px-2.5 py-2 w-full',
    active
      ? 'bg-[#7F77DD22] text-[#9b97dd]'
      : 'text-[#666] hover:bg-[#1a1728] hover:text-[#e0e0e0]'
  )

  return (
    <aside style={{
      background: '#0e0c1c', borderRight: '1px solid #1e1b2e',
      display: 'flex', flexDirection: 'column', height: '100%',
      width: collapsed ? '56px' : '224px', flexShrink: 0,
      transition: 'width 0.2s ease', overflow: 'hidden',
    }}>

      {/* Header — wordmark + toggle */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '16px 0' : '18px 16px 14px',
      }}>
        {!collapsed && (
          <span style={{ fontSize: '22px', fontWeight: 500, letterSpacing: '-0.03em', color: '#7F77DD', lineHeight: 1 }}>
            rally
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: 'none', border: '1px solid #2a2a2a',
            cursor: 'pointer', color: '#444', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#444' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: collapsed ? '4px 0' : '0 12px',
        display: 'flex', flexDirection: 'column', gap: '2px',
      }}>

        <Link href="/messages" className={navItemCn(pathname.startsWith('/messages'))} title={collapsed ? 'Messages' : ''}>
          <MessageSquare className="h-4 w-4 shrink-0" />
          {!collapsed && 'Messages'}
        </Link>

        <Link href="/dashboard" className={navItemCn(pathname === '/dashboard')} title={collapsed ? 'Dashboard' : ''}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {!collapsed && 'Dashboard'}
        </Link>

        {/* Groups */}
        <div style={{ paddingTop: '8px' }}>
          {!collapsed && (
            <p style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#3d3856', padding: '4px 10px 6px',
            }}>Groups</p>
          )}

          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: collapsed ? '6px' : '2px',
            alignItems: collapsed ? 'center' : 'stretch',
          }}>
            {groups.map(g => {
              const active = isGroupActive(g.id)
              const color  = g.theme_color ?? '#7F77DD'

              if (collapsed) {
                return (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                    title={g.name}
                    style={{
                      width: '36px', height: '36px',
                      borderRadius: active ? '10px' : '14px',
                      background: active ? color + '30' : color + '18',
                      border: '1.5px solid ' + (active ? color + '55' : 'transparent'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 900, color,
                      textDecoration: 'none', flexShrink: 0,
                      transition: 'border-radius 0.2s, background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = color + '2e'
                        el.style.borderColor = color + '44'
                        el.style.borderRadius = '10px'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = color + '18'
                        el.style.borderColor = 'transparent'
                        el.style.borderRadius = '14px'
                      }
                    }}
                  >
                    {g.name[0]?.toUpperCase()}
                  </Link>
                )
              }

              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 8px', borderRadius: '8px',
                    background: active ? color + '18' : 'transparent',
                    border: active ? '1px solid ' + color + '33' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = color + '10'
                      const icon = el.querySelector('.g-icon') as HTMLElement
                      if (icon) { icon.style.background = color + '2e'; icon.style.borderColor = color + '44' }
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'transparent'
                      const icon = el.querySelector('.g-icon') as HTMLElement
                      if (icon) { icon.style.background = color + '18'; icon.style.borderColor = 'transparent' }
                    }
                  }}
                >
                  <div
                    className="g-icon"
                    style={{
                      width: '24px', height: '24px', flexShrink: 0,
                      borderRadius: active ? '7px' : '10px',
                      background: active ? color + '30' : color + '18',
                      border: '1.5px solid ' + (active ? color + '55' : 'transparent'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 900, color,
                      transition: 'border-radius 0.2s, background 0.15s, border-color 0.15s',
                    }}
                  >
                    {g.name[0]?.toUpperCase()}
                  </div>
                  <span style={{
                    fontSize: '13px', fontWeight: 500,
                    color: active ? color : '#d0d0d0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    transition: 'color 0.15s', flex: 1,
                  }}>
                    {g.name}
                  </span>
                </Link>
              )
            })}

            {/* New group */}
            {collapsed ? (
              <Link
                href="/groups/new"
                title="New group"
                style={{
                  width: '36px', height: '36px', borderRadius: '14px',
                  background: 'rgba(127,119,221,0.12)',
                  border: '1.5px solid rgba(127,119,221,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#7F77DD', textDecoration: 'none',
                  transition: 'border-radius 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderRadius = '10px' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderRadius = '14px' }}
              >
                <Plus size={16} />
              </Link>
            ) : (
              <Link
                href="/groups/new"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 8px', marginTop: '2px', borderRadius: '8px',
                  background: 'rgba(127,119,221,0.10)',
                  border: '1px solid rgba(127,119,221,0.22)',
                  color: '#7F77DD', textDecoration: 'none',
                  fontSize: '13px', fontWeight: 600,
                }}
              >
                <Plus className="h-4 w-4 shrink-0" />
                New group
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div style={{
        borderTop: '1px solid #1e1b2e',
        padding: collapsed ? '8px 0' : '8px 12px',
        display: 'flex', flexDirection: 'column',
        alignItems: collapsed ? 'center' : 'stretch',
        gap: '2px',
      }}>
        <AvailabilitySheet
          triggerClassName={collapsed
            ? 'flex items-center justify-center w-9 h-9 mx-auto rounded-md text-[#666] hover:bg-[#1a1728] hover:text-[#e0e0e0] transition-colors'
            : 'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors text-[#666] hover:bg-[#1a1728] hover:text-[#e0e0e0]'
          }
          collapsed={collapsed}
        />

        <Link
          href="/settings"
          title={collapsed ? 'Settings' : ''}
          className={navItemCn(pathname === '/settings')}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && 'Settings'}
        </Link>

        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : ''}
          className={navItemCn(false)}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
