'use client'

import { useState, useEffect, useRef } from 'react'
import { updateEvent } from '@/lib/actions/events'

interface Props {
  event: {
    id: string
    title: string
    starts_at: string | null
    ends_at: string | null
    description: string | null
    location: string | null
    banner_url: string | null
    event_type: string
  }
  accentColor: string
  onClose: () => void
  onSaved?: (updated: any) => void
}

function timeFromIso(iso: string | null): string {
  if (!iso) return '18:00'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function dateFromIso(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

function fmt12(val: string): string {
  const [h, m] = val.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2,'0')} ${suffix}`
}

function TimePicker({ value, onChange, accent }: { value: string; onChange: (v: string) => void; accent: string }) {
  const [h, m] = value.split(':').map(Number)
  const hour12 = h % 12 || 12
  const ampm   = h >= 12 ? 'PM' : 'AM'

  const setH = (newH12: number, newAmpm: string) => {
    let h24 = newH12 % 12
    if (newAmpm === 'PM') h24 += 12
    onChange(`${String(h24).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }
  const setM = (newM: number) => onChange(`${String(h).padStart(2,'0')}:${String(newM).padStart(2,'0')}`)
  const setA = (a: string) => setH(hour12, a)

  const sel: React.CSSProperties = {
    flex: 1, padding: '10px 6px', borderRadius: '10px',
    border: '1.5px solid #2a2a2a', fontSize: '14px',
    fontFamily: 'inherit', color: '#e0e0e0', background: '#1a1a1a',
    outline: 'none', cursor: 'pointer',
    appearance: 'none' as any, WebkitAppearance: 'none' as any,
    textAlign: 'center',
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <select value={hour12} onChange={e => setH(Number(e.target.value), ampm)} style={sel}
        onFocus={e => (e.target.style.borderColor = accent)} onBlur={e => (e.target.style.borderColor = '#2a2a2a')}>
        {Array.from({length:12},(_,i)=>i+1).map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <span style={{ color: '#333', fontWeight: 700 }}>:</span>
      <select value={m} onChange={e => setM(Number(e.target.value))} style={sel}
        onFocus={e => (e.target.style.borderColor = accent)} onBlur={e => (e.target.style.borderColor = '#2a2a2a')}>
        {[0,5,10,15,20,25,30,35,40,45,50,55].map(v => <option key={v} value={v}>{String(v).padStart(2,'0')}</option>)}
      </select>
      <select value={ampm} onChange={e => setA(e.target.value)} style={{...sel, flex: 'none', width: '62px'}}
        onFocus={e => (e.target.style.borderColor = accent)} onBlur={e => (e.target.style.borderColor = '#2a2a2a')}>
        <option>AM</option><option>PM</option>
      </select>
    </div>
  )
}

export function EditEventModal({ event, accentColor, onClose, onSaved }: Props) {
  const [visible,  setVisible]  = useState(false)
  const [title,    setTitle]    = useState(event.title)
  const [date,     setDate]     = useState(dateFromIso(event.starts_at))
  const [startT,   setStartT]   = useState(timeFromIso(event.starts_at))
  const [endT,     setEndT]     = useState(timeFromIso(event.ends_at))
  const [location, setLocation] = useState(event.location ?? '')
  const [desc,     setDesc]     = useState(event.description ?? '')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true))
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const handleSave = async () => {
    if (!title.trim() || !date) { setError('Title and date are required.'); return }
    setSaving(true)
    setError('')
    try {
      const updated = await updateEvent(event.id, {
        title:       title.trim(),
        startsAt:    `${date}T${startT}:00`,
        endsAt:      `${date}T${endT}:00`,
        description: desc.trim() || null,
        location:    location.trim() || null,
      })
      onSaved?.(updated)
      handleClose()
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.')
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: '10px',
    border: '1.5px solid #2a2a2a', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', background: '#1a1a1a',
    color: '#e0e0e0', transition: 'border-color 0.15s',
  }

  const lbl: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: '#555',
    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '7px',
    display: 'block',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 101,
          background: '#161616',
          borderTop: '1px solid #2a2a2a',
          borderRadius: '20px 20px 0 0',
          maxHeight: '90vh',
          overflowY: 'auto',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '9999px', background: '#2a2a2a' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#e0e0e0', margin: 0 }}>Edit plan</h2>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '20px', lineHeight: 1, padding: '4px', fontFamily: 'inherit' }}>×</button>
        </div>

        {/* Fields */}
        <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '560px', margin: '0 auto' }}>

          {/* Title */}
          <div>
            <label style={lbl}>Plan name</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={inp}
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          </div>

          {/* Date */}
          <div>
            <label style={lbl}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
              ...inp,
              colorScheme: 'dark',
            }}
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          </div>

          {/* Times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={lbl}>Start time</label>
              <TimePicker value={startT} onChange={setStartT} accent={accentColor} />
            </div>
            <div>
              <label style={lbl}>End time</label>
              <TimePicker value={endT} onChange={setEndT} accent={accentColor} />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={lbl}>📍 Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Address, venue, destination…" style={inp}
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Details <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '11px' }}>(optional)</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Notes, what to bring…" rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 } as React.CSSProperties}
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          </div>

          {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleClose} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1.5px solid #2a2a2a', background: '#1a1a1a', color: '#aaa', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: accentColor, border: 'none', color: 'white', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit', boxShadow: `0 4px 16px ${accentColor}40` }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
