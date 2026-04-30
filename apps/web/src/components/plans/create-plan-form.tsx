'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postCheckWhosIn } from '@/lib/actions/plan-cards'

const ACCENT = '#7F77DD'

const EVENT_TYPES = [
  { value: 'hangout',    label: 'Hangout',    emoji: '🛋️' },
  { value: 'game_night', label: 'Game night', emoji: '🎮' },
  { value: 'day_trip',   label: 'Day trip',   emoji: '🚗' },
  { value: 'road_trip',  label: 'Road trip',  emoji: '🛣️' },
  { value: 'vacation',   label: 'Vacation',   emoji: '✈️' },
  { value: 'meetup',     label: 'Meetup',     emoji: '👋' },
  { value: 'moto_trip',  label: 'Moto trip',  emoji: '🏍️' },
] as const

// ── Quick time picks ──────────────────────────────────────────────────────────

function getQuickTimes() {
  const now     = new Date()
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const pad     = (n: number) => String(n).padStart(2, '0')
  const fmt     = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  // Next Saturday
  const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7
  const saturday     = new Date(today); saturday.setDate(today.getDate() + daysUntilSat)

  return [
    {
      id:    'tonight',
      label: 'Tonight',
      date:  fmt(today),
      start: '19:00',
      end:   '22:00',
      desc:  '7 – 10 PM',
    },
    {
      id:    'tomorrow',
      label: 'Tomorrow',
      date:  fmt(tomorrow),
      start: '18:00',
      end:   '21:00',
      desc:  `${tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
    },
    {
      id:    'weekend',
      label: 'This weekend',
      date:  fmt(saturday),
      start: '14:00',
      end:   '20:00',
      desc:  `Sat ${saturday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    },
  ]
}

// Auto-generate a title if user leaves it blank
function autoTitle(eventType: string, quickId: string | null): string {
  const typeLabel: Record<string, string> = {
    hangout:    'Hangout',
    game_night: 'Game night',
    day_trip:   'Day trip',
    road_trip:  'Road trip',
    vacation:   'Trip',
    meetup:     'Meetup',
    moto_trip:  'Ride',
  }
  const base = typeLabel[eventType] ?? 'Plan'
  if (quickId === 'tonight')  return `${base} tonight`
  if (quickId === 'tomorrow') return `${base} tomorrow`
  if (quickId === 'weekend')  return `${base} this weekend`
  return base
}

type Props = {
  groupId: string
  groupName: string
  themeColor: string
}

export default function CreatePlanForm({ groupId, groupName, themeColor }: Props) {
  const router = useRouter()
  const accent = themeColor || ACCENT

  const QUICK_TIMES = getQuickTimes()

  const [selectedQuick, setSelectedQuick] = useState<string | null>('tonight')
  const [showCustomTime, setShowCustomTime] = useState(false)
  const [eventType, setEventType]   = useState('hangout')
  const [title, setTitle]           = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]   = useState('')
  const [pending, startTransition]  = useTransition()

  const quick = QUICK_TIMES.find(q => q.id === selectedQuick)

  const resolvedDate  = showCustomTime ? customDate  : quick?.date  ?? ''
  const resolvedStart = showCustomTime ? customStart : quick?.start ?? ''
  const resolvedEnd   = showCustomTime ? customEnd   : quick?.end   ?? ''

  function handleQuickPick(id: string) {
    setSelectedQuick(id)
    setShowCustomTime(false)
  }

  function handleCustomTime() {
    setSelectedQuick(null)
    setShowCustomTime(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      const finalTitle = title.trim() || autoTitle(eventType, selectedQuick)
      const result = await postCheckWhosIn({
        groupId,
        title: finalTitle,
        eventType: eventType as any,
        proposedDate:  resolvedDate  || undefined,
        proposedStart: resolvedStart || undefined,
        proposedEnd:   resolvedEnd   || undefined,
      })
      if (result?.error) {
        console.error(result.error)
        return
      }
      router.push(`/groups/${groupId}`)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back */}
        <a
          href={`/groups/${groupId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555', textDecoration: 'none', marginBottom: '32px' }}
        >
          ← {groupName}
        </a>

        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-.3px' }}>
          Check who's in
        </h1>
        <p style={{ fontSize: '13px', color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
          Throw it out to the group — they can say yes, maybe, or suggest another time.
        </p>

        {/* ── Quick time picks ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={sectionLabel}>When?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
            {QUICK_TIMES.map(q => {
              const on = selectedQuick === q.id && !showCustomTime
              return (
                <button
                  key={q.id}
                  onClick={() => handleQuickPick(q.id)}
                  style={{
                    padding: '14px 10px', borderRadius: '12px',
                    border: `1px solid ${on ? `${accent}55` : '#222'}`,
                    background: on ? `${accent}14` : '#161616',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    transition: 'all .12s',
                    transform: on ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 700, color: on ? '#fff' : '#ccc' }}>
                    {q.label}
                  </span>
                  <span style={{ fontSize: '11px', color: on ? `${accent}bb` : '#444' }}>
                    {q.desc}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Pick a time */}
          <button
            onClick={handleCustomTime}
            style={{
              width: '100%', padding: '11px', borderRadius: '12px',
              border: `1px solid ${showCustomTime ? `${accent}55` : '#222'}`,
              background: showCustomTime ? `${accent}10` : '#161616',
              color: showCustomTime ? '#c4bff5' : '#555',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .12s',
            }}
          >
            {showCustomTime ? 'Custom time selected' : '+ Pick a specific time'}
          </button>

          {showCustomTime && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px' }}>
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                style={{ ...inputStyle, gridColumn: '1 / -1', colorScheme: 'dark' }}
              />
              <input
                type="time"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
              <input
                type="time"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
              <div />
            </div>
          )}
        </div>

        {/* ── What kind of plan? ── */}
        <div style={{ marginBottom: '24px' }}>
          <p style={sectionLabel}>What's the plan? <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#333' }}>(optional)</span></p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {EVENT_TYPES.map(t => {
              const on = eventType === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setEventType(t.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 14px', borderRadius: '9999px',
                    border: `1px solid ${on ? `${accent}55` : '#222'}`,
                    background: on ? `${accent}12` : '#161616',
                    color: on ? '#c4bff5' : '#555',
                    fontSize: '13px', fontWeight: on ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .12s',
                  }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{t.emoji}</span>
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Name (optional) ── */}
        <div style={{ marginBottom: '32px' }}>
          <p style={sectionLabel}>Give it a name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#333' }}>(optional)</span></p>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={autoTitle(eventType, selectedQuick)}
            style={inputStyle}
          />
          <p style={{ fontSize: '11px', color: '#333', marginTop: '6px' }}>
            Leave blank and we'll use the placeholder above.
          </p>
        </div>

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          disabled={pending}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: pending ? '#1a1a1a' : accent,
            color: pending ? '#333' : '#fff',
            fontSize: '15px', fontWeight: 700,
            cursor: pending ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'background .15s',
            letterSpacing: '-.1px',
            boxShadow: pending ? 'none' : `0 4px 16px ${accent}44`,
          }}
        >
          {pending ? 'Sending to group…' : "Check who's in →"}
        </button>

        <p style={{ fontSize: '12px', color: '#333', textAlign: 'center', marginTop: '12px' }}>
          The group will be able to say yes, maybe, or suggest another time.
        </p>

      </div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px',
  margin: '0 0 10px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid #222', background: '#161616',
  color: '#fff', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color .15s',
}
