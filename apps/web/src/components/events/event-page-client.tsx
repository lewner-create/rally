'use client'

import { useState } from 'react'
import Link from 'next/link'
import EventTabs from '@/components/events/event-tabs'
import { ChatPanel } from '@/components/chat/chat-panel'
import RsvpSection from '@/components/events/rsvp-section'
import { EditEventModal } from '@/components/events/edit-event-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

type EventData = {
  id: string
  title: string
  description: string | null
  event_type: string
  starts_at: string | null
  ends_at: string | null
  created_by: string
  group_id: string
  banner_url: string | null
  location: string | null
  status: string | null
  groups: { id: string; name: string; slug: string; theme_color: string | null } | null
}

type Member = { id: string; display_name: string | null; username: string; avatar_url: string | null }
type Rsvp   = { user_id: string; rsvp_status: string; profiles: any }

interface Props {
  event:       EventData
  rsvps:       Rsvp[]
  members:     Member[]
  userRsvp:    string | null
  isCreator:   boolean
  currentUserId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_META: Record<string, { emoji: string; label: string }> = {
  vacation:   { emoji: '✈',  label: 'Vacation'   },
  day_trip:   { emoji: '🗺',  label: 'Day trip'   },
  road_trip:  { emoji: '🛣',  label: 'Road trip'  },
  game_night: { emoji: '',  label: 'Game night' },
  hangout:    { emoji: '',  label: 'Hangout'    },
  meetup:     { emoji: '',  label: 'Meetup'     },
  moto_trip:  { emoji: '🏍',  label: 'Moto trip'  },
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  const h = d.getHours(), m = d.getMinutes()
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour   = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2,'0')}${suffix}`
}

// ─── Client component ─────────────────────────────────────────────────────────

export function EventPageClient({ event: initialEvent, rsvps, members, userRsvp, isCreator, currentUserId }: Props) {
  const [event,     setEvent]     = useState(initialEvent)
  const [editOpen,  setEditOpen]  = useState(false)

  const accentColor = event.groups?.theme_color ?? '#6366f1'
  const groupName   = event.groups?.name ?? ''
  const typeMeta    = EVENT_TYPE_META[event.event_type] ?? { emoji: '', label: event.event_type }
  const goingCount  = rsvps.filter(r => r.rsvp_status === 'yes').length
  const isCompleted = event.status === 'completed'

  const aboutSlot = (
    <div className="space-y-4">
      {event.location && (
        <p className="text-[#aaa] text-sm flex items-center gap-2">
          <span></span> {event.location}
        </p>
      )}
      {event.description && (
        <p className="text-[#aaa] text-sm leading-relaxed">{event.description}</p>
      )}
      {rsvps.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#555] font-semibold mb-2">
            Who's in · {goingCount} going
          </p>
          <div className="flex flex-wrap gap-2">
            {rsvps
              .filter(r => r.rsvp_status === 'yes')
              .map(r => {
                const p = r.profiles as any
                return (
                  <div key={r.user_id} className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-lg px-2.5 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#333] overflow-hidden flex items-center justify-center text-[10px] text-white">
                      {p?.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (p?.display_name ?? p?.username ?? '?').charAt(0).toUpperCase()
                      }
                    </div>
                    <span className="text-xs text-[#aaa]">{p?.display_name ?? p?.username}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row min-h-screen">

          {/* Left column */}
          <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8 lg:max-w-[560px]">

            {/* Back + edit row */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/groups/${event.group_id}`}
                className="inline-flex items-center gap-1.5 text-[#555] text-sm hover:text-white transition-colors"
              >
                ← {groupName}
              </Link>
              {isCreator && !isCompleted && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:text-white"
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    color: '#666',
                  }}
                >
                  ✏ Edit
                </button>
              )}
            </div>

            {/* Hero card */}
            <div
              className="rounded-2xl p-5 mb-5 relative overflow-hidden"
              style={{
                background: event.banner_url
                  ? undefined
                  : `${accentColor}18`,
                backgroundImage: event.banner_url
                  ? `url(${event.banner_url})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: `1px solid ${accentColor}30`,
              }}
            >
              {event.banner_url && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)', borderRadius: 'inherit' }} />
              )}
              <div className="relative flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${accentColor}30` }}
                >
                  {typeMeta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: accentColor }}>
                      {typeMeta.label}
                    </p>
                    {isCompleted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#2a2a2a', color: '#666' }}>
                        Completed
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-white leading-tight mb-2">{event.title}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {event.starts_at && (
                      <span className="text-sm text-[#aaa]">{formatDate(event.starts_at)}</span>
                    )}
                    {event.starts_at && (
                      <span className="text-sm text-[#aaa]">
                        {formatTime(event.starts_at)}
                        {event.ends_at && ` – ${formatTime(event.ends_at)}`}
                      </span>
                    )}
                    {event.location && (
                      <span className="text-sm text-[#aaa] flex items-center gap-1">
                        <span></span>{event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isCompleted && (
              <div className="mb-5">
                <RsvpSection
                  eventId={event.id}
                  currentRsvp={userRsvp}
                />
              </div>
            )}

            <EventTabs
              eventId={event.id}
              eventType={event.event_type}
              members={members}
              isCreator={isCreator}
              aboutSlot={aboutSlot}
              isCompleted={isCompleted}
            />
          </div>

          {/* Right column — chat */}
          <div
            className="lg:w-[340px] lg:border-l lg:sticky lg:top-0 lg:h-screen flex flex-col"
            style={{ borderColor: '#1e1e1e' }}
          >
            <div className="px-4 py-4 border-b" style={{ borderColor: '#1e1e1e' }}>
              <p className="text-xs uppercase tracking-widest text-[#555] font-semibold">Plan chat</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                groupId={event.group_id}
                currentUserId={currentUserId}
                eventId={event.id}
                initialMessages={[]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <EditEventModal
          event={event}
          accentColor={accentColor}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setEvent(prev => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  )
}
