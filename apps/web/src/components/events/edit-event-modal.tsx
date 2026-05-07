'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { updateEvent } from '@/lib/actions/events'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
  event: {
    id: string
    title: string
    starts_at: string | null
    ends_at: string | null
    location: string | null
    description: string | null
    banner_url: string | null
  }
  onSaved: (updated: Partial<Props['event']>) => void
}

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return iso.split('T')[0]
}

function toTimeInput(iso: string | null) {
  if (!iso) return ''
  const t = iso.split('T')[1] ?? ''
  return t.slice(0, 5)
}

function toIso(date: string, time: string) {
  if (!date || !time) return null
  return `${date}T${time}:00`
}

export function EditEventModal({ open, onClose, event, onSaved }: Props) {
  const [title,       setTitle]       = useState(event.title)
  const [date,        setDate]        = useState(toDateInput(event.starts_at))
  const [startTime,   setStartTime]   = useState(toTimeInput(event.starts_at))
  const [endTime,     setEndTime]     = useState(toTimeInput(event.ends_at))
  const [location,    setLocation]    = useState(event.location ?? '')
  const [description, setDescription] = useState(event.description ?? '')

  // Banner state
  const [bannerUrl,     setBannerUrl]     = useState(event.banner_url ?? '')
  const [bannerPreview, setBannerPreview] = useState(event.banner_url ?? '')
  const [bannerFile,    setBannerFile]    = useState<File | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [saving, startSave] = useTransition()
  const [error,  setError]  = useState<string | null>(null)

  // Re-init when event prop changes
  useEffect(() => {
    setTitle(event.title)
    setDate(toDateInput(event.starts_at))
    setStartTime(toTimeInput(event.starts_at))
    setEndTime(toTimeInput(event.ends_at))
    setLocation(event.location ?? '')
    setDescription(event.description ?? '')
    setBannerUrl(event.banner_url ?? '')
    setBannerPreview(event.banner_url ?? '')
    setBannerFile(null)
    setError(null)
  }, [event.id])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleBannerPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  function removeBanner() {
    setBannerFile(null)
    setBannerPreview('')
    setBannerUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function uploadBannerIfNeeded(): Promise<string | null> {
    if (!bannerFile) return bannerUrl || null
    setUploading(true)
    try {
      const supabase = createClient()
      const ext  = bannerFile.name.split('.').pop() ?? 'jpg'
      const path = `event-banners/${event.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('event-banners')
        .upload(path, bannerFile, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('event-banners').getPublicUrl(path)
      return publicUrl
    } finally {
      setUploading(false)
    }
  }

  function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setError(null)

    startSave(async () => {
      const finalBannerUrl = await uploadBannerIfNeeded()

      const result = await updateEvent(event.id, {
        title:       title.trim(),
        starts_at:   toIso(date, startTime),
        ends_at:     toIso(date, endTime),
        location:    location.trim() || null,
        description: description.trim() || null,
        banner_url:  finalBannerUrl,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      onSaved({
        title:       title.trim(),
        starts_at:   toIso(date, startTime),
        ends_at:     toIso(date, endTime),
        location:    location.trim() || null,
        description: description.trim() || null,
        banner_url:  finalBannerUrl,
      })
      onClose()
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .15s', colorScheme: 'dark',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#555',
    textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: '6px',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .25s',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', zIndex: 51,
        transform: open ? 'translate(-50%, 0)' : 'translate(-50%, 100%)',
        transition: 'transform .35s cubic-bezier(0.32,0.72,0,1)',
        width: '100%', maxWidth: '560px',
        background: '#141414', borderRadius: '20px 20px 0 0',
        border: '1px solid #1e1e1e', borderBottom: 'none',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#2a2a2a' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 24px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>
            ✏ Edit event
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: '18px', lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Banner */}
            <div>
              <label style={labelStyle}>Banner image</label>
              {bannerPreview ? (
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '120px' }}>
                  <img src={bannerPreview} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Change
                    </button>
                    <button
                      onClick={removeBanner}
                      style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.25)', color: '#ff6b6b', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: '100%', height: '80px', borderRadius: '12px',
                    background: '#1a1a1a', border: '1px dashed #2a2a2a',
                    color: '#555', fontSize: '13px', cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', transition: 'border-color .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#444')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  🖼 Add a banner image
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleBannerPick}
                style={{ display: 'none' }}
              />
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={inputStyle}
                placeholder="Event title"
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            {/* Date + times row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#444')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>
              <div>
                <label style={labelStyle}>Start</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#444')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>
              <div>
                <label style={labelStyle}>End</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#444')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={labelStyle}>Location</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={inputStyle}
                placeholder="Where is it?"
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                placeholder="Any notes for the group…"
                onFocus={e => (e.target.style.borderColor = '#444')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || uploading}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                background: saving || uploading ? '#2a2a2a' : '#6366f1',
                color: saving || uploading ? '#555' : '#fff',
                fontSize: '14px', fontWeight: 700,
                cursor: saving || uploading ? 'default' : 'pointer',
                fontFamily: 'inherit', transition: 'background .2s',
              }}
            >
              {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save changes'}
            </button>

          </div>
        </div>
      </div>
    </>
  )
}
