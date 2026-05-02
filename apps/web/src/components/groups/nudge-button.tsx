'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { postCheckWhosIn } from '@/lib/actions/plan-cards'
import type { EventType } from '@/lib/actions/events'

const EVENT_TYPES: Array<{ id: EventType; label: string; icon: string }> = [
  { id: 'game_night', label: 'Game night', icon: '🎮' },
  { id: 'hangout',    label: 'Hangout',    icon: '☕' },
  { id: 'meetup',     label: 'Meetup',     icon: '🤝' },
  { id: 'day_trip',   label: 'Day trip',   icon: '🗺️' },
  { id: 'road_trip',  label: 'Road trip',  icon: '🚗' },
  { id: 'moto_trip',  label: 'Moto trip',  icon: '🏍️' },
  { id: 'vacation',   label: 'Vacation',   icon: '✈️' },
]

export interface NudgeButtonProps {
  groupId: string
  windowDate?:      string  // "2025-04-25"
  windowStart?:     string  // "18:00"
  windowEnd?:       string  // "21:00"
  windowLabel?:     string  // "Friday evening · Apr 25"
  windowTimeLabel?: string  // "6 PM – 9 PM"
}

// idle → fork → type_picker → popover → sent
type Step = 'idle' | 'fork' | 'type_picker' | 'popover' | 'sent'

// Which path did they choose at the fork?
type Path = 'happening' | 'whos_in' | null

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
  const [path,         setPath]         = useState<Path>(null)
  const [selectedType, setSelectedType] = useState<EventType | null>(null)
  const [title,        setTitle]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [pos,          setPos]          = useState({ top: 0, left: 0, alignRight: false })

  const btnRef    = useRef<HTMLButtonElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  // ── Positioning ────────────────────────────────────────────────────────────
  const PANEL_WIDTH = 292

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r   = btnRef.current.getBoundingClientRect()
    const vw  = window.innerWidth
    const alignRight = r.left + PANEL_WIDTH > vw - 12
    const left = alignRight ? Math.max(12, r.right - PANEL_WIDTH) : r.left
    setPos({ top: r.bottom + 8, left, alignRight })
  }, [])

  useEffect(() => {
    if (step === 'idle') return
    updatePos()
    window.addEventListener('resize',  updatePos)
    window.addEventListener('scroll',  updatePos, true)
    return () => {
      window.removeEventListener('resize',  updatePos)
      window.removeEventListener('scroll',  updatePos, true)
    }
  }, [step, updatePos])

  useEffect(() => {
    if (step === 'idle') return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !portalRef.current?.contains(t)) setStep('idle')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [step])

  const reset = () => {
    setStep('idle'); setPath(null); setSelectedType(null); setTitle('')
  }

  // ── "It's happening" → prefill event form ─────────────────────────────────
  const handleHappening = (type: EventType) => {
    const params = new URLSearchParams()
    params.set('type', type)
    if (windowDate)  params.set('date',  windowDate)
    if (windowStart) params.set('start', windowStart)
    if (windowEnd)   params.set('end',   windowEnd)
    setStep('idle')
    router.push(`/groups/${groupId}/events/new?${params.toString()}`)
  }

  // ── "Check who's in" → post plan card ─────────────────────────────────────
  const handleCheckWhosIn = async () => {
    if (!selectedType || !title.trim()) return
    setLoading(true)
    try {
      const result = await postCheckWhosIn({
        groupId,
        title:         title.trim(),
        eventType:     selectedType,
        proposedDate:  windowDate  ?? new Date().toISOString().split('T')[0],
        proposedStart: windowStart ?? '18:00',
        proposedEnd:   windowEnd   ?? '21:00',
      })
      if (result.error) { console.error(result.error); setLoading(false); return }
      setStep('sent')
      setTimeout(reset, 1800)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const isSent = step === 'sent'

  // ── Trigger button ─────────────────────────────────────────────────────────
  const btnEl = (
    <button
      ref={btnRef}
      onClick={() => {
        if (step === 'idle') { updatePos(); setStep('fork') }
        else if (step !== 'sent') reset()
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 18px', borderRadius: '9999px',
        background: isSent ? '#1D9E75' : '#7F77DD',
        color: 'white', border: 'none', cursor: 'pointer',
        fontSize: '14px', fontWeight: 600,
        boxShadow: isSent
          ? '0 4px 16px rgba(29,158,117,0.4)'
          : '0 4px 20px rgba(127,119,221,0.45)',
        transition: 'background 0.2s, box-shadow 0.2s',
        whiteSpace: 'nowrap', fontFamily: 'inherit',
      }}
    >
      <span>👋</span>
      <span>{isSent ? 'Sent ✓' : "Check who's in"}</span>
      {!isSent && <span style={{ fontSize: '9px', opacity: 0.65, marginLeft: 2 }}>▾</span>}
    </button>
  )

  // ── Shared panel shell ─────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    position: 'fixed', top: pos.top, left: pos.left,
    zIndex: 9999, width: PANEL_WIDTH,
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  }

  // ── Window context pill (shared) ───────────────────────────────────────────
  const windowPill = windowLabel ? (
    <div style={{
      margin: '0 14px 12px',
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '7px 10px', borderRadius: '9px',
      background: '#252525', fontSize: '12px', color: '#aaa', fontWeight: 500,
    }}>
      <span>📅</span>
      <span>{windowLabel}</span>
      {windowTimeLabel && <span style={{ color: '#555' }}>· {windowTimeLabel}</span>}
    </div>
  ) : null

  // ── Step: fork ─────────────────────────────────────────────────────────────
  const forkEl = step === 'fork' && (
    <div ref={portalRef} style={panelStyle}>
      <div style={{ padding: '14px 14px 4px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 12px' }}>
          How do you want to kick it off?
        </p>
        {windowPill}
      </div>

      <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* It's happening */}
        <button
          onClick={() => { setPath('happening'); setStep('type_picker'); requestAnimationFrame(updatePos) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '12px', border: 'none',
            background: 'rgba(127,119,221,0.15)',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            width: '100%', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(127,119,221,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(127,119,221,0.15)')}
        >
          <span style={{ fontSize: '22px', flexShrink: 0 }}>📅</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#c4c0f5', marginBottom: '2px' }}>It's happening</div>
            <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.4 }}>Create the event &amp; invite</div>
          </div>
        </button>

        {/* Check who's in */}
        <button
          onClick={() => { setPath('whos_in'); setStep('type_picker'); requestAnimationFrame(updatePos) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '12px',
            border: '1px solid #252525', background: '#222',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            width: '100%', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
          onMouseLeave={e => (e.currentTarget.style.background = '#222')}
        >
          <span style={{ fontSize: '22px', flexShrink: 0 }}>👋</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e0e0e0', marginBottom: '2px' }}>Check who's in</div>
            <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.4 }}>Poll the group first</div>
          </div>
        </button>
      </div>
    </div>
  )

  // ── Step: type picker ──────────────────────────────────────────────────────
  const typePickerEl = step === 'type_picker' && (
    <div ref={portalRef} style={panelStyle}>
      <div style={{ padding: '14px 14px 4px' }}>
        <button
          onClick={() => setStep('fork')}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '13px', padding: '0 0 8px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          ← Back
        </button>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 10px' }}>
          {path === 'happening' ? 'What kind of event?' : 'What type of plan?'}
        </p>
      </div>

      <div style={{ padding: '0 6px 10px' }}>
        {EVENT_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => {
              if (path === 'happening') {
                handleHappening(t.id)
              } else {
                setSelectedType(t.id)
                setTitle('')
                setStep('popover')
                requestAnimationFrame(updatePos)
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '9px 10px', borderRadius: '9px',
              background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left', fontSize: '14px', color: '#e0e0e0',
              fontFamily: 'inherit', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Step: "check who's in" details popover ─────────────────────────────────
  const popoverEl = step === 'popover' && (
    <div ref={portalRef} style={panelStyle}>
      <div style={{ padding: '14px 14px 0' }}>
        <button
          onClick={() => setStep('type_picker')}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '13px', padding: '0 0 10px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          ← Back
        </button>

        {/* Plan name */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Plan name</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Name your plan…"
            autoFocus
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#7F77DD')}
            onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
          />
        </div>

        {windowPill}
      </div>

      <div style={{ padding: '0 14px 14px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setStep('type_picker')}
          style={{ flex: 1, padding: '9px 0', borderRadius: '9px', border: '1.5px solid #2a2a2a', background: 'none', fontSize: '13px', color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Back
        </button>
        <button
          onClick={handleCheckWhosIn}
          disabled={loading || !title.trim()}
          style={{
            flex: 2, padding: '9px 0', borderRadius: '9px',
            background: '#7F77DD', border: 'none', color: 'white',
            fontSize: '13px', fontWeight: 700,
            cursor: loading || !title.trim() ? 'default' : 'pointer',
            opacity: !title.trim() ? 0.5 : 1,
            transition: 'opacity 0.15s',
            boxShadow: '0 2px 10px rgba(127,119,221,0.4)',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Posting…' : "Send to group →"}
        </button>
      </div>
    </div>
  )

  const portalContent = forkEl || typePickerEl || popoverEl

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
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: '9px',
  border: '1.5px solid #2a2a2a', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  background: '#111', color: '#e0e0e0', transition: 'border-color 0.15s',
}
