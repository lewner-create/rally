'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateProfile, type Profile } from '@/lib/actions/profile'
import { resetTour } from '@/lib/actions/tour'
import { createClient } from '@/lib/supabase/client'

const accent = '#7F77DD'

const NOTIF_OPTIONS = [
  { id: 'notif_new_plan',        label: 'New plan card',    description: 'Someone starts a plan in one of your groups' },
  { id: 'notif_locked_in',       label: 'Plan locked in',   description: 'A plan you voted on becomes a confirmed event' },
  { id: 'notif_group_activity',  label: 'Group activity',   description: 'New messages in your group chats' },
  { id: 'notif_rsvp_reminder',   label: 'RSVP reminders',   description: "Reminder when you haven't responded to a plan" },
]

interface SettingsFormProps {
  profile: Profile
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition]      = useTransition()
  const [isResetting, startResetTrans]    = useTransition()
  const [saved, setSaved]                 = useState(false)
  const [signingOut, setSigningOut]       = useState(false)

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

  const handleRepeatGuide = () => {
    startResetTrans(async () => {
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

        {/* App */}
        <div style={{ ...cardStyle, marginTop: '16px' }}>
          <p style={sectionLabelStyle}>App</p>
          <button
            onClick={handleRepeatGuide}
            disabled={isResetting}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', background: 'none', border: 'none', cursor: isResetting ? 'default' : 'pointer',
              fontFamily: 'inherit', opacity: isResetting ? 0.6 : 1,
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', textAlign: 'left' }}>
                {isResetting ? 'Restarting guide…' : 'Repeat Volta guide'}
              </div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '1px', textAlign: 'left' }}>
                Walk through the app tour again
              </div>
            </div>
            <span style={{ color: '#444', fontSize: '16px', flexShrink: 0 }}>›</span>
          </button>
        </div>

        {/* Notifications */}
        <div style={{ ...cardStyle, marginTop: '16px' }}>
          <p style={sectionLabelStyle}>Notifications</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            {NOTIF_OPTIONS.map((opt, i) => (
              <div key={opt.id}>
                {i > 0 && <div style={{ height: '1px', background: '#1e1e1e' }} />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '14px 0' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{opt.description}</div>
                  </div>
                  <button
                    onClick={() => toggle(opt.id)}
                    style={{ width: '44px', height: '26px', borderRadius: '9999px', border: 'none', cursor: 'pointer', flexShrink: 0, background: notifs[opt.id] ? accent : '#2a2a2a', position: 'relative', transition: 'background 0.2s', padding: 0 }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: notifs[opt.id] ? '21px' : '3px', transition: 'left 0.2s' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{ marginTop: '8px', width: '100%', padding: '11px', borderRadius: '9999px', border: 'none', cursor: isPending ? 'default' : 'pointer', background: saved ? '#1D9E75' : accent, color: 'white', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit', transition: 'background 0.2s', opacity: isPending ? 0.7 : 1 }}
          >
            {saved ? 'Saved!' : isPending ? 'Saving...' : 'Save notifications'}
          </button>
        </div>

        {/* Sign out */}
        <div style={{ ...cardStyle, marginTop: '16px', borderColor: '#2a1a1a' }}>
          <p style={{ ...sectionLabelStyle, color: '#6b3333' }}>Account</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ width: '100%', padding: '11px', borderRadius: '9999px', border: '1px solid #3a1f1f', background: '#1a1010', color: '#cc5555', fontSize: '14px', fontWeight: 600, cursor: signingOut ? 'default' : 'pointer', fontFamily: 'inherit', opacity: signingOut ? 0.6 : 1 }}
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>

      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#161616', borderRadius: '18px', padding: '24px', border: '1px solid #222',
}
const sectionLabelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#444',
  textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px',
}
const linkRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 0', textDecoration: 'none', cursor: 'pointer',
}
