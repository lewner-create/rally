'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { postCheckWhosIn } from '@/lib/actions/plan-cards'
import type { EventType } from '@/lib/actions/events'

const EVENT_TYPES: { id: EventType; label: string; icon: string }[] = [
  { id: 'game_night', label: 'Game night', icon: '🎮' },
  { id: 'hangout',    label: 'Hangout',    icon: '☕' },
  { id: 'meetup',     label: 'Meetup',     icon: '👋' },
  { id: 'day_trip',   label: 'Day trip',   icon: '🗺️' },
  { id: 'road_trip',  label: 'Road trip',  icon: '🚗' },
  { id: 'moto_trip',  label: 'Moto trip',  icon: '🏍️' },
  { id: 'vacation',   label: 'Vacation',   icon: '✈️' },
]

export interface NudgeButtonProps {
  groupId:          string
  windowDate?:      string   // "2025-04-25"
  windowStart?:     string   // "18:00"
  windowEnd?:       string   // "21:00"
  windowLabel?:     string   // "Friday evening · Apr 25"
  windowTimeLabel?: string   // "6 PM – 9 PM"
}

type Step = 'idle' | 'dropdown' | 'popover' | 'sent'

export function NudgeButton({
  groupId,
  windowDate,
  windowStart,
  windowEnd,
  windowLabel,
  windowTimeLabel,
}: NudgeButtonProps) {
  const router = useRouter()

  const [step,         setStep]         = useState<Step>('idle')
  const [selectedType, setSelectedType] = useState<(typeof EVENT_TYPES)[number] | null>(null)
  const [title,        setTitle]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [createdCardId, setCreatedCardId] = useState<string | null>(null)
  const [pos,          setPos]          = useState({ top: 0, left: 0 })

  const btnRef    = useRef<HTMLButtonElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r  = btnRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const pw = step === 'popover' ? 296 : 200
    const left = r.left + pw > vw - 12 ? Math.max(12, vw - pw - 12) : r.left
    setPos({ top: r.bottom + 8, left })
  }, [step])

  useEffect(() => {
    if (step === 'idle') return
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [step, updatePos])

  useEffect(() => {
    if (step === 'idle') return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !portalRef.current?.contains(t)) {
        setStep('idle')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [step])

  const selectType = (t: (typeof EVENT_TYPES)[number]) => {
    setSelectedType(t)
    setTitle('')
    setStep('popover')
    requestAnimationFrame(() => updatePos())
  }

  // ── Post plan card + notification ─────────────────────────────────────────
  const handleCheckWhosIn = async () => {
    if (!selectedType || !title.trim()) return
    setLoading(true)
    try {
      const date  = windowDate  ?? new Date().toISOString().split('T')[0]
      const start = windowStart ?? '18:00'
      const end   = windowEnd   ?? '21:00'

      const result = await postCheckWhosIn({
        groupId,
        title:         title.trim(),
        eventType:     selectedType.id,
        proposedDate:  date,
        proposedStart: start,
        proposedEnd:   end,
      })

      if (result.error) {
        console.error(result.error)
        setLoading(false)
        return
      }

      setCreatedCardId(result.id ?? null)
      setStep('sent')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Navigate to event creation form pre-filled with current plan details
  const handleCreateEvent = () => {
    const date  = windowDate  ?? new Date().toISOString().split('T')[0]
    const start = windowStart ?? '18:00'
    const end   = windowEnd   ?? '21:00'
    const type  = selectedType?.id ?? 'hangout'
    const name  = encodeURIComponent(title.trim())
    router.push(
      `/groups/${groupId}/events/new?title=${name}&type=${type}&date=${date}&start=${start}&end=${end}`
    )
    setStep('idle')
  }

  const isSent = step === 'sent'

  // ── Trigger button ────────────────────────────────────────────────────────
  const btnEl = (
    <button
      ref={btnRef}
      onClick={() => {
        if (step === 'idle') { updatePos(); setStep('dropdown') }
        else if (step !== 'sent') setStep('idle')
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 18px', borderRadius: '9999px',
        background: isSent ? '#1D9E75' : '#7F77DD',
        color: 'white', border: 'none', cursor: 'pointer',
        fontSize: '14px', fontWeight: 600,
        boxShadow: isSent
          ? '0 4px 16px rgba(29,158,117,0.35)'
          : '0 4px 20px rgba(127,119,221,0.4)',
        transition: 'background 0.2s, box-shadow 0.2s',
        whiteSpace: 'nowrap', fontFamily: 'inherit',
      }}
    >
      <span>👋</span>
      <span>{isSent ? 'Posted to chat ✓' : "Check who's in"}</span>
      {!isSent && <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: 2 }}>▾</span>}
    </button>
  )

  // ── Event type dropdown ───────────────────────────────────────────────────
  const dropdownEl = step === 'dropdown' && (
    <div
      ref={portalRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
        background: '#1a1a1a', borderRadius: '14px',
        border: '1px solid #2a2a2a',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
        padding: '6px', minWidth: '196px',
      }}
    >
      <p style={{
        fontSize: '10px', fontWeight: 700, color: '#444',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        margin: '4px 10px 6px',
      }}>
        What kind of plan?
      </p>
      {EVENT_TYPES.map(t => (
        <button
          key={t.id}
          onClick={() => selectType(t)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '8px 10px', borderRadius: '9px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontSize: '14px', color: '#ccc',
            fontFamily: 'inherit', transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#252525'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = '#ccc'
          }}
        >
          <span style={{ fontSize: '16px', width: '22px', textAlign: 'center', flexShrink: 0 }}>
            {t.icon}
          </span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  )

  // ── Plan details popover ──────────────────────────────────────────────────
  const popoverEl = (step === 'popover' || step === 'sent') && (
    <div
      ref={portalRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
        background: '#1a1a1a', borderRadius: '18px',
        border: '1px solid #2a2a2a',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
        padding: '18px', width: '296px',
      }}
    >
      {step === 'sent' ? (
        /* ── Sent confirmation ── */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#1D9E7522', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '18px', flexShrink: 0,
            }}>
              ✓
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>
                Posted to chat!
              </p>
              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                Members can now vote in the group chat.
              </p>
            </div>
          </div>

          {/* Set details CTA */}
          <button
            onClick={handleCreateEvent}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px',
              background: 'rgba(127,119,221,0.12)', border: '1px solid rgba(127,119,221,0.25)',
              color: '#7F77DD', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(127,119,221,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(127,119,221,0.12)')}
          >
            <span>📋</span> Set event details →
          </button>

          <button
            onClick={() => { setStep('idle'); setTitle(''); setSelectedType(null) }}
            style={{
              width: '100%', padding: '8px', marginTop: '6px', borderRadius: '10px',
              background: 'none', border: 'none', color: '#444',
              fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Done
          </button>
        </div>
      ) : (
        /* ── Plan name form ── */
        <>
          {/* Type indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '20px' }}>{selectedType?.icon}</span>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
              {selectedType?.label}
            </p>
            <button
              onClick={() => setStep('dropdown')}
              style={{
                marginLeft: 'auto', fontSize: '11px', color: '#444',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', padding: '2px 6px', borderRadius: '6px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >
              change
            </button>
          </div>

          {/* Plan name input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Plan name</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && title.trim()) handleCheckWhosIn() }}
              placeholder={`e.g. ${selectedType?.label ?? 'Plan name'}…`}
              autoFocus
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#7F77DD')}
              onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
            />
          </div>

          {/* Window pill */}
          {windowLabel && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 10px', borderRadius: '9px',
              background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.2)',
              fontSize: '12px', color: '#9b97cc', marginBottom: '14px', fontWeight: 500,
            }}>
              <span>📅</span>
              <span>{windowLabel}</span>
              {windowTimeLabel && (
                <span style={{ color: '#5a5490' }}>· {windowTimeLabel}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={handleCheckWhosIn}
              disabled={loading || !title.trim()}
              style={{
                width: '100%', padding: '10px 0', borderRadius: '10px',
                background: title.trim() ? '#7F77DD' : '#252525',
                border: 'none', color: title.trim() ? 'white' : '#444',
                fontSize: '14px', fontWeight: 700,
                cursor: loading || !title.trim() ? 'default' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
                boxShadow: title.trim() ? '0 2px 12px rgba(127,119,221,0.35)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Posting…' : "👋 Check who's in"}
            </button>

            <button
              onClick={handleCreateEvent}
              disabled={!title.trim()}
              style={{
                width: '100%', padding: '8px 0', borderRadius: '10px',
                background: 'none', border: '1px solid #2a2a2a',
                color: title.trim() ? '#666' : '#333',
                fontSize: '13px', cursor: title.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit', transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (title.trim()) { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#aaa' }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = title.trim() ? '#666' : '#333' }}
            >
              Create event directly →
            </button>
          </div>
        </>
      )}
    </div>
  )

  const portalContent = dropdownEl || popoverEl

  return (
    <>
      {btnEl}
      {typeof document !== 'undefined' && portalContent
        ? createPortal(portalContent, document.body)
        : null}
    </>
  )
}

// ─── Style constants ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '10px',
  border: '1.5px solid #2a2a2a', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  background: '#111', color: '#e0e0e0', transition: 'border-color 0.15s',
}
