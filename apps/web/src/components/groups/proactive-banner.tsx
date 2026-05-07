'use client'

import { useState, useEffect } from 'react'
import type { ProactivePrompt } from '@/lib/actions/prompts'
import { NudgeButton } from '@/components/groups/nudge-button'
import { X } from 'lucide-react'

interface ProactiveBannerProps {
  groupId: string
  prompt:  ProactivePrompt
}

function dismissKey(groupId: string) {
  const today = new Date().toISOString().split('T')[0]
  return `rally_prompt_dismissed_${groupId}_${today}`
}

export function ProactiveBanner({ groupId, prompt }: ProactiveBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(dismissKey(groupId))) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [groupId])

  const handleDismiss = () => {
    try { localStorage.setItem(dismissKey(groupId), '1') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '16px 18px',
        marginBottom: '20px',
        position: 'relative',
        background: 'linear-gradient(135deg, #3B30A8 0%, #7F77DD 100%)',
        boxShadow: '0 4px 20px rgba(127,119,221,0.35)',
        animation: 'slideDown 0.25s ease',
        // Column layout — button lives on its own row, can never clip against the edge
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          width: '26px', height: '26px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: 'none',
          cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>

      {/* Message — padded right so it doesn't overlap dismiss button */}
      <div style={{ paddingRight: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{ fontSize: '18px' }}></span>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.3 }}>
            {prompt.message}
          </p>
        </div>
        {(prompt.windowLabel || prompt.windowDate) && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '2px 0 0 26px' }}>
            {prompt.windowLabel ?? prompt.windowDate}
            {prompt.windowTimeLabel && ` · ${prompt.windowTimeLabel}`}
          </p>
        )}
      </div>

      {/* CTA row — sits on its own line, can never overflow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NudgeButton
          groupId={groupId}
          windowDate={prompt.windowDate}
          windowStart={prompt.windowStart}
          windowEnd={prompt.windowEnd}
          windowLabel={prompt.windowLabel}
          windowTimeLabel={prompt.windowTimeLabel}
        />
      </div>
    </div>
  )
}
