'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, type Profile } from '@/lib/actions/profile'
import { saveWeeklyAvailability, type WeeklyAvailability } from '@/lib/actions/availability'

const accent = '#7F77DD'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
const WEEKDAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const WEEKEND:  DayKey[] = ['sat', 'sun']
const ALL_DAYS: DayKey[] = [...WEEKDAYS, ...WEEKEND]

const PRESETS = [
  { id: 'weeknights',    label: 'Weeknights',    description: 'Mon–Fri evenings',    days: WEEKDAYS,                          hours: [19,20,21,22] },
  { id: 'weekend_days',  label: 'Weekend days',  description: 'Sat & Sun daytime',   days: WEEKEND,                           hours: [10,11,12,13,14,15,16,17] },
  { id: 'weekend_nights',label: 'Weekend nights',description: 'Fri–Sun evenings',    days: ['fri' as DayKey,...WEEKEND],       hours: [20,21,22,23] },
  { id: 'mornings',      label: 'Mornings',      description: 'Any day, before noon',days: ALL_DAYS,                          hours: [7,8,9,10,11] },
  { id: 'midday',        label: 'Midday',        description: 'Weekday lunch windows',days: WEEKDAYS,                         hours: [11,12,13,14] },
  { id: 'late_nights',   label: 'Late nights',   description: 'After 11pm',          days: ALL_DAYS,                          hours: [23] },
]

function presetsToWeekly(selected: string[]): WeeklyAvailability {
  const result: WeeklyAvailability = { mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[] }
  for (const id of selected) {
    const p = PRESETS.find(p => p.id === id)
    if (!p) continue
    for (const day of p.days) {
      const s = new Set(result[day])
      p.hours.forEach(h => s.add(h))
      result[day] = Array.from(s).sort((a,b) => a-b)
    }
  }
  return result
}

interface Props { profile: Profile }

export function OnboardingFlow({ profile }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Detect if user needs username step (Google sign-in users have display_name but no username)
  const needsUsername = !profile.username

  // Steps: 'username' (optional) → 'availability'
  const [step, setStep] = useState<'username' | 'availability'>(
    needsUsername ? 'username' : 'availability'
  )
  const totalSteps   = needsUsername ? 2 : 1
  const currentStep  = needsUsername ? (step === 'username' ? 1 : 2) : 1

  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [username,    setUsername]    = useState('')
  const [presets,     setPresets]     = useState<string[]>([])

  const togglePreset = (id: string) =>
    setPresets(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleFinish = () => {
    startTransition(async () => {
      await Promise.all([
        updateProfile({
          ...(needsUsername ? { display_name: displayName.trim(), username: username.trim() } : {}),
          preferences: { ...(profile.preferences ?? {}), onboarded: true },
        }),
        presets.length > 0 ? saveWeeklyAvailability(presetsToWeekly(presets)) : Promise.resolve(),
      ])
      router.push('/dashboard')
    })
  }

  const firstName = (profile.display_name ?? profile.username ?? 'there').split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo + progress */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '17px', fontWeight: 800, color: accent, margin: '0 0 20px' }}>rally</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: '3px', borderRadius: '9999px', background: i < currentStep ? accent : '#222', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {/* ── Username step (Google users only) ── */}
        {step === 'username' && (
          <div>
            <h1 style={h1}>Welcome to Rally{displayName ? `, ${displayName.split(' ')[0]}` : ''}!</h1>
            <p style={sub}>Just need one thing before we get started — pick a username so your friends can find you.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {/* Display name — pre-filled from Google but editable */}
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
              {/* Username */}
              <div>
                <label style={labelStyle}>Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#444', fontSize: '14px', pointerEvents: 'none' }}>@</span>
                  <input
                    autoFocus
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi,'').toLowerCase())}
                    placeholder="username"
                    style={{ ...inputStyle, paddingLeft: '28px' }}
                    onFocus={e => (e.target.style.borderColor = accent)}
                    onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#444', margin: '6px 0 0' }}>Letters, numbers, and underscores only</p>
              </div>
            </div>

            <button
              onClick={() => setStep('availability')}
              disabled={!displayName.trim() || username.trim().length < 3}
              style={primaryBtn(!!displayName.trim() && username.trim().length >= 3)}
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Availability step ── */}
        {step === 'availability' && (
          <div>
            <h1 style={h1}>When are you usually free, {firstName}?</h1>
            <p style={sub}>Rally uses this to find the best times for your groups. You can always adjust it later.</p>
            <p style={{ fontSize: '12px', color: '#444', margin: '0 0 28px' }}>Select at least one to get started.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              {PRESETS.map(p => {
                const active = presets.includes(p.id)
                return (
                  <button key={p.id} onClick={() => togglePreset(p.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                    background: active ? `${accent}18` : '#161616',
                    border: active ? `1px solid ${accent}44` : '1px solid #222',
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: active ? '#fff' : '#ccc' }}>{p.label}</div>
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{p.description}</div>
                    </div>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, border: active ? 'none' : '2px solid #333', background: active ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {active && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {needsUsername && (
                <button onClick={() => setStep('username')} style={ghostBtn}>Back</button>
              )}
              <button onClick={handleFinish} disabled={isPending} style={{ ...primaryBtn(true), flex: 1, opacity: isPending ? 0.7 : 1 }}>
                {isPending ? 'Setting up…' : "Let's go →"}
              </button>
            </div>

            {!isPending && (
              <button onClick={handleFinish} style={{ width: '100%', padding: '10px', marginTop: '8px', background: 'none', border: 'none', color: '#333', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Skip for now
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

const h1: React.CSSProperties          = { fontSize: '26px', fontWeight: 800, margin: '0 0 8px' }
const sub: React.CSSProperties         = { fontSize: '14px', color: '#666', margin: '0 0 24px', lineHeight: 1.5 }
const labelStyle: React.CSSProperties  = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }
const inputStyle: React.CSSProperties  = { width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #2a2a2a', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#1a1a1a', color: '#fff', transition: 'border-color 0.15s' }
const primaryBtn = (on: boolean): React.CSSProperties => ({ width: '100%', padding: '13px', borderRadius: '9999px', border: 'none', cursor: on ? 'pointer' : 'default', background: on ? accent : '#1a1a1a', color: on ? 'white' : '#444', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit', transition: 'background 0.2s' })
const ghostBtn: React.CSSProperties    = { padding: '13px 20px', borderRadius: '9999px', border: '1px solid #2a2a2a', background: 'transparent', color: '#666', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
