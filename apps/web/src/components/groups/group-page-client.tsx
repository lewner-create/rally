'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GroupChatDrawer } from '@/components/groups/group-chat-drawer'

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
  groupName?: string
  bannerUrl?: string | null
  description?: string | null
  members?: unknown[]
  isAdmin?: boolean
  proactiveBannerSlot?: React.ReactNode
}

// ─── Event type labels ─────────────────────────────────────────────────────────
const EVENT_TYPE_LABEL: Record<string, string> = {
  vacation:   'Vacation',
  day_trip:   'Day trip',
  road_trip:  'Road trip',
  game_night: 'Game night',
  hangout:    'Hangout',
  meetup:     'Meetup',
  moto_trip:  'Moto trip',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parseDateStr(s: string | null): Date | null {
  if (!s) return null
  // Handle "2026-05-10", "2026-05-10T19:00:00Z", "2026-05-10 19:00:00+00"
  const normalised = s.replace(' ', 'T')
  const d = new Date(normalised)
  return isNaN(d.getTime()) ? null : d
}

function formatDate(d: string | null): string | null {
  const date = parseDateStr(d)
  if (!date) return null
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(t: string | null): string | null {
  if (!t) return null
  // Accept "HH:MM", "HH:MM:SS", or full ISO
  const timePart = t.includes('T') ? t.split('T')[1] : t
  const [hStr, mStr] = timePart.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h)) return null
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour   = h > 12 ? h - 12 : h === 0 ? 12 : h
  return isNaN(m) || m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

function relativeDate(s: string | null): string | null {
  const d = parseDateStr(s)
  if (!d) return null
  const now   = new Date()
  const diff  = d.getTime() - now.getTime()
  const days  = Math.ceil(diff / 86_400_000)
  if (days < 0)  return 'past'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days <= 6)  return `in ${days} days`
  return formatDate(s)
}

// ─── FOMO copy based on response counts ───────────────────────────────────────
function getFomoCopy(inCount: number, total: number): string {
  if (total === 0)   return "Be the first to say you're in"
  if (inCount === 0) return "No one's committed yet — be the first"
  if (inCount === 1) return "1 person is in — they need you to make it happen"
  if (inCount === 2) return "2 people in — one more and this is happening"
  if (inCount >= 3)  return `${inCount} people in — don't be the one who misses this`
  return `${inCount} people in`
}

// ─── Locked event hero ─────────────────────────────────────────────────────────
function LockedEventHero({ event, accent }: { event: Event; accent: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    const target = parseDateStr(event.starts_at)
    if (!target) return
    const update = () => {
      const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [event.starts_at])

  function formatCountdown(s: number): string {
    const d  = Math.floor(s / 86400)
    const h  = Math.floor((s % 86400) / 3600)
    const m  = Math.floor((s % 3600) / 60)
    const sc = s % 60
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${sc}s`
    return `${m}m ${sc}s`
  }

  const typeLabel = EVENT_TYPE_LABEL[event.event_type] ?? event.event_type
  const dateStr   = formatDate(event.starts_at)
  const timeStr   = formatTime(event.starts_at)

  return (
    <Link href={`/events/${event.id}`} className="block mb-4">
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: `linear-gradient(145deg, ${accent}33 0%, #111 70%)`,
          border: `1.5px solid ${accent}55`,
        }}
      >
        {/* Glow */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: accent, opacity: 0.12, filter: 'blur(48px)' }}
        />

        <div className="relative p-5">
          {/* Status row */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: `${accent}33`, color: accent }}
            >
              {typeLabel}
            </span>
            <span
              className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{ animation: 'pulse 2s infinite' }}
              />
              Locked in
            </span>
          </div>

          {/* Event name */}
          <h2
            className="text-xl font-bold text-white mb-3 leading-tight"
            style={{ letterSpacing: '-0.02em' }}
          >
            {event.name}
          </h2>

          {/* Date / time / location */}
          <div className="space-y-1.5 mb-4">
            {dateStr ? (
              <p className="text-sm font-semibold text-white/80">
                {dateStr}{timeStr ? ` · ${timeStr}` : ''}
              </p>
            ) : (
              <p className="text-sm text-[#555]">Date TBD</p>
            )}
            {event.location && (
              <p className="text-xs text-[#666]">{event.location}</p>
            )}
          </div>

          {/* Countdown */}
          {secondsLeft !== null && secondsLeft > 0 && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span className="text-xs text-[#888]">Starts in</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {formatCountdown(secondsLeft)}
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: accent }}>
              View details
            </span>
            <span style={{ color: accent, fontSize: 16 }}>→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── FOMO plan card ────────────────────────────────────────────────────────────
function ActivePlanCard({ card, accent }: { card: ActiveCard; accent: string }) {
  const counts   = card.response_counts ?? { in: 0, maybe: 0, cant: 0 }
  const total    = counts.in + counts.maybe + counts.cant
  const fomoCopy = getFomoCopy(counts.in, total)
  const relDate  = relativeDate(card.proposed_date)
  const typeLabel = EVENT_TYPE_LABEL[card.event_type] ?? card.event_type

  // Urgency colour: green if lots in, amber if few, default if none
  const urgencyColor = counts.in >= 3 ? '#34d399' : counts.in >= 1 ? '#fbbf24' : '#555'

  return (
    <Link href={`/plans/${card.id}`} className="block">
      <div
        className="rounded-xl overflow-hidden transition-all hover:border-[#3a3a3a]"
        style={{
          background: `linear-gradient(135deg, ${accent}10 0%, #1a1a1a 60%)`,
          border: `1px solid ${accent}30`,
        }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: `${accent}20` }}
        >
          <span
            className="text-[9px] font-bold tracking-widest uppercase"
            style={{ color: accent }}
          >
            {typeLabel} · checking who's in
          </span>
          {relDate && relDate !== 'past' && (
            <span className="text-[9px] font-semibold text-[#555] uppercase tracking-wider">
              {relDate}
            </span>
          )}
        </div>

        <div className="p-4">
          {/* Title */}
          <p className="text-white font-semibold text-base mb-1 leading-tight">{card.title}</p>

          {/* Proposed time */}
          {card.proposed_date && (
            <p className="text-[#555] text-xs mb-3">
              {formatDate(card.proposed_date)}
              {card.proposed_start && ` · ${formatTime(card.proposed_start)}`}
            </p>
          )}

          {/* FOMO copy */}
          <p
            className="text-sm font-medium mb-3 leading-snug"
            style={{ color: urgencyColor }}
          >
            {fomoCopy}
          </p>

          {/* Response bar */}
          {total > 0 ? (
            <div className="space-y-2">
              <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                {counts.in > 0    && <div className="bg-emerald-500 rounded-full" style={{ width: `${(counts.in / total) * 100}%` }} />}
                {counts.maybe > 0 && <div className="bg-yellow-500 rounded-full"  style={{ width: `${(counts.maybe / total) * 100}%` }} />}
                {counts.cant > 0  && <div className="bg-[#333] rounded-full"       style={{ width: `${(counts.cant / total) * 100}%` }} />}
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-emerald-500 font-medium">{counts.in} in</span>
                <span className="text-yellow-500">{counts.maybe} maybe</span>
                <span className="text-[#444]">{counts.cant} can't</span>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-[#555]">No responses yet</span>
              <span className="ml-auto font-semibold" style={{ color: accent }}>Respond →</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Upcoming event row ────────────────────────────────────────────────────────
function UpcomingEventRow({ event, accent }: { event: Event; accent: string }) {
  const dateStr = formatDate(event.starts_at)
  const timeStr = formatTime(event.starts_at)
  const typeLabel = EVENT_TYPE_LABEL[event.event_type] ?? event.event_type

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div
        className="flex items-center gap-3 py-3 border-b last:border-0 -mx-4 px-4 transition-colors hover:bg-[#1e1e1e]"
        style={{ borderColor: '#222' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider"
          style={{ background: `${accent}22`, color: accent, letterSpacing: '0.04em' }}
        >
          {typeLabel.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate">{event.name}</p>
          <p className="text-[#555] text-xs mt-0.5">
            {dateStr
              ? <>{dateStr}{timeStr && ` · ${timeStr}`}{event.location && ` · ${event.location}`}</>
              : 'Date TBD'
            }
          </p>
        </div>
        <span className="text-[#444] flex-shrink-0 text-sm">→</span>
      </div>
    </Link>
  )
}

// ─── Start something buttons ───────────────────────────────────────────────────
function StartSomethingButtons({ groupId, accent }: { groupId: string; accent: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <a
        href={`/groups/${groupId}/plans/new`}
        style={{
          flex: 1, minWidth: '140px',
          display: 'flex', flexDirection: 'column', gap: 4,
          padding: '14px 16px', borderRadius: 14, textDecoration: 'none',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>Check who's in</span>
        <span style={{ fontSize: 12, color: '#666', lineHeight: 1.35 }}>Send a poll, see who's free</span>
      </a>
      <a
        href={`/groups/${groupId}/events/new`}
        style={{
          flex: 1, minWidth: '140px',
          display: 'flex', flexDirection: 'column', gap: 4,
          padding: '14px 16px', borderRadius: 14, textDecoration: 'none',
          background: `${accent}22`, border: `1px solid ${accent}40`,
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 700, color: accent }}>Lock in a plan</span>
        <span style={{ fontSize: 12, color: '#666', lineHeight: 1.35 }}>Create a confirmed event</span>
      </a>
    </div>
  )
}

// ─── Proactive banner ──────────────────────────────────────────────────────────
function ProactiveBanner({ prompt, accent, groupId }: { prompt: NonNullable<Prompt>; accent: string; groupId: string }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div
      className="rounded-xl p-4 mb-4 relative"
      style={{ background: `linear-gradient(135deg, ${accent}18 0%, #1e1e1e 100%)`, border: `1px solid ${accent}33` }}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-[#444] hover:text-[#888] transition-colors"
        style={{ fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ×
      </button>
      <p className="text-xs font-semibold mb-0.5" style={{ color: accent }}>
        {prompt.members?.length ?? 0} people are free right now
      </p>
      <p className="text-white text-sm font-medium">{prompt.label}</p>
      <p className="text-[#666] text-xs mb-3">{prompt.start_hour}:00–{prompt.end_hour}:00</p>
      <Link
        href={`/groups/${groupId}/plans/new`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        style={{ background: `${accent}33`, color: accent }}
      >
        Check who's in →
      </Link>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
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

  const accent       = themeColor ?? '#6366f1'
  const openCards    = activeCards.filter(c => c.status === 'open')
  const plansBadge   = openCards.length + events.length
  const hasActivity  = openCards.length > 0 || events.length > 0

  return (
    <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: '#111' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">

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
              {(t.badge ?? 0) > 0 && (
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

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <div>
            {!hasActivity ? (
              /* Empty state */
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
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: accent, margin: '0 0 3px' }}>Check who's in</p>
                      <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>See who's free</p>
                    </div>
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Locked events — hero at top of overview */}
                {events.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">
                      Locked in
                    </p>
                    {events.map((event) => (
                      <LockedEventHero key={event.id} event={event} accent={accent} />
                    ))}
                  </div>
                )}

                {/* Active plan cards */}
                {openCards.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">
                      Who's in?
                    </p>
                    <div className="space-y-3">
                      {openCards.map((card) => (
                        <ActivePlanCard key={card.id} card={card} accent={accent} />
                      ))}
                    </div>
                  </div>
                )}

                {prompt && <ProactiveBanner prompt={prompt} accent={accent} groupId={groupId} />}

                {/* Start something */}
                <div
                  className="rounded-2xl p-5 mb-5 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${accent}18 0%, #1a1a1a 65%)`, border: `1px solid ${accent}25` }}
                >
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none" style={{ background: accent }} />
                  <div className="relative">
                    <h2 className="text-base font-bold text-white mb-1">Start something new</h2>
                    <p className="text-[#666] text-sm mb-4">Check who's free or lock in a plan directly.</p>
                    <StartSomethingButtons groupId={groupId} accent={accent} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">Suggested times</p>
                  {openWindowsSlot}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Plans tab ── */}
        {tab === 'plans' && (
          <div>
            {/* Locked events first — they're the win */}
            {events.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">Locked in</p>
                {events.map((event) => (
                  <LockedEventHero key={event.id} event={event} accent={accent} />
                ))}
              </div>
            )}

            {/* Open plan cards */}
            {openCards.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">Who's in?</p>
                <div className="space-y-3">
                  {openCards.map((card) => (
                    <ActivePlanCard key={card.id} card={card} accent={accent} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {events.length === 0 && openCards.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white font-medium mb-1">Nothing planned yet</p>
                <p className="text-[#555] text-sm mb-6">Start a plan to kick things off.</p>
                <StartSomethingButtons groupId={groupId} accent={accent} />
              </div>
            )}
          </div>
        )}
      </div>

      <GroupChatDrawer
        groupId={groupId}
        currentUserId={currentUserId ?? ''}
        accentColor={accent}
      />
    </div>
  )
}

export default GroupPageClient
