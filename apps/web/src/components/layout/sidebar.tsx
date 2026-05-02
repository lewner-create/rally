'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Settings, LogOut, MessageSquare, Plus, ChevronDown, LayoutDashboard, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AvailabilitySheet } from '@/components/availability/availability-sheet'

interface Group {
  id: string
  name: string
  slug: string
  theme_color: string | null
}

interface SidebarProps {
  groups: Group[]
  currentUserId?: string
}

export function Sidebar({ groups, currentUserId }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [groupsOpen,     setGroupsOpen]     = useState(true)
  const [unreadCount,    setUnreadCount]    = useState(0)
  const [availSheetOpen, setAvailSheetOpen] = useState(false)

  // ── Unread badge ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return
    if (pathname.startsWith('/messages')) { setUnreadCount(0); return }
    const supabase = createClient()
    const channel = supabase
      .channel('sidebar-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const msg = payload.new as any
        if (msg.user_id && msg.user_id !== currentUserId) setUnreadCount(c => c + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, pathname])

  useEffect(() => {
    if (pathname.startsWith('/messages')) setUnreadCount(0)
  }, [pathname])

  // Close sheet on navigation
  useEffect(() => { setAvailSheetOpen(false) }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isGroupActive = (id: string) => {
    if (pathname.startsWith(`/groups/${id}`)) return true
    if (typeof window !== 'undefined') {
      const last = localStorage.getItem('rally-last-group')
      if (last === id && (pathname.startsWith('/events/') || pathname.startsWith('/plans/'))) return true
    }
    return false
  }

  const activeGroup = groups.find(g => isGroupActive(g.id))
  const sheetAccent = activeGroup?.theme_color ?? '#7F77DD'

  const item = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 10px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 500,
    color: active ? '#e0e0e0' : '#555',
    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
    textDecoration: 'none', cursor: 'pointer',
    border: 'none', width: '100%', fontFamily: 'inherit',
    transition: 'color 0.15s, background 0.15s',
    textAlign: 'left' as const,
  })

  return (
    <>
      <aside style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '224px', flexShrink: 0, borderRight: '1px solid #1e1e1e', background: '#0e0c1c' }}>

        {/* Wordmark */}
        <div style={{ padding: '20px 20px 16px' }}>
          <span style={{ fontSize: '22px', fontWeight: 500, letterSpacing: '-0.03em', color: '#7F77DD', lineHeight: 1 }}>
            rally
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>

          <Link href="/messages" style={item(pathname.startsWith('/messages'))}>
            <MessageSquare size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Messages</span>
            {unreadCount > 0 && !pathname.startsWith('/messages') && (
              <span style={{ fontSize: '10px', fontWeight: 700, minWidth: '18px', height: '18px', padding: '0 4px', borderRadius: '9999px', background: '#7F77DD', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <Link href="/dashboard" style={item(pathname === '/dashboard')}>
            <LayoutDashboard size={16} style={{ flexShrink: 0 }} />
            Dashboard
          </Link>

          <button
            onClick={() => setAvailSheetOpen(true)}
            style={item(availSheetOpen || pathname === '/availability')}
          >
            <Calendar size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Availability</span>
          </button>

          {/* Groups */}
          <div style={{ paddingTop: '8px' }}>
            <button
              onClick={() => setGroupsOpen(p => !p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#444', letterSpacing: '.07em' }}>Groups</span>
              <ChevronDown size={12} style={{ color: '#333', transform: groupsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
            </button>

            {groupsOpen && (
              <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {groups.map(g => {
                  const active = isGroupActive(g.id)
                  const color  = g.theme_color ?? '#7F77DD'
                  return (
                    <Link
                      key={g.id}
                      href={`/groups/${g.id}`}
                      onClick={() => { if (typeof window !== 'undefined') localStorage.setItem('rally-last-group', g.id) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: active ? color : '#555', background: active ? 'rgba(255,255,255,0.05)' : 'transparent', textDecoration: 'none', transition: 'color 0.15s, background 0.15s' }}
                    >
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: active ? color : '#2a2a2a', flexShrink: 0, transition: 'background 0.15s' }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                    </Link>
                  )
                })}
                <Link href="/groups/new" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', marginTop: '4px', borderRadius: '8px', background: 'rgba(127,119,221,0.10)', border: '1px solid rgba(127,119,221,0.20)', color: '#7F77DD', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                  <Plus size={15} style={{ flexShrink: 0 }} />
                  New group
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px 10px 16px', borderTop: '1px solid #1a1a1a' }}>
          <Link href="/settings" style={item(pathname === '/settings')}>
            <Settings size={16} style={{ flexShrink: 0 }} />
            Settings
          </Link>
          <button onClick={handleSignOut} style={{ ...item(false), marginTop: '2px' }}>
            <LogOut size={16} style={{ flexShrink: 0 }} />
            Sign out
          </button>
        </div>
      </aside>

      <AvailabilitySheet
        isOpen={availSheetOpen}
        onClose={() => setAvailSheetOpen(false)}
        accentColor={sheetAccent}
      />
    </>
  )
}
