'use client'

import Link from 'next/link'

const EVENT_ICONS: Record<string, string> = {
  game_night: '🎮',
  hangout:    '☕',
  meetup:     '🤝',
  day_trip:   '🗺️',
  road_trip:  '🚗',
  moto_trip:  '🏍️',
  vacation:   '✈️',
}

interface EventCardProps {
  event: {
    id: string
    title: string
    event_type: string
    starts_at: string
    status: string
    banner_url?: string | null
    event_attendees?: Array<{ user_id: string; rsvp_status: string }>
  }
}

export function EventCard({ event }: EventCardProps) {
  const start   = new Date(event.starts_at)
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '')
  const going   = event.event_attendees?.filter(a => a.rsvp_status === 'yes').length ?? 0
  const isDraft = event.status === 'draft'
  const banner  = event.banner_url

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          borderRadius: '14px',
          background: 'white',
          cursor: 'pointer',
          border: '1.5px solid transparent',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#e8e7ff'
          el.style.boxShadow   = '0 2px 10px rgba(127,119,221,0.08)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'transparent'
          el.style.boxShadow   = 'none'
        }}
      >
        {/* Banner strip — shown only when banner exists */}
        {banner && (
          <div style={{
            height: '72px',
            backgroundImage: `url(${banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.0), rgba(0,0,0,0.4))',
            }}/>
            {/* Type badge overlaid on banner */}
            <div style={{
              position: 'absolute', bottom: '8px', left: '12px',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '9999px',
              background: 'rgba(0,0,0,0.4)',
              fontSize: '10px', fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {EVENT_ICONS[event.event_type] ?? '📅'}
            </div>
          </div>
        )}

        {/* Card body */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: banner ? '10px 14px' : '11px 14px',
        }}>
          {/* Icon — only shown when no banner */}
          {!banner && (
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#f4f3ff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '17px', flexShrink: 0,
            }}>
              {EVENT_ICONS[event.event_type] ?? '📅'}
            </div>
          )}

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '14px', fontWeight: 600, color: '#111',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {event.title}
              </span>
              {isDraft && (
                <span style={{
                  fontSize: '10px', background: '#f0eeea', color: '#999',
                  padding: '1px 6px', borderRadius: '9999px', fontWeight: 700,
                  letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0,
                }}>
                  Draft
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
              {dateStr} · {timeStr}
            </div>
          </div>

          {/* Going count */}
          {going > 0 && (
            <span style={{
              fontSize: '12px', color: '#1D9E75', fontWeight: 700, flexShrink: 0,
              background: '#edf9f4', padding: '3px 8px', borderRadius: '9999px',
            }}>
              {going} going
            </span>
          )}

          <span style={{ fontSize: '14px', color: '#ccc', flexShrink: 0 }}>›</span>
        </div>
      </div>
    </Link>
  )
}
