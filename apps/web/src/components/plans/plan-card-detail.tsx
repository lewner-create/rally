'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import { respondToPlanCard, lockInPlanCard } from '@/lib/actions/plan-cards'

// ─── Types ────────────────────────────────────────────────────────────────────

type Response = {
  user_id: string
  response: 'in' | 'maybe' | 'cant'
  profiles: { id: string; display_name: string | null; username: string; avatar_url: string | null } | null
}

type Card = {
  id: string
  title: string
  event_type: string
  proposed_date: string | null
  proposed_start: string | null
  proposed_end: string | null
  status: 'open' | 'locked'
  event_id: string | null
  created_by: string
  group_id: string
  groups: { id: string; name: string; slug: string; theme_color: string | null } | null
}

type Member = {
  id: string
  display_name: string | null
  username: string
  avatar_url: string | null
}

type Props = {
  card: Card
  responses: Response[]
  members: Member[]
  currentUserId: string
  isCreator: boolean
  userResponse: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_META: Record<string, { emoji: string; label: string; gradient: string }> = {
  vacation:   { emoji: '✈',  label: 'Vacation',   gradient: 'linear-gradient(135deg, #001a2d, #003a5c)' },
  day_trip:   { emoji: '🗺',  label: 'Day trip',   gradient: 'linear-gradient(135deg, #0d2010, #1a4020)' },
  road_trip:  { emoji: '',  label: 'Road trip',  gradient: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' },
  game_night: { emoji: '',  label: 'Game night', gradient: 'linear-gradient(135deg, #1a1040, #2d1f6e)' },
  hangout:    { emoji: '',  label: 'Hangout',    gradient: 'linear-gradient(135deg, #1a1208, #3d2b10)' },
  meetup:     { emoji: '',  label: 'Meetup',     gradient: 'linear-gradient(135deg, #0d1f2d, #1a3a4a)' },
  moto_trip:  { emoji: '🏍',  label: 'Moto trip',  gradient: 'linear-gradient(135deg, #2d0f00, #4a1a00)' },
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

function Avatar({ member, size = 8 }: { member: Member; size?: number }) {
  const initials = (member.display_name ?? member.username).charAt(0).toUpperCase()
  const px = size * 4
  return (
    <div
      style={{ width: px, height: px, borderRadius: '50%' }}
      className="bg-[#2a2a2a] overflow-hidden flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
      title={member.display_name ?? member.username}
    >
      {member.avatar_url
        ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
        : initials
      }
    </div>
  )
}

// ─── Confetti canvas ─────────────────────────────────────────────────────────

type Particle = {
  x: number; y: number
  vx: number; vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
  shape: 'rect' | 'circle'
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = ['#7F77DD', '#22c55e', '#eab308', '#ec4899', '#3b82f6', '#f97316', '#06b6d4', '#a855f7']

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -40 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: 2.5 + Math.random() * 3.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 7,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 0.85 + Math.random() * 0.15,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))

    let frame: number
    let running = true
    const startTime = Date.now()

    const animate = () => {
      if (!running) return
      const elapsed = Date.now() - startTime
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fade out after 3s
      const globalOpacity = elapsed > 3000
        ? Math.max(0, 1 - (elapsed - 3000) / 1200)
        : 1

      if (globalOpacity <= 0) { running = false; return }

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.vy += 0.05 // gravity

        // Reset when off screen
        if (p.y > canvas.height + 20) {
          p.y = -20
          p.x = Math.random() * canvas.width
          p.vy = 2.5 + Math.random() * 3.5
        }

        ctx.save()
        ctx.globalAlpha = p.opacity * globalOpacity
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6)
        }
        ctx.restore()
      })

      frame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  )
}

// ─── Locked screen ────────────────────────────────────────────────────────────

function LockedScreen({ card, responses, accent }: {
  card: Card
  responses: Response[]
  accent: string
}) {
  const [visible, setVisible] = useState(false)
  const typeMeta = EVENT_TYPE_META[card.event_type] ?? { emoji: '', label: card.event_type, gradient: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' }

  const inResponses = responses.filter(r => r.response === 'in')

  useEffect(() => {
    // Stagger in after a tick so CSS transition fires
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <>
      <ConfettiCanvas />

      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#0a0a0a' }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.95)',
            opacity: visible ? 1 : 0,
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
          }}
        >
          {/* Celebration header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                fontSize: '64px',
                lineHeight: 1,
                marginBottom: '12px',
                display: 'inline-block',
                transform: visible ? 'rotate(0deg) scale(1)' : 'rotate(-20deg) scale(0.5)',
                transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
              }}
            >
              
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'white',
                margin: '0 0 6px',
                letterSpacing: '-0.5px',
              }}
            >
              It's happening!
            </h1>
            <p style={{ fontSize: '15px', color: '#555', margin: 0 }}>
              Plan locked in — time to get excited
            </p>
          </div>

          {/* Event summary card */}
          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '16px',
              position: 'relative',
            }}
          >
            {/* Type gradient bg */}
            <div style={{ position: 'absolute', inset: 0, background: typeMeta.gradient }} />
            {/* Accent glow */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '180px', height: '180px', borderRadius: '50%',
              background: accent, opacity: 0.15, filter: 'blur(40px)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', padding: '24px' }}>
              {/* Type pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 11px', borderRadius: '9999px',
                background: 'rgba(255,255,255,0.12)',
                fontSize: '11px', fontWeight: 700,
                color: 'rgba(255,255,255,0.75)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: '14px',
              }}>
                {typeMeta.emoji} {typeMeta.label}
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '22px', fontWeight: 800, color: 'white',
                margin: '0 0 14px', letterSpacing: '-0.3px', lineHeight: 1.2,
              }}>
                {card.title}
              </h2>

              {/* Date / time */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
                {card.proposed_date && (
                  <p style={{
                    fontSize: '14px', color: 'rgba(255,255,255,0.8)',
                    margin: 0, display: 'flex', alignItems: 'center', gap: '7px',
                  }}>
                    <span style={{ opacity: 0.6 }}></span>
                    {formatDate(card.proposed_date)}
                  </p>
                )}
                {card.proposed_start && (
                  <p style={{
                    fontSize: '13px', color: 'rgba(255,255,255,0.55)',
                    margin: 0, display: 'flex', alignItems: 'center', gap: '7px',
                  }}>
                    <span style={{ opacity: 0.5 }}></span>
                    {formatTime(card.proposed_start)}
                    {card.proposed_end && ` – ${formatTime(card.proposed_end)}`}
                  </p>
                )}
              </div>

              {/* Who's in */}
              {inResponses.length > 0 && (
                <div>
                  <p style={{
                    fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px',
                  }}>
                    Who's in · {inResponses.length}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Avatar stack */}
                    <div style={{ display: 'flex', marginRight: '2px' }}>
                      {inResponses.slice(0, 6).map((r, i) => {
                        const p = r.profiles
                        const initials = ((p?.display_name ?? p?.username ?? '?')).charAt(0).toUpperCase()
                        return (
                          <div
                            key={r.user_id}
                            title={p?.display_name ?? p?.username ?? ''}
                            style={{
                              width: 32, height: 32,
                              borderRadius: '50%',
                              border: '2px solid rgba(0,0,0,0.3)',
                              marginLeft: i === 0 ? 0 : -10,
                              overflow: 'hidden',
                              background: '#2a2a2a',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 700, color: 'white',
                              flexShrink: 0,
                              zIndex: inResponses.length - i,
                            }}
                          >
                            {p?.avatar_url
                              ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : initials
                            }
                          </div>
                        )
                      })}
                    </div>
                    {/* Names */}
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                      {inResponses
                        .slice(0, 3)
                        .map(r => r.profiles?.display_name ?? r.profiles?.username ?? 'Someone')
                        .join(', ')}
                      {inResponses.length > 3 && ` +${inResponses.length - 3} more`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          {card.event_id && (
            <Link
              href={`/events/${card.event_id}`}
              style={{
                display: 'block', width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: accent,
                border: 'none',
                color: 'white',
                fontSize: '15px', fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: `0 6px 28px ${accent}50`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 36px ${accent}70`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 6px 28px ${accent}50`
              }}
            >
              See the plan →
            </Link>
          )}

          {/* Back link */}
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <Link
              href={`/groups/${card.group_id}`}
              style={{ fontSize: '13px', color: '#444', textDecoration: 'none' }}
            >
              ← Back to group
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Response bucket ──────────────────────────────────────────────────────────

function ResponseBucket({
  label, emoji, color, responses, members,
}: {
  label: string
  emoji: string
  color: string
  responses: Response[]
  members: Member[]
}) {
  if (responses.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
          {label} · {responses.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {responses.map((r) => {
          const p = r.profiles
          if (!p) return null
          const m = members.find((m) => m.id === r.user_id) ?? p
          return (
            <div key={r.user_id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#1a1a1a' }}>
              <Avatar member={m} size={6} />
              <span className="text-sm text-white">{p.display_name ?? p.username}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlanCardDetail({
  card, responses: initialResponses, members, currentUserId, isCreator, userResponse: initialUserResponse,
}: Props) {
  const [responses, setResponses]       = useState(initialResponses)
  const [userResponse, setUserResponse] = useState(initialUserResponse)
  const [locking, startLock]            = useTransition()
  const [responding, startRespond]      = useTransition()

  const accent = (card.groups as any)?.theme_color ?? '#6366f1'
  const typeMeta = EVENT_TYPE_META[card.event_type] ?? { emoji: '', label: card.event_type, gradient: '' }

  const inCount    = responses.filter((r) => r.response === 'in').length
  const maybeCount = responses.filter((r) => r.response === 'maybe').length
  const cantCount  = responses.filter((r) => r.response === 'cant').length
  const total      = responses.length

  const canLockIn = isCreator && card.status === 'open' && (inCount >= 2 || (total > 0 && inCount / total >= 0.5))

  function handleRespond(response: 'in' | 'maybe' | 'cant') {
    startRespond(async () => {
      await respondToPlanCard(card.id, response)
      setUserResponse(response)
      setResponses((prev) => {
        const filtered = prev.filter((r) => r.user_id !== currentUserId)
        const me = members.find((m) => m.id === currentUserId)
        return [...filtered, {
          user_id: currentUserId,
          response,
          profiles: me ? { id: me.id, display_name: me.display_name, username: me.username, avatar_url: me.avatar_url } : null,
        }]
      })
    })
  }

  function handleLockIn() {
    startLock(async () => {
      await lockInPlanCard(card.id)
      // lockInPlanCard redirects to the event page
    })
  }

  // ── Locked state: celebratory screen ─────────────────────────────────────
  if (card.status === 'locked' && card.event_id) {
    return (
      <LockedScreen
        card={card}
        responses={responses}
        accent={accent}
      />
    )
  }

  // ── Active / open state ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-lg mx-auto px-4 py-8 pb-24">

        {/* Back */}
        <Link
          href={`/groups/${card.group_id}`}
          className="inline-flex items-center gap-1.5 text-[#555] text-sm hover:text-white transition-colors mb-6"
        >
          ← {(card.groups as any)?.name ?? 'Back'}
        </Link>

        {/* Hero */}
        <div
          className="rounded-2xl p-5 mb-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accent}22 0%, #1a1a1a 65%)`,
            border: `1px solid ${accent}30`,
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
            style={{ background: accent }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{typeMeta.emoji}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
                {typeMeta.label} · checking who's in
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mb-3">{card.title}</h1>
            {(card.proposed_date || card.proposed_start) && (
              <div className="flex flex-wrap gap-3 text-sm text-[#aaa]">
                {card.proposed_date && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#555]"></span>
                    {formatDate(card.proposed_date)}
                  </span>
                )}
                {card.proposed_start && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#555]"></span>
                    {formatTime(card.proposed_start)}
                    {card.proposed_end && ` – ${formatTime(card.proposed_end)}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Response buttons */}
        {card.status === 'open' && (
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">
              Are you in?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'in',    label: "I'm in",   emoji: '', color: '#22c55e' },
                { value: 'maybe', label: 'Maybe',    emoji: '', color: '#eab308' },
                { value: 'cant',  label: "Can't",    emoji: '', color: '#ef4444' },
              ] as const).map((opt) => {
                const isSelected = userResponse === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleRespond(opt.value)}
                    disabled={responding}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isSelected ? `${opt.color}22` : '#1a1a1a',
                      border: `1px solid ${isSelected ? opt.color + '66' : '#252525'}`,
                    }}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: isSelected ? opt.color : '#aaa' }}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Response summary bar */}
        {total > 0 && (
          <div className="mb-6">
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
              {inCount > 0    && <div className="bg-emerald-500 rounded-full" style={{ width: `${(inCount / total) * 100}%` }} />}
              {maybeCount > 0 && <div className="bg-yellow-500 rounded-full" style={{ width: `${(maybeCount / total) * 100}%` }} />}
              {cantCount > 0  && <div className="bg-[#333] rounded-full" style={{ width: `${(cantCount / total) * 100}%` }} />}
            </div>

            <div className="space-y-4">
              <ResponseBucket
                label="In"    emoji="" color="#22c55e"
                responses={responses.filter((r) => r.response === 'in')}
                members={members}
              />
              <ResponseBucket
                label="Maybe" emoji="" color="#eab308"
                responses={responses.filter((r) => r.response === 'maybe')}
                members={members}
              />
              <ResponseBucket
                label="Can't" emoji="" color="#ef4444"
                responses={responses.filter((r) => r.response === 'cant')}
                members={members}
              />
            </div>
          </div>
        )}

        {total === 0 && (
          <div
            className="rounded-xl p-6 text-center mb-6"
            style={{ background: '#161616', border: '1px dashed #222' }}
          >
            <p className="text-[#444] text-sm">No responses yet — be the first</p>
          </div>
        )}

        {/* Lock in button */}
        {canLockIn && (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              background: `linear-gradient(135deg, ${accent}20 0%, #1a1a1a 60%)`,
              border: `1px solid ${accent}44`,
            }}
          >
            <p className="text-sm font-semibold text-white mb-1">
              {inCount} {inCount === 1 ? 'person is' : 'people are'} in 
            </p>
            <p className="text-[#666] text-xs mb-4">
              Looks good — lock it in to create the plan.
            </p>
            <button
              onClick={handleLockIn}
              disabled={locking}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: accent }}
            >
              {locking ? 'Locking in…' : 'Lock it in →'}
            </button>
          </div>
        )}

        {/* Waiting state for non-creator */}
        {!isCreator && card.status === 'open' && (
          <p className="text-center text-[#444] text-xs mt-4">
            Waiting for {(card.groups as any)?.name ?? 'the group'} to lock this in
          </p>
        )}
      </div>
    </div>
  )
}
