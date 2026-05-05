'use client'

import Link from 'next/link'
import { useState, useTransition, useEffect } from 'react'
import { upsertRsvp } from '@/lib/actions/events'
import type { GroupWithWindows, MemberPreview, UpcomingPlan, NeedsYouItem, GroupActivity } from '@/lib/actions/dashboard'

// ── Design tokens ───────────────────────────────────────────────
const T = {
  bg:          '#0f0f0f',
  bgElev:      '#17171a',
  bgElev2:     '#1c1c20',
  border:      'rgba(255,255,255,0.08)',
  borderStrong:'rgba(255,255,255,0.14)',
  text:        '#f5f4f8',
  textDim:     '#a8a4b8',
  textMute:    '#6b6878',
  textFaint:   '#4a4757',
  violet:      '#7F77DD',
  violetSoft:  'rgba(127,119,221,0.15)',
  violetMid:   'rgba(127,119,221,0.28)',
  green:       '#5fcf8a',
  greenSoft:   'rgba(95,207,138,0.14)',
  amber:       '#e8b65a',
  amberSoft:   'rgba(232,182,90,0.14)',
}

type Props = {
  profile: { id: string; display_name: string | null; username: string; avatar_url: string | null } | null
  groupsWithWindows: GroupWithWindows[]
  upcomingPlans: UpcomingPlan[]
  needsYouItems: NeedsYouItem[]
  groupsActivity: GroupActivity[]
}

// ── Helpers ─────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function relativeTime(iso: string): string {
  const dt    = new Date(iso)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff  = Math.floor((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Tonight'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7)   return dt.toLocaleDateString('en-US', { weekday: 'long' })
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function greeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name} ☀️`
  if (h < 17) return `Hey, ${name} 👋`
  if (h < 21) return `Evening, ${name} 🌙`
  return `Hey, ${name} 🌙`
}

// ── useIsMobile hook ─────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

// ── Avatar stack ─────────────────────────────────────────────────
function AvatarStack({ people, size = 24, max = 5 }: { people: MemberPreview[]; size?: number; max?: number }) {
  const shown   = people.slice(0, max)
  const extra   = people.length - shown.length
  const overlap = Math.round(size * 0.3)
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: shown.length - i }}>
          <div style={{
            width: size, height: size, borderRadius: '50%',
            background: '#2a252e', border: `1.5px solid ${T.bg}`,
            overflow: 'hidden', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: Math.round(size * 0.38),
            fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>
            {p.avatar_url
              ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (p.display_name ?? p.username).charAt(0).toUpperCase()
            }
          </div>
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -overlap,
          width: size, height: size, borderRadius: '50%',
          background: '#2a252e', border: `1.5px solid ${T.bg}`,
          color: T.textDim, fontSize: Math.round(size * 0.34), fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>+{extra}</div>
      )}
    </div>
  )
}

// ── Hero plan card ───────────────────────────────────────────────
function HeroPlan({ plan, isMobile }: { plan: UpcomingPlan; isMobile: boolean }) {
  const when  = relativeTime(plan.starts_at)
  const time  = formatTime(plan.starts_at)
  const color = plan.group_color ?? T.violet

  return (
    <Link href={`/events/${plan.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 18,
        background: `
          radial-gradient(120% 120% at 0% 0%, rgba(127,119,221,0.32) 0%, rgba(127,119,221,0.08) 40%, transparent 70%),
          linear-gradient(135deg, #1d1640 0%, #2a1f4d 60%, #3a1e3e 100%)
        `,
        border: `1px solid rgba(127,119,221,0.28)`,
        padding: isMobile ? '18px 16px' : '22px 24px',
        color: T.text,
      }}>
        {plan.group_banner && (
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.15,
            backgroundImage: `url(${plan.group_banner})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            mixBlendMode: 'screen',
            maskImage: 'linear-gradient(to right, transparent 0%, transparent 30%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 30%, black 100%)',
          }} />
        )}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: T.textDim, fontWeight: 500 }}>{plan.group_name}</span>
            <span style={{ color: T.textFaint }}>·</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              color: T.green, textTransform: 'uppercase',
            }}>✓ Locked in</span>
          </div>
          <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, lineHeight: 1.15 }}>
            {plan.title}
          </div>
          <div style={{ fontSize: 14.5, color: T.textDim, marginBottom: 18 }}>
            {when} · {time}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AvatarStack people={plan.attendees} size={28} max={5} />
              <div style={{ fontSize: 13, color: T.textDim }}>
                <span style={{ color: T.text, fontWeight: 600 }}>{plan.going_count} going</span>
                {plan.maybe_count > 0 && <span style={{ color: T.textMute }}> · {plan.maybe_count} maybe</span>}
              </div>
            </div>
            <span style={{
              background: T.violet, color: '#fff', border: 'none',
              padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(127,119,221,0.3)',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>View plan →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Empty hero ───────────────────────────────────────────────────
function EmptyHero({ hasGroups, isMobile }: { hasGroups: boolean; isMobile: boolean }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 18, padding: isMobile ? '22px 18px' : '28px 24px',
      background: `
        radial-gradient(120% 100% at 0% 0%, rgba(127,119,221,0.32), transparent 60%),
        linear-gradient(160deg, #1a1430 0%, #2a1a3e 100%)
      `,
      border: `1px solid rgba(127,119,221,0.25)`,
    }}>
      <div style={{ display: 'flex', marginBottom: 14 }}>
        {['👋', '🍻', '🎲', '🏔️'].map((e, i) => (
          <div key={i} style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `hsl(${260 + i * 22} 40% 22%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, marginLeft: i === 0 ? 0 : -10,
            border: `2px solid ${T.bg}`,
          }}>{e}</div>
        ))}
      </div>
      <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 700, letterSpacing: '-0.02em', color: T.text }}>
        {hasGroups ? 'Nothing locked in yet' : "Let's get the crew together"}
      </h2>
      <p style={{ margin: '8px 0 18px', fontSize: 14, color: T.textDim, lineHeight: 1.45 }}>
        {hasGroups
          ? 'Check the suggested times for your groups and start something.'
          : "Make a group, invite your friends, and Volta finds when you're all free."
        }
      </p>
      {hasGroups ? (
        <Link href="/groups/new" style={{
          background: T.violet, color: '#fff',
          padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(127,119,221,0.3)',
        }}>+ Start a plan</Link>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/groups/new" style={{
            background: T.violet, color: '#fff',
            padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
          }}>+ Start your first group</Link>
          <Link href="/join" style={{
            background: 'rgba(255,255,255,0.06)', color: T.text,
            border: `1px solid ${T.border}`,
            padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
          }}>I have an invite link</Link>
        </div>
      )}
    </div>
  )
}

// ── Needs you row ────────────────────────────────────────────────
function NeedsYouSection({ items }: { items: NeedsYouItem[] }) {
  const [rsvping, setRsvping] = useState<string | null>(null)
  const [done, setDone]       = useState<Set<string>>(new Set())
  const [, startTransition]   = useTransition()

  const visible = items.filter(i => !done.has(i.id))
  if (visible.length === 0) return null

  function handleRsvp(eventId: string, status: 'yes' | 'no') {
    setRsvping(eventId)
    startTransition(async () => {
      await upsertRsvp(eventId, status)
      setDone(prev => new Set([...prev, eventId]))
      setRsvping(null)
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.text }}>Needs you</h3>
        <span style={{ fontSize: 12, color: T.textMute }}>{visible.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 12,
            background: T.bgElev, border: `1px solid ${T.border}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: T.amberSoft, color: T.amber,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🕐</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                {item.group_color && <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.group_color }} />}
                <span style={{ fontSize: 11, color: T.textMute, fontWeight: 500 }}>{item.group_name}</span>
              </div>
              <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12.5, color: T.textDim }}>{item.sub}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => handleRsvp(item.id, 'yes')}
                disabled={rsvping === item.id}
                style={{
                  background: T.greenSoft, color: T.green,
                  border: 'none', padding: '6px 12px', borderRadius: 8,
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: rsvping === item.id ? 0.6 : 1,
                }}
              >I'm in</button>
              <button
                onClick={() => handleRsvp(item.id, 'no')}
                disabled={rsvping === item.id}
                style={{
                  background: 'transparent', color: T.textDim,
                  border: `1px solid ${T.border}`, padding: '6px 12px', borderRadius: 8,
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Can't</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── What's brewing ───────────────────────────────────────────────
function BrewingSection({ groups }: { groups: GroupWithWindows[] }) {
  const items = groups
    .filter(g => g.next_window || g.member_count > 1)
    .slice(0, 4)
    .map(g => {
      if (g.next_window) {
        return {
          icon: '⚡', color: T.violet, group: g.name, groupId: g.id,
          groupColor: g.theme_color,
          text: `${g.next_window.members.length} people free ${g.next_window.label.toLowerCase()}`,
          action: 'Start a plan', href: `/groups/${g.id}`,
        }
      }
      return {
        icon: '👥', color: T.textMute, group: g.name, groupId: g.id,
        groupColor: g.theme_color,
        text: `${g.member_count} member${g.member_count !== 1 ? 's' : ''} · no plans yet`,
        action: 'Open', href: `/groups/${g.id}`,
      }
    })

  if (items.length === 0) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.text }}>What's brewing</h3>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgElev,
        overflow: 'hidden',
      }}>
        {items.map((it, i) => (
          <div key={it.groupId} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            borderTop: i === 0 ? 'none' : `1px solid ${T.border}`,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>{it.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {it.text}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {it.groupColor && <div style={{ width: 5, height: 5, borderRadius: '50%', background: it.groupColor }} />}
                <span style={{ fontSize: 11.5, color: T.textMute }}>{it.group}</span>
              </div>
            </div>
            <Link href={it.href} style={{
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textDim, padding: '6px 10px', borderRadius: 8,
              fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}>{it.action}</Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Compact groups list ──────────────────────────────────────────
function CompactGroupsList({ groups }: { groups: GroupActivity[] }) {
  if (groups.length === 0) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.text }}>Your groups</h3>
        <span style={{ fontSize: 12, color: T.textMute }}>{groups.length}</span>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgElev,
        overflow: 'hidden',
      }}>
        {groups.map((g, i) => (
          <Link key={g.id} href={`/groups/${g.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 12px',
              borderTop: i === 0 ? 'none' : `1px solid ${T.border}`,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = T.bgElev2)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: g.theme_color
                  ? `linear-gradient(135deg, ${g.theme_color}, ${g.theme_color}88)`
                  : 'linear-gradient(135deg, #3a2e5e, #2a1f4d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 10.5, fontWeight: 700,
              }}>{initials(g.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.name}
                </div>
                <div style={{ fontSize: 11.5, color: T.textMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.last_activity ?? `${g.member_count} member${g.member_count !== 1 ? 's' : ''}`}
                </div>
              </div>
              {g.unread > 0 && (
                <span style={{
                  background: T.violet, color: '#fff',
                  fontSize: 10.5, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 10, minWidth: 18, textAlign: 'center',
                }}>{g.unread}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Start plan CTA ───────────────────────────────────────────────
function StartPlanCTA({ hasGroups, groups }: { hasGroups: boolean; groups: GroupActivity[] }) {
  const [open, setOpen] = useState(false)

  if (!hasGroups) {
    return (
      <Link href="/groups/new" style={{ textDecoration: 'none' }}>
        <div style={{
          width: '100%', background: `linear-gradient(135deg, ${T.violet} 0%, #b66adb 100%)`,
          color: '#fff', padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', boxShadow: '0 6px 20px rgba(127,119,221,0.25)',
        }}>
          <span>+ Create your first group</span>
        </div>
      </Link>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', background: `linear-gradient(135deg, ${T.violet} 0%, #b66adb 100%)`,
          color: '#fff', border: 'none',
          padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          cursor: 'pointer', boxShadow: '0 6px 20px rgba(127,119,221,0.25)',
          fontFamily: 'inherit',
        }}
      >
        <span>+ Round up the crew</span>
        <span style={{ fontSize: 11.5, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: T.bgElev, border: `1px solid ${T.border}`,
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 20,
        }}>
          <div style={{ padding: '10px 12px 6px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              Pick a group
            </p>
          </div>
          {groups.map((g, i) => (
            <Link key={g.id} href={`/groups/${g.id}/plans/new`} style={{ textDecoration: 'none' }}
              onClick={() => setOpen(false)}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderTop: `1px solid ${T.border}`,
              }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: g.theme_color
                    ? `linear-gradient(135deg, ${g.theme_color}, ${g.theme_color}88)`
                    : 'linear-gradient(135deg, #3a2e5e, #2a1f4d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 9.5, fontWeight: 700,
                }}>{initials(g.name)}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{g.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ───────────────────────────────────────────────
export default function DashboardClient({
  profile,
  groupsWithWindows,
  upcomingPlans,
  needsYouItems,
  groupsActivity,
}: Props) {
  const isMobile  = useIsMobile()
  const firstName = profile?.display_name?.split(' ')[0] ?? profile?.username ?? 'there'
  const hasGroups = groupsWithWindows.length > 0
  const today     = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const heroPlan  = upcomingPlans.find(p => p.my_rsvp === 'yes') ?? upcomingPlans[0] ?? null

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'inherit' }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: isMobile ? '14px 16px' : '18px 36px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {greeting(firstName)}
          </h1>
          <div style={{ fontSize: 13, color: T.textMute, marginTop: 2 }}>{today}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {/* Search bar — desktop only */}
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.bgElev, border: `1px solid ${T.border}`,
              padding: '7px 12px', borderRadius: 10, width: 240,
              color: T.textMute, fontSize: 13,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
              <span style={{ flex: 1 }}>Search…</span>
            </div>
          )}
          <Link href="/groups/new" style={{
            width: 34, height: 34, borderRadius: 9,
            background: T.bgElev, border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.textDim, textDecoration: 'none', fontSize: 18,
          }}>+</Link>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        padding: isMobile ? '16px 16px 80px' : '28px 36px 80px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 300px',
        gap: isMobile ? 20 : 28,
        alignItems: 'start',
        maxWidth: 1200,
        margin: '0 auto',
      }}>

        {/* On mobile: CTA comes first, above the hero */}
        {isMobile && (
          <StartPlanCTA hasGroups={hasGroups} groups={groupsActivity} />
        )}

        {/* ── Left / main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 28, minWidth: 0 }}>
          {heroPlan
            ? <HeroPlan plan={heroPlan} isMobile={isMobile} />
            : <EmptyHero hasGroups={hasGroups} isMobile={isMobile} />
          }
          <NeedsYouSection items={needsYouItems} />
          {hasGroups && <BrewingSection groups={groupsWithWindows} />}
          {!hasGroups && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMute, marginBottom: 12 }}>
                Three steps to your first hang
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { n: 1, title: 'Make a group',        sub: 'Name it, theme it' },
                  { n: 2, title: 'Invite your friends',  sub: 'Share a link, no app needed' },
                  { n: 3, title: 'Drop your free times', sub: 'Volta finds when you all overlap' },
                ].map(s => (
                  <div key={s.n} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', borderRadius: 12,
                    background: T.bgElev, border: `1px solid ${T.border}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: T.violetSoft, color: T.violet,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                    }}>{s.n}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{s.title}</div>
                      <div style={{ fontSize: 12.5, color: T.textMute, marginTop: 1 }}>{s.sub}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* On mobile: groups list appears at the bottom of the main column */}
          {isMobile && <CompactGroupsList groups={groupsActivity} />}
        </div>

        {/* ── Right column — desktop only ── */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, position: 'sticky', top: 24 }}>
            <StartPlanCTA hasGroups={hasGroups} groups={groupsActivity} />
            <CompactGroupsList groups={groupsActivity} />
          </div>
        )}

      </div>
    </div>
  )
}
