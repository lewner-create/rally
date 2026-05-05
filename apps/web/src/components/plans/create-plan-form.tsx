'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { postCheckWhosIn } from '@/lib/actions/plan-cards'

const EVENT_TYPES = [
  { value: 'hangout',    label: 'Hangout',    emoji: '🛋️' },
  { value: 'game_night', label: 'Game night', emoji: '🎮' },
  { value: 'day_trip',   label: 'Day trip',   emoji: '🚗' },
  { value: 'road_trip',  label: 'Road trip',  emoji: '🛣️' },
  { value: 'vacation',   label: 'Vacation',   emoji: '✈️' },
  { value: 'meetup',     label: 'Meetup',     emoji: '👋' },
  { value: 'moto_trip',  label: 'Moto trip',  emoji: '🏍️' },
] as const

// ── Quick date helpers ────────────────────────────────────────────
function todayDate() {
  return new Date().toISOString().split('T')[0]
}
function tomorrowDate() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
function weekendDate() {
  const d   = new Date()
  const day = d.getDay()           // 0=Sun, 6=Sat
  const diff = day === 6 ? 7 : (6 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}
function weekendLabel() {
  const d = new Date(weekendDate())
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function tomorrowLabel() {
  const d = new Date(tomorrowDate())
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ── Auto-name suggestion ─────────────────────────────────────────
function buildSuggestion(type: string, when: 'tonight' | 'tomorrow' | 'weekend' | 'custom'): string {
  const label = EVENT_TYPES.find(t => t.value === type)?.label ?? 'Hangout'
  switch (when) {
    case 'tonight':  return `${label} tonight`
    case 'tomorrow': return `${label} tomorrow`
    case 'weekend':  return `${label} this weekend`
    default:         return label
  }
}

type Props = { groupId: string; groupName: string; themeColor: string }

// ── Success screen ───────────────────────────────────────────────
function SuccessScreen({ groupName, groupId, accent, onContinue }: {
  groupName: string
  groupId: string
  accent: string
  onContinue: () => void
}) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    const r = setTimeout(onContinue, 3000)
    return () => { clearInterval(t); clearTimeout(r) }
  }, [onContinue])

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', flexDirection: 'column', textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 20, lineHeight: 1 }}>🎉</div>
      <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>
        It's out there!
      </h2>
      <p style={{ margin: '0 0 8px', fontSize: 16, color: '#888', lineHeight: 1.5 }}>
        Your plan card is live in <strong style={{ color: '#fff' }}>{groupName}</strong>.
      </p>
      <p style={{ margin: '0 0 36px', fontSize: 14, color: '#555' }}>
        The group will see it in chat and can say yes, maybe, or can't.
      </p>
      <button
        onClick={onContinue}
        style={{
          background: accent, color: '#fff', border: 'none',
          padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 16px rgba(127,119,221,0.35)',
        }}
      >
        See who's in →
      </button>
      <p style={{ marginTop: 14, fontSize: 12, color: '#333' }}>
        Redirecting in {countdown}…
      </p>
    </div>
  )
}

// ── Main form ────────────────────────────────────────────────────
export default function CreatePlanForm({ groupId, groupName, themeColor }: Props) {
  const router  = useRouter()
  const accent  = themeColor

  // Date/time state
  const [when, setWhen]           = useState<'tonight' | 'tomorrow' | 'weekend' | 'custom'>('tonight')
  const [showCustom, setShowCustom] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime]     = useState('')

  // Type state
  const [eventType, setEventType] = useState<typeof EVENT_TYPES[number]['value']>('hangout')

  // Name state — tracks whether user has manually edited it
  const [nameDirty, setNameDirty]   = useState(false)
  const [title, setTitle]           = useState(buildSuggestion('hangout', 'tonight'))

  // Sync suggestion when type/when changes, unless user has typed their own name
  useEffect(() => {
    if (!nameDirty) {
      setTitle(buildSuggestion(eventType, when))
    }
  }, [eventType, when, nameDirty])

  const [sent, setSent]             = useState(false)
  const [pending, startTransition]  = useTransition()

  function resolvedDate() {
    if (when === 'tonight')  return todayDate()
    if (when === 'tomorrow') return tomorrowDate()
    if (when === 'weekend')  return weekendDate()
    return customDate || undefined
  }

  function handleSubmit() {
    const finalTitle = title.trim() || buildSuggestion(eventType, when)
    startTransition(async () => {
      const result = await postCheckWhosIn({
        groupId,
        title: finalTitle,
        eventType: eventType as any,
        proposedDate:  resolvedDate(),
        proposedStart: when === 'tonight' ? '19:00' : startTime || undefined,
        proposedEnd:   when === 'tonight' ? '22:00' : endTime   || undefined,
      })
      if (result?.error) {
        console.error(result.error)
        return
      }
      setSent(true)
    })
  }

  if (sent) {
    return (
      <SuccessScreen
        groupName={groupName}
        groupId={groupId}
        accent={accent}
        onContinue={() => router.push(`/groups/${groupId}`)}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Back */}
        <a href={`/groups/${groupId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', textDecoration: 'none', marginBottom: 28 }}>
          ← {groupName}
        </a>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          Check who's in
        </h1>
        <p style={{ fontSize: 14, color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
          Throw it out to the group — they can say yes, maybe, or suggest another time.
        </p>

        {/* ── WHEN? ── */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>When?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
            {([
              { key: 'tonight',  line1: 'Tonight',      line2: '7 – 10 PM' },
              { key: 'tomorrow', line1: 'Tomorrow',     line2: tomorrowLabel() },
              { key: 'weekend',  line1: 'This weekend', line2: `Sat ${weekendLabel()}` },
            ] as const).map(opt => {
              const on = when === opt.key
              return (
                <button key={opt.key} onClick={() => { setWhen(opt.key); setShowCustom(false) }} style={{ padding: '12px 8px', borderRadius: 12, border: `1px solid ${on ? accent + '55' : '#222'}`, background: on ? `${accent}18` : '#161616', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all .12s' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: on ? '#fff' : '#aaa' }}>{opt.line1}</span>
                  <span style={{ fontSize: 11, color: on ? accent : '#444' }}>{opt.line2}</span>
                </button>
              )
            })}
          </div>
          <button
            onClick={() => { setShowCustom(v => !v); if (!showCustom) setWhen('custom') }}
            style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1px solid #222', background: when === 'custom' ? `${accent}18` : '#161616', color: when === 'custom' ? accent : '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Pick a specific time
          </button>
          {showCustom && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} style={{ ...inputStyle, gridColumn: '1 / -1', colorScheme: 'dark' }} />
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="Start" style={{ ...inputStyle, colorScheme: 'dark' }} />
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="End" style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
          )}
        </div>

        {/* ── WHAT'S THE PLAN? ── */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>What's the plan? <span style={{ color: '#444', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EVENT_TYPES.map(t => {
              const on = eventType === t.value
              return (
                <button key={t.value} onClick={() => setEventType(t.value)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9999, border: `1px solid ${on ? accent + '55' : '#222'}`, background: on ? `${accent}18` : '#161616', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
                  <span style={{ fontSize: 16 }}>{t.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: on ? 600 : 400, color: on ? accent : '#888' }}>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── NAME — auto-suggested, editable ── */}
        <div style={{ marginBottom: 32 }}>
          <label style={labelStyle}>Give it a name <span style={{ color: '#444', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <div style={{ position: 'relative' }}>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setNameDirty(true) }}
              placeholder={buildSuggestion(eventType, when)}
              style={{ ...inputStyle, paddingRight: nameDirty ? 36 : 14 }}
              onFocus={e => (e.target.style.borderColor = accent)}
              onBlur={e  => (e.target.style.borderColor = '#222')}
            />
            {/* Clear button to restore suggestion */}
            {nameDirty && (
              <button
                onClick={() => { setTitle(buildSuggestion(eventType, when)); setNameDirty(false) }}
                title="Use suggestion"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, padding: 2, lineHeight: 1 }}
              >✕</button>
            )}
          </div>
          {!nameDirty && (
            <p style={{ fontSize: 12, color: '#444', marginTop: 6 }}>
              Leave blank and we'll use the placeholder above.
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={pending}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: accent, color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: pending ? 'default' : 'pointer',
            fontFamily: 'inherit', opacity: pending ? 0.7 : 1,
            transition: 'opacity .15s',
            boxShadow: '0 4px 16px rgba(127,119,221,0.3)',
          }}
        >
          {pending ? 'Sending to group…' : 'Check who\'s in →'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#333', marginTop: 10 }}>
          The group will be able to say yes, maybe, or suggest another time.
        </p>

      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid #222', background: '#161616', color: '#fff',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color .15s',
}
