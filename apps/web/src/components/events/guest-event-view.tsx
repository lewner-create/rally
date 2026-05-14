'use client'
import { useState, useTransition } from 'react'
import { rsvpAsGuest, sendGuestMessage } from '@/lib/actions/guest-invites'
import { APP_URL } from '@/lib/resend'

const RSVP_OPTIONS = [
  { value: 'yes',   label: 'Going',         color: '#22c55e' },
  { value: 'maybe', label: 'Maybe',         color: '#fbbf24' },
  { value: 'no',    label: "Can't make it", color: '#ef4444' },
] as const
type RsvpValue = 'yes' | 'maybe' | 'no'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
function formatTime(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso), h = d.getHours(), m = d.getMinutes()
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2,'0')}${suffix}`
}

export default function GuestEventView({ data, token }: { data: any; token: string }) {
  const { invite, event, host, attendees, frozen } = data
  const accent = event.accent ?? '#7F77DD'
  const [rsvp,      setRsvp]      = useState<RsvpValue | null>(invite.status === 'accepted' ? 'yes' : null)
  const [name,      setName]      = useState('')
  const [msgBody,   setMsgBody]   = useState('')
  const [msgSent,   setMsgSent]   = useState(false)
  const [pending,   startTx]      = useTransition()
  const [showNudge, setShowNudge] = useState(false)

  const handleRsvp = (value: RsvpValue) => {
    if (!name.trim()) return
    startTx(async () => {
      await rsvpAsGuest(token, name.trim(), value)
      setRsvp(value); setShowNudge(true)
    })
  }
  const handleSendMessage = () => {
    if (!msgBody.trim()) return
    startTx(async () => {
      await sendGuestMessage(token, msgBody.trim(), name || invite.email)
      setMsgBody(''); setMsgSent(true)
    })
  }
  const crew        = attendees.filter((a: any) => !a.is_guest)
  const guests      = attendees.filter((a: any) => a.is_guest)
  const goingCrew   = crew.filter((a: any) => a.rsvp_status === 'yes')
  const goingGuests = guests.filter((a: any) => a.rsvp_status === 'yes')

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-lg mx-auto px-4 py-8 pb-20">
        {frozen && (
          <div className="rounded-xl p-4 mb-6 text-center" style={{ background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.3)' }}>
            <p className="text-white font-semibold mb-1">This event has wrapped.</p>
            <p className="text-[#888] text-sm mb-3">The crew is already planning their next thing.</p>
            <a href={`${APP_URL}/signup`} className="inline-block px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#7F77DD', color: 'white' }}>
              Create a Volta account
            </a>
          </div>
        )}
        <div className="rounded-2xl p-5 mb-5" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
          <p className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: accent }}>{event.group_name}</p>
          <h1 className="text-2xl font-bold text-white leading-tight mb-2">{event.title}</h1>
          {event.starts_at && (
            <p className="text-sm text-[#aaa]">
              {formatDate(event.starts_at)}{event.starts_at && ` ? ${formatTime(event.starts_at)}`}{event.ends_at && ` - ${formatTime(event.ends_at)}`}
            </p>
          )}
          {event.description && <p className="text-sm text-[#888] mt-2 leading-relaxed">{event.description}</p>}
        </div>
        <div className="flex items-center gap-3 mb-5">
          {host?.avatar_url
            ? <img src={host.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${accent}44` }}>
                {(host?.display_name ?? host?.username ?? '?')[0].toUpperCase()}
              </div>
          }
          <p className="text-sm text-[#aaa]">Hosted by <span className="text-white font-medium">{host?.display_name ?? host?.username}</span></p>
        </div>
        {!frozen && (
          <div className="rounded-xl p-4 mb-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
            {rsvp ? (
              <div className="text-center py-2">
                <p className="text-white font-semibold mb-1">
                  {rsvp === 'yes' ? "You're going!" : rsvp === 'maybe' ? "You're a maybe" : "You can't make it"}
                </p>
                <p className="text-[#555] text-xs mb-3">Tap a button to change your RSVP</p>
                <div className="flex gap-2">
                  {RSVP_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => handleRsvp(opt.value)} disabled={pending}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: rsvp === opt.value ? opt.color + '22' : 'rgba(255,255,255,0.04)', border: `1px solid ${rsvp === opt.value ? opt.color + '66' : 'rgba(255,255,255,0.08)'}`, color: rsvp === opt.value ? opt.color : '#555' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-white mb-3">What should we call you?</p>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#555] outline-none mb-3"
                  style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
                <div className="flex gap-2">
                  {RSVP_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => handleRsvp(opt.value)} disabled={pending || !name.trim()}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: opt.color + '18', border: `1px solid ${opt.color}44`, color: opt.color, opacity: !name.trim() ? 0.4 : 1 }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {showNudge && (
          <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(127,119,221,0.08)', border: '1px solid rgba(127,119,221,0.25)' }}>
            <p className="text-sm text-white font-semibold mb-1">You're in!</p>
            <p className="text-xs text-[#888] mb-3">Create a Volta account to get notified about future events and stay connected with the crew.</p>
            <div className="flex gap-2">
              <a href={`${APP_URL}/signup`} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#7F77DD', color: 'white' }}>Create account</a>
              <button onClick={() => setShowNudge(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: '#555' }}>Maybe later</button>
            </div>
          </div>
        )}
        {(goingCrew.length > 0 || goingGuests.length > 0) && (
          <div className="rounded-xl p-4 mb-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
            <p className="text-[10px] uppercase tracking-wider text-[#555] font-semibold mb-3">
              {goingCrew.length + goingGuests.length} going{goingCrew.length > 0 && goingGuests.length > 0 && ` ? ${goingCrew.length} crew ? ${goingGuests.length} guests`}
            </p>
            {goingCrew.length > 0 && (
              <><p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Crew</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {goingCrew.map((a: any) => {
                  const p = a.profiles, n = p?.display_name ?? p?.username ?? '?'
                  const parts = n.split(' '), short = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : n
                  return (<div key={a.user_id} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: '#1e1e1e' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#333' }}>
                      {p?.avatar_url ? <img src={p.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" /> : n[0]}
                    </div>
                    <span className="text-xs text-[#aaa]">{short}</span>
                  </div>)
                })}
              </div></>
            )}
            {goingGuests.length > 0 && (
              <><p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Other guests</p>
              <div className="flex flex-wrap gap-2">
                {goingGuests.map((a: any) => {
                  const n = a.guest_display_name ?? 'Guest'
                  const parts = n.split(' '), short = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : n
                  return (<div key={a.user_id} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: '#1e1e1e' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#444' }}>{n[0].toUpperCase()}</div>
                    <span className="text-xs text-[#aaa]">{short}</span>
                    <span className="text-[9px] text-[#444]">guest</span>
                  </div>)
                })}
              </div></>
            )}
          </div>
        )}
        {!frozen && (
          <div className="rounded-xl p-4" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
            <p className="text-sm font-semibold text-white mb-1">Message the host</p>
            <p className="text-xs text-[#555] mb-3">Send a message to {host?.display_name ?? host?.username}</p>
            {msgSent ? (
              <p className="text-xs text-[#34d399]">Message sent!</p>
            ) : (
              <div className="flex gap-2">
                <input value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Ask something..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-[#555] outline-none"
                  style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
                <button onClick={handleSendMessage} disabled={pending || !msgBody.trim()}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: '#7F77DD', color: 'white', opacity: !msgBody.trim() ? 0.4 : 1 }}>Send</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}