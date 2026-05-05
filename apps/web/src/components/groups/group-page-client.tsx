'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GroupChatDrawer } from '@/components/groups/group-chat-drawer'

const T = {
  bg:     '#0f0f0f',
  elev:   '#17171a',
  border: 'rgba(255,255,255,0.08)',
  text:   '#f5f4f8',
  dim:    '#a8a4b8',
  mute:   '#6b6878',
  faint:  '#4a4757',
  green:  '#5fcf8a',
  greenSoft: 'rgba(95,207,138,0.14)',
  amber:  '#e8b65a',
  amberSoft: 'rgba(232,182,90,0.14)',
}

type ActiveCard = {
  id: string
  title: string
  event_type: string
  proposed_date: string | null
  proposed_start: string | null
  proposed_end: string | null
  status: 'open' | 'locked' | 'cancelled'
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

const EVENT_TYPE_EMOJI: Record<string, string> = {
  vacation: '✈️', day_trip: '🚗', road_trip: '🛣️',
  game_night: '🎮', hangout: '🛋️', meetup: '👋', moto_trip: '🏍️',
}

function formatDate(d: string | null) {
  if (!d) return null
  const date = new Date(d)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff  = Math.floor((date.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Tonight'
  if (diff === 1) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(t: string | null) {
  if (!t) return null
  const d = new Date(t)
  const h = d.getHours(); const m = d.getMinutes()
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2,'0')}${suffix}`
}

function groupEventsBySection(events: Event[], activeCards: ActiveCard[]) {
  const now = new Date()
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7)

  const allItems = [
    ...activeCards.map(c => ({ kind: 'card' as const, item: c, date: c.proposed_date ? new Date(c.proposed_date) : null })),
    ...events.map(e => ({ kind: 'event' as const, item: e, date: e.starts_at ? new Date(e.starts_at) : null })),
  ]

  const thisWeek = allItems.filter(i => i.date && i.date >= now && i.date <= weekEnd)
  const upcoming = allItems.filter(i => i.date && i.date > weekEnd)
  const tbd      = allItems.filter(i => !i.date)

  return { thisWeek, upcoming, tbd }
}

function PlanRow({ kind, item, accent }: { kind: 'card' | 'event'; item: any; accent: string }) {
  const isCard = kind === 'card'
  const href   = isCard ? `/plans/${item.id}` : `/events/${item.id}`
  const title  = isCard ? item.title : item.name
  const date   = isCard ? item.proposed_date : item.starts_at
  const time   = isCard ? item.proposed_start : item.starts_at
  const counts = item.response_counts
  const isLocked = item.status === 'locked'

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
        transition: 'background 0.1s',
      }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: isLocked ? T.greenSoft : T.amberSoft,
          color: isLocked ? T.green : T.amber,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
        }}>
          {isLocked ? '✓' : (EVENT_TYPE_EMOJI[item.event_type] ?? '📅')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </span>
            {isLocked && (
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.green }}>
                LOCKED
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.mute }}>
            {formatDate(date?.split?.('T')?.[0] ?? date) ?? 'Date TBD'}
            {time && ` · ${formatTime(time)}`}
          </div>
        </div>
        {counts && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: T.mute, flexShrink: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />{counts.in}
            </span>
            {counts.maybe > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber }} />{counts.maybe}
              </span>
            )}
          </div>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
      </div>
    </Link>
  )
}

function PlansSection({ title, count, items, accent, collapsed = false }: {
  title: string; count: number; items: { kind: 'card' | 'event'; item: any }[];
  accent: string; collapsed?: boolean
}) {
  const [open, setOpen] = useState(!collapsed)
  if (items.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>{title}</h3>
          <span style={{ fontSize: 12, color: T.mute }}>{count}</span>
        </div>
        {collapsed && (
          <button
            onClick={() => setOpen(v => !v)}
            style={{ background: 'none', border: 'none', color: T.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {open ? 'Hide ↑' : 'Show all ↓'}
          </button>
        )}
      </div>
      {open && (
        <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, background: T.elev, overflow: 'hidden' }}>
          {items.map((item, i) => (
            <div key={item.item.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.border}` }}>
              <PlanRow kind={item.kind} item={item.item} accent={accent} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function GroupPageClient({
  groupId, themeColor, events = [], activeCards = [],
  prompt, currentUserId, openWindowsSlot,
}: Props) {
  const [tab, setTab] = useState<'overview' | 'plans'>('overview')
  const accent = themeColor ?? '#7F77DD'
  const { thisWeek, upcoming, tbd } = groupEventsBySection(events, activeCards)
  const totalPlans = events.length + activeCards.length

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#111' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 28px 80px' }}>

        {/* Tab strip */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 28 }}>
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'plans',    label: 'Plans', badge: totalPlans },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', fontSize: 14, fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t.id ? T.text : T.mute,
                fontFamily: 'inherit', position: 'relative',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
              {t.badge > 0 && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '1.5px 6px', borderRadius: 9,
                  background: tab === t.id ? accent : 'rgba(255,255,255,0.08)',
                  color: tab === t.id ? '#fff' : T.mute,
                }}>{t.badge}</span>
              )}
              {tab === t.id && (
                <span style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: accent, borderRadius: '2px 2px 0 0',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Suggested times — HERO, at the top */}
            {openWindowsSlot && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.text }}>Suggested times</h3>
                  <span style={{ fontSize: 12, color: T.mute }}>based on everyone's availability</span>
                </div>
                {openWindowsSlot}
              </div>
            )}

            {/* Proactive window hint */}
            {prompt && (
              <div style={{ fontSize: 13, color: T.dim, padding: '10px 14px', borderRadius: 10, background: T.elev, border: `1px solid ${T.border}` }}>
                <span style={{ color: accent }}>✦ {prompt.members?.length ?? 0} people are free</span>
                {' '}{prompt.label.toLowerCase()} — <Link href={`/groups/${groupId}/plans/new`} style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>check who's in →</Link>
              </div>
            )}

            {/* Start something — DEMOTED to subtle dashed CTA */}
            <Link href={`/groups/${groupId}/plans/new`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 12,
                background: 'transparent', border: `1px dashed rgba(255,255,255,0.14)`,
                color: T.dim, fontSize: 14, cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = `${accent}66`)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)')}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: `rgba(127,119,221,0.15)`, color: accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>+</div>
                <span style={{ flex: 1 }}>Start something specific</span>
                <span style={{ fontSize: 12, color: T.faint }}>Pick a date →</span>
              </div>
            </Link>

            {/* Empty state */}
            {!openWindowsSlot && events.length === 0 && activeCards.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 6px' }}>
                  Invite the crew to get started
                </p>
                <p style={{ fontSize: 13, color: T.mute, margin: '0 0 20px', lineHeight: 1.5 }}>
                  Once your group has members, Rally will find the best times to hang.
                </p>
                <Link href={`/groups/${groupId}/settings`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px', borderRadius: 9, textDecoration: 'none',
                  background: `${accent}20`, border: `1px solid ${accent}40`,
                  color: accent, fontSize: 13, fontWeight: 600,
                }}>
                  Invite people →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Plans tab ── */}
        {tab === 'plans' && (
          <div>
            {totalPlans === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🗓</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 6px' }}>Nothing planned yet</p>
                <p style={{ fontSize: 13, color: T.mute, margin: '0 0 20px' }}>Start a plan to kick things off.</p>
                <Link href={`/groups/${groupId}/plans/new`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px', borderRadius: 9, textDecoration: 'none',
                  background: accent, color: '#fff', fontSize: 13, fontWeight: 600,
                }}>
                  + Start a plan
                </Link>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Plans</h2>
                  <Link href={`/groups/${groupId}/plans/new`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '8px 14px', borderRadius: 9, textDecoration: 'none',
                    background: accent, color: '#fff', fontSize: 13, fontWeight: 600,
                  }}>
                    + New plan
                  </Link>
                </div>

                <PlansSection
                  title="Tonight & this week"
                  count={thisWeek.length}
                  items={thisWeek}
                  accent={accent}
                />
                <PlansSection
                  title="Upcoming"
                  count={upcoming.length}
                  items={upcoming}
                  accent={accent}
                />
                <PlansSection
                  title="Date TBD"
                  count={tbd.length}
                  items={tbd}
                  accent={accent}
                />
              </>
            )}
          </div>
        )}
      </div>

      <GroupChatDrawer groupId={groupId} currentUserId={currentUserId ?? ''} accentColor={accent} />
    </div>
  )
}

export default GroupPageClient
