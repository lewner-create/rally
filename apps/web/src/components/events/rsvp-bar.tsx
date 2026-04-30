'use client'

import { useState, useTransition } from 'react'
import { upsertRsvp } from '@/lib/actions/events'

type RsvpStatus = 'yes' | 'maybe' | 'no' | 'pending'

interface AttendeeProfile {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

interface Attendee {
  rsvp_status: string
  profiles: AttendeeProfile | null
}

export interface RsvpBarProps {
  eventId: string
  attendees: Attendee[]
  currentUserRsvp?: string
  currentUserId: string
}

const AVATAR_COLORS = ['#7F77DD', '#1D9E75', '#4A9ECC', '#CC8844', '#8B5CF6', '#D85A30', '#3D8B8B']

function avatarColor(id: string) {
  const h = id.split('').reduce((n, c) => n + c.charCodeAt(0), 0)
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function initials(p: AttendeeProfile | null): string {
  if (!p) return '?'
  if (p.display_name) {
    const parts = p.display_name.trim().split(/\s+/)
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : p.display_name.slice(0, 2).toUpperCase()
  }
  return p.username ? p.username.slice(0, 2).toUpperCase() : '??'
}

function AvatarStack({ list, max = 3 }: { list: Attendee[]; max?: number }) {
  const visible = list.slice(0, max)
  const extra   = list.length - max
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '28px' }}>
      {visible.map((a, i) => (
        <div key={a.profiles?.id ?? i} title={a.profiles?.display_name ?? a.profiles?.username ?? ''} style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: avatarColor(a.profiles?.id ?? String(i)),
          color: 'white', fontSize: '10px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white', marginLeft: i === 0 ? 0 : '-7px',
          position: 'relative', zIndex: max - i, flexShrink: 0,
        }}>
          {initials(a.profiles)}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: '#ebebeb', color: '#777', fontSize: '9px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white', marginLeft: '-7px', flexShrink: 0,
        }}>+{extra}</div>
      )}
    </div>
  )
}

function ExpandedList({ list }: { list: Attendee[] }) {
  return (
    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0efeb' }}>
      {list.map((a, i) => (
        <div key={a.profiles?.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0', fontSize: '13px', color: '#444' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: avatarColor(a.profiles?.id ?? String(i)),
            color: 'white', fontSize: '9px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{initials(a.profiles)}</div>
          <span>{a.profiles?.display_name ?? a.profiles?.username ?? 'Member'}</span>
        </div>
      ))}
    </div>
  )
}

const BUCKETS = [
  { status: 'yes',   label: 'Going',  emoji: '✓', color: '#1D9E75', activeBg: '#edf9f4', borderActive: '#1D9E75', confirm: "You're going!" },
  { status: 'maybe', label: 'Maybe',  emoji: '?', color: '#6b6b6b', activeBg: '#f5f4f1', borderActive: '#aaa',    confirm: "Maybe for you"   },
  { status: 'no',    label: "Can't",  emoji: '✕', color: '#D85A30', activeBg: '#fdf1ec', borderActive: '#D85A30', confirm: "Can't make it"   },
] as const

export function RsvpBar({ eventId, attendees, currentUserRsvp, currentUserId }: RsvpBarProps) {
  const [myRsvp, setMyRsvp]         = useState<string>(currentUserRsvp ?? 'pending')
  const [localAttendees, setLocal]  = useState<Attendee[]>(attendees)
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [confirmation, setConfirm]  = useState<string | null>(null)
  const [, startTransition]         = useTransition()

  const handleRsvp = (status: 'yes' | 'maybe' | 'no') => {
    if (myRsvp === status) return
    const prev = myRsvp

    setMyRsvp(status)
    setLocal(curr => {
      const others   = curr.filter(a => a.profiles?.id !== currentUserId)
      const existing = curr.find(a => a.profiles?.id === currentUserId)
      const myEntry: Attendee = {
        rsvp_status: status,
        profiles: existing?.profiles ?? {
          id: currentUserId,
          display_name: null,
          username: 'You',
          avatar_url: null,
        },
      }
      return [...others, myEntry]
    })

    // Show confirmation toast
    const bucket = BUCKETS.find(b => b.status === status)
    if (bucket) {
      setConfirm(bucket.confirm)
      setTimeout(() => setConfirm(null), 2500)
    }

    startTransition(async () => {
      try {
        await upsertRsvp(eventId, status)
      } catch {
        setMyRsvp(prev)
        setLocal(attendees)
        setConfirm(null)
      }
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
          RSVP
        </p>
        {/* Confirmation toast */}
        <div style={{
          fontSize: '12px', fontWeight: 600,
          color: confirmation ? BUCKETS.find(b => b.confirm === confirmation)?.color ?? '#1D9E75' : 'transparent',
          transition: 'color 0.2s, opacity 0.3s',
          opacity: confirmation ? 1 : 0,
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          ✓ {confirmation}
        </div>
      </div>

      {/* Bucket row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {BUCKETS.map(b => {
          const group    = localAttendees.filter(a => a.rsvp_status === b.status)
          const isActive = myRsvp === b.status

          return (
            <button
              key={b.status}
              onClick={() => handleRsvp(b.status)}
              style={{
                flex: 1, padding: '10px', borderRadius: '12px',
                border: isActive ? `2px solid ${b.borderActive}` : '2px solid #eeede9',
                background: isActive ? b.activeBg : '#fafaf8',
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                fontSize: '11px', fontWeight: 700,
                color: isActive ? b.color : '#bbb',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                {isActive && <span style={{ fontSize: '10px' }}>{b.emoji}</span>}
                {b.label}
              </div>
              {group.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AvatarStack list={group} />
                  <span style={{ fontSize: '11px', color: '#999', fontWeight: 600 }}>{group.length}</span>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#ddd' }}>—</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Expand links */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {BUCKETS.map(b => {
          const group = localAttendees.filter(a => a.rsvp_status === b.status)
          if (group.length === 0) return null
          const isOpen = expanded === b.status
          return (
            <button
              key={b.status}
              onClick={() => setExpanded(isOpen ? null : b.status)}
              style={{
                fontSize: '12px', color: b.color, background: 'none', border: 'none',
                cursor: 'pointer', padding: 0, textDecoration: 'underline',
                opacity: 0.75, fontFamily: 'inherit',
              }}
            >
              {isOpen ? 'Hide' : `${b.label} (${group.length})`}
            </button>
          )
        })}
      </div>

      {expanded && (
        <ExpandedList list={localAttendees.filter(a => a.rsvp_status === expanded)} />
      )}
    </div>
  )
}
