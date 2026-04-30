'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GroupChatDrawer } from '@/components/groups/group-chat-drawer'

// ─── Types (matching what server page actually passes) ────────────────────────

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
  name: string
  event_type: string
  starts_at: string | null
  ends_at: string | null
  location: string | null
}

type Prompt = {
  label: string
  start_hour: number
  end_hour: number
  members: { id: string; display_name: string | null; username: string; avatar_url: string | null }[]
} | null

type Props = {
  groupId: string
  themeColor: string
  events?: Event[]
  activeCards?: ActiveCard[]
  prompt?: Prompt
  currentUserId?: string
  tier?: string
  openWindowsSlot?: React.ReactNode
  // Legacy optional — accepted but unused so nothing breaks
  groupName?: string
  bannerUrl?: string | null
  description?: string | null
  members?: unknown[]
  isAdmin?: boolean
  proactiveBannerSlot?: React.ReactNode
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_EMOJI: Record<string, string> = {
  vacation: '✈️', day_trip: '🚗', road_trip: '🛣️',
  game_night: '🎮', hangout: '🛋️', meetup: '👋', moto_trip: '🏍️',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivePlanCard({ card, accent }: { card: ActiveCard; accent: string }) {
  const counts = card.response_counts ?? { in: 0, maybe: 0, cant: 0 }
  const total = counts.in + counts.maybe + counts.cant

  return (
    <Link href={`/plans/${card.id}`} className="block">
      <div
        className="rounded-xl p-4 transition-colors hover:border-[#333]"
        style={{ background: '#1a1a1a', border: '1px solid #252525' }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-base">{EVENT_TYPE_EMOJI[card.event_type] ?? '📅'}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
                checking who's in
              </span>
            </div>
            <p className="text-white font-medium text-sm truncate">{card.title}</p>
            {card.proposed_date && (
              <p className="text-[#666] text-xs mt-0.5">
                {formatDate(card.proposed_date)}
                {card.proposed_start && ` · ${formatTime(card.proposed_start)}`}
              </p>
            )}
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: `${accent}22`, color: accent }}
          >
            {counts.in} in
          </span>
        </div>
        {total > 0 && (
          <>
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
              {counts.in > 0 && <div className="bg-emerald-500 rounded-full" style={{ width: `${(counts.in / total) * 100}%` }} />}
              {counts.maybe > 0 && <div className="bg-yellow-500 rounded-full" style={{ width: `${(counts.maybe / total) * 100}%` }} />}
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

function UpcomingEventRow({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="block">
      <div
        className="flex items-center gap-3 py-2.5 border-b last:border-0 hover:bg-[#1e1e1e] -mx-4 px-4 transition-colors"
        style={{ borderColor: '#222' }}
      >
        <span className="text-lg w-7 text-center flex-shrink-0">
          {EVENT_TYPE_EMOJI[event.event_type] ?? '📅'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate">{event.name}</p>
          <p className="text-[#555] text-xs">
            {formatDate(event.starts_at?.split('T')[0]) ?? 'Date TBD'}
            {event.starts_at && ` · ${formatTime(event.starts_at?.split('T')[1] ?? '')}`}
            {event.location && ` · ${event.location}`}
          </p>
        </div>
        <span className="text-[#444] flex-shrink-0">→</span>
      </div>
    </Link>
  )
}

function ProactiveBanner({ prompt, accent, groupId }: { prompt: NonNullable<Prompt>; accent: string; groupId: string }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div
      className="rounded-xl p-4 mb-4 relative"
      style={{ background: `linear-gradient(135deg, ${accent}18 0%, #1e1e1e 100%)`, border: `1px solid ${accent}33` }}
    >
      <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-[#444] hover:text-[#888] transition-colors text-sm">✕</button>
      <p className="text-xs font-semibold mb-0.5" style={{ color: accent }}>✦ {prompt.members?.length ?? 0} people are free</p>
      <p className="text-white text-sm font-medium">{prompt.label}</p>
      <p className="text-[#666] text-xs mb-3">{prompt.start_hour}:00–{prompt.end_hour}:00</p>
      <Link
        href={`/groups/${groupId}/plans/new`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        style={{ background: `${accent}33`, color: accent }}
      >
        👋 Check who's in
      </Link>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GroupPageClient({
  groupId,
  themeColor,
  events = [],
  activeCards = [],
  prompt,
  currentUserId,
  openWindowsSlot,
}: Props) {
  const [tab, setTab] = useState<'overview' | 'plans'>('overview')

  const accent = themeColor ?? '#6366f1'
  const plansBadge = activeCards.length + events.length

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto"
      style={{ background: '#111' }}
    >
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
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium relative transition-colors ${
                tab === t.id ? 'text-white' : 'text-[#555] hover:text-[#999]'
              }`}
            >
              {t.label}
              {t.badge > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{ background: accent, color: '#fff' }}
                >
                  {t.badge}
                </span>
              )}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: accent }} />
              )}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div>
            {activeCards.length === 0 && events.length === 0 ? (
              /* Activated empty state — fresh group */
              <div style={{ paddingTop: '8px' }}>
                <p style={{ fontSize: '13px', color: '#555', marginBottom: '24px', lineHeight: 1.6 }}>
                  Your group is ready. What do you want to do first?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                  <a
                    href={`/groups/${groupId}/invite`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '10px', padding: '24px 16px', borderRadius: '16px', textDecoration: 'none',
                      background: '#161616', border: '1px solid #252525',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>👥</span>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 3px' }}>Invite people</p>
                      <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Who's in this group?</p>
                    </div>
                  </a>
                  <a
                    href={`/groups/${groupId}/plans/new`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '10px', padding: '24px 16px', borderRadius: '16px', textDecoration: 'none',
                      background: `${accent}12`, border: `1px solid ${accent}33`,
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>👋</span>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: accent, margin: '0 0 3px' }}>Start a plan</p>
                      <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>See who's free</p>
                    </div>
                  </a>
                </div>
              </div>
            ) : (
              /* Normal overview */
              <>
                <div
                  className="rounded-2xl p-5 mb-5 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${accent}22 0%, #1a1a1a 65%)`, border: `1px solid ${accent}30` }}
                >
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none" style={{ background: accent }} />
                  <div className="relative">
                    <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: accent }}>✦ ready to plan?</p>
                    <h2 className="text-lg font-bold text-white mb-1">Start something</h2>
                    <p className="text-[#666] text-sm mb-4">Check who's free and lock in a plan with the group.</p>
                    <a
                      href={`/groups/${groupId}/plans/new`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: accent }}
                    >
                      + Start a plan
                    </a>
                  </div>
                </div>
                {prompt && <ProactiveBanner prompt={prompt} accent={accent} groupId={groupId} />}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">Suggested times</p>
                  {openWindowsSlot}
                </div>
              </>
            )}
          </div>
        )}
        {tab === 'plans' && (
          <div>
            {activeCards.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">Active</p>
                <div className="space-y-3">
                  {activeCards.map((card) => (
                    <ActivePlanCard key={card.id} card={card} accent={accent} />
                  ))}
                </div>
              </div>
            )}
            {events.length > 0 ? (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-2">Upcoming plans</p>
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
                <p className="text-[#555] text-sm mb-6">Start a plan to kick things off.</p>
                <Link
                  href={`/groups/${groupId}/plans/new`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: accent }}
                >
                  + Start a plan
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Group chat drawer */}
      <GroupChatDrawer
        groupId={groupId}
        currentUserId={currentUserId ?? ''}
        accentColor={accent}
      />
    </div>
  )
}

export default GroupPageClient
