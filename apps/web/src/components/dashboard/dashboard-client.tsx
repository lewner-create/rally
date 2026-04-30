'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { GroupWithWindows, MemberPreview } from '@/lib/actions/dashboard'

type Props = {
  profile: { id: string; display_name: string | null; username: string; avatar_url: string | null } | null
  groupsWithWindows: GroupWithWindows[]
}

function formatHour(h: number) {
  const n = Number(h)
  if (!h && h !== 0) return '?'
  if (isNaN(n)) return '?'
  if (n === 0) return '12am'
  if (n < 12) return `${n}am`
  if (n === 12) return '12pm'
  return `${n - 12}pm`
}

function MemberAvatars({ members, max = 4 }: { members: MemberPreview[]; max?: number }) {
  const shown = members.slice(0, max)
  const extra = members.length - max
  return (
    <div className="flex -space-x-2">
      {shown.map((m) => (
        <div
          key={m.id}
          className="w-7 h-7 rounded-full border-2 border-[#0f0f0f] overflow-hidden bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          title={m.display_name ?? m.username}
        >
          {m.avatar_url ? (
            <img src={m.avatar_url} alt={m.display_name ?? m.username} className="w-full h-full object-cover" />
          ) : (
            <span>{(m.display_name ?? m.username).charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-[#0f0f0f] bg-[#333] flex items-center justify-center text-xs text-[#aaa] flex-shrink-0">
          +{extra}
        </div>
      )}
    </div>
  )
}

function getBannerStyle(bannerUrl: string | null): React.CSSProperties {
  if (!bannerUrl) return {}
  if (bannerUrl.startsWith('gradient:')) {
    return { background: bannerUrl.replace('gradient:', '') }
  }
  return { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
}

function GroupCard({ group }: { group: GroupWithWindows }) {
  const accent = group.theme_color ?? '#6366f1'
  const hasWindow = !!group.next_window
  const hasBanner = !!group.banner_url

  return (
    <Link href={`/groups/${group.id}`} className="block group/card">
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.015] hover:shadow-2xl"
        style={{ background: '#161616', border: '1px solid #252525' }}
      >
        {/* Top color stripe */}
        <div
          className="h-1.5 w-full"
          style={{ background: accent }}
        />

        {/* Banner or color fill — never an <img> tag */}
        <div
          className="h-14 w-full"
          style={hasBanner
            ? { ...getBannerStyle(group.banner_url), opacity: 0.6 }
            : { background: `linear-gradient(135deg, ${accent}22 0%, transparent 70%)` }
          }
        />

        <div className="px-4 pb-4 -mt-2">
          {/* Group name + members */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-white text-base leading-tight group-hover/card:text-white transition-colors">
                {group.name}
              </h3>
              <p className="text-[#666] text-xs mt-0.5">
                {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
              </p>
            </div>
            <MemberAvatars members={group.members} max={4} />
          </div>

          {/* Next window pill or empty nudge */}
          {hasWindow ? (
            <div
              className="rounded-xl p-3 flex items-center justify-between"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: accent }}>
                  Next window
                </p>
                <p className="text-white text-sm font-medium truncate">
                  {group.next_window!.label}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
                <MemberAvatars members={group.next_window!.members} max={3} />
                <p className="text-[#555] text-[10px]">
                  {group.next_window!.members.length} free
                </p>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: '#1a1a1a', border: '1px dashed #2a2a2a' }}
            >
              <span className="text-lg">🗓</span>
              <p className="text-[#555] text-xs">No windows yet — add your availability</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-4xl mb-6">
        👋
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Start your first group</h2>
      <p className="text-[#666] text-sm max-w-xs mb-8 leading-relaxed">
        Rally around the people you actually want to hang out with. Create a group, share availability, and start making plans.
      </p>
      <Link
        href="/groups/new"
        className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: '#6366f1' }}
      >
        Create a group
      </Link>
    </div>
  )
}

export default function DashboardClient({ profile, groupsWithWindows }: Props) {
  const firstName = profile?.display_name?.split(' ')[0] ?? profile?.username ?? 'there'
  const hasGroups = groupsWithWindows.length > 0

  // Find the single best upcoming window across all groups
  const bestWindow = groupsWithWindows
    .filter((g) => g.next_window !== null)
    .sort((a, b) => (b.next_window!.members.length - a.next_window!.members.length))[0]

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[#555] text-sm mb-0.5">Hey {firstName} 👋</p>
            <h1 className="text-2xl font-bold text-white">Your groups</h1>
          </div>
          <Link
            href="/groups/new"
            className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xl hover:bg-[#222] transition-colors"
            title="New group"
          >
            +
          </Link>
        </div>

        {/* Best upcoming window hero — only show if 2+ people free */}
        {bestWindow && bestWindow.next_window && bestWindow.next_window.members.length >= 2 && (
          <Link href={`/groups/${bestWindow.id}`} className="block mb-6">
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${bestWindow.theme_color ?? '#6366f1'}33 0%, #1a1a1a 60%)`,
                border: `1px solid ${bestWindow.theme_color ?? '#6366f1'}44`,
              }}
            >
              {/* Subtle glow */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl"
                style={{ background: bestWindow.theme_color ?? '#6366f1' }}
              />
              <div className="relative">
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: bestWindow.theme_color ?? '#6366f1' }}>
                  ✦ best window coming up
                </p>
                <h2 className="text-xl font-bold text-white mb-1">
                  {bestWindow.next_window.label}
                </h2>
                <p className="text-[#aaa] text-sm mb-4">
                  {bestWindow.name}
                </p>
                <div className="flex items-center justify-between">
                  <MemberAvatars members={bestWindow.next_window.members} max={5} />
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: `${bestWindow.theme_color ?? '#6366f1'}33`, color: bestWindow.theme_color ?? '#a5b4fc' }}
                  >
                    {bestWindow.next_window.members.length} people free →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Group grid / list */}
        {hasGroups ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {groupsWithWindows.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Availability shortcut */}
        {hasGroups && (
          <div className="mt-6">
            <Link
              href="/availability"
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors"
              style={{ background: '#161616', border: '1px solid #222' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🗓</span>
                <div>
                  <p className="text-white text-sm font-medium">Your availability</p>
                  <p className="text-[#555] text-xs">Keep it updated so plans actually happen</p>
                </div>
              </div>
              <span className="text-[#444] text-sm">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
