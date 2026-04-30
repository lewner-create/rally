'use client'

import { useState } from 'react'

interface ShareEventButtonProps {
  inviteGroupSlug: string | null
  inviteSlug: string | null
  eventId: string
}

export function ShareEventButton({ inviteGroupSlug, inviteSlug, eventId }: ShareEventButtonProps) {
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = inviteGroupSlug && inviteSlug
    ? `${origin}/invite/${inviteGroupSlug}/${inviteSlug}`
    : `${origin}/events/${eventId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 14px',
        borderRadius: '9999px',
        background: copied ? 'rgba(29,158,117,0.12)' : 'rgba(255,255,255,0.12)',
        border: copied ? '1px solid rgba(29,158,117,0.3)' : '1px solid rgba(255,255,255,0.15)',
        color: copied ? '#1D9E75' : 'rgba(255,255,255,0.7)',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
      }}
    >
      <span>{copied ? '✓' : '↗'}</span>
      <span>{copied ? 'Copied!' : 'Share invite'}</span>
    </button>
  )
}
