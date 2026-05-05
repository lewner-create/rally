'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateProfile, type Profile } from '@/lib/actions/profile'
import { createClient } from '@/lib/supabase/client'

const accent = '#7F77DD'

const NOTIF_OPTIONS = [
  { id: 'notif_new_plan',       label: 'New plan card',    description: 'Someone starts a plan in one of your groups' },
  { id: 'notif_locked_in',      label: 'Plan locked in',   description: 'A plan you voted on becomes a confirmed event' },
  { id: 'notif_group_activity', label: 'Group activity',   description: 'New messages in your group chats' },
  { id: 'notif_rsvp_reminder',  label: 'RSVP reminders',   description: "Reminder when you haven't responded to a plan" },
]

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [signingOut, setSigningOut] = useState(false)

  const initNotifs = (): Record<string, boolean> => {
    const saved = profile.preferences?.notifications as Record<string, boolean> | undefined
    return NOTIF_OPTIONS.reduce((acc, opt) => {
      acc[opt.id] = saved?.[opt.id] ?? true
      return acc
    }, {} as Record<string, boolean>)
  }

  const [notifs, setNotifs] = useState<Record<string, boolean>>(initNotifs)

  // Auto-save on toggle — no save button needed
  function toggle(id: string) {
    const next = { ...notifs, [id]: !notifs[id] }
    setNotifs(next)
    startTransition(async () => {
      await updateProfile({
        preferences: { ...profile.preferences, notifications: next },
      })
    })
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 20px 80px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 4px' }}>
          Settings
        </h1>
        <p style={{ fontSize: '14px', color: '#6b6878', margin: '0 0 32px' }}>Account and preferences</p>

        {/* Account */}
        <div style={CARD}>
          <p style={LABEL}>Account</p>
          <Link href="/profile" style={ROW_LINK}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f4f8' }}>Profile</div>
              <div style={{ fontSize: '12px', color: '#6b6878', marginTop: 1 }}>
                {profile.display_name ?? profile.username} · @{profile.username}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4757" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
          </Link>
          <div style={DIVIDER} />
          <Link href="/availability" style={ROW_LINK}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f4f8' }}>Availability</div>
              <div style={{ fontSize: '12px', color: '#6b6878', marginTop: 1 }}>Manage your free windows and calendar sync</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4757" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
          </Link>
        </div>

        {/* Notifications — auto-save */}
        <div style={{ ...CARD, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ ...LABEL, margin: 0 }}>Notifications</p>
            <span style={{ fontSize: 11, color: '#4a4757' }}>Auto-saved</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {NOTIF_OPTIONS.map((opt, i) => (
              <div key={opt.id}>
                {i > 0 && <div style={DIVIDER} />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '13px 0' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#e0ddf0' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: '#6b6878', marginTop: 2 }}>{opt.description}</div>
                  </div>
                  <button
                    onClick={() => toggle(opt.id)}
                    style={{
                      width: 44, height: 26, borderRadius: 9999,
                      border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: notifs[opt.id] ? accent : '#2a2a35',
                      position: 'relative', transition: 'background 0.2s', padding: 0,
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: notifs[opt.id] ? 21 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out — not destructive */}
        <div style={{ ...CARD, marginTop: 16 }}>
          <p style={LABEL}>Session</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: '100%', padding: '11px', borderRadius: 10,
              border: `1px solid rgba(255,255,255,0.08)`,
              background: 'rgba(255,255,255,0.04)',
              color: '#a8a4b8', fontSize: '14px', fontWeight: 500,
              cursor: signingOut ? 'default' : 'pointer', fontFamily: 'inherit',
              opacity: signingOut ? 0.6 : 1, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!signingOut) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        {/* App version */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#4a4757', marginTop: 32 }}>
          Rally · Beta
        </p>

      </div>
    </div>
  )
}

const CARD: React.CSSProperties = {
  background: '#17171a', borderRadius: 16, padding: '20px 22px',
  border: '1px solid rgba(255,255,255,0.08)',
}
const LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#4a4757',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px',
}
const DIVIDER: React.CSSProperties = { height: 1, background: 'rgba(255,255,255,0.06)' }
const ROW_LINK: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 0', textDecoration: 'none', cursor: 'pointer',
}
