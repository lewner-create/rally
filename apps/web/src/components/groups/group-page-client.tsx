'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GroupChatDrawer } from '@/components/groups/group-chat-drawer'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveCard = {
  id: string
  title: string
  event_type: string
  proposed_date: string | null
  proposed_start: string | null
  proposed_end: string | null
  status: 'open' | 'locked'
  response_counts?: { in: number; maybe: number; cant: number }
}

type Event = {
  id: string
  title: string          // ← DB column is `title`, not `name`
  event_type: string
  starts_at: string | null
  ends_at: string | null
  location: string | null
}

type Props = {
  groupId: string
  themeColor: string
  events?: Event[]
  activeCards?: ActiveCard[]
  currentUserId?: string
  tier?: string | number
  openWindowsSlot?: React.ReactNode
  groupName?: string
  bannerUrl?: string | null
  description?: string | null
  members?: unknown[]
  isAdmin?: boolean
  proactiveBannerSlot?: React.ReactNode
  prompt?: unknown
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_EMOJI: Record<string, string> = {
  vacation: '✈️', day_trip: '🗺️', road_trip: '🛣️',
  game_night: '🎮', hangout: '☕', meetup: '🤝', moto_trip: '🏍️',
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

// ─── Start a plan fork ────────────────────────────────────────────────────────

function StartPlanFork({ groupId, accent }: { groupId: string; accent: string }) {
  const [hoverL, setHoverL] = useState(false)
  const [hoverR, setHoverR] = useState(false)

  return (
    <>
      <style>{`
        @keyframes rally-glow-pulse {
          0%,100% { box-shadow: 0 0 0 0 transparent; }
          50%      { box-shadow: 0 0 0 3px ${accent}44, 0 0 32px 0 ${accent}1a; }
        }
        .rally-plan-fork { animation: rally-glow-pulse 3s ease-in-out infinite; }
      `}</style>

      <div
        className="rally-plan-fork rounded-2xl p-5 mb-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent}22 0%, #1a1a1a 65%)`,
          border: `1px solid ${accent}30`,
        }}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none" style={{ background: accent }} />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: accent }}>✦ ready to plan?</p>
          <h2 className="text-lg font-bold text-white mb-1">Start something</h2>
          <p className="text-[#666] text-sm mb-4">Pick how you want to kick it off.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <a
              href={`/groups/${groupId}/events/new`}
              onMouseEnter={() => setHoverL(true)}
              onMouseLeave={() => setHoverL(false)}
              style={{
                display: 'block', padding: '12px 14px', borderRadius: '12px',
                background: hoverL ? accent : `${accent}1a`,
                border: `1px solid ${hoverL ? accent : `${accent}33`}`,
                textDecoration: 'none',
                boxShadow: hoverL ? `0 4px 18px ${accent}40` : 'none',
                transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '5px' }}>📅</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: hoverL ? 'white' : accent, marginBottom: '2px', transition: 'color 0.18s' }}>
                It's happening
              </div>
              <div style={{ fontSize: '11px', color: hoverL ? 'rgba(255,255,255,0.65)' : `${accent}99`, lineHeight: 1.4, transition: 'color 0.18s' }}>
                Create event &amp; invite
              </div>
            </a>

            <a
              href={`/groups/${groupId}/plans/new`}
              onMouseEnter={() => setHoverR(true)}
              onMouseLeave={() => setHoverR(false)}
              style={{
                display: 'block', padding: '12px 14px', borderRadius: '12px',
                background: hoverR ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${hoverR ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.09)'}`,
                textDecoration: 'none',
                transition: 'background 0.18s, border-color 0.18s',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '5px' }}>👋</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e0e0e0', marginBottom: '2px' }}>Check who's in</div>
              <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.4 }}>Poll the group first</div>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Active plan card ─────────────────────────────────────────────────────────

function ActivePlanCard({ card, accent }: { card: ActiveCard; accent: string }) {
  const counts = card.response_counts ?? { in: 0, maybe: 0, cant: 0 }
  const total  = counts.in + counts.maybe + counts.cant

  return (
    <Link href={`/plans/${card.id}`} className="block">
      <div className="rounded-xl p-4 transition-colors hover:border-[#333]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-base">{EVENT_TYPE_EMOJI[card.event_type] ?? '📅'}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>checking who's in</span>
            </div>
            <p className="text-white font-medium text-sm truncate">{card.title}</p>
            {card.proposed_date && (
              <p className="text-[#666] text-xs mt-0.5">
                {formatDate(card.proposed_date)}{card.proposed_start && ` · ${formatTime(card.proposed_start)}`}
              </p>
            )}
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: `${accent}22`, color: accent }}>
            {counts.in} in
          </span>
        </div>
        {total > 0 && (
          <>
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
              {counts.in > 0    && <div className="bg-emerald-500 rounded-full" style={{ width: `${(counts.in / total) * 100}%` }} />}
              {counts.maybe > 0 && <div className="bg-yellow-500 rounded-full"  style={{ width: `${(counts.maybe / total) * 100}%` }} />}
              <div className="bg-[#2a2a2a] rounded-full flex-1" />
            </div>
            <div className="flex gap-3 mt-1.5 text-xs">
              <span className="text-emerald-500">{counts.in} in</span>
              <span className="text-yellow-500">{counts.maybe} maybe</span>
              <span className="text-[#555]">{counts.cant} can't</span>
            </div>
          </>
        )}
      </div>
    </Link>
  )
}

// ─── Upcoming event row ───────────────────────────────────────────────────────

function UpcomingEventRow({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="flex items-center gap-3 py-2.5 border-b last:border-0 hover:bg-[#1e1e1e] -mx-4 px-4 transition-colors" style={{ borderColor: '#222' }}>
        <span className="text-lg w-7 text-center flex-shrink-0">{EVENT_TYPE_EMOJI[event.event_type] ?? '📅'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate">{event.title}</p>
          <p className="text-[#555] text-xs">
            {formatDate(event.starts_at?.split('T')[0]) ?? 'Date TBD'}
            {event.starts_at && ` · ${formatTime(event.starts_at.split('T')[1] ?? '')}`}
            {event.location && ` · ${event.location}`}
          </p>
        </div>
        <span className="text-[#444] flex-shrink-0">→</span>
      </div>
    </Link>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GroupPageClient({ groupId, themeColor, events = [], activeCards = [], currentUserId, openWindowsSlot }: Props) {
  const [tab, setTab] = useState<'overview' | 'plans'>('overview')
  const accent     = themeColor ?? '#6366f1'
  const plansBadge = activeCards.length + events.length

  return (
    <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: '#111' }}>
      <div className="max-w-2xl mx-auto px-6 py-6 pb-24">

        {/* Tab strip */}
        <div className="flex border-b mb-6" style={{ borderColor: '#222' }}>
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'plans',    label: 'Plans', badge: plansBadge },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium relative transition-colors ${tab === t.id ? 'text-white' : 'text-[#555] hover:text-[#999]'}`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none" style={{ background: accent, color: '#fff' }}>
                  {t.badge}
                </span>
              )}
              {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: accent }} />}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            {activeCards.length === 0 && events.length === 0 ? (
              <div style={{ paddingTop: '8px' }}>
                <p style={{ fontSize: '13px', color: '#555', marginBottom: '24px', lineHeight: 1.6 }}>Your group is ready. What do you want to do first?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                  <a href={`/groups/${groupId}/invite`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px 16px', borderRadius: '16px', textDecoration: 'none', background: '#161616', border: '1px solid #252525' }}>
                    <span style={{ fontSize: '28px' }}>👥</span>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 3px' }}>Invite people</p>
                      <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Who's in this group?</p>
                    </div>
                  </a>
                  <a href={`/groups/${groupId}/events/new`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px 16px', borderRadius: '16px', textDecoration: 'none', background: `${accent}12`, border: `1px solid ${accent}33` }}>
                    <span style={{ fontSize: '28px' }}>📅</span>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: accent, margin: '0 0 3px' }}>Start a plan</p>
                      <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Create an event</p>
                    </div>
                  </a>
                </div>
              </div>
            ) : (
              <>
                <StartPlanFork groupId={groupId} accent={accent} />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">Suggested times</p>
                {openWindowsSlot}
              </>
            )}
          </div>
        )}

        {/* Plans */}
        {tab === 'plans' && (
          <div>
            {activeCards.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">👋 Checking who's in</p>
                <div className="space-y-3">
                  {activeCards.map((card) => <ActivePlanCard key={card.id} card={card} accent={accent} />)}
                </div>
              </div>
            )}

            {events.length > 0 ? (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-2">📅 Events</p>
                <div className="rounded-xl" style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                  <div className="px-4">
                    {events.map((event) => <UpcomingEventRow key={event.id} event={event} />)}
                  </div>
                </div>
              </div>
            ) : activeCards.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🗓</p>
                <p className="text-white font-medium mb-1">Nothing planned yet</p>
                <p className="text-[#555] text-sm mb-6">Create an event or check who's free first.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href={`/groups/${groupId}/events/new`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: accent }}>
                    📅 It's happening
                  </Link>
                  <Link href={`/groups/${groupId}/plans/new`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa' }}>
                    👋 Check who's in
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <GroupChatDrawer groupId={groupId} currentUserId={currentUserId ?? ''} accentColor={accent} />
    </div>
  )
}

export default GroupPageClient
