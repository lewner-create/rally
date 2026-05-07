'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

// ── Design tokens ──────────────────────────────────────────────
const T = {
  bg:          '#0f0f0f',
  bgElev:      '#17171a',
  bgElev2:     '#1c1c20',
  border:      'rgba(255,255,255,0.08)',
  borderStrong:'rgba(255,255,255,0.14)',
  text:        '#f5f4f8',
  textDim:     '#a8a4b8',
  textMute:    '#6b6878',
  violet:      '#7F77DD',
  violetSoft:  'rgba(127,119,221,0.15)',
  violetMid:   'rgba(127,119,221,0.28)',
  green:       '#5fcf8a',
  amber:       '#e8b65a',
}

const PEOPLE = [
  { name: 'Sam',    color: '#5db4e8' },
  { name: 'Alex',   color: '#e85a7d' },
  { name: 'Taylor', color: '#e8b65a' },
  { name: 'Jordan', color: '#5fcf8a' },
  { name: 'Lucas',  color: '#7F77DD' },
]

// ── useIsMobile ─────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [v, setV] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    setV(mq.matches)
    const h = (e: MediaQueryListEvent) => setV(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [bp])
  return v
}

// ── Helpers ────────────────────────────────────────────────────
function Avatar({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, border: `1.5px solid ${T.bg}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: Math.round(size * 0.4), fontWeight: 600, flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function AvatarStack({ people, size = 24 }: { people: typeof PEOPLE; size?: number }) {
  const overlap = Math.round(size * 0.3)
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {people.map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -overlap }}>
          <Avatar name={p.name} color={p.color} size={size} />
        </div>
      ))}
    </div>
  )
}

function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: color ?? T.textMute }}>
      {children}
    </div>
  )
}

// ── Availability graphic ───────────────────────────────────────
function HeroAvailabilityGraphic({ isMobile }: { isMobile: boolean }) {
  const days   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const avails = [
    { name: 'Sam',    color: '#5db4e8', avail: [1,0,1,1,0,2,2] },
    { name: 'Alex',   color: '#e85a7d', avail: [0,1,1,1,0,2,1] },
    { name: 'Taylor', color: '#e8b65a', avail: [1,1,0,1,0,2,2] },
    { name: 'Jordan', color: '#5fcf8a', avail: [0,0,1,1,1,2,1] },
    { name: 'Lucas',  color: '#7F77DD', avail: [1,1,1,0,1,2,2] },
  ]
  const cell = isMobile ? 26 : 28
  const gap  = 4

  return (
    // Outer wrapper clips the floating chat bubbles on mobile
    <div style={{ position: 'relative', padding: isMobile ? '0' : '24px 20px' }}>
      <div style={{
        position: 'relative',
        padding: '22px 18px 18px', borderRadius: 18,
        background: 'linear-gradient(160deg, #1d1640 0%, #2a1f4d 70%, #3a1e3e 100%)',
        border: '1px solid rgba(127,119,221,0.32)',
        boxShadow: '0 30px 80px -20px rgba(127,119,221,0.4)',
        overflow: isMobile ? 'hidden' : 'visible',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c96fd1' }} />
            <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>The Crew · this week</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: T.green, textTransform: 'uppercase' }}>
            ● Live
          </span>
        </div>

        {/* Scrollable grid on mobile */}
        <div style={{ overflowX: 'auto', marginBottom: 4 }}>
          <div style={{ minWidth: `${60 + 7 * cell + 6 * gap}px` }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(7, ${cell}px)`, gap, marginBottom: gap }}>
              <div />
              {days.map(d => (
                <div key={d} style={{ fontSize: 10.5, color: T.textMute, textAlign: 'center', fontWeight: 600, letterSpacing: '0.04em' }}>{d}</div>
              ))}
            </div>
            {/* Rows */}
            {avails.map(p => (
              <div key={p.name} style={{ display: 'grid', gridTemplateColumns: `60px repeat(7, ${cell}px)`, gap, marginBottom: gap }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={p.name} color={p.color} size={18} />
                  <span style={{ fontSize: 11, color: T.textDim, fontWeight: 500 }}>{p.name}</span>
                </div>
                {p.avail.map((a, ci) => {
                  const isSat = ci === 5
                  const bg = a === 2
                    ? `linear-gradient(135deg, ${T.violet}, #b66adb)`
                    : a === 1 ? `${p.color}55` : 'rgba(255,255,255,0.05)'
                  return (
                    <div key={ci} style={{
                      width: cell, height: cell, borderRadius: 5, background: bg,
                      border: isSat ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.04)',
                      boxShadow: isSat ? '0 0 12px rgba(127,119,221,0.6)' : 'none',
                    }} />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Callout */}
        <div style={{
          marginTop: 14, padding: '11px 14px', borderRadius: 12,
          background: 'rgba(127,119,221,0.18)', border: '1px solid rgba(127,119,221,0.4)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Saturday afternoon — all 5 are free</div>
            <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 1 }}>First overlap in 3 weeks. Lock it in?</div>
          </div>
          <button style={{
            background: T.violet, color: '#fff', border: 'none',
            padding: '6px 11px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
            flexShrink: 0,
          }}>Send to chat</button>
        </div>

        {/* Floating chat bubbles — desktop only */}
        {!isMobile && (
          <>
            <div style={{
              position: 'absolute', top: -18, right: -16,
              background: T.bgElev2, color: T.text, border: `1px solid ${T.border}`,
              padding: '8px 12px', borderRadius: 14, borderBottomRightRadius: 4,
              fontSize: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', gap: 6, transform: 'rotate(2deg)',
            }}>
              <Avatar name="Sam" color="#5db4e8" size={18} />
              <span>"sat works"</span>
            </div>
            <div style={{
              position: 'absolute', bottom: -14, left: -12,
              background: T.bgElev2, color: T.text, border: `1px solid ${T.border}`,
              padding: '7px 11px', borderRadius: 14, borderBottomLeftRadius: 4,
              fontSize: 11.5, boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', gap: 6, transform: 'rotate(-3deg)',
            }}>
              <Avatar name="Taylor" color="#e8b65a" size={16} />
              <span>"down"</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Step visuals ───────────────────────────────────────────────
function StepGroupViz() {
  return (
    <div style={{ borderRadius: 12, padding: 14, background: T.bg, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #c96fd1, #c96fd177)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700,
        }}>TC</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>The Crew</div>
          <div style={{ fontSize: 11, color: T.textMute }}>5 members</div>
        </div>
      </div>
      <AvatarStack people={PEOPLE} size={26} />
    </div>
  )
}

function StepAvailViz() {
  const me   = [1,1,0,1,2,2,1]
  const days = ['M','T','W','T','F','S','S']
  return (
    <div style={{ borderRadius: 12, padding: 14, background: T.bg, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, color: T.textMute, marginBottom: 8, fontWeight: 600, letterSpacing: '0.04em' }}>
        TAP TO MARK FREE
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {days.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: T.textMute, fontWeight: 600 }}>{d}</span>
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: 6,
              background: me[i] === 2 ? `linear-gradient(135deg, ${T.violet}, #b66adb)` : me[i] === 1 ? T.violetSoft : 'rgba(255,255,255,0.04)',
              border: me[i] === 2 ? '1.5px solid rgba(255,255,255,0.3)' : `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11,
            }}>
              {me[i] === 2 && '✓'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepLockViz() {
  return (
    <div style={{
      borderRadius: 12, padding: 14,
      background: 'rgba(127,119,221,0.18)', border: '1px solid rgba(127,119,221,0.35)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        
        <Eyebrow color={T.violet}>Most likely</Eyebrow>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Saturday afternoon</div>
      <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>5 of 5 free</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <AvatarStack people={PEOPLE} size={20} />
        <button style={{
          background: T.violet, color: '#fff', border: 'none',
          padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}>Lock it in</button>
      </div>
    </div>
  )
}

// ── Product thumbnails ─────────────────────────────────────────
function DashboardThumb() {
  return (
    <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}`, background: T.bg }}>
      <div style={{ height: 8, background: T.bgElev, borderBottom: `1px solid ${T.border}` }} />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          padding: '10px 12px', borderRadius: 9,
          background: 'linear-gradient(135deg, rgba(127,119,221,0.28), rgba(127,119,221,0.08))',
          border: '1px solid rgba(127,119,221,0.3)',
        }}>
          <div style={{ fontSize: 9.5, color: T.green, fontWeight: 600, marginBottom: 3 }}>● LOCKED IN</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 1 }}>Game night at Sam's</div>
          <div style={{ fontSize: 10.5, color: T.textDim }}>Tonight · 7:30 PM</div>
        </div>
        {[
          { icon: '🕐', title: "Boys Trip",       sub: 'Reply needed' },
          { icon: '✨', title: 'Cabin date poll', sub: '4 of 6 voted' },
          { icon: '🔥', title: 'On a streak',     sub: '4 hangs in 3 weeks' },
        ].map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 8,
            background: T.bgElev, border: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 12, flexShrink: 0 }}>{r.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: T.text }}>{r.title}</div>
              <div style={{ fontSize: 9, color: T.textMute }}>{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupThumb() {
  return (
    <div style={{ width: '100%', borderRadius: 10, background: T.bg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{ height: 38, position: 'relative', background: 'linear-gradient(135deg, #2a1f4d, #3a1e3e)' }}>
        <div style={{ position: 'absolute', left: 10, bottom: 5, fontSize: 10.5, fontWeight: 700, color: '#fff' }}>The Crew</div>
      </div>
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          { tag: '🔥 MOST LIKELY', day: 'Saturday', sub: '5 of 5 free', hot: true },
          { tag: 'OPEN',           day: 'Wed eve',  sub: '3 free · 2 maybe', hot: false },
        ].map((r, i) => (
          <div key={i} style={{
            padding: '7px 9px', borderRadius: 7,
            background: r.hot ? 'rgba(127,119,221,0.18)' : T.bgElev,
            border: r.hot ? '1px solid rgba(127,119,221,0.35)' : `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 8.5, color: r.hot ? T.violet : T.textMute, fontWeight: 700, letterSpacing: '0.05em' }}>{r.tag}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginTop: 1 }}>{r.day}</div>
            <div style={{ fontSize: 9, color: T.textMute }}>{r.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

type Stats = { groups: string; users: string; events: string; freeBlocks: string }

// ── Main landing page ──────────────────────────────────────────
export default function LandingPage({ stats }: { stats?: Stats }) {
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: '-apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif' }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '14px 20px' : '18px 48px',
        background: 'rgba(15,15,15,0.8)', backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${T.border}`,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: `linear-gradient(135deg, ${T.violet}, #b66adb)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, color: '#fff',
          }}>V</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: T.text }}>volta</div>
        </div>

        {/* Desktop: middle links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, color: T.textDim, fontWeight: 500 }}>
            <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>How it works</a>
            <Link href="/features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</Link>
          </div>
        )}

        {/* Desktop: auth buttons / Mobile: sign up only */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          {!isMobile && (
            <Link href="/login" style={{ fontSize: 14, color: T.textDim, textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          )}
          <Link href="/request-access" style={{
            background: T.violet, color: '#fff', textDecoration: 'none',
            padding: isMobile ? '8px 14px' : '9px 16px',
            borderRadius: 9, fontSize: isMobile ? 13 : 13.5, fontWeight: 600,
            boxShadow: '0 2px 10px rgba(127,119,221,0.3)',
            whiteSpace: 'nowrap',
          }}>Request access</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: isMobile ? '48px 20px 56px' : '72px 48px 92px' }}>
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 900,
          background: 'radial-gradient(circle, rgba(127,119,221,0.18) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'relative',
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : '1fr 460px',
          gap: isMobile ? 40 : 64,
          alignItems: 'center',
          maxWidth: 1180, margin: '0 auto',
        }}>
          {/* Copy */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 99,
              background: T.violetSoft, border: `1px solid ${T.violetMid}`,
              fontSize: 12, color: T.violet, fontWeight: 600, marginBottom: 20,
            }}>✨ Now in open beta</div>
            <h1 style={{
              margin: 0,
              fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
              fontSize: isMobile ? 42 : 64, fontWeight: 700, letterSpacing: '-0.035em',
              lineHeight: 1.02, color: T.text,
            }}>
              Find when{' '}
              <span style={{
                background: `linear-gradient(120deg, ${T.violet} 0%, #d77ad8 60%, ${T.amber} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontStyle: 'italic',
              }}>the whole crew</span>
              {' '}is free.
            </h1>
            <p style={{ margin: '20px 0 28px', fontSize: isMobile ? 16 : 19, color: T.textDim, lineHeight: 1.45 }}>
              Volta is a low-effort home base for your friend group. Drop your free times, see when everyone overlaps, lock in a hang. No more "any of yall down for…" group chats.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/request-access" style={{
                background: T.violet, color: '#fff', textDecoration: 'none',
                padding: isMobile ? '12px 18px' : '14px 22px', borderRadius: 11,
                fontSize: isMobile ? 14 : 15, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 24px rgba(127,119,221,0.4)',
              }}>Request access →</Link>
              {!isMobile && (
                <button style={{
                  background: 'rgba(255,255,255,0.06)', color: T.text,
                  border: `1px solid ${T.border}`,
                  padding: '14px 20px', borderRadius: 11, fontSize: 15, fontWeight: 500, cursor: 'pointer',
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}}>How it works</button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, fontSize: 12.5, color: T.textMute }}>
              <AvatarStack people={PEOPLE} size={22} />
              <span><b style={{ color: T.text }}>{stats?.users ?? '0'}</b> people already on Volta</span>
            </div>
          </div>
          {/* Graphic */}
          <HeroAvailabilityGraphic isMobile={isMobile} />
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{
        padding: isMobile ? '32px 20px' : '40px 48px',
        borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
        background: T.bgElev,
      }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 24 : 32,
        }}>
          {[
            { num: stats?.groups ?? '0',     label: 'friend groups',     emoji: '👯' },
            { num: stats?.events ?? '0',     label: 'hangs locked in',   emoji: '🎉' },
            { num: stats?.freeBlocks ?? '0', label: 'busy times synced', emoji: '📅' },
            { num: stats?.users ?? '0',      label: 'people on Volta',   emoji: '🙌' },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              paddingLeft: (!isMobile && i > 0) ? 24 : 0,
              borderLeft: (!isMobile && i > 0) ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{ fontSize: 14 }}>{s.emoji}</div>
              <div style={{
                fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
                fontSize: isMobile ? 28 : 36, fontWeight: 700, letterSpacing: '-0.03em', color: T.text, lineHeight: 1,
              }}>{s.num}</div>
              <div style={{ fontSize: 13.5, color: T.textMute, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding: isMobile ? '60px 20px' : '90px 48px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
            <Eyebrow>How it works</Eyebrow>
            <h2 style={{
              margin: '12px 0 0',
              fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
              fontSize: isMobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.03em', color: T.text, lineHeight: 1.05,
            }}>
              Three taps from <span style={{ fontStyle: 'italic', color: T.violet }}>"we should hang"</span>
              {isMobile ? ' ' : <br />}
              to <span style={{ fontStyle: 'italic' }}>actually hanging</span>.
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 16 : 22,
          }}>
            {[
              { n: 1, emoji: '👯', title: 'Make a group',         sub: 'The Crew, soccer guys, brunch club — whatever your friends are.',               visual: <StepGroupViz /> },
              { n: 2, emoji: '📅', title: 'Drop your free times',  sub: "Tap the hours you're around. Volta watches for overlaps with your friends.",    visual: <StepAvailViz /> },
              { n: 3, emoji: '🎉', title: 'Lock in the hang',      sub: 'Volta suggests when most of you are free. Pick a window, send it to chat, done.', visual: <StepLockViz /> },
            ].map(s => (
              <div key={s.n} style={{
                borderRadius: 18, padding: isMobile ? 22 : 28,
                background: T.bgElev, border: `1px solid ${T.border}`,
                display: 'flex', flexDirection: 'column', gap: 16,
                minHeight: isMobile ? 'auto' : 360,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: T.violetSoft, color: T.violet,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                  }}>0{s.n}</div>
                  <div style={{ fontSize: 24 }}>{s.emoji}</div>
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
                    fontSize: isMobile ? 20 : 24, fontWeight: 700, letterSpacing: '-0.02em', color: T.text,
                  }}>{s.title}</h3>
                  <p style={{ margin: '8px 0 0', fontSize: 14.5, color: T.textDim, lineHeight: 1.5 }}>{s.sub}</p>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>{s.visual}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screenshots gallery ── */}
      <section style={{
        padding: isMobile ? '60px 20px' : '90px 48px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(127,119,221,0.04) 100%)',
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 50 }}>
            <Eyebrow>The product</Eyebrow>
            <h2 style={{
              margin: '12px 0 14px',
              fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
              fontSize: isMobile ? 28 : 44, fontWeight: 700, letterSpacing: '-0.03em', color: T.text, lineHeight: 1.05,
            }}>Built for the way friends actually plan.</h2>
            <p style={{ margin: '0 auto', maxWidth: 560, fontSize: isMobile ? 15 : 16, color: T.textDim, lineHeight: 1.5 }}>
              One screen for what's happening, one for who's free, one for the chat. That's it.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
            gap: isMobile ? 16 : 22,
            alignItems: 'stretch',
          }}>
            {/* Big card */}
            <div style={{
              borderRadius: 18, padding: isMobile ? 22 : 28,
              background: T.bgElev, border: `1px solid ${T.border}`,
              display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.violet }} />
                <Eyebrow color={T.violet}>Dashboard</Eyebrow>
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
                  fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-0.02em', color: T.text, lineHeight: 1.1,
                }}>See what's happening — across every group.</h3>
                <p style={{ margin: '8px 0 0', fontSize: 14.5, color: T.textDim, lineHeight: 1.5 }}>
                  Tonight's plans, who needs an answer, which groups are quiet. All on one screen.
                </p>
              </div>
              <div style={{ marginTop: 'auto', flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                <DashboardThumb />
              </div>
            </div>

            {/* Two smaller cards */}
            <div style={{ display: 'grid', gridTemplateRows: isMobile ? 'auto auto' : '1fr 1fr', gap: isMobile ? 16 : 22 }}>
              <div style={{
                borderRadius: 18, padding: 22,
                background: T.bgElev, border: `1px solid ${T.border}`,
                display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
                  <Eyebrow color={T.green}>Group page</Eyebrow>
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
                    fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.text, lineHeight: 1.1,
                  }}>Suggested times, ranked.</h3>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>Volta finds the windows where most of you are free.</p>
                </div>
                <div style={{ marginTop: 'auto' }}><GroupThumb /></div>
              </div>

              <div style={{
                borderRadius: 18, padding: 22,
                background: T.bgElev, border: `1px solid ${T.border}`,
                display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber }} />
                  <Eyebrow color={T.amber}>Mobile</Eyebrow>
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
                    fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.text, lineHeight: 1.1,
                  }}>Your crew in your pocket.</h3>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>Drop free times in 3 taps. iOS + Android coming soon.</p>
                </div>
                <div style={{ fontSize: 32, marginTop: 'auto' }}>📱</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: isMobile ? '48px 20px' : '80px 48px', borderTop: `1px solid ${T.border}` }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          position: 'relative', overflow: 'hidden',
          borderRadius: 24, padding: isMobile ? '40px 24px' : '60px 56px',
          background: `
            radial-gradient(80% 100% at 0% 0%, rgba(127,119,221,0.4), transparent 60%),
            radial-gradient(80% 100% at 100% 100%, rgba(232,90,125,0.2), transparent 60%),
            linear-gradient(135deg, #1d1640, #2a1a3e)
          `,
          border: '1px solid rgba(127,119,221,0.4)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🎉</div>
          <h2 style={{
            margin: 0,
            fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
            fontSize: isMobile ? 30 : 48, fontWeight: 700, letterSpacing: '-0.03em', color: T.text, lineHeight: 1.05,
          }}>
            Your friends are <em>probably</em> free this weekend.
          </h2>
          <p style={{ margin: '16px auto 24px', maxWidth: 520, fontSize: isMobile ? 15 : 17, color: T.textDim, lineHeight: 1.5 }}>
            Find out for sure. Make a group, share a link, see when everyone overlaps.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/request-access" style={{
              background: T.violet, color: '#fff', textDecoration: 'none',
              padding: isMobile ? '13px 22px' : '15px 26px', borderRadius: 11,
              fontSize: isMobile ? 14 : 15.5, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(127,119,221,0.4)',
            }}>Request access →</Link>
            <Link href="/login" style={{
              background: 'rgba(255,255,255,0.08)', color: T.text,
              border: `1px solid ${T.border}`, textDecoration: 'none',
              padding: isMobile ? '13px 20px' : '15px 22px', borderRadius: 11,
              fontSize: isMobile ? 14 : 15.5, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center',
            }}>Log in</Link>
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: T.textMute }}>
            Free forever for groups up to 8 · No credit card · Web + iOS + Android coming soon
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: isMobile ? '40px 20px 32px' : '60px 48px 40px',
        borderTop: `1px solid ${T.border}`, background: T.bgElev,
      }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1.4fr 1fr 1fr 1fr',
          gap: isMobile ? 32 : 40,
        }}>
          {/* Brand col — full width on mobile */}
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: `linear-gradient(135deg, ${T.violet}, #b66adb)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16, color: '#fff',
              }}>V</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: T.text }}>volta</div>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: T.textDim, lineHeight: 1.5, maxWidth: 280 }}>
              A low-effort home base for your friend group. Find time, plan things, hang out more.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog'] },
            { title: 'Company', links: ['About', ''] },
            { title: 'Legal',   links: ['Privacy', 'Terms', 'Cookies'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: T.text,
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14,
              }}>{col.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(l => (
                  <li key={l}>
  <a href={({'Features':'/features','Pricing':'/pricing','Changelog':'/changelog','About':'/about','Privacy':'/privacy','Terms':'/terms','Cookies':'/cookies'} as Record<string,string>)[l] ?? '#'}
    style={{ fontSize: 13.5, color: T.textDim, textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
    {l}
  </a>
</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          maxWidth: 1180, margin: '32px auto 0',
          paddingTop: 24, borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          fontSize: 12, color: T.textMute,
        }}>
          <span>© 2026 Volta Labs, Inc. Made with 💜 for friend groups.</span>
          <span>Beta · Web only for now</span>
        </div>
      </footer>

    </div>
  )
}
