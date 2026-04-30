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

  // Only show if not dismissed today
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(dismissKey(groupId))
      if (!dismissed) setVisible(true)
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
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'linear-gradient(135deg, #3B30A8 0%, #7F77DD 100%)',
        boxShadow: '0 4px 20px rgba(127,119,221,0.35)',
        animation: 'slideDown 0.25s ease',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Spark + message */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>✨</span>
        <p style={{
          fontSize: '14px', fontWeight: 600, color: 'white',
          margin: 0, lineHeight: 1.4,
        }}>
          {prompt.message}
        </p>
      </div>

      {/* CTA + dismiss */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <NudgeButton
          groupId={groupId}
          windowDate={prompt.windowDate}
          windowStart={prompt.windowStart}
          windowEnd={prompt.windowEnd}
          windowLabel={prompt.windowLabel}
        />
        <button
          onClick={handleDismiss}
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
