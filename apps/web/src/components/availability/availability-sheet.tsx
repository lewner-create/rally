'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getWeeklyAvailability, type WeeklyAvailability } from '@/lib/actions/availability'
import { AvailabilityPickerBody } from '@/components/availability/availability-picker'

interface Props {
  isOpen:   boolean
  onClose:  () => void
  /** Accent color passed through to preset chips / save button */
  accentColor?: string
}

function defaultWeekly(): WeeklyAvailability {
  return { mon:[], tue:[], wed:[], thu:[], fri:[], sat:[], sun:[] }
}

export function AvailabilitySheet({ isOpen, onClose, accentColor = '#7F77DD' }: Props) {
  const [visible,  setVisible]  = useState(false)
  const [avail,    setAvail]    = useState<WeeklyAvailability | null>(null)
  const [loaded,   setLoaded]   = useState(false)
  const [mounted,  setMounted]  = useState(false)

  // SSR safety
  useEffect(() => { setMounted(true) }, [])

  // Animate in / out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [isOpen])

  // Load availability on first open
  useEffect(() => {
    if (!isOpen || loaded) return
    getWeeklyAvailability().then(data => {
      setAvail(data)
      setLoaded(true)
    })
  }, [isOpen, loaded])

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Keyboard close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 320)
  }, [onClose])

  const handleSaved = useCallback(() => {
    // Auto-close after the "Saved ✓" state shows
    setTimeout(handleClose, 200)
  }, [handleClose])

  if (!mounted) return null

  const sheetContent = (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.72)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Update availability"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 201,
          background: '#161616',
          borderTop: '1px solid #2a2a2a',
          borderRadius: '20px 20px 0 0',
          maxHeight: '88vh',
          overflowY: 'auto',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          // Widen on desktop so it doesn't span the full viewport width
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '9999px', background: '#2a2a2a' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#e0e0e0', margin: '0 0 2px', letterSpacing: '-.2px' }}>
              Your availability
            </h2>
            <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
              When are you typically free?
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: '#222', border: 'none', cursor: 'pointer', color: '#666', fontSize: '16px', lineHeight: 1, padding: '6px', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', transition: 'background 0.15s', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#222')}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '0 20px 8px' }}>
          {!loaded ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '13px', color: '#444' }}>Loading…</div>
            </div>
          ) : (
            <AvailabilityPickerBody
              initial={avail ?? defaultWeekly()}
              accentColor={accentColor}
              onSaved={handleSaved}
            />
          )}
        </div>

        {/* Full page link */}
        <div style={{ textAlign: 'center', padding: '8px 20px 4px' }}>
          <a
            href="/availability"
            style={{ fontSize: '12px', color: '#333', textDecoration: 'none' }}
            onClick={handleClose}
          >
            Open full availability page →
          </a>
        </div>
      </div>
    </>
  )

  // Only render when open or animating out
  if (!isOpen && !visible) return null

  return createPortal(sheetContent, document.body)
}
