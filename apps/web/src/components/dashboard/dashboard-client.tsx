'use client'

import Link from 'next/link'
import type { GroupWithWindows, MemberPreview, UpcomingEvent } from '@/lib/actions/dashboard'

type Props = {
  profile: { id: string; display_name: string | null; username: string; avatar_url: string | null } | null
  groupsWithWindows: GroupWithWindows[]
  upcomingEvents?: UpcomingEvent[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_META: Record<string, { emoji: string; gradient: string }> = {
  vacation:   { emoji: '✈️',  gradient: 'linear-gradient(135deg, #001a2d, #003a5c)' },
  day_trip:   { emoji: '🗺️',  gradient: 'linear-gradient(135deg, #0d2010, #1a4020)' },
  road_trip:  { emoji: '🛣️',  gradient: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' },
  game_night: { emoji: '🎮',  gradient: 'linear-gradient(135deg, #1a1040, #2d1f6e)' },
  hangout:    { emoji: '☕',  gradient: 'linear-gradient(135deg, #1a1208, #3d2b10)' },
  meetup:     { emoji: '🤝',  gradient: 'linear-gradient(135deg, #0d1f2d, #1a3a4a)' },
  moto_trip:  { emoji: '🏍️',  gradient: 'linear-gradient(135deg, #2d0f00, #4a1a00)' },
}

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000)

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  if (diffDays === 0) return `Today · ${timeStr}`
  if (diffDays === 1) return `Tomorrow · ${timeStr}`
  if (diffDays < 7)  return d.toLocaleDateString('en-US', { weekday: 'long' }) + ` · ${timeStr}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` · ${timeStr}`
}

const RSVP_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  yes:   { label: "I'm going", bg: '#166534', color: '#4ade80' },
  maybe: { label: 'Maybe',     bg: '#713f12', color: '#fbbf24' },
  no:    { label: "Can't go",  bg: '#1a1a1a', color: '#555'    },
}

function MemberAvatars({ members, max = 4 }: { members: MemberPreview[]; max?: number }) {
  const shown = members.slice(0, max)
  const extra = members.length - max
  return (
    <div className="flex -space-x-2">
      {shown.map((m) => (
        <div
          key={m.id}
          className="w-6 h-6 rounded-full border-2 border-[#161616] overflow-hidden bg-[#2a2a2a] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          title={m.display_name ?? m.username}
        >
          {m.avatar_url
            ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
            : (m.display_name ?? m.username).charAt(0).toUpperCase()
          }
        </div>
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full border-2 border-[#161616] bg-[#2a2a2a] flex items-center justify-center text-[10px] text-[#888] flex-shrink-0">
          +{extra}
        </div>
      )}
    </div>
  )
}

// ─── Upcoming event card (horizontal scroll) ──────────────────────────────────

function UpcomingEventCard({ event }: { event: UpcomingEvent }) {
  const meta   = EVENT_TYPE_META[event.event_type] ?? { emoji: '📅', gradient: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)' }
  const accent = event.group_theme_color ?? '#7F77DD'
  const rsvp   = event.user_rsvp ? RSVP_BADGE[event.user_rsvp] : null

  return (
    <Link href={`/events/${event.id}`} className="block flex-shrink-0" style={{ width: '220px' }}>
      <div
        className="rounded-2xl overflow-hidden h-full transition-transform hover:scale-[1.02]"
        style={{ background: '#161616', border: '1px solid #1e1e1e' }}
      >
        {/* Top gradient */}
        <div
          style={{
            height: '80px',
            background: event.banner_url
              ? undefined
              : meta.gradient,
            backgroundImage: event.banner_url ? `url(${event.banner_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          {event.banner_url && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          )}
          <div style={{ position: 'relative', padding: '10px 12px' }}>
            <span style={{ fontSize: '22px' }}>{meta.emoji}</span>
          </div>
          {/* Group accent line */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: accent }} />
        </div>

        {/* Content */}
        <div style={{ padding: '11px 13px 13px' }}>
          <p
            className="text-white font-semibold text-sm leading-tight mb-1 truncate"
            title={event.title}
          >
            {event.title}
          </p>
          <p style={{ fontSize: '11px', color: accent, fontWeight: 600, marginBottom: '4px', truncate: true } as any}>
            {event.group_name}
          </p>
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>
            {formatEventDate(event.starts_at)}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {event.going_count > 0 ? (
              <span style={{ fontSize: '11px', color: '#555' }}>
                {event.going_count} going
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#333' }}>No RSVPs yet</span>
            )}
            {rsvp ? (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '9999px',
                background: rsvp.bg, color: rsvp.color,
              }}>
                {rsvp.label}
              </span>
            ) : (
              <span style={{
                fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '9999px',
                background: `${accent}22`, color: accent,
              }}>
                RSVP
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Group card ───────────────────────────────────────────────────────────────

function getBannerStyle(bannerUrl: string | null): React.CSSProperties {
  if (!bannerUrl) return {}
  return { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
}

function GroupCard({ group }: { group: GroupWithWindows }) {
  const accent    = group.theme_color ?? '#6366f1'
  const hasWindow = !!group.next_window
  const hasBanner = !!group.banner_url

  return (
    <Link href={`/groups/${group.id}`} className="block group/card">
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.015]"
        style={{ background: '#161616', border: '1px solid #1e1e1e' }}
      >
        <div className="h-1.5 w-full" style={{ background: accent }} />
        <div
          className="h-12 w-full"
          style={hasBanner
            ? { ...getBannerStyle(group.banner_url), opacity: 0.55 }
            : { background: `linear-gradient(135deg, ${accent}22 0%, transparent 70%)` }
          }
        />

        <div className="px-4 pb-4 -mt-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-white text-sm leading-tight">{group.name}</h3>
              <p className="text-[#555] text-xs mt-0.5">
                {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
              </p>
            </div>
            <MemberAvatars members={group.members} max={4} />
          </div>

          {hasWindow ? (
            <div
              className="rounded-xl p-2.5 flex items-center justify-between"
              style={{ background: '#1e1e1e', border: '1px solid #252525' }}
            >
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: accent }}>
                  Next window
                </p>
                <p className="text-white text-xs font-medium truncate">{group.next_window!.label}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                <MemberAvatars members={group.next_window!.members} max={3} />
                <p className="text-[#444] text-[10px]">{group.next_window!.members.length} free</p>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl p-2.5 flex items-center gap-2"
              style={{ background: '#1a1a1a', border: '1px dashed #222' }}
            >
              <span className="text-base">🗓</span>
              <p className="text-[#444] text-xs">No windows yet</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center text-4xl mb-6">
        👋
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Start your first group</h2>
      <p className="text-[#555] text-sm max-w-xs mb-8 leading-relaxed">
        Rally around the people you actually want to hang out with. Create a group, share availability, and start making plans.
      </p>
      <Link
        href="/groups/new"
        className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
        style={{ background: '#7F77DD' }}
      >
        Create a group
      </Link>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardClient({ profile, groupsWithWindows, upcomingEvents = [] }: Props) {
  const firstName  = profile?.display_name?.split(' ')[0] ?? profile?.username ?? 'there'
  const hasGroups  = groupsWithWindows.length > 0
  const hasEvents  = upcomingEvents.length > 0

  const bestWindow = groupsWithWindows
    .filter(g => g.next_window !== null)
    .sort((a, b) => (b.next_window!.members.length - a.next_window!.members.length))[0]

  const getHour = () => new Date().getHours()
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Hey' : 'Evening'

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-[#444] text-sm mb-0.5">{greeting}, {firstName} 👋</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          </div>
          {profile?.avatar_url ? (
            <Link href="/profile">
              <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#2a2a2a]" />
            </Link>
          ) : (
            <Link href="/profile">
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-sm font-bold text-[#7F77DD]">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </Link>
          )}
        </div>

        {/* ── What's on ── upcoming events horizontal scroll */}
        {hasEvents && (
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555]">What's on</p>
              {upcomingEvents.length > 3 && (
                <span className="text-[11px] text-[#444]">{upcomingEvents.length} upcoming</span>
              )}
            </div>
            {/* Horizontal scroll strip — negative margin breaks out of padding, padding re-added inside */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="[-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
            >
              {upcomingEvents.map(event => (
                <UpcomingEventCard key={event.id} event={event} />
              ))}
              {/* "See all" tile */}
              {hasGroups && (
                <div className="flex-shrink-0" style={{ width: '100px' }}>
                  <div className="rounded-2xl h-full flex flex-col items-center justify-center gap-2 text-center" style={{ background: '#161616', border: '1px dashed #222', minHeight: '160px' }}>
                    <span className="text-2xl">📅</span>
                    <p className="text-[#444] text-[11px] leading-tight px-2">Browse your groups</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Best window hero ── */}
        {bestWindow && bestWindow.next_window && bestWindow.next_window.members.length >= 2 && (
          <Link href={`/groups/${bestWindow.id}`} className="block mb-6">
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${bestWindow.theme_color ?? '#6366f1'}33 0%, #1a1a1a 60%)`,
                border: `1px solid ${bestWindow.theme_color ?? '#6366f1'}44`,
              }}
            >
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
                style={{ background: bestWindow.theme_color ?? '#6366f1' }}
              />
              <div className="relative">
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: bestWindow.theme_color ?? '#7F77DD' }}>
                  ✦ best window coming up
                </p>
                <h2 className="text-xl font-bold text-white mb-1">
                  {bestWindow.next_window.label}
                </h2>
                <p className="text-[#666] text-sm mb-4">{bestWindow.name}</p>
                <div className="flex items-center justify-between">
                  <MemberAvatars members={bestWindow.next_window.members} max={5} />
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{
                      background: `${bestWindow.theme_color ?? '#6366f1'}25`,
                      color:      bestWindow.theme_color ?? '#a5b4fc',
                    }}
                  >
                    {bestWindow.next_window.members.length} free →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Groups ── */}
        {hasGroups ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555]">Your groups</p>
              <Link href="/groups/new" className="text-[11px] font-semibold" style={{ color: '#7F77DD' }}>
                + New group
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
              {groupsWithWindows.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}

        {/* ── Quick actions ── */}
        {hasGroups && (
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">Quick actions</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Link
                href="/availability"
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '14px', textDecoration: 'none', background: '#161616', border: '1px solid #1e1e1e', transition: 'border-color 0.15s' }}
              >
                <span style={{ fontSize: '20px' }}>🗓</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', margin: '0 0 2px' }}>Availability</p>
                  <p style={{ fontSize: '11px', color: '#555', margin: 0, lineHeight: 1.4 }}>Update your free time</p>
                </div>
              </Link>
              <Link
                href="/messages"
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '14px', textDecoration: 'none', background: '#161616', border: '1px solid #1e1e1e', transition: 'border-color 0.15s' }}
              >
                <span style={{ fontSize: '20px' }}>💬</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', margin: '0 0 2px' }}>Messages</p>
                  <p style={{ fontSize: '11px', color: '#555', margin: 0, lineHeight: 1.4 }}>Group chats &amp; DMs</p>
                </div>
              </Link>
              <Link
                href="/groups/new"
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '14px', textDecoration: 'none', background: 'rgba(127,119,221,0.08)', border: '1px solid rgba(127,119,221,0.2)' }}
              >
                <span style={{ fontSize: '20px' }}>👥</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#7F77DD', margin: '0 0 2px' }}>New group</p>
                  <p style={{ fontSize: '11px', color: '#555', margin: 0, lineHeight: 1.4 }}>Start a new crew</p>
                </div>
              </Link>
              <Link
                href="/profile"
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '14px', textDecoration: 'none', background: '#161616', border: '1px solid #1e1e1e' }}
              >
                <span style={{ fontSize: '20px' }}>👤</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', margin: '0 0 2px' }}>Profile</p>
                  <p style={{ fontSize: '11px', color: '#555', margin: 0, lineHeight: 1.4 }}>Edit your info</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
