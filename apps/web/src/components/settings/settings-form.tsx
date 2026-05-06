'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateProfile, type Profile } from '@/lib/actions/profile'
import { generateInviteToken, getMyInvites, type InviteToken } from '@/lib/actions/invites'
import { resetTour } from '@/lib/actions/tour'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check } from 'lucide-react'

const accent = '#7F77DD'

const NOTIF_OPTIONS = [
  {
    id: 'notif_new_plan',
    label: 'New plan card',
    description: 'Someone starts a plan in one of your groups',
  },
  {
    id: 'notif_locked_in',
    label: 'Plan locked in',
    description: 'A plan you voted on becomes a confirmed event',
  },
  {
    id: 'notif_group_activity',
    label: 'Group activity',
    description: 'New messages in your group chats',
  },
  {
    id: 'notif_rsvp_reminder',
    label: 'RSVP reminders',
    description: "Reminder when you haven't responded to a plan",
  },
]

interface SettingsFormProps {
  profile: Profile & { invite_credits?: number }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date()
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router                        = useRouter()
  const [isPending, startTransition]  = useTransition()
  const [saved, setSaved]             = useState(false)
  const [signingOut, setSigningOut]   = useState(false)

  // Notifications
  const initNotifs = (): Record<string, boolean> => {
    const saved = profile.preferences?.notifications as Record<string, boolean> | undefined
    return NOTIF_OPTIONS.reduce((acc, opt) => {
      acc[opt.id] = saved?.[opt.id] ?? true
      return acc
    }, {} as Record<string, boolean>)
  }
  const [notifs, setNotifs] = useState<Record<string, boolean>>(initNotifs)

  const toggle = (id: string) => setNotifs(prev => ({ ...prev, [id]: !prev[id] }))

  const handleSave = () => {
    startTransition(async () => {
      await updateProfile({ preferences: { ...profile.preferences, notifications: notifs } })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  // Invites
  const [invites, setInvites]         = useState<InviteToken[]>([])
  const [credits, setCredits]         = useState(profile.invite_credits ?? 5)
  const [inviteLabel, setInviteLabel] = useState('')
  const [generating, setGenerating]   = useState(false)
  const [genError, setGenError]       = useState<string | null>(null)
  const [copiedId, setCopiedId]       = useState<string | null>(null)

  useEffect(() => {
    getMyInvites().then(setInvites)
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setGenError(null)
    const result = await generateInviteToken(inviteLabel || undefined)
    if (result.error) {
      setGenError(result.error)
    } else {
      setCredits(c => Math.max(0, c - 1))
      setInviteLabel('')
      getMyInvites().then(setInvites)
      // Auto-copy the new link
      if (result.url) {
        navigator.clipboard.writeText(result.url).catch(() => {})
        setCopiedId('new')
        setTimeout(() => setCopiedId(null), 2000)
      }
    }
    setGenerating(false)
  }

  function copyLink(token: string, id: string) {
    const baseUrl = window.location.origin
    navigator.clipboard.writeText(`${baseUrl}/welcome/${token}`).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Repeat guide
  const handleRepeatGuide = () => {
    startTransition(async () => {
      await resetTour()
      router.push('/dashboard')
    })
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 20px 80px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Settings</h1>
        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 32px' }}>Account and preferences</p>

        {/* Account */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link href="/profile" style={linkRowStyle}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Profile</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '1px' }}>
                  {profile.display_name ?? profile.username} · @{profile.username}
                </div>
              </div>
              <span style={{ color: '#444', fontSize: '16px' }}>›</span>
            </Link>
            <div style={{ height: '1px', background: '#1e1e1e' }} />
            <Link href="/availability" style={linkRowStyle}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Availability</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '1px' }}>Manage your default free windows</div>
              </div>
              <span style={{ color: '#444', fontSize: '16px' }}>›</span>
            </Link>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ ...cardStyle, marginTop: '16px' }}>
          <p style={sectionLabelStyle}>Notifications</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {NOTIF_OPTIONS.map((opt, i) => (
              <div key={opt.id}>
                {i > 0 && <div style={{ height: '1px', background: '#1e1e1e' }} />}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '16px', padding: '14px 0',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{opt.description}</div>
                  </div>
                  <button
                    onClick={() => toggle(opt.id)}
                    style={{
                      width: '44px', height: '26px', borderRadius: '9999px',
                      border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: notifs[opt.id] ? accent : '#2a2a2a',
                      position: 'relative', transition: 'background 0.2s', padding: 0,
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: 'white', position: 'absolute', top: '3px',
                      left: notifs[opt.id] ? '21px' : '3px',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              marginTop: '8px', width: '100%', padding: '11px',
              borderRadius: '9999px', border: 'none',
              cursor: isPending ? 'default' : 'pointer',
              background: saved ? '#1D9E75' : accent, color: 'white',
              fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
              transition: 'background 0.2s', opacity: isPending ? 0.7 : 1,
            }}
          >
            {saved ? 'Saved!' : isPending ? 'Saving…' : 'Save notifications'}
          </button>
        </div>

        {/* Invites */}
        <div style={{ ...cardStyle, marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ ...sectionLabelStyle, margin: 0 }}>Invite someone</p>
            <div style={{
              fontSize: '12px', fontWeight: 700,
              color: credits > 0 ? accent : '#555',
              background: credits > 0 ? 'rgba(127,119,221,0.12)' : '#1e1e1e',
              padding: '3px 10px', borderRadius: '9999px',
            }}>
              {credits} invite{credits !== 1 ? 's' : ''} left
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#555', margin: '0 0 14px', lineHeight: 1.5 }}>
            Generate a personal invite link. Anyone with the link can join Volta — no approval needed.
          </p>

          {/* Generate row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Label (optional — e.g. a name)"
              value={inviteLabel}
              onChange={e => setInviteLabel(e.target.value)}
              disabled={credits <= 0}
              style={{
                flex: 1, padding: '10px 12px',
                borderRadius: '10px', border: '1px solid #2a2a2a',
                background: '#0f0f0f', color: '#fff',
                fontSize: '14px', fontFamily: 'inherit',
                outline: 'none',
                opacity: credits <= 0 ? 0.4 : 1,
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={generating || credits <= 0}
              style={{
                padding: '10px 16px', borderRadius: '10px',
                border: 'none',
                background: credits > 0 ? accent : '#2a2a2a',
                color: credits > 0 ? '#fff' : '#555',
                fontSize: '13px', fontWeight: 700,
                cursor: generating || credits <= 0 ? 'default' : 'pointer',
                fontFamily: 'inherit', flexShrink: 0,
                opacity: generating ? 0.7 : 1,
              }}
            >
              {generating ? '…' : 'Generate'}
            </button>
          </div>

          {genError && (
            <div style={{
              fontSize: '13px', color: '#e05a5a',
              marginBottom: '8px', padding: '8px 12px',
              background: 'rgba(224,90,90,0.08)',
              borderRadius: '8px',
            }}>
              {genError}
            </div>
          )}

          {copiedId === 'new' && (
            <div style={{
              fontSize: '13px', color: '#1D9E75',
              marginBottom: '8px', padding: '8px 12px',
              background: 'rgba(29,158,117,0.08)',
              borderRadius: '8px',
            }}>
              ✓ Link copied to clipboard!
            </div>
          )}

          {/* Invite list */}
          {invites.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #1e1e1e', paddingTop: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                Your invites
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {invites.map(inv => {
                  const expired = isExpired(inv.expires_at)
                  const used    = !!inv.used_at
                  const status  = used ? 'accepted' : expired ? 'expired' : 'pending'
                  const isCopied = copiedId === inv.id

                  return (
                    <div
                      key={inv.id}
                      style={{
                        display: 'flex', alignItems: 'center',
                        gap: '10px', padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#0f0f0f',
                        border: '1px solid #1e1e1e',
                      }}
                    >
                      {/* Status dot */}
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background: status === 'accepted' ? '#1D9E75' : status === 'expired' ? '#555' : '#f5a623',
                      }} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0', lineHeight: 1.2 }}>
                          {inv.label || `Invite ${inv.token.slice(0, 6)}…`}
                        </div>
                        <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
                          {status === 'accepted' && inv.used_by_profile
                            ? `Accepted by ${inv.used_by_profile.display_name ?? inv.used_by_profile.username} · ${formatDate(inv.used_at!)}`
                            : status === 'accepted'
                              ? `Accepted · ${formatDate(inv.used_at!)}`
                              : status === 'expired'
                                ? `Expired · ${formatDate(inv.expires_at)}`
                                : `Pending · expires ${formatDate(inv.expires_at)}`
                          }
                        </div>
                      </div>

                      {/* Copy button (only for pending, non-expired) */}
                      {status === 'pending' && (
                        <button
                          onClick={() => copyLink(inv.token, inv.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '30px', height: '30px', borderRadius: '8px',
                            border: '1px solid #2a2a2a', background: '#1a1a1a',
                            cursor: 'pointer', color: isCopied ? '#1D9E75' : '#666',
                            flexShrink: 0,
                          }}
                          title="Copy link"
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* App */}
        <div style={{ ...cardStyle, marginTop: '16px' }}>
          <p style={sectionLabelStyle}>App</p>
          <button
            onClick={handleRepeatGuide}
            disabled={isPending}
            style={{
              width: '100%', padding: '11px', borderRadius: '9999px',
              border: '1px solid #2a2a2a', background: 'transparent',
              color: '#999', fontSize: '14px', fontWeight: 600,
              cursor: isPending ? 'default' : 'pointer', fontFamily: 'inherit',
              opacity: isPending ? 0.6 : 1, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '10px',
              paddingLeft: '16px',
            }}
          >
            <span style={{ fontSize: '16px' }}>🗺️</span>
            Repeat Volta guide
          </button>
        </div>

        {/* Danger zone */}
        <div style={{ ...cardStyle, marginTop: '16px', borderColor: '#2a1a1a' }}>
          <p style={{ ...sectionLabelStyle, color: '#6b3333' }}>Account</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: '100%', padding: '11px', borderRadius: '9999px',
              border: '1px solid #3a1f1f', background: '#1a1010',
              color: '#cc5555', fontSize: '14px', fontWeight: 600,
              cursor: signingOut ? 'default' : 'pointer', fontFamily: 'inherit',
              opacity: signingOut ? 0.6 : 1,
            }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#161616', borderRadius: '18px', padding: '24px',
  border: '1px solid #222',
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#444',
  textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px',
}

const linkRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 0', textDecoration: 'none', cursor: 'pointer',
}
