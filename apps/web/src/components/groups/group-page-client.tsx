'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GroupChatDrawer } from '@/components/groups/group-chat-drawer'

// ─── Types ────────────────────────────────────────────────────────────────────

type Creator = {
  id?: string
  display_name: string | null
  username: string
  avatar_url: string | null
}

type ActiveCard = {
  id: string
  title: string
  event_type: string
  proposed_date: string | null
  proposed_start: string | null
  proposed_end: string | null
  status: 'open' | 'locked'
  created_at?: string | null
  creator?: Creator | null
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

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function CreatorAvatar({ creator }: { creator: Creator }) {
  const name = creator.display_name ?? creator.username
  return (
    <div
      className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
      style={{ background: '#333' }}
      title={name}
    >
      {creator.avatar_url
        ? <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
        : name.charAt(0).toUpperCase()
      }
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivePlanCard({ card, accent }: { card: ActiveCard; accent: string }) {
  const counts = card.response_counts ?? { in: 0, maybe: 0, cant: 0 }
  const total  = counts.in + counts.maybe + counts.cant

  return (
    <Link href={`/plans/${card.id}`} className="block">
      <div
        className="rounded-xl p-4 transition-all hover:border-[#333]"
        style={{ background: '#1a1a1a', border: '1px solid #252525' }}
      >
        {/* Header row — creator + timestamp */}
        <div className="flex items-center gap-2 mb-3">
          {card.creator && <CreatorAvatar creator={card.creator} />}
          <span className="text-[#555] text-[11px] truncate min-w-0">
            {card.creator
              ? <><span className="text-[#888]">{card.creator.display_name ?? card.creator.username}</span> asked</>
              : 'Checking who\'s in'
            }
          </span>
          {card.created_at && (
            <span className="text-[#3a3a3a] text-[10px] flex-shrink-0 ml-auto">
              {timeAgo(card.created_at)}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base leading-none">{EVENT_TYPE_EMOJI[card.event_type] ?? '📅'}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
                who's in?
              </span>
            </div>
            <p className="text-white font-semibold text-sm truncate">{card.title}</p>
            {card.proposed_date && (
              <p className="text-[#555] text-xs mt-0.5">
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

        {/* Response bar */}
        {total > 0 ? (
          <>
            <div className="flex h-1 rounded-full overflow-hidden gap-0.5 mb-1.5">
              {counts.in > 0 && (
                <div className="bg-emerald-500 rounded-full" style={{ width: `${(counts.in / total) * 100}%` }} />
              )}
              {counts.maybe > 0 && (
                <div className="bg-yellow-500 rounded-full" style={{ width: `${(counts.maybe / total) * 100}%` }} />
              )}
              <div className="bg-[#2a2a2a] rounded-full flex-1" />
            </div>
            <div className="flex gap-3 text-[11px]">
              <span className="text-emerald-500">{counts.in} in</span>
              <span className="text-yellow-500">{counts.maybe} maybe</span>
              <span className="text-[#444]">{counts.cant} can't</span>
            </div>
          </>
        ) : (
          <p className="text-[#3a3a3a] text-[11px]">No responses yet — tap to vote</p>
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

  const accent = themeColor ?? '#7F77DD'
  const plansBadge = activeCards.length + events.length

  return (
    <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: '#0f0f0f' }}>
      <div className="max-w-2xl mx-auto px-6 py-6 pb-24">

        {/* Tab strip */}
        <div className="flex border-b mb-6" style={{ borderColor: '#1e1e1e' }}>
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'plans',    label: 'Plans', badge: plansBadge },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium relative transition-colors ${
                tab === t.id ? 'text-white' : 'text-[#444] hover:text-[#888]'
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

        {/* Plans tab */}
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
