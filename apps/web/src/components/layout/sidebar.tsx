'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Settings, LogOut, MessageSquare, Plus, ChevronDown, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Group {
  id: string
  name: string
  slug: string
  theme_color: string | null
}

interface SidebarProps {
  groups: Group[]
}

const LAST_GROUP_KEY = 'rally_last_group_id'

export function Sidebar({ groups }: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [groupsOpen, setGroupsOpen] = useState(true)
  const [lastGroupId, setLastGroupId] = useState<string | null>(null)

  // Persist last visited group so events/plans pages can highlight it
  useEffect(() => {
    const match = pathname.match(/\/groups\/([0-9a-f-]{36})/)
    if (match) {
      localStorage.setItem(LAST_GROUP_KEY, match[1])
      setLastGroupId(match[1])
    } else {
      setLastGroupId(localStorage.getItem(LAST_GROUP_KEY))
    }
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isGroupActive = (id: string) => {
    if (pathname.startsWith(`/groups/${id}`)) return true
    // Highlight last group when on event or plan detail pages
    if (pathname.startsWith('/events/') || pathname.startsWith('/plans/')) {
      return lastGroupId === id
    }
    return false
  }

  // Settings + account subpages (profile, availability) all highlight Settings
  const isSettingsActive =
    pathname === '/settings' ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/availability')

  return (
    <aside className="flex flex-col h-full w-56" style={{ background: '#1a1333', borderRight: '1px solid #2a1f4a' }}>

      {/* Wordmark */}
      <div className="px-5 py-5 pb-4">
        <span
          className="text-[22px] font-medium tracking-[-0.03em] leading-none"
          style={{ color: 'var(--rally-primary)' }}
        >
          rally
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">

        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === '/dashboard'
              ? 'bg-[var(--rally-primary-surface)] text-[var(--rally-primary-text)]'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard
        </Link>

        {/* Messages */}
        <Link
          href="/messages"
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
            pathname.startsWith('/messages')
              ? 'bg-[var(--rally-primary-surface)] text-[var(--rally-primary-text)]'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          Messages
        </Link>

        {/* Groups section */}
        <div className="pt-2">
          <button
            onClick={() => setGroupsOpen(p => !p)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            style={{ letterSpacing: '0.07em' }}
          >
            <span>Groups</span>
            <ChevronDown
              className="h-3 w-3 shrink-0 transition-transform"
              style={{ transform: groupsOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </button>

          {groupsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {groups.map(g => {
                const active = isGroupActive(g.id)
                const color  = g.theme_color ?? '#7F77DD'
                return (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="truncate">{g.name}</span>
                  </Link>
                )
              })}

              {/* New group */}
              <Link
                href="/groups/new"
                className="flex items-center gap-2 px-2.5 py-2 mt-1 rounded-md text-sm font-semibold transition-colors"
                style={{
                  background: 'rgba(127,119,221,0.12)',
                  border: '1px solid rgba(127,119,221,0.25)',
                  color: '#7F77DD',
                }}
              >
                <Plus className="h-4 w-4 shrink-0" />
                New group
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid #2a1f4a' }}>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors mt-1',
            isSettingsActive
              ? 'bg-[var(--rally-primary-surface)] text-[var(--rally-primary-text)]'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
