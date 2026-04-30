'use client'

import Link from 'next/link'
import type { GroupWithWindows, MemberPreview } from '@/lib/actions/dashboard'

type Props = {
  profile: { id: string; display_name: string | null; username: string; avatar_url: string | null } | null
  groupsWithWindows: GroupWithWindows[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getBannerStyle(bannerUrl: string | null | undefined): React.CSSProperties {
  if (!bannerUrl) return {}
  if (bannerUrl.startsWith('gradient:')) {
    return { background: bannerUrl.replace('gradient:', '') }
  }
  return {
    backgroundImage: `url(${bannerUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

function MemberAvatars({
  members,
  max = 4,
  size = 'sm',
}: {
  members: MemberPreview[]
  max?: number
  size?: 'sm' | 'xs'
}) {
  const shown = members.slice(0, max)
  const extra = members.length - max
  const dim = size === 'xs' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'
  const border = size === 'xs' ? 'border' : 'border-2'

  return (
    <div className="flex -space-x-1.5">
      {shown.map((m) => (
        <div
          key={m.id}
          className={`${dim} rounded-full ${border} border-[#111] overflow-hidden bg-[#2a2a2a] flex items-center justify-center font-bold text-white flex-shrink-0`}
          title={m.display_name ?? m.username}
        >
          {m.avatar_url ? (
            <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{(m.display_name ?? m.username).charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className={`${dim} rounded-full ${border} border-[#111] bg-[#333] flex items-center justify-center text-[#999] flex-shrink-0`}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

// ─── Priority Banner ──────────────────────────────────────────────────────────
// Priority: window with 2+ free → fallback "set availability" nudge
// Future: event starting soon → unanswered nudge → proactive suggestion

function PriorityBanner({ groups }: { groups: GroupWithWindows[] }) {
  const bestWindow = groups
    .filter((g) => g.next_window && g.next_window.members.length >= 2)
    .sort((a, b) => b.next_window!.members.length - a.next_window!.members.length)[0]

  if (bestWindow && bestWindow.next_window) {
    const accent = bestWindow.theme_color ?? '#7F77DD'
    const w = bestWindow.next_window
    return (
      <Link href={`/groups/${bestWindow.id}`} className="block mb-5">
        <div
          className="relative rounded-2xl px-5 py-4 overflow-hidden transition-all hover:scale-[1.005]"
          style={{
            background: `linear-gradient(130deg, ${accent}28 0%, #161616 55%)`,
            border: `1px solid ${accent}30`,
          }}
        >
          {/* glow orb */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-[0.15] blur-3xl pointer-events-none"
            style={{ background: accent }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p
                className="text-[10px] uppercase tracking-[0.12em] font-semibold mb-1"
                style={{ color: accent }}
              >
                ✦ best window
              </p>
              <p className="text-white font-semibold text-base leading-tight truncate">
                {w.label}
              </p>
              <p className="text-[#666] text-xs mt-0.5 truncate">{bestWindow.name}</p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <MemberAvatars members={w.members} max={4} size="xs" />
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded-md"
                style={{
                  background: `${accent}20`,
                  color: accent,
                }}
              >
                {w.members.length} free →
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Fallback: nudge to set availability
  return (
    <Link href="/availability" className="block mb-5">
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 transition-all hover:bg-[#1a1a1a]"
        style={{ background: '#161616', border: '1px solid #222' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: '#1e1e1e' }}
          >
            🗓
          </div>
          <div>
            <p className="text-white text-sm font-medium">Set your availability</p>
            <p className="text-[#555] text-xs mt-0.5">
              Rally needs your free windows to find the best times
            </p>
          </div>
        </div>
        <span className="text-[#444] flex-shrink-0">→</span>
      </div>
    </Link>
  )
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({ group }: { group: GroupWithWindows }) {
  const accent = group.theme_color ?? '#7F77DD'
  const hasBanner = !!group.banner_url
  const window = group.next_window
  const windowHasEnoughPeople = window && window.members.length >= 2

  return (
    <Link href={`/groups/${group.id}`} className="block group/card">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.012] hover:shadow-xl"
        style={{ background: '#141414', border: '1px solid #1e1e1e' }}
      >
        {/* Visual identity header */}
        <div className="relative h-[72px] overflow-hidden">
          {hasBanner ? (
            <>
              <div className="absolute inset-0" style={getBannerStyle(group.banner_url)} />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent 30%, #141414 100%)',
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${accent}30 0%, ${accent}08 60%, transparent 100%)`,
              }}
            />
          )}
          {/* Thin accent stripe at top */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: accent }}
          />
        </div>

        {/* Content */}
        <div className="px-4 pb-4 -mt-1">
          <div className="flex items-end justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm leading-tight truncate group-hover/card:text-[#e8e8e8] transition-colors">
                {group.name}
              </h3>
              <p className="text-[#4a4a4a] text-xs mt-0.5">
                {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>

          {/* Window pill — only if 2+ people free */}
          {windowHasEnoughPeople ? (
            <div
              className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
              style={{
                background: `${accent}10`,
                border: `1px solid ${accent}20`,
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-[10px] uppercase tracking-widest font-semibold mb-0.5"
                  style={{ color: accent }}
                >
                  Open window
                </p>
                <p className="text-white text-xs font-medium truncate">{window!.label}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1">
                <MemberAvatars members={window!.members} max={3} size="xs" />
                <p className="text-[#4a4a4a] text-[9px] leading-none">
                  {window!.members.length} free
                </p>
              </div>
            </div>
          ) : (
            // Quiet empty state — minimal, not intrusive
            <div
              className="rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: '#1a1a1a', border: '1px solid #222' }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#2e2e2e' }}
              />
              <p className="text-[#3a3a3a] text-xs">No windows yet</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
        style={{ background: '#161616', border: '1px solid #222' }}
      >
        👋
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">Start your first group</h2>
      <p className="text-[#555] text-sm max-w-xs mb-8 leading-relaxed">
        Rally around the people you actually want to hang out with. Create a group, share availability, and start making plans.
      </p>
      <Link
        href="/groups/new"
        className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: '#7F77DD' }}
      >
        Create a group
      </Link>
    </div>
  )
}

// ─── Dashboard Client ─────────────────────────────────────────────────────────

export default function DashboardClient({ profile, groupsWithWindows }: Props) {
  const firstName = profile?.display_name?.split(' ')[0] ?? profile?.username ?? 'there'
  const hasGroups = groupsWithWindows.length > 0

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-[#444] text-xs mb-0.5 uppercase tracking-widest">Hey {firstName}</p>
            <h1 className="text-xl font-bold text-white">Your groups</h1>
          </div>
          <Link
            href="/groups/new"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-medium hover:opacity-80 transition-opacity"
            style={{
              background: 'rgba(127,119,221,0.15)',
              border: '1px solid rgba(127,119,221,0.3)',
              color: '#7F77DD',
            }}
            title="New group"
          >
            +
          </Link>
        </div>

        {/* Priority banner */}
        {hasGroups && <PriorityBanner groups={groupsWithWindows} />}

        {/* Group grid */}
        {hasGroups ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {groupsWithWindows.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}
