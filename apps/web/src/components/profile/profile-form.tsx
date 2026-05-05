'use client'

import { useState, useRef, useTransition } from 'react'
import { updateProfile, uploadAvatar, type Profile } from '@/lib/actions/profile'

const T = {
  bg:     '#0f0f0f',
  elev:   '#17171a',
  elev2:  '#1c1c20',
  border: 'rgba(255,255,255,0.08)',
  text:   '#f5f4f8',
  dim:    '#a8a4b8',
  mute:   '#6b6878',
  faint:  '#4a4757',
  violet: '#7F77DD',
  violetSoft: 'rgba(127,119,221,0.15)',
}

const ACTIVITY_TYPES = [
  { id: 'gaming',     label: 'Gaming' },
  { id: 'dining',     label: 'Dining out' },
  { id: 'day_trips',  label: 'Day trips' },
  { id: 'road_trips', label: 'Road trips' },
  { id: 'hiking',     label: 'Hiking' },
  { id: 'events',     label: 'Events' },
  { id: 'nightlife',  label: 'Nightlife' },
  { id: 'movies',     label: 'Movie nights' },
  { id: 'sports',     label: 'Sports' },
  { id: 'travel',     label: 'Travel' },
]

export function ProfileForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [username,    setUsername]    = useState(profile.username ?? '')
  const [bio,         setBio]         = useState(profile.bio ?? '')
  const [avatarUrl,   setAvatarUrl]   = useState(profile.avatar_url ?? '')
  const [interests,   setInterests]   = useState<string[]>(
    (profile.preferences?.interests as string[]) ?? []
  )
  const [saved,     setSaved]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleInterest = (id: string) =>
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const handleSave = () => {
    startTransition(async () => {
      await updateProfile({ display_name: displayName, username, bio, preferences: { interests } })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('avatar', file)
      const url = await uploadAvatar(fd)
      setAvatarUrl(url)
    } finally { setUploading(false) }
  }

  const initials = (displayName || username || '?')[0].toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px 80px' }}>

        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: T.text, margin: '0 0 4px' }}>
          Profile
        </h1>
        <p style={{ fontSize: 14, color: T.mute, margin: '0 0 32px' }}>Your identity across Rally</p>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div onClick={() => fileRef.current?.click()} style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${T.violet}, #b66adb)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', position: 'relative',
            boxShadow: `0 2px 16px rgba(127,119,221,0.3)`,
          }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>{initials}</span>
            }
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 600 }}>…</div>
            )}
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()} style={{
              padding: '8px 16px', borderRadius: 9, border: `1px solid ${T.border}`,
              background: T.elev, fontSize: 13, fontWeight: 600, color: T.dim,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <p style={{ fontSize: 12, color: T.faint, margin: '6px 0 0' }}>JPG or PNG, max 2MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
        </div>

        {/* Identity */}
        <div style={CARD}>
          <p style={LABEL_S}>Identity</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={FIELD_LABEL}>Display name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" style={INPUT}
                onFocus={e => (e.target.style.borderColor = T.violet)} onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.faint, fontSize: 14, pointerEvents: 'none' }}>@</span>
                <input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())} placeholder="username"
                  style={{ ...INPUT, paddingLeft: 28 }}
                  onFocus={e => (e.target.style.borderColor = T.violet)} onBlur={e => (e.target.style.borderColor = T.border)} />
              </div>
              <p style={HINT}>Used for invite links and @mentions</p>
            </div>
            <div>
              <label style={FIELD_LABEL}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A short intro…" rows={3}
                style={{ ...INPUT, resize: 'vertical', minHeight: 72, lineHeight: 1.5, paddingTop: 9 } as React.CSSProperties}
                onFocus={e => (e.target.style.borderColor = T.violet)} onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Email</label>
              <div style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, color: T.faint, background: 'rgba(255,255,255,0.02)' }}>
                Connected via auth
              </div>
              <p style={HINT}>Email cannot be changed here</p>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div style={{ ...CARD, marginTop: 16 }}>
          <p style={LABEL_S}>Interests</p>
          <p style={{ fontSize: 13, color: T.mute, margin: '0 0 14px' }}>What kinds of plans do you usually join?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ACTIVITY_TYPES.map(a => {
              const active = interests.includes(a.id)
              return (
                <button key={a.id} onClick={() => toggleInterest(a.id)} style={{
                  padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
                  fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: 'inherit',
                  background: active ? T.violetSoft : T.elev2,
                  border: `1px solid ${active ? 'rgba(127,119,221,0.4)' : T.border}`,
                  color: active ? T.violet : T.mute,
                  transition: 'all 0.15s',
                }}>
                  {a.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={isPending} style={{
          marginTop: 20, width: '100%', padding: 13,
          borderRadius: 10, border: 'none', cursor: isPending ? 'default' : 'pointer',
          background: saved ? '#1D9E75' : T.violet, color: 'white',
          fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
          boxShadow: saved ? '0 4px 16px rgba(29,158,117,0.3)' : '0 4px 20px rgba(127,119,221,0.3)',
          transition: 'background 0.2s', opacity: isPending ? 0.7 : 1,
        }}>
          {saved ? 'Saved ✓' : isPending ? 'Saving…' : 'Save changes'}
        </button>

      </div>
    </div>
  )
}

const CARD: React.CSSProperties = {
  background: '#17171a', borderRadius: 16, padding: '20px 22px',
  border: 'rgba(255,255,255,0.08)' && '1px solid rgba(255,255,255,0.08)',
}
const LABEL_S: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#4a4757',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px',
}
const FIELD_LABEL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#6b6878',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}
const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: '#1c1c20',
  color: '#f5f4f8', transition: 'border-color 0.15s',
}
const HINT: React.CSSProperties = { fontSize: 12, color: '#4a4757', margin: '5px 0 0' }
