'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { respondToPlanCard, lockInPlanCard } from '@/lib/actions/plan-cards'
import type { PlanCard as PlanCardType, PlanCardResponseRow } from '@/lib/actions/plan-cards'

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, string> = {
  game_night: '', hangout: '', meetup: '',
  day_trip: '🗺', road_trip: '', moto_trip: '🏍', vacation: '✈',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(h: number) {
  if (h === 0)  return '12 AM'
  if (h < 12)  return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function fmtDateLine(date: string, start: string, end: string) {
  const d      = new Date(`${date}T${start}`)
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const sh     = new Date(`${date}T${start}`).getHours()
  const eh     = new Date(`${date}T${end}`).getHours()
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()} · ${fmtTime(sh)} – ${fmtTime(eh)}`
}

// ─── Avatar stack ─────────────────────────────────────────────────────────────

type AvatarProfile = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

function AvatarStack({ profiles }: { profiles: AvatarProfile[] }) {
  const shown = profiles.slice(0, 3)
  const extra = profiles.length - shown.length
  const SIZE  = 20
  return (
    <div style={{ display: 'flex' }}>
      {shown.map((p, i) => (
        <div key={p.id} style={{
          width: SIZE, height: SIZE, borderRadius: '50%',
          background:      p.avatar_url ? 'transparent' : '#7F77DD',
          backgroundImage: p.avatar_url ? `url(${p.avatar_url})` : undefined,
          backgroundSize: 'cover',
          color: 'white', fontSize: 8, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid #2a2a2a',
          marginLeft: i > 0 ? -5 : 0,
          position: 'relative', zIndex: shown.length - i, flexShrink: 0,
        }}>
          {!p.avatar_url && (p.display_name?.[0] ?? p.username?.[0] ?? '?').toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: SIZE, height: SIZE, borderRadius: '50%',
          background: '#333', color: '#aaa', fontSize: 8, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid #2a2a2a', marginLeft: -5,
          position: 'relative', flexShrink: 0,
        }}>+{extra}</div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PlanCardProps {
  planCardId:    string
  currentUserId: string
}

export function PlanCard({ planCardId, currentUserId }: PlanCardProps) {
  const router = useRouter()

  const [card,         setCard]         = useState<PlanCardType | null>(null)
  const [responses,    setResponses]    = useState<PlanCardResponseRow[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [responding,   setResponding]   = useState(false)
  const [locking,      setLocking]      = useState(false)

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [cardRes, responsesRes] = await Promise.all([
        supabase.from('plan_cards').select('*').eq('id', planCardId).single(),
        supabase
          .from('plan_card_responses')
          .select('*, profiles(id, display_name, username, avatar_url)')
          .eq('plan_card_id', planCardId),
      ])
      if (cardRes.data) {
        setCard(cardRes.data as PlanCardType)
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', cardRes.data.group_id)
        setTotalMembers(count ?? 0)
      }
      setResponses((responsesRes.data ?? []) as PlanCardResponseRow[])
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`plan-card-${planCardId}-${Date.now()}`)
      .on('postgres_changes' as any, {
        event: '*', schema: 'public',
        table: 'plan_card_responses',
        filter: `plan_card_id=eq.${planCardId}`,
      }, async () => {
        const { data } = await supabase
          .from('plan_card_responses')
          .select('*, profiles(id, display_name, username, avatar_url)')
          .eq('plan_card_id', planCardId)
        if (data) setResponses(data as PlanCardResponseRow[])
      })
      .on('postgres_changes' as any, {
        event: 'UPDATE', schema: 'public',
        table: 'plan_cards',
        filter: `id=eq.${planCardId}`,
      }, (payload: any) => {
        setCard(prev => prev ? { ...prev, ...payload.new } : null)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [planCardId])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const myResponse = responses.find(r => r.user_id === currentUserId)?.response
  const inList     = responses.filter(r => r.response === 'in')
  const maybeList  = responses.filter(r => r.response === 'maybe')
  const cantList   = responses.filter(r => r.response === 'cant')
  const inCount    = inList.length
  const isCreator  = card?.created_by === currentUserId
  const isLocked   = card?.status === 'locked'
  const threshold  = Math.max(3, Math.ceil(totalMembers * 0.5))
  const shouldLock = inCount >= threshold && !isLocked

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRespond = async (r: 'in' | 'maybe' | 'cant') => {
    if (responding || isLocked || !card) return
    setResponding(true)
    setResponses(prev => [
      ...prev.filter(x => x.user_id !== currentUserId),
      { id: 'temp', plan_card_id: planCardId, user_id: currentUserId, response: r, created_at: '' },
    ])
    await respondToPlanCard(planCardId, r)
    setResponding(false)
  }

  const handleLockIn = async () => {
    if (locking || !card) return
    setLocking(true)
    const result = await lockInPlanCard(planCardId)
    if (result.eventId) router.push(`/events/${result.eventId}`)
    else setLocking(false)
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading || !card) {
    return (
      <div style={{
        borderRadius: '14px', padding: '16px',
        background: '#161616', fontSize: '13px', color: '#555',
      }}>
        Loading plan…
      </div>
    )
  }

  const icon = EVENT_ICONS[card.event_type] ?? ''
  const toProfiles = (rows: PlanCardResponseRow[]): AvatarProfile[] =>
    rows.map(r => r.profiles ?? { id: r.user_id, display_name: null, username: null, avatar_url: null })

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100%', borderRadius: '14px', overflow: 'hidden',
      background: '#161616',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        background: isLocked
          ? 'linear-gradient(135deg, #1a6b50 0%, #134f3c 100%)'
          : 'linear-gradient(135deg, #4c4899 0%, #373580 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
          <span style={{ fontSize: '15px' }}>{icon}</span>
          <span style={{
            fontSize: '10px', fontWeight: 700, opacity: 0.7,
            textTransform: 'uppercase', letterSpacing: '.07em', color: 'white',
          }}>
            {isLocked ? 'Locked in ✓' : "Who's in?"}
          </span>
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.25, color: 'white' }}>
          {card.title}
        </p>
        {card.proposed_date && card.proposed_start && card.proposed_end && (
          <p style={{ fontSize: '12px', opacity: 0.65, margin: 0, color: 'white' }}>
            {fmtDateLine(card.proposed_date, card.proposed_start, card.proposed_end)}
          </p>
        )}
      </div>

      {/* Response tally */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '12px 14px', gap: '8px',
        borderBottom: '1px solid #222',
        background: '#1a1a1a',
      }}>
        {([
          { key: 'in',    label: 'In',    emoji: '', color: '#34d399', list: inList    },
          { key: 'maybe', label: 'Maybe', emoji: '', color: '#fbbf24', list: maybeList },
          { key: 'cant',  label: "Can't", emoji: '', color: '#666',    list: cantList  },
        ] as const).map(bucket => (
          <div key={bucket.key} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: bucket.color, margin: '0 0 5px' }}>
              {bucket.emoji} {bucket.list.length}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {bucket.list.length > 0
                ? <AvatarStack profiles={toProfiles(bucket.list)} />
                : <span style={{ fontSize: '10px', color: '#444' }}>{bucket.label}</span>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {!isLocked ? (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#161616' }}>

          {/* Response buttons */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {(['in', 'maybe', 'cant'] as const).map(r => {
              const labels = { in: "I'm in", maybe: 'Maybe', cant: "Can't" }
              const active = myResponse === r
              const activeColors = {
                in:    { bg: '#1a6b50', border: '#1a6b50' },
                maybe: { bg: '#92400e', border: '#92400e' },
                cant:  { bg: '#7f1d1d', border: '#7f1d1d' },
              }
              const ac = activeColors[r]
              return (
                <button
                  key={r}
                  onClick={() => handleRespond(r)}
                  disabled={responding}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: '9px',
                    background: active ? ac.bg : '#222',
                    color: active ? 'white' : '#888',
                    border: `1px solid ${active ? ac.border : '#2a2a2a'}`,
                    fontSize: '12px', fontWeight: 600,
                    cursor: responding ? 'default' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {labels[r]}
                </button>
              )
            })}
          </div>

          {/* Lock it in — creator only */}
          {shouldLock && isCreator && (
            <div style={{
              padding: '10px 12px', borderRadius: '10px',
              background: '#0d2e20', border: '1px solid #1a4a31',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#34d399', margin: 0 }}>
                Looks like this is happening 
              </p>
              <button
                onClick={handleLockIn}
                disabled={locking}
                style={{
                  padding: '7px 12px', borderRadius: '9999px',
                  background: '#1a6b50', color: 'white', border: 'none',
                  fontSize: '12px', fontWeight: 700,
                  cursor: locking ? 'default' : 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                {locking ? 'Locking…' : 'Lock it in →'}
              </button>
            </div>
          )}

          {shouldLock && !isCreator && (
            <p style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, textAlign: 'center', margin: 0 }}>
              {inCount} people are in — waiting for the organiser
            </p>
          )}
        </div>
      ) : (
        /* Locked footer */
        <div style={{
          padding: '12px 16px', background: '#161616',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#34d399', margin: 0 }}>
            This is happening! 
          </p>
          {card.event_id && (
            <a
              href={`/events/${card.event_id}`}
              style={{ fontSize: '12px', fontWeight: 700, color: '#7F77DD', textDecoration: 'none' }}
            >
              View plan →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
