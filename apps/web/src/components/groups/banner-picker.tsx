'use client'

import { useState, useRef } from 'react'

// ─── Template definitions ─────────────────────────────────────────────────────

export type BannerTemplate = {
  id: string
  label: string
  css: string        // CSS background value — used as inline style
  preview: string    // same value, used in preview swatch
}

export const BANNER_TEMPLATES: BannerTemplate[] = [
  // Solid dark tones
  { id: 'obsidian',    label: 'Obsidian',     css: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',                    preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  { id: 'charcoal',   label: 'Charcoal',     css: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',                    preview: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' },

  // Warm
  { id: 'ember',      label: 'Ember',        css: 'linear-gradient(135deg, #b45309 0%, #7c2d12 60%, #1c0a00 100%)',       preview: 'linear-gradient(135deg, #b45309 0%, #7c2d12 60%, #1c0a00 100%)' },
  { id: 'canyon',     label: 'Canyon',       css: 'linear-gradient(135deg, #c2410c 0%, #9a3412 50%, #431407 100%)',       preview: 'linear-gradient(135deg, #c2410c 0%, #9a3412 50%, #431407 100%)' },
  { id: 'gold',       label: 'Gold',         css: 'linear-gradient(135deg, #d97706 0%, #92400e 60%, #1c1002 100%)',       preview: 'linear-gradient(135deg, #d97706 0%, #92400e 60%, #1c1002 100%)' },

  // Cool
  { id: 'midnight',   label: 'Midnight',     css: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f3d 60%, #070d1a 100%)',      preview: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f3d 60%, #070d1a 100%)' },
  { id: 'glacier',    label: 'Glacier',      css: 'linear-gradient(135deg, #0e7490 0%, #164e63 60%, #042330 100%)',       preview: 'linear-gradient(135deg, #0e7490 0%, #164e63 60%, #042330 100%)' },
  { id: 'arctic',     label: 'Arctic',       css: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 60%, #03192a 100%)',      preview: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 60%, #03192a 100%)' },

  // Purple / indigo
  { id: 'dusk',       label: 'Dusk',         css: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 60%, #1a0533 100%)',      preview: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 60%, #1a0533 100%)' },
  { id: 'nebula',     label: 'Nebula',       css: 'linear-gradient(135deg, #6366f1 0%, #4338ca 40%, #1e1b4b 100%)',      preview: 'linear-gradient(135deg, #6366f1 0%, #4338ca 40%, #1e1b4b 100%)' },
  { id: 'cosmic',     label: 'Cosmic',       css: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 40%, #2e1065 80%, #0f0218 100%)', preview: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 40%, #2e1065 80%, #0f0218 100%)' },

  // Green / nature
  { id: 'forest',     label: 'Forest',       css: 'linear-gradient(135deg, #166534 0%, #14532d 50%, #052e16 100%)',       preview: 'linear-gradient(135deg, #166534 0%, #14532d 50%, #052e16 100%)' },
  { id: 'moss',       label: 'Moss',         css: 'linear-gradient(135deg, #4d7c0f 0%, #3f6212 50%, #1a2e05 100%)',       preview: 'linear-gradient(135deg, #4d7c0f 0%, #3f6212 50%, #1a2e05 100%)' },

  // Pink / rose
  { id: 'rose',       label: 'Rose',         css: 'linear-gradient(135deg, #be185d 0%, #9d174d 50%, #4a0726 100%)',       preview: 'linear-gradient(135deg, #be185d 0%, #9d174d 50%, #4a0726 100%)' },
  { id: 'neon',       label: 'Neon Rose',    css: 'linear-gradient(135deg, #f43f5e 0%, #be123c 50%, #4c0519 100%)',       preview: 'linear-gradient(135deg, #f43f5e 0%, #be123c 50%, #4c0519 100%)' },

  // Multi-tone / special
  { id: 'aurora',     label: 'Aurora',       css: 'linear-gradient(135deg, #0f766e 0%, #1d4ed8 33%, #7c3aed 66%, #0f172a 100%)', preview: 'linear-gradient(135deg, #0f766e 0%, #1d4ed8 33%, #7c3aed 66%, #0f172a 100%)' },
  { id: 'sunset',     label: 'Sunset',       css: 'linear-gradient(135deg, #ea580c 0%, #dc2626 33%, #9333ea 66%, #1e1b4b 100%)', preview: 'linear-gradient(135deg, #ea580c 0%, #dc2626 33%, #9333ea 66%, #1e1b4b 100%)' },
  { id: 'deepocean',  label: 'Deep Ocean',   css: 'linear-gradient(135deg, #164e63 0%, #1e3a8a 50%, #0c0a1e 100%)',       preview: 'linear-gradient(135deg, #164e63 0%, #1e3a8a 50%, #0c0a1e 100%)' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type BannerValue =
  | { type: 'template'; templateId: string; css: string }
  | { type: 'upload'; url: string }
  | null

type Props = {
  // Current value — either an existing URL (from DB) or null
  currentBannerUrl?: string | null
  // Called when user selects/uploads a banner
  onChange: (value: BannerValue) => void
  // Group name for preview label
  groupName?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BannerPicker({ currentBannerUrl, onChange, groupName }: Props) {
  const [mode, setMode] = useState<'template' | 'upload'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Derive current preview background
  const previewBg = (() => {
    if (selectedTemplate) {
      return BANNER_TEMPLATES.find((t) => t.id === selectedTemplate)?.css ?? '#1a1a1a'
    }
    if (uploadPreview) return `url(${uploadPreview}) center/cover no-repeat`
    if (currentBannerUrl) return `url(${currentBannerUrl}) center/cover no-repeat`
    return '#1a1a1a'
  })()

  function handleSelectTemplate(template: BannerTemplate) {
    setSelectedTemplate(template.id)
    setUploadPreview(null)
    onChange({ type: 'template', templateId: template.id, css: template.css })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setUploadPreview(url)
      setSelectedTemplate(null)
      // Parent handles actual upload — we pass the File object via a data URL
      // Real upload happens in the settings form's save handler
      onChange({ type: 'upload', url })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      {/* Preview strip */}
      <div
        className="w-full h-20 rounded-xl mb-4 transition-all duration-300 relative overflow-hidden flex items-end"
        style={{ background: previewBg }}
      >
        {groupName && (
          <div className="px-3 py-2">
            <p className="text-white text-xs font-semibold drop-shadow-lg opacity-60">{groupName}</p>
          </div>
        )}
        {!selectedTemplate && !uploadPreview && !currentBannerUrl && (
          <p className="absolute inset-0 flex items-center justify-center text-[#444] text-xs">
            No banner selected
          </p>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-3 p-1 rounded-lg bg-[#1a1a1a] w-fit">
        {(['template', 'upload'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === m ? 'bg-[#2a2a2a] text-white' : 'text-[#555] hover:text-[#999]'
            }`}
          >
            {m === 'template' ? 'Templates' : 'Upload'}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {mode === 'template' && (
        <div className="grid grid-cols-6 gap-1.5">
          {BANNER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t)}
              title={t.label}
              className={`h-8 rounded-lg transition-all hover:scale-105 relative ${
                selectedTemplate === t.id
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-[#111] scale-105'
                  : ''
              }`}
              style={{ background: t.preview }}
            >
              {selectedTemplate === t.id && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Upload */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-16 rounded-xl border-2 border-dashed border-[#2a2a2a] flex items-center justify-center gap-2 text-sm text-[#555] hover:text-[#999] hover:border-[#444] transition-colors"
          >
            <span className="text-lg">📁</span>
            {uploading ? 'Uploading…' : uploadPreview ? 'Change image' : 'Choose an image'}
          </button>
          <p className="text-[#444] text-xs mt-2">JPG, PNG or WebP. Displays at 3:1 aspect ratio.</p>
        </div>
      )}

      {/* Clear */}
      {(selectedTemplate || uploadPreview || currentBannerUrl) && (
        <button
          onClick={() => {
            setSelectedTemplate(null)
            setUploadPreview(null)
            onChange(null)
          }}
          className="mt-2 text-xs text-[#444] hover:text-[#888] transition-colors"
        >
          Remove banner
        </button>
      )}
    </div>
  )
}
