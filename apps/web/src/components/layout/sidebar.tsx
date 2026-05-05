'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Settings, LogOut, MessageSquare, Plus, ChevronDown, LayoutDashboard, X } from 'lucide-react'
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
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ groups, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [groupsOpen, setGroupsOpen] = useState(true)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Close mobile sidebar when navigating
  const close = () => onMobileClose?.()

  const isGroupActive = (id: string) => pathname.startsWith(`/groups/${id}`)

  return (
    <aside
      className={cn(
        // Base
        'flex flex-col h-full border-r bg-background',
        // Mobile: fixed overlay, slides in/out
        'fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-200 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static in flex flow, always visible
        'md:relative md:inset-auto md:z-auto md:w-56 md:translate-x-0 md:flex-shrink-0',
      )}
      style={{ borderColor: '#1e1e1e' }}
    >
      {/* Wordmark row — close button visible on mobile only */}
      <div className="px-5 py-5 pb-4 flex items-center justify-between">
        <span
          className="text-[22px] font-medium tracking-[-0.03em] leading-none"
          style={{ color: 'var(--rally-primary)' }}
        >
          volta
        </span>
        <button
          onClick={close}
          className="md:hidden p-1.5 rounded-md text-[#666] hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">

        <Link
          href="/messages"
          onClick={close}
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

        <Link
          href="/dashboard"
          onClick={close}
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
                const color = g.theme_color ?? '#7F77DD'
                return (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                    onClick={close}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="truncate">{g.name}</span>
                  </Link>
                )
              })}

              <Link
                href="/groups/new"
                onClick={close}
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
      <div className="px-3 pb-4 pt-2 border-t" style={{ borderColor: '#1e1e1e' }}>
        <Link
          href="/settings"
          onClick={close}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors mt-1',
            pathname === '/settings'
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
