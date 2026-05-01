'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEventPhotos, saveEventPhoto, deleteEventPhoto } from '@/lib/actions/events'

type Photo = {
  id: string
  public_url: string
  created_at: string
  uploader: { display_name: string | null; username: string } | null
}

type Props = {
  eventId: string
}

export default function MomentsTab({ eventId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getEventPhotos(eventId).then((data) => {
      setPhotos(data as Photo[])
      setLoading(false)
    })
  }, [eventId])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type + size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Images must be under 10MB.')
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(path)

      const saved = await saveEventPhoto(eventId, publicUrl)
      if (saved) {
        setPhotos((prev) => [{ id: saved.id, public_url: publicUrl, created_at: saved.created_at, uploader: null }, ...prev])
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(photoId: string) {
    await deleteEventPhoto(photoId, eventId)
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    if (lightbox === photoId) setLightbox(null)
  }

  if (loading) {
    return <div className="py-12 text-center text-[#555] text-sm">Loading moments…</div>
  }

  return (
    <div>
      {/* Header + upload button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-semibold text-sm">Moments</p>
          <p className="text-[#555] text-xs mt-0.5">
            {photos.length > 0 ? `${photos.length} photo${photos.length === 1 ? '' : 's'}` : 'No photos yet'}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#1e1e1e] border border-[#2a2a2a] text-white hover:bg-[#252525] disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <span className="text-base leading-none">+</span>
              Add photo
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Empty state */}
      {photos.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed border-[#2a2a2a] py-16 flex flex-col items-center gap-3 cursor-pointer hover:border-[#3a3a3a] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-4xl">📸</span>
          <div className="text-center">
            <p className="text-white font-medium text-sm">Add the first photo</p>
            <p className="text-[#555] text-xs mt-1">Share your memories from this event</p>
          </div>
        </div>
      ) : (
        /* Photo grid */
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a]">
              <img
                src={photo.public_url}
                alt=""
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-[1.02]"
                onClick={() => setLightbox(photo.id)}
                loading="lazy"
              />
              {/* Hover overlay with delete */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo.id) }}
                  className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/60 transition-colors text-xs"
                  title="Delete photo"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (() => {
        const photo = photos.find((p) => p.id === lightbox)
        if (!photo) return null
        const idx = photos.findIndex((p) => p.id === lightbox)
        const prev = idx > 0 ? photos[idx - 1] : null
        const next = idx < photos.length - 1 ? photos[idx + 1] : null
        return (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={() => setLightbox(null)}
            >
              ✕
            </button>

            {/* Prev */}
            {prev && (
              <button
                className="absolute left-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightbox(prev.id) }}
              >
                ‹
              </button>
            )}

            {/* Image */}
            <img
              src={photo.public_url}
              alt=""
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next */}
            {next && (
              <button
                className="absolute right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightbox(next.id) }}
              >
                ›
              </button>
            )}

            {/* Caption */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
              <p className="text-white/50 text-xs">
                {idx + 1} / {photos.length}
                {photo.uploader && ` · by ${photo.uploader.display_name ?? photo.uploader.username}`}
              </p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
