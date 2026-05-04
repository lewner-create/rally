'use client'

import { useState, useTransition } from 'react'
import { upsertRsvp } from '@/lib/actions/events'
import { RsvpQuestionnaireModal } from './rsvp-questionnaire-modal'
import type { EventQuestion } from '@/lib/actions/questionnaire'

type RsvpStatus = 'yes' | 'maybe' | 'no'

const OPTIONS = [
  { value: 'yes'   as const, label: "I'm in",  emoji: '✅', color: '#22c55e' },
  { value: 'maybe' as const, label: 'Maybe',   emoji: '🤔', color: '#eab308' },
  { value: 'no'    as const, label: "Can't",   emoji: '❌', color: '#ef4444' },
]

export default function RsvpSection({
  eventId,
  currentRsvp,
  questions = [],
  hasAnswered = false,
  accentColor = '#7F77DD',
}: {
  eventId: string
  currentRsvp: string | null
  questions?: EventQuestion[]
  hasAnswered?: boolean
  accentColor?: string
}) {
  const [status, setStatus]       = useState<RsvpStatus | null>(currentRsvp as RsvpStatus)
  const [pending, startTransition] = useTransition()
  const [modalRsvp, setModalRsvp]  = useState<'yes' | 'maybe' | null>(null)

  const needsQuestionnaire = questions.length > 0 && !hasAnswered

  function handleRsvp(value: RsvpStatus) {
    // "Can't" — skip questionnaire
    if (value === 'no' || !needsQuestionnaire) {
      commitRsvp(value)
      return
    }
    // yes/maybe with unanswered questions — show modal
    setModalRsvp(value)
  }

  function commitRsvp(value: RsvpStatus) {
    startTransition(async () => {
      await upsertRsvp(eventId, value)
      setStatus(value)
    })
  }

  function handleModalConfirm() {
    if (!modalRsvp) return
    setModalRsvp(null)
    commitRsvp(modalRsvp)
  }

  const modalOption = OPTIONS.find(o => o.value === modalRsvp)

  return (
    <>
      <div>
        <p style={{
          fontSize: '11px', fontWeight: 700, color: '#555',
          textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px',
        }}>
          Are you going?
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {OPTIONS.map((opt) => {
            const on = status === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleRsvp(opt.value)}
                disabled={pending}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: '10px',
                  border: `1px solid ${on ? opt.color + '66' : '#222'}`,
                  background: on ? `${opt.color}18` : '#161616',
                  cursor: pending ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  transition: 'all .12s', fontFamily: 'inherit',
                  transform: on ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: '18px' }}>{opt.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: on ? opt.color : '#555' }}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>

        {needsQuestionnaire && !status && (
          <p style={{ fontSize: '11px', color: '#555', marginTop: '8px' }}>
            ✦ The organiser has a couple of questions for you when you RSVP
          </p>
        )}
      </div>

      {modalRsvp && modalOption && (
        <RsvpQuestionnaireModal
          eventId={eventId}
          questions={questions}
          rsvpLabel={modalOption.label}
          accentColor={accentColor}
          onConfirm={handleModalConfirm}
          onClose={() => setModalRsvp(null)}
        />
      )}
    </>
  )
}
