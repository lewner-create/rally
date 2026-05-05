'use client'

import { useState, useTransition, useEffect } from 'react'
import { completeTour } from '@/lib/actions/tour'

const accent = '#7F77DD'

const STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to Volta!',
    body: "You're all set up. Here's a 30-second tour of how the app works — then you're on your own.",
    position: 'center' as const,
    hint: null,
  },
  {
    emoji: '👥',
    title: 'Your groups',
    body: 'Open the menu (top-left on mobile, sidebar on desktop) to see your groups. Each group has its own chat, availability grid, and plans.',
    position: 'top-left' as const,
    hint: '← Tap the menu to explore your groups',
  },
  {
    emoji: '👋',
    title: 'Start a plan',
    body: "Inside any group, choose \"Check who's in\" to poll the group, or \"Lock in a plan\" to create a confirmed event directly.",
    position: 'center' as const,
    hint: null,
  },
  {
    emoji: '🗓',
    title: 'Keep availability updated',
    body: 'The more accurate your free times, the better Volta finds windows. Go to Availability any time to update it.',
    position: 'bottom' as const,
    hint: 'Find Availability in the sidebar or menu',
  },
]

type Position = 'center' | 'top-left' | 'bottom'

function cardPosition(pos: Position, isMobile: boolean): React.CSSProperties {
  if (isMobile) {
    return {
      position: 'fixed',
      bottom: 24, left: 16, right: 16,
    }
  }
  switch (pos) {
    case 'top-left':
      return { position: 'fixed', top: 80, left: 280 }  // just right of sidebar
    case 'bottom':
      return { position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', width: 380 }
    case 'center':
    default:
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 380 }
  }
}

interface DashboardTourProps {
  onDismiss: () => void
}

export function DashboardTour({ onDismiss }: DashboardTourProps) {
  const [step, setStep] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  const finish = (skipped = false) => {
    startTransition(async () => {
      await completeTour()
      onDismiss()
    })
  }

  const next = () => {
    if (isLast) finish()
    else setStep(s => s + 1)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={() => finish(true)}
      />

      {/* Tour card */}
      <div
        style={{
          ...cardPosition(current.position, isMobile),
          zIndex: 91,
          background: '#17171a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '24px 24px 20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          maxWidth: isMobile ? undefined : 380,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 18 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 3, borderRadius: 9999,
                background: i <= step ? accent : '#2a2a2a',
                transition: 'background 0.25s',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ fontSize: 28, marginBottom: 10 }}>{current.emoji}</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#f5f4f8', letterSpacing: '-0.02em' }}>
          {current.title}
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 14, color: '#a8a4b8', lineHeight: 1.5 }}>
          {current.body}
        </p>
        {current.hint && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: accent, fontWeight: 600 }}>
            {current.hint}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 10 }}>
          <button
            onClick={() => finish(true)}
            style={{
              background: 'none', border: 'none', color: '#6b6878',
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0',
            }}
          >
            Skip tour
          </button>
          <button
            onClick={next}
            style={{
              background: accent, color: '#fff', border: 'none',
              padding: '10px 22px', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(127,119,221,0.3)',
            }}
          >
            {isLast ? 'Done!' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
