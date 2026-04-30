'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import { Settings, LogOut, MessageSquare, Plus, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Group {
  id: string
  name: string
  slug: string
  theme_color: string | null
  banner_url?: string | null
}

interface SidebarProps {
  groups: Group[]
}

// Resolve banner_url to a CSS background style for the group icon
function getGroupIconStyle(group: Group): React.CSSProperties {
  const color = group.theme_color ?? '#7F77DD'
  if (!group.banner_url) return { background: color }
  if (group.banner_url.startsWith('gradient:')) {
    return { background: group.banner_url.replace('gradient:', '') }
  }
  // It's an image URL — use as cover
  return {
    backgroundImage: `url(${group.banner_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

function Tooltip({ text, y }: { text: string; y: number }) {
  return (
    <div
      className="fixed z-[999] pointer-events-none"
      style={{ left: 68, top: y, transform: 'translateY(-50%)' }}
    >
      <div className="flex items-center gap-1.5">
        {/* Arrow */}
        <div
          className="w-1.5 h-1.5 rotate-45 bg-[#2c2c2c] border-l border-t border-[#3a3a3a]"
          style={{ flexShrink: 0 }}
        />
        <div
          className="bg-[#2c2c2c] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#3a3a3a] whitespace-nowrap shadow-xl"
          style={{ letterSpacing: '0.01em' }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

function NavIcon({
  href,
  icon: Icon,
  label,
  active,
  onTooltip,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
  onTooltip: (y: number | null) => void
}) {
  return (
    <Link
      href={href}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        onTooltip(rect.top + rect.height / 2)
      }}
      onMouseLeave={() => onTooltip(null)}
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
        active
          ? 'bg-[var(--rally-primary-surface)] text-[var(--rally-primary-text)]'
          : 'text-[#555] hover:text-[#aaa] hover:bg-[#1e1e1e]'
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </Link>
  )
}

function GroupIcon({
  group,
  active,
  onTooltip,
}: {
  group: Group
  active: boolean
  onTooltip: (y: number | null) => void
}) {
  const color = group.theme_color ?? '#7F77DD'
  const iconStyle = getGroupIconStyle(group)
  const initial = group.name.charAt(0).toUpperCase()
  // Check if it's an image (not a solid color or gradient)
  const isImage = group.banner_url && !group.banner_url.startsWith('gradient:')

  return (
    <Link
      href={`/groups/${group.id}`}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        onTooltip(rect.top + rect.height / 2)
      }}
      onMouseLeave={() => onTooltip(null)}
      className="relative group/icon block"
    >
      {/* Active ring */}
      {active && (
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            boxShadow: `0 0 0 2px ${color}`,
          }}
        />
      )}
      <div
        className={cn(
          'w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white overflow-hidden transition-all duration-150',
          active
            ? 'rounded-[14px]'
            : 'rounded-[20px] group-hover/icon:rounded-[14px]'
        )}
        style={iconStyle}
      >
        {!isImage && <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{initial}</span>}
      </div>

      {/* Activity badge slot — wire to real data later */}
      {/* {hasUnread && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#ef4444] border-2 border-[#0f0f0f]" />
      )} */}
    </Link>
  )
}

export function Sidebar({ groups }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [tooltip, setTooltip] = useState<{ text: string; y: number } | null>(null)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isGroupActive = (id: string) =>
    pathname.startsWith(`/groups/${id}`) ||
    pathname.startsWith(`/events/`) || // partial — no group ID in URL, best-effort
    pathname.startsWith(`/plans/`)

  const exactGroupActive = (id: string) => pathname.startsWith(`/groups/${id}`)

  return (
    <>
      {/* Fixed tooltip rendered outside sidebar overflow */}
      {tooltip && <Tooltip text={tooltip.text} y={tooltip.y} />}

      <aside
        className="flex flex-col h-full border-r"
        style={{
          width: 60,
          minWidth: 60,
          background: '#0e0d14',
          borderColor: '#1e1c2a',
        }}
      >
        {/* Wordmark — just the "r" glyph */}
        <div className="flex items-center justify-center h-14 flex-shrink-0">
          <span
            className="text-[20px] font-semibold leading-none select-none"
            style={{
              color: 'var(--rally-primary)',
              letterSpacing: '-0.03em',
              fontFamily: 'inherit',
            }}
          >
            r
          </span>
        </div>

        {/* Top divider */}
        <div className="mx-3 h-px" style={{ background: '#1e1c2a' }} />

        {/* Main nav icons */}
        <div className="flex flex-col items-center gap-1 px-[10px] pt-3 pb-2">
          <NavIcon
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            active={pathname === '/dashboard'}
            onTooltip={(y) =>
              y !== null
                ? setTooltip({ text: 'Dashboard', y })
                : setTooltip(null)
            }
          />
          <NavIcon
            href="/messages"
            icon={MessageSquare}
            label="Messages"
            active={pathname.startsWith('/messages')}
            onTooltip={(y) =>
              y !== null
                ? setTooltip({ text: 'Messages', y })
                : setTooltip(null)
            }
          />
        </div>

        {/* Groups divider */}
        <div className="mx-3 h-px mt-1" style={{ background: '#1e1c2a' }} />

        {/* Group icons */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 px-[10px] py-3">
          {groups.map((g) => (
            <GroupIcon
              key={g.id}
              group={g}
              active={exactGroupActive(g.id)}
              onTooltip={(y) =>
                y !== null
                  ? setTooltip({ text: g.name, y })
                  : setTooltip(null)
              }
            />
          ))}

          {/* New group */}
          <Link
            href="/groups/new"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setTooltip({ text: 'New group', y: rect.top + rect.height / 2 })
            }}
            onMouseLeave={() => setTooltip(null)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-150 hover:rounded-[14px]"
            style={{
              background: 'rgba(127,119,221,0.1)',
              border: '1.5px dashed rgba(127,119,221,0.35)',
              color: '#7F77DD',
            }}
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>

        {/* Bottom divider */}
        <div className="mx-3 h-px" style={{ background: '#1e1c2a' }} />

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-1 px-[10px] py-3">
          <NavIcon
            href="/settings"
            icon={Settings}
            label="Settings"
            active={pathname === '/settings'}
            onTooltip={(y) =>
              y !== null
                ? setTooltip({ text: 'Settings', y })
                : setTooltip(null)
            }
          />
          <button
            onClick={handleSignOut}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setTooltip({ text: 'Sign out', y: rect.top + rect.height / 2 })
            }}
            onMouseLeave={() => setTooltip(null)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#555] hover:text-[#aaa] hover:bg-[#1e1e1e] transition-all duration-150"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>
    </>
  )
}
