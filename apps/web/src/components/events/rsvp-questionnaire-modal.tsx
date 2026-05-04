'use client'

import { useState } from 'react'
import { submitQuestionAnswers, type EventQuestion } from '@/lib/actions/questionnaire'
import { X } from 'lucide-react'

type Props = {
  eventId: string
  questions: EventQuestion[]
  rsvpLabel: string
  accentColor?: string
  onConfirm: () => void
  onClose: () => void
}

export function RsvpQuestionnaireModal({
  eventId,
  questions,
  rsvpLabel,
  accentColor = '#7F77DD',
  onConfirm,
  onClose,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map(q => [q.id, '']))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = questions
    .filter(q => q.required)
    .every(q => answers[q.id]?.trim().length > 0)

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)

    const answerList = questions
      .filter(q => answers[q.id]?.trim())
      .map(q => ({ questionId: q.id, answer: answers[q.id] }))

    const { error } = await submitQuestionAnswers(eventId, answerList)
    if (error) {
      setError(error)
      setSubmitting(false)
      return
    }

    onConfirm()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#161616', borderRadius: '20px',
        border: '1px solid #2a2a2a',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px 16px',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              A couple of questions
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555' }}>
              The organiser wants to know before you RSVP {rsvpLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#2a2a2a', border: 'none', cursor: 'pointer',
              color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Questions */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {questions.map((q, i) => (
            <div key={q.id}>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 600,
                color: '#ccc', marginBottom: '6px',
              }}>
                {i + 1}. {q.question}
                {q.required && <span style={{ color: accentColor, marginLeft: '4px' }}>*</span>}
              </label>
              <input
                value={answers[q.id] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Your answer…"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '10px',
                  border: '1.5px solid #2a2a2a', background: '#1e1e1e',
                  fontSize: '14px', color: '#fff', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = accentColor)}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>
          ))}

          {error && (
            <p style={{ fontSize: '12px', color: '#f87171', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '0 20px 20px',
          display: 'flex', gap: '10px',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px',
              border: '1px solid #2a2a2a', background: 'none',
              fontSize: '14px', color: '#555', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            style={{
              flex: 2, padding: '11px', borderRadius: '10px',
              background: canSubmit ? accentColor : '#2a2a2a',
              border: 'none', color: canSubmit ? '#fff' : '#444',
              fontSize: '14px', fontWeight: 700,
              cursor: canSubmit && !submitting ? 'pointer' : 'default',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Submitting…' : `Confirm ${rsvpLabel}`}
          </button>
        </div>
      </div>
    </div>
  )
}
