import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EventTabs from '@/components/events/event-tabs'
import { ChatPanel } from '@/components/chat/chat-panel'
import RsvpSection from '@/components/events/rsvp-section'

type Props = {
  params: Promise<{ eventId: string }>
}

const EVENT_TYPE_META: Record<string, { emoji: string; label: string }> = {
  vacation:   { emoji: '\u2708\uFE0F',       label: 'Vacation'   },
  day_trip:   { emoji: '\uD83D\uDE97',       label: 'Day trip'   },
  road_trip:  { emoji: '\uD83D\uDEE3\uFE0F', label: 'Road trip'  },
  game_night: { emoji: '\uD83C\uDFAE',       label: 'Game night' },
  hangout:    { emoji: '\uD83D\uDECB\uFE0F', label: 'Hangout'    },
  meetup:     { emoji: '\uD83D\uDC4B',       label: 'Meetup'     },
  moto_trip:  { emoji: '\uD83C\uDFCD\uFE0F', label: 'Moto trip'  },
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function formatTime(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

export default async function EventPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      id, title, description, event_type, starts_at, ends_at,
      created_by, group_id,
      groups ( id, name, slug, theme_color )
    `)
    .eq('id', eventId)
    .single()

  if (error || !event) notFound()

  const { data: rsvps } = await supabase
    .from('event_attendees')
    .select('user_id, rsvp_status, profiles:user_id(id, display_name, username, avatar_url)')
    .eq('event_id', eventId)

  const { data: groupMembers } = await supabase
    .from('group_members')
    .select('profiles(id, display_name, username, avatar_url)')
    .eq('group_id', event.group_id)

  const members = (groupMembers ?? [])
    .map((m) => m.profiles)
    .filter(Boolean) as { id: string; display_name: string | null; username: string; avatar_url: string | null }[]

  const userRsvp   = (rsvps ?? []).find((r) => r.user_id === user.id)
  const isCreator  = event.created_by === user.id
  const typeMeta   = EVENT_TYPE_META[event.event_type] ?? { emoji: '\uD83D\uDCC5', label: event.event_type }
  const goingCount = (rsvps ?? []).filter((r) => r.rsvp_status === 'yes').length
  const accentColor = (event.groups as any)?.theme_color ?? '#6366f1'
  const groupName   = (event.groups as any)?.name ?? ''
  const groupId     = event.group_id

  const aboutSlot = (
    <div className="space-y-4">
      {event.description && (
        <p className="text-[#aaa] text-sm leading-relaxed">{event.description}</p>
      )}
      {(rsvps ?? []).length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#555] font-semibold mb-2">
            Who&apos;s in &middot; {goingCount} going
          </p>
          <div className="flex flex-wrap gap-2">
            {(rsvps ?? [])
              .filter((r) => r.rsvp_status === 'yes')
              .map((r) => {
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

          {/* ── Left column ─────────────────────────────────────────── */}
          <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8 lg:max-w-[560px]">

            <a
              href={`/groups/${groupId}`}
              className="inline-flex items-center gap-1.5 text-[#555] text-sm hover:text-white transition-colors mb-6"
            >
              &larr; {groupName}
            </a>

            {/* Hero card */}
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${accentColor}30` }}
                >
                  {typeMeta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: accentColor }}>
                    {typeMeta.label}
                  </p>
                  <h1 className="text-xl font-bold text-white leading-tight mb-2">{event.title}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {event.starts_at && (
                      <span className="text-sm text-[#aaa]">{formatDate(event.starts_at)}</span>
                    )}
                    {event.starts_at && (
                      <span className="text-sm text-[#aaa]">
                        {formatTime(event.starts_at)}
                        {event.ends_at && ` \u2013 ${formatTime(event.ends_at)}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <RsvpSection
                eventId={eventId}
                currentRsvp={userRsvp?.rsvp_status ?? null}
              />
            </div>

            <EventTabs
              eventId={eventId}
              eventType={event.event_type}
              members={members}
              isCreator={isCreator}
              aboutSlot={aboutSlot}
            />
          </div>

          {/* ── Right column — chat ──────────────────────────────────── */}
          {/*
            Desktop: sticky sidebar, full viewport height, border-left
            Mobile:  stacks below left column, gets a top border + a
                     fixed height so the chat input is reachable
          */}
          <div
            className="
              flex flex-col
              border-t lg:border-t-0 lg:border-l
              lg:w-[340px] lg:sticky lg:top-0 lg:h-screen
            "
            style={{ borderColor: '#1e1e1e' }}
          >
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: '#1e1e1e' }}>
              <p className="text-xs uppercase tracking-widest text-[#555] font-semibold">Plan chat</p>
            </div>
            {/* min-h on mobile so the input bar isn't squeezed off screen */}
            <div className="flex-1 overflow-hidden min-h-[320px] lg:min-h-0">
              <ChatPanel
                groupId={groupId}
                currentUserId={user.id}
                eventId={eventId}
                initialMessages={[]}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
