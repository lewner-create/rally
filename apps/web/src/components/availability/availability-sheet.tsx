'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getWeeklyAvailability, type WeeklyAvailability } from '@/lib/actions/availability'
import { AvailabilityPickerBody } from '@/components/availability/availability-picker'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvailabilitySheetProps {
  triggerClassName?: string
  triggerStyle?: React.CSSProperties
  collapsed?: boolean
}

export function AvailabilitySheet({ triggerClassName, triggerStyle, collapsed }: AvailabilitySheetProps) {
  const [open,    setOpen]    = useState(false)
  const [data,    setData]    = useState<WeeklyAvailability | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleOpen = async () => {
    setOpen(true)
    if (!data) {
      setLoading(true)
      const weekly = await getWeeklyAvailability()
      setData(weekly)
      setLoading(false)
    }
  }

  const handleClose = () => setOpen(false)

  // ── Trigger button ───────────────────────────────────────────────────────
  const trigger = (
    <button
      onClick={handleOpen}
      className={triggerClassName}
      style={triggerStyle}
      title={collapsed ? 'Availability' : ''}
    >
      <Calendar className="h-4 w-4 shrink-0" />
      {!collapsed && 'Availability'}
    </button>
  )

  // ── Sheet portal ─────────────────────────────────────────────────────────
  const sheet = open && (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          maxHeight: '88vh',
          background: '#0f0f0f',
          borderRadius: '20px 20px 0 0',
          border: '1px solid #1e1e1e',
          borderBottom: 'none',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.25s ease',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        <style>{`
          @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#2a2a2a' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 16px',
          borderBottom: '1px solid #1e1e1e',
        }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Availability
            </h2>
            <p style={{ fontSize: '12px', color: '#555', margin: '2px 0 0' }}>
              When are you usually free?
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: '#1e1e1e', border: '1px solid #2a2a2a',
              cursor: 'pointer', color: '#666',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1e1e1e'; e.currentTarget.style.color = '#666' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <p style={{ color: '#444', fontSize: '14px' }}>Loading…</p>
            </div>
          ) : data ? (
            <AvailabilityPickerBody
              initial={data}
              onSaved={() => {
                // Brief delay so user sees the "Saved ✓" state before sheet closes
                setTimeout(() => setOpen(false), 900)
              }}
            />
          ) : null}
        </div>
      </div>
    </>
  )

  return (
    <>
      {trigger}
      {mounted && sheet ? createPortal(sheet, document.body) : null}
    </>
  )
}
