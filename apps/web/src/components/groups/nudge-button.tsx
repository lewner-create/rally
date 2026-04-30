'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { postCheckWhosIn } from '@/lib/actions/plan-cards'
import type { EventType } from '@/lib/actions/events'

const EVENT_TYPES = [
  { id: 'game_night' as EventType, label: 'Game night', icon: '🎮', free: true  },
  { id: 'hangout'    as EventType, label: 'Hangout',    icon: '☕', free: true  },
  { id: 'day_trip'   as EventType, label: 'Day trip',   icon: '🗺️', free: false },
  { id: 'road_trip'  as EventType, label: 'Road trip',  icon: '🚗', free: false },
]

export interface NudgeButtonProps {
  groupId: string
  windowDate?:      string  // ISO date "2025-04-25"
  windowStart?:     string  // "18:00"
  windowEnd?:       string  // "21:00"
  windowLabel?:     string  // "Friday evening · Apr 25"
  windowTimeLabel?: string  // "6 PM – 9 PM"
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
  const [pos,          setPos]          = useState({ top: 0, left: 0 })

  const btnRef    = useRef<HTMLButtonElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r  = btnRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const pw = step === 'popover' ? 288 : 182
    const left = r.left + pw > vw - 12 ? Math.max(12, vw - pw - 12) : r.left
    setPos({ top: r.bottom + 6, left })
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

  const selectType = (t: typeof EVENT_TYPES[number]) => {
    if (!t.free) return
    setSelectedType(t.id)
    setTitle(windowLabel ? '' : t.label)
    setStep('popover')
    requestAnimationFrame(() => updatePos())
  }

  // ── Post plan card to group chat ───────────────────────────────────────────
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
        eventType:     selectedType,
        proposedDate:  date,
        proposedStart: start,
        proposedEnd:   end,
      })

      if (result.error) {
        console.error(result.error)
        setLoading(false)
        return
      }

      setStep('sent')
      setTimeout(() => {
        setStep('idle')
        setTitle('')
        setNote('')
        setSelectedType(null)
      }, 1800)
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
          ? '0 4px 16px rgba(29,158,117,0.4)'
          : '0 4px 20px rgba(127,119,221,0.45)',
        transition: 'background 0.2s, box-shadow 0.2s',
        whiteSpace: 'nowrap', fontFamily: 'inherit',
      }}
    >
      <span>👋</span>
      <span>{isSent ? 'Sent to chat ✓' : "Check who's in"}</span>
      {!isSent && <span style={{ fontSize: '9px', opacity: 0.7, marginLeft: 2 }}>▾</span>}
    </button>
  )

  // ── Event type dropdown ────────────────────────────────────────────────────
  const dropdownEl = step === 'dropdown' && (
    <div
      ref={portalRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left,
        zIndex: 9999, background: 'white', borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        padding: '6px', minWidth: '176px',
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
            textAlign: 'left', fontSize: '14px',
            color: t.free ? '#111' : '#c0c0c0',
            fontFamily: 'inherit', transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (t.free) (e.currentTarget).style.background = '#f4f3ff' }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'none' }}
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
        zIndex: 9999, background: 'white', borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        padding: '18px', width: '288px',
      }}
    >
      {/* Plan name */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Plan name</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={windowLabel ? `e.g. Game night, Hangout…` : 'Name your plan…'}
          autoFocus
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#7F77DD')}
          onBlur={e  => (e.target.style.borderColor = '#e5e5e5')}
        />
      </div>

      {/* Time window pill */}
      {windowLabel && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 10px', borderRadius: '8px',
          background: '#f4f3ff', fontSize: '13px', color: '#5a5490',
          marginBottom: '12px', fontWeight: 500,
        }}>
          <span>📅</span>
          <span>{windowLabel}</span>
          {windowTimeLabel && (
            <span style={{ color: '#9b97cc' }}>· {windowTimeLabel}</span>
          )}
        </div>
      )}

      {/* Note */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Note (optional)</label>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Bring snacks, BYOB…"
          style={{ ...inputStyle, color: '#555' }}
          onFocus={e => (e.target.style.borderColor = '#7F77DD')}
          onBlur={e  => (e.target.style.borderColor = '#e5e5e5')}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setStep('dropdown')}
          style={{
            flex: 1, padding: '9px 0', borderRadius: '9px',
            border: '1.5px solid #e5e5e5', background: 'none',
            fontSize: '13px', color: '#666', cursor: 'pointer', fontFamily: 'inherit',
          }}
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
            boxShadow: '0 2px 10px rgba(127,119,221,0.35)',
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
      {typeof document !== 'undefined' && portalContent
        ? createPortal(portalContent, document.body)
        : null}
    </>
  )
}

// ─── Style constants ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#999',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: '9px',
  border: '1.5px solid #e5e5e5', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  background: 'white', color: '#111', transition: 'border-color 0.15s',
}
