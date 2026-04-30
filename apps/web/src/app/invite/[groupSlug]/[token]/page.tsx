import { createClient } from '@/lib/supabase/server'
import { joinGroupViaEventInvite } from '@/lib/actions/events'
import Link from 'next/link'
import { InviteRsvpButtons } from '@/components/events/invite-rsvp-buttons'

const TYPE_META: Record<string, { label: string; icon: string }> = {
  game_night: { label: 'Game Night', icon: '🎮' },
  hangout:    { label: 'Hangout',    icon: '☕' },
  meetup:     { label: 'Meetup',     icon: '🤝' },
  day_trip:   { label: 'Day Trip',   icon: '🗺️' },
  road_trip:  { label: 'Road Trip',  icon: '🚗' },
  moto_trip:  { label: 'Moto Trip',  icon: '🏍️' },
  vacation:   { label: 'Vacation',   icon: '✈️' },
}

function formatDate(startsAt: string) {
  return new Date(startsAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function formatTime(startsAt: string, endsAt: string) {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      .replace(':00', '')
  return `${fmt(new Date(startsAt))} – ${fmt(new Date(endsAt))}`
}

interface Props {
  params: Promise<{ groupSlug: string; token: string }>
}

export default async function EventInvitePage({ params }: Props) {
  const { groupSlug, token } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, groups(id, name)')
    .eq('invite_slug', token)
    .eq('invite_group_slug', groupSlug)
    .eq('status', 'published')
    .single()

  if (!event) {
    return (
      <div style={centerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💀</div>
          <h2 style={headingStyle}>Event not found</h2>
          <p style={subStyle}>This invite link is invalid or has expired.</p>
          <Link href="/dashboard" style={btnSecondaryStyle}>Go to dashboard</Link>
        </div>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  const groupId   = (event.groups as any)?.id as string
  const groupName = (event.groups as any)?.name as string
  const meta      = TYPE_META[event.event_type] ?? { label: event.event_type, icon: '📅' }
  const bannerUrl = event.banner_url as string | null

  let isMember = false
  if (user) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()
    isMember = !!membership
  }

  return (
    <div style={centerStyle}>
      <div style={cardStyle}>

        {/* Event preview card */}
        <div style={{
          borderRadius: '16px', marginBottom: '20px', color: 'white',
          textAlign: 'left', overflow: 'hidden', position: 'relative', minHeight: '140px',
        }}>
          {bannerUrl ? (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #2C2C2A, #1C1B1A 55%, #26215C)' }}/>
          )}
          <div style={{ position: 'absolute', inset: 0, background: bannerUrl ? 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.75) 100%)' : 'linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.35) 100%)' }}/>
          <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '9999px', background: 'rgba(255,255,255,0.12)', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              {meta.icon} {meta.label}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.2px', textShadow: bannerUrl ? '0 1px 6px rgba(0,0,0,0.5)' : 'none' }}>
              {event.title}
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 2px', textShadow: bannerUrl ? '0 1px 4px rgba(0,0,0,0.4)' : 'none' }}>
              {formatDate(event.starts_at)}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              {formatTime(event.starts_at, event.ends_at)}
            </p>
          </div>
        </div>

        <p style={subStyle}>
          You're invited to join <strong style={{ color: '#333' }}>{groupName}</strong> for this plan.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          {!user ? (
            <>
              <Link href={`/login?next=/invite/${groupSlug}/${token}`} style={btnPrimaryStyle}>
                Sign in to RSVP
              </Link>
              <Link href={`/signup?next=/invite/${groupSlug}/${token}`} style={btnSecondaryStyle}>
                Create account
              </Link>
            </>
          ) : isMember ? (
            /* InviteRsvpButtons already shows "View plan →" after RSVP — no duplicate needed */
            <InviteRsvpButtons eventId={event.id} eventUrl={`/events/${event.id}`} />
          ) : (
            <form action={async () => {
              'use server'
              await joinGroupViaEventInvite(groupSlug, token)
            }}>
              <button type="submit" style={btnPrimaryStyle}>
                Join {groupName} & RSVP →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const centerStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '24px', background: '#F1EFE8',
}
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '24px', padding: '28px',
  maxWidth: '400px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
}
const headingStyle: React.CSSProperties = {
  fontSize: '24px', fontWeight: 800, color: '#111',
  margin: '0 0 8px', letterSpacing: '-0.3px', textAlign: 'center',
}
const subStyle: React.CSSProperties = {
  fontSize: '14px', color: '#999', margin: 0, lineHeight: 1.6, textAlign: 'center',
}
const btnPrimaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '13px 24px', borderRadius: '9999px',
  background: '#7F77DD', color: 'white', textDecoration: 'none', fontWeight: 700,
  fontSize: '15px', boxShadow: '0 4px 20px rgba(127,119,221,0.4)', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box', textAlign: 'center',
}
const btnSecondaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '13px 24px', borderRadius: '9999px',
  background: 'white', color: '#555', textDecoration: 'none', fontWeight: 600,
  fontSize: '15px', border: '1.5px solid #e5e5e5', cursor: 'pointer',
  fontFamily: 'inherit', boxSizing: 'border-box', textAlign: 'center',
}
