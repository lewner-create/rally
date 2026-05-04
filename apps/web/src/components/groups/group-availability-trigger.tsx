'use client'

import { useState } from 'react'
import { GroupAvailabilitySheet } from '@/components/availability/group-availability-sheet'
import type { WeeklyAvailability } from '@/lib/actions/availability'

interface Props {
  groupId: string
  groupName: string
  themeColor: string
  initialAvailability: WeeklyAvailability
  initialIsCustom: boolean
}

export function GroupAvailabilityTrigger({
  groupId,
  groupName,
  themeColor,
  initialAvailability,
  initialIsCustom,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isCustom, setIsCustom] = useState(initialIsCustom)

  return (
    <>
      {/* Trigger row */}
      <div>
        <p style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '.08em',
          textTransform: 'uppercase', color: '#555', margin: '0 0 8px',
        }}>
          My availability
        </p>
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            padding: '7px 10px', borderRadius: '8px', fontFamily: 'inherit',
            transition: 'background .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1e1e1e')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {/* Status dot */}
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: isCustom ? themeColor : '#555',
            boxShadow: isCustom ? `0 0 6px ${themeColor}80` : 'none',
          }} />
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: isCustom ? themeColor : '#888', margin: 0, lineHeight: 1.3 }}>
              {isCustom ? 'Custom for this group' : 'Using default'}
            </p>
            <p style={{ fontSize: '11px', color: '#444', margin: 0, lineHeight: 1.3 }}>
              {isCustom ? 'Tap to adjust' : 'Tap to customise'}
            </p>
          </div>
          <span style={{ marginLeft: 'auto', color: '#333', fontSize: '12px', flexShrink: 0 }}>›</span>
        </button>
      </div>

      {/* Sheet */}
      <GroupAvailabilitySheet
        groupId={groupId}
        groupName={groupName}
        themeColor={themeColor}
        initialAvailability={initialAvailability}
        initialIsCustom={isCustom}
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(custom) => setIsCustom(custom)}
      />
    </>
  )
}
