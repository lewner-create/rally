'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, type Profile } from '@/lib/actions/profile'
import { saveWeeklyAvailability, type WeeklyAvailability } from '@/lib/actions/availability'

const accent = '#7F77DD'

// ── Activity interests ──────────────────────────────────────────────
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

// ── Availability presets ────────────────────────────────────────────
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
const WEEKDAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const WEEKEND: DayKey[]  = ['sat', 'sun']
const ALL_DAYS: DayKey[] = [...WEEKDAYS, WEEKEND[0], WEEKEND[1]]

const PRESETS = [
  {
    id: 'weeknights',
    label: 'Weeknights',
    description: 'Mon–Fri evenings',
    days: WEEKDAYS,
    hours: [19, 20, 21, 22],
  },
  {
    id: 'weekend_days',
    label: 'Weekend days',
    description: 'Sat & Sun daytime',
    days: WEEKEND,
    hours: [10, 11, 12, 13, 14, 15, 16, 17],
  },
  {
    id: 'weekend_nights',
    label: 'Weekend nights',
    description: 'Fri–Sun evenings',
    days: ['fri' as DayKey, ...WEEKEND],
    hours: [20, 21, 22, 23],
  },
  {
    id: 'mornings',
    label: 'Mornings',
    description: 'Any day, before noon',
    days: ALL_DAYS,
    hours: [7, 8, 9, 10, 11],
  },
  {
    id: 'midday',
    label: 'Midday',
    description: 'Weekday lunch windows',
    days: WEEKDAYS,
    hours: [11, 12, 13, 14],
  },
  {
    id: 'late_nights',
    label: 'Late nights',
    description: 'After 11pm',
    days: ALL_DAYS,
    hours: [23],
  },
]

function presetsToWeekly(selected: string[]): WeeklyAvailability {
  const result: WeeklyAvailability = {
    mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
  }
  for (const presetId of selected) {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) continue
    for (const day of preset.days) {
      const existing = new Set(result[day])
      for (const h of preset.hours) existing.add(h)
      result[day] = Array.from(existing).sort((a, b) => a - b)
    }
  }
  return result
}

// ── Component ───────────────────────────────────────────────────────
interface OnboardingFlowProps {
  profile: Profile
}

export function OnboardingFlow({ profile }: OnboardingFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [username, setUsername]       = useState(profile.username ?? '')
  const [interests, setInterests]     = useState<string[]>([])
  const [presets, setPresets]         = useState<string[]>([])

  const toggleInterest = (id: string) =>
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const togglePreset = (id: string) =>
    setPresets(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleFinish = () => {
    startTransition(async () => {
      await Promise.all([
        updateProfile({
          display_name: displayName,
          username,
          preferences: {
            interests,
            onboarded: true,
          },
        }),
        saveWeeklyAvailability(presetsToWeekly(presets)),
      ])
      router.push('/dashboard')
    })
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo + progress */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '17px', fontWeight: 800, color: accent, margin: '0 0 20px' }}>rally</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                flex: 1, height: '3px', borderRadius: '9999px',
                background: n <= step ? accent : '#222',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px' }}>
              What should we call you?
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 32px' }}>
              This is how your friends will see you in Rally.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={labelStyle}>Display name</label>
                <input
                  autoFocus
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
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: '#444', fontSize: '14px',
                    pointerEvents: 'none',
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
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!displayName.trim() || !username.trim()}
              style={primaryBtnStyle(!!displayName.trim() && !!username.trim())}
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 2: Interests ── */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px' }}>
              What do you like to do?
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 32px' }}>
              Pick as many as you like. This helps Rally suggest the right plans.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
              {ACTIVITY_TYPES.map(a => {
                const active = interests.includes(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleInterest(a.id)}
                    style={{
                      padding: '9px 16px', borderRadius: '9999px',
                      cursor: 'pointer', fontSize: '14px',
                      fontWeight: active ? 600 : 400, fontFamily: 'inherit',
                      transition: 'all 0.15s',
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={ghostBtnStyle}>Back</button>
              <button onClick={() => setStep(3)} style={{ ...primaryBtnStyle(true), flex: 1 }}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Availability ── */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px' }}>
              When are you usually free?
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 32px' }}>
              This sets your default availability. You can always adjust it later.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              {PRESETS.map(p => {
                const active = presets.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePreset(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                      background: active ? `${accent}18` : '#161616',
                      border: active ? `1px solid ${accent}44` : '1px solid #222',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: active ? '#fff' : '#ccc' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                        {p.description}
                      </div>
                    </div>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                      border: active ? 'none' : '2px solid #333',
                      background: active ? accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                    </div>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} style={ghostBtnStyle}>Back</button>
              <button
                onClick={handleFinish}
                disabled={isPending}
                style={{ ...primaryBtnStyle(true), flex: 1, opacity: isPending ? 0.7 : 1 }}
              >
                {isPending ? 'Setting up...' : "Let's go"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '12px',
  border: '1px solid #2a2a2a', fontSize: '15px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: '#1a1a1a',
  color: '#fff', transition: 'border-color 0.15s',
}

const primaryBtnStyle = (enabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '13px', borderRadius: '9999px', border: 'none',
  cursor: enabled ? 'pointer' : 'default',
  background: enabled ? accent : '#1a1a1a',
  color: enabled ? 'white' : '#444',
  fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
  transition: 'background 0.2s',
})

const ghostBtnStyle: React.CSSProperties = {
  padding: '13px 20px', borderRadius: '9999px',
  border: '1px solid #2a2a2a', background: 'transparent',
  color: '#666', fontSize: '15px', fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}
