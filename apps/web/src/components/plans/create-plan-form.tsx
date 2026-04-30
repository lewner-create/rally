'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postCheckWhosIn } from '@/lib/actions/plan-cards'

const EVENT_TYPES = [
  { value: 'hangout',    label: 'Hangout',       emoji: '🛋️' },
  { value: 'game_night', label: 'Game night',    emoji: '🎮' },
  { value: 'day_trip',   label: 'Day trip',      emoji: '🚗' },
  { value: 'road_trip',  label: 'Road trip',     emoji: '🛣️' },
  { value: 'vacation',   label: 'Vacation',      emoji: '✈️' },
  { value: 'meetup',     label: 'Meetup',        emoji: '👋' },
  { value: 'moto_trip',  label: 'Moto trip',     emoji: '🏍️' },
] as const

type Props = {
  groupId: string
  groupName: string
  themeColor: string
}

export default function CreatePlanForm({ groupId, groupName, themeColor }: Props) {
  const router = useRouter()
  const [title, setTitle]           = useState('')
  const [eventType, setEventType]   = useState('hangout')
  const [date, setDate]             = useState('')
  const [startTime, setStartTime]   = useState('')
  const [endTime, setEndTime]       = useState('')
  const [pending, startTransition]  = useTransition()

  const accent = themeColor

  function handleSubmit() {
    if (!title.trim()) return
    startTransition(async () => {
      const result = await postCheckWhosIn({
        groupId,
        title: title.trim(),
        eventType: eventType as any,
        proposedDate: date || undefined,
        proposedStart: startTime || undefined,
        proposedEnd: endTime || undefined,
      })
      if (result?.error) {
        console.error(result.error)
      }
      router.push(`/groups/${groupId}`)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back */}
        <a
          href={`/groups/${groupId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555', textDecoration: 'none', marginBottom: '28px' }}
        >
          ← {groupName}
        </a>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-.3px' }}>
          Start a plan
        </h1>
        <p style={{ fontSize: '13px', color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
          Send it to the group and see who's in.
        </p>

        {/* Plan name */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Plan name</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Saturday night hang, Weekend trip to the mountains…"
            autoFocus
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Event type */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>What kind of plan?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {EVENT_TYPES.map(t => {
              const on = eventType === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setEventType(t.value)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    border: `1px solid ${on ? accent + '55' : '#222'}`,
                    background: on ? accent + '12' : '#161616',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all .12s',
                    fontFamily: 'inherit',
                    transform: on ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.emoji}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: on ? accent : '#555', textAlign: 'center', lineHeight: 1.2 }}>
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date + time (optional) */}
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>Proposed time <span style={{ color: '#333', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, gridColumn: '1 / -1', colorScheme: 'dark' }}
            />
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              placeholder="Start"
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              placeholder="End"
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
            <div /> {/* spacer */}
          </div>
          <p style={{ fontSize: '11px', color: '#333', marginTop: '8px' }}>
            Not sure yet? Skip this — the group can figure it out.
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || pending}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: title.trim() ? accent : '#1a1a1a',
            color: title.trim() ? '#fff' : '#333',
            border: 'none',
            fontSize: '15px',
            fontWeight: 700,
            cursor: title.trim() && !pending ? 'pointer' : 'default',
            fontFamily: 'inherit',
            transition: 'background .15s, color .15s',
            letterSpacing: '-.1px',
          }}
        >
          {pending ? 'Sending to group…' : 'Check who\'s in →'}
        </button>

      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#555',
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  marginBottom: '10px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #222',
  background: '#161616',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .15s',
}
