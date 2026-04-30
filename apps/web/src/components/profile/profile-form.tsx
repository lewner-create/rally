'use client'

import { useState, useRef, useTransition } from 'react'
import { updateProfile, uploadAvatar, type Profile } from '@/lib/actions/profile'

const ACTIVITY_TYPES = [
  { id: 'gaming',    label: 'Gaming' },
  { id: 'dining',    label: 'Dining out' },
  { id: 'day_trips', label: 'Day trips' },
  { id: 'road_trips',label: 'Road trips' },
  { id: 'hiking',    label: 'Hiking' },
  { id: 'events',    label: 'Events' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'movies',    label: 'Movie nights' },
  { id: 'sports',    label: 'Sports' },
  { id: 'travel',    label: 'Travel' },
]

export function ProfileForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [username, setUsername]       = useState(profile.username ?? '')
  const [bio, setBio]                 = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl]     = useState(profile.avatar_url ?? '')
  const [interests, setInterests]     = useState<string[]>(
    (profile.preferences?.interests as string[]) ?? []
  )
  const [saved, setSaved]             = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [isPending, startTransition]  = useTransition()
  const fileRef                       = useRef<HTMLInputElement>(null)

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    startTransition(async () => {
      await updateProfile({
        display_name: displayName,
        username,
        bio,
        preferences: { interests },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const url = await uploadAvatar(fd)
      setAvatarUrl(url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const initials = (displayName || username || '?')[0].toUpperCase()
  const accent = '#7F77DD'

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 20px 80px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          Profile
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 32px' }}>
          Your identity across Rally
        </p>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
              background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${accent}, #5B52C8)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              boxShadow: `0 2px 16px ${accent}40`,
            }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>{initials}</span>
            }
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: 'white', fontWeight: 600,
              }}>...</div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                padding: '8px 16px', borderRadius: '9999px',
                border: '1px solid #2a2a2a', background: '#1a1a1a',
                fontSize: '13px', fontWeight: 600, color: '#ccc',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {uploading ? 'Uploading...' : 'Change photo'}
            </button>
            <p style={{ fontSize: '12px', color: '#444', margin: '6px 0 0' }}>JPG or PNG, max 2MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
        </div>

        {/* Identity card */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Identity</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Display name</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = accent)}
                onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>
            <div>
              <label style={labelStyle}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: '#444', fontSize: '14px', pointerEvents: 'none',
                }}>@</span>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                  placeholder="username"
                  style={{ ...inputStyle, paddingLeft: '28px' }}
                  onFocus={e => (e.target.style.borderColor = accent)}
                  onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>
              <p style={hintStyle}>Used for invite links and @mentions</p>
            </div>
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="A short intro..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '72px',
                  lineHeight: 1.5,
                  paddingTop: '9px',
                }}
                onFocus={e => (e.target.style.borderColor = accent)}
                onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{
                padding: '9px 12px', borderRadius: '10px', border: '1px solid #1e1e1e',
                fontSize: '14px', color: '#444', background: '#111',
              }}>
                Connected via Supabase Auth
              </div>
              <p style={hintStyle}>Email cannot be changed here</p>
            </div>
          </div>
        </div>

        {/* Interests card */}
        <div style={{ ...cardStyle, marginTop: '16px' }}>
          <p style={sectionLabelStyle}>Interests</p>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 14px' }}>
            What kinds of plans do you usually join?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ACTIVITY_TYPES.map(a => {
              const active = interests.includes(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => toggleInterest(a.id)}
                  style={{
                    padding: '7px 14px', borderRadius: '9999px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: active ? 600 : 400,
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    background: active ? `${accent}22` : '#1a1a1a',
                    border: active ? `1px solid ${accent}66` : '1px solid #2a2a2a',
                    color: active ? accent : '#888',
                  }}
                >
                  {a.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isPending}
          style={{
            marginTop: '20px', width: '100%', padding: '13px',
            borderRadius: '9999px', border: 'none', cursor: isPending ? 'default' : 'pointer',
            background: saved ? '#1D9E75' : accent, color: 'white',
            fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
            boxShadow: saved ? '0 4px 16px rgba(29,158,117,0.3)' : `0 4px 20px ${accent}40`,
            transition: 'background 0.2s, box-shadow 0.2s',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {saved ? 'Saved!' : isPending ? 'Saving...' : 'Save changes'}
        </button>
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
  textTransform: 'uppercase', letterSpacing: '0.06em',
  margin: '0 0 16px',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '10px',
  border: '1px solid #2a2a2a', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: '#1a1a1a',
  color: '#fff', transition: 'border-color 0.15s',
}

const hintStyle: React.CSSProperties = {
  fontSize: '12px', color: '#444', margin: '5px 0 0',
}
