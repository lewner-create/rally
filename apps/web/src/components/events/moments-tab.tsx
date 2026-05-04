'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveEventPhoto, deleteEventPhoto, type EventPhoto } from '@/lib/actions/photos'
import { X, ChevronLeft, ChevronRight, Trash2, ImagePlus } from 'lucide-react'

type Props = {
  eventId: string
  currentUserId: string
  initialPhotos: EventPhoto[]
}

export function MomentsTab({ eventId, currentUserId, initialPhotos }: Props) {
  const [photos, setPhotos]       = useState<EventPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox]   = useState<number | null>(null) // index into photos
  const [error, setError]         = useState<string | null>(null)
  const fileRef                   = useRef<HTMLInputElement>(null)

  // ── Upload ────────────────────────────────────────────────────────
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setUploading(false); return }

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${eventId}/${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) { setError(uploadError.message); continue }

      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(path)

      const { id, error: saveError } = await saveEventPhoto(eventId, publicUrl)
      if (saveError || !id) { setError(saveError ?? 'Save failed'); continue }

      const newPhoto: EventPhoto = {
        id,
        event_id:   eventId,
        user_id:    user.id,
        public_url:  publicUrl,
        caption:    null,
        created_at: new Date().toISOString(),
        profiles:   null,
      }
      setPhotos(prev => [...prev, newPhoto])
    }

    setUploading(false)
  }

  // ── Delete ────────────────────────────────────────────────────────
  async function handleDelete(photoId: string) {
    const { error } = await deleteEventPhoto(photoId)
    if (error) { setError(error); return }
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (lightbox !== null) {
      const newLen = photos.length - 1
      if (newLen === 0) setLightbox(null)
      else setLightbox(Math.min(lightbox, newLen - 1))
    }
  }

  // ── Lightbox nav ──────────────────────────────────────────────────
  const lightboxPhoto = lightbox !== null ? photos[lightbox] : null
  const canPrev = lightbox !== null && lightbox > 0
  const canNext = lightbox !== null && lightbox < photos.length - 1

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
          {photos.length === 0 ? 'No photos yet' : `${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '9999px',
            background: uploading ? '#1a1a1a' : '#7F77DD22',
            border: '1px solid #7F77DD44',
            color: uploading ? '#555' : '#7F77DD',
            fontSize: '13px', fontWeight: 600,
            cursor: uploading ? 'default' : 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
        >
          <ImagePlus size={14} />
          {uploading ? 'Uploading…' : 'Add photos'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p style={{ fontSize: '12px', color: '#f87171', marginBottom: '12px' }}>{error}</p>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '1.5px dashed #2a2a2a', borderRadius: '16px',
            padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#7F77DD55')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#1a1a1a', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px', fontSize: '20px',
          }}>
            📸
          </div>
          <p style={{ fontSize: '14px', color: '#aaa', margin: '0 0 4px', fontWeight: 600 }}>
            Add your first photo
          </p>
          <p style={{ fontSize: '12px', color: '#444', margin: 0 }}>
            Share moments from the event
          </p>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              onClick={() => setLightbox(i)}
              style={{
                aspectRatio: '1',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                background: '#1a1a1a',
              }}
              onMouseEnter={e => {
                const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement
                if (overlay) overlay.style.opacity = '1'
              }}
              onMouseLeave={e => {
                const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement
                if (overlay) overlay.style.opacity = '0'
              }}
            >
              <img
                src={photo.public_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                className="hover-overlay"
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  opacity: 0, transition: 'opacity 0.15s',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setLightbox(null) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>

          {/* Delete (own photos only) */}
          {lightboxPhoto.uploader_id === currentUserId && (
            <button
              onClick={() => handleDelete(lightboxPhoto.id)}
              style={{
                position: 'absolute', top: '20px', right: '64px',
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.2)', border: 'none',
                cursor: 'pointer', color: '#f87171',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Prev */}
          {canPrev && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(lightbox! - 1) }}
              style={{
                position: 'absolute', left: '16px',
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <img
            src={lightboxPhoto.public_url}
            alt=""
            style={{
              maxWidth: 'min(90vw, 900px)',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '8px',
              userSelect: 'none',
            }}
          />

          {/* Next */}
          {canNext && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(lightbox! + 1) }}
              style={{
                position: 'absolute', right: '16px',
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Counter */}
          <div style={{
            position: 'absolute', bottom: '20px',
            left: '50%', transform: 'translateX(-50%)',
            fontSize: '12px', color: 'rgba(255,255,255,0.5)',
            fontWeight: 600,
          }}>
            {lightbox! + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  )
}
