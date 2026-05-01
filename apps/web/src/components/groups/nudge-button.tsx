'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { postCheckWhosIn } from '@/lib/actions/plan-cards'
import type { EventType } from '@/lib/actions/events'

const EVENT_TYPES = [
  { id: 'game_night' as EventType, label: 'Game night', icon: '🎮', free: true  },
  { id: 'hangout'    as EventType, label: 'Hangout',    icon: '🛋️', free: true  },
  { id: 'day_trip'   as EventType, label: 'Day trip',   icon: '🚗', free: false },
  { id: 'road_trip'  as EventType, label: 'Road trip',  icon: '🛣️', free: false },
]

export interface NudgeButtonProps {
  groupId:          string
  windowDate?:      string
  windowStart?:     string
  windowEnd?:       string
  windowLabel?:     string
  windowTimeLabel?: string
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
  const [step,         setStep]         = useState<Step>('idle')
  const [selectedType, setSelectedType] = useState<EventType | null>(null)
  const [title,        setTitle]        = useState('')
  const [note,         setNote]         = useState('')
  const [loading,      setLoading]      = useState(false)
  const [pos,          setPos]          = useState({ top: 0, left: 0, width: 0 })
  const [mounted,      setMounted]      = useState(false)

  const btnRef    = useRef<HTMLButtonElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  // Wait for client mount before portal renders
  useEffect(() => { setMounted(true) }, [])

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r   = btnRef.current.getBoundingClientRect()
    const vw  = window.innerWidth
    const pw  = step === 'popover' ? 292 : 188
    // Prefer left-aligned with button; flip left if would overflow viewport
    const left = r.right - pw < 0
      ? Math.max(8, r.left)
      : r.right + pw > vw - 8
        ? Math.max(8, vw - pw - 8)
        : r.left
    setPos({ top: r.bottom + 8, left, width: pw })
  }, [step])

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

  // Close on outside click
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

  const selectType = (t: typeof EVENT_TYPES[number]) => {
    if (!t.free) return
    setSelectedType(t.id)
    setTitle(windowLabel ? '' : t.label)
    setStep('popover')
    requestAnimationFrame(updatePos)
  }

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
      setTimeout(() => {
        setStep('idle'); setTitle(''); setNote(''); setSelectedType(null)
      }, 1800)
    } catch (err) {
      console.error(err); setLoading(false)
    }
  }

  const isSent = step === 'sent'

  // ── Trigger button ─────────────────────────────────────────────────────────
  const btnEl = (
    <button
      ref={btnRef}
      onClick={() => {
        if (step === 'idle') { updatePos(); setStep('dropdown') }
        else if (step !== 'sent') setStep('idle')
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', borderRadius: '9999px',
        background: isSent ? '#1a6b50' : 'rgba(255,255,255,0.18)',
        color: 'white', border: isSent ? 'none' : '1px solid rgba(255,255,255,0.25)',
        cursor: 'pointer', fontSize: '13px', fontWeight: 600,
        transition: 'background 0.2s',
        whiteSpace: 'nowrap', fontFamily: 'inherit',
        backdropFilter: 'blur(4px)',
      }}
      onMouseEnter={e => { if (!isSent) e.currentTarget.style.background = 'rgba(255,255,255,0.26)' }}
      onMouseLeave={e => { if (!isSent) e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
    >
      <span>👋</span>
      <span>{isSent ? 'Sent ✓' : "Check who's in"}</span>
      {!isSent && <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: 1 }}>▾</span>}
    </button>
  )

  // ── Event type dropdown ────────────────────────────────────────────────────
  const dropdownEl = step === 'dropdown' && (
    <div
      ref={portalRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left,
        zIndex: 9999, width: `${pos.width}px`,
        background: '#1a1a1a', borderRadius: '12px',
        border: '1px solid #2a2a2a',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '6px',
      }}
    >
      {EVENT_TYPES.map(t => (
        <button
          key={t.id}
          onClick={() => selectType(t)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '9px 12px', borderRadius: '8px',
            background: 'none', border: 'none',
            cursor: t.free ? 'pointer' : 'default',
            textAlign: 'left', fontSize: '13px',
            color: t.free ? '#e0e0e0' : '#444',
            fontFamily: 'inherit', transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (t.free) e.currentTarget.style.background = '#252525' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          <span style={{ fontSize: '16px' }}>{t.icon}</span>
          <span style={{ flex: 1 }}>{t.label}</span>
          {!t.free && (
            <span style={{ fontSize: '11px', color: '#7F77DD', fontWeight: 700 }}>Boost</span>
          )}
        </button>
      ))}
    </div>
  )

  // ── Plan details popover ───────────────────────────────────────────────────
  const popoverEl = step === 'popover' && (
    <div
      ref={portalRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left,
        zIndex: 9999, width: `${pos.width}px`,
        background: '#1a1a1a', borderRadius: '16px',
        border: '1px solid #2a2a2a',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '16px',
      }}
    >
      {/* Plan name */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Plan name</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={windowLabel ? 'e.g. Game night, Hangout…' : 'Name your plan…'}
          autoFocus
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#7F77DD')}
          onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
          onKeyDown={e => e.key === 'Enter' && handleCheckWhosIn()}
        />
      </div>

      {/* Time window pill */}
      {windowLabel && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 10px', borderRadius: '8px',
          background: '#7F77DD18', border: '1px solid #7F77DD33',
          fontSize: '12px', color: '#9b97dd',
          marginBottom: '12px', fontWeight: 500,
        }}>
          <span>📅</span>
          <span>{windowLabel}</span>
          {windowTimeLabel && (
            <span style={{ color: '#666' }}>· {windowTimeLabel}</span>
          )}
        </div>
      )}

      {/* Note */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Note <span style={{ color: '#333', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Bring snacks, BYOB…"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#7F77DD')}
          onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setStep('dropdown')}
          style={{
            flex: 1, padding: '9px 0', borderRadius: '9px',
            border: '1px solid #2a2a2a', background: 'none',
            fontSize: '13px', color: '#666', cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#222'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          Back
        </button>
        <button
          onClick={handleCheckWhosIn}
          disabled={loading || !title.trim()}
          style={{
            flex: 2, padding: '9px 0', borderRadius: '9px',
            background: title.trim() ? '#7F77DD' : '#222',
            border: 'none', color: title.trim() ? 'white' : '#444',
            fontSize: '13px', fontWeight: 700,
            cursor: loading || !title.trim() ? 'default' : 'pointer',
            transition: 'background 0.15s, color 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Posting…' : "Check who's in →"}
        </button>
      </div>
    </div>
  )

  const portalContent = dropdownEl || popoverEl

  return (
    <>
      {btnEl}
      {mounted && portalContent
        ? createPortal(portalContent, document.body)
        : null}
    </>
  )
}

// ─── Style constants ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: '9px',
  border: '1px solid #2a2a2a', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  background: '#111', color: '#e0e0e0', transition: 'border-color 0.15s',
}
