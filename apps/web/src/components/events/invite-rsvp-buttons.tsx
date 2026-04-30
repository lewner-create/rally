'use client'

import { useState, useTransition } from 'react'
import { upsertRsvp } from '@/lib/actions/events'
import Link from 'next/link'

interface InviteRsvpButtonsProps {
  eventId: string
  eventUrl: string
}

const OPTIONS = [
  { status: 'yes'   as const, label: '✓ Going',   color: '#1D9E75', confirm: "You're going! 🎉" },
  { status: 'maybe' as const, label: '? Maybe',    color: '#666',    confirm: "Marked as maybe"   },
  { status: 'no'    as const, label: "✕ Can't",   color: '#D85A30', confirm: "Maybe next time"    },
]

export function InviteRsvpButtons({ eventId, eventUrl }: InviteRsvpButtonsProps) {
  const [selected, setSelected]   = useState<string | null>(null)
  const [confirm, setConfirm]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRsvp = (status: 'yes' | 'maybe' | 'no') => {
    if (isPending || selected === status) return
    setSelected(status)
    const opt = OPTIONS.find(o => o.status === status)
    startTransition(async () => {
      await upsertRsvp(eventId, status)
      setConfirm(opt?.confirm ?? 'Saved!')
    })
  }

  if (confirm) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '32px', marginBottom: '12px',
          animation: 'none',
        }}>
          {selected === 'yes' ? '🎉' : selected === 'maybe' ? '🤔' : '😢'}
        </div>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
          {confirm}
        </p>
        <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 20px' }}>
          Your RSVP has been saved.
        </p>
        <Link href={eventUrl} style={{
          display: 'block', width: '100%', padding: '13px 24px',
          borderRadius: '9999px', background: '#7F77DD', color: 'white',
          textDecoration: 'none', fontWeight: 700, fontSize: '15px',
          boxShadow: '0 4px 20px rgba(127,119,221,0.4)',
          textAlign: 'center', boxSizing: 'border-box',
        }}>
          View event →
        </Link>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', textAlign: 'center' }}>
        Are you going?
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {OPTIONS.map(opt => (
          <button
            key={opt.status}
            onClick={() => handleRsvp(opt.status)}
            disabled={isPending}
            style={{
              flex: 1, padding: '12px 8px', borderRadius: '12px',
              border: selected === opt.status ? `2px solid ${opt.color}` : '2px solid #e5e5e5',
              background: selected === opt.status ? `${opt.color}12` : 'white',
              fontSize: '13px', fontWeight: 700,
              color: selected === opt.status ? opt.color : '#555',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending && selected !== opt.status ? 0.5 : 1,
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {isPending && selected === opt.status ? '...' : opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
