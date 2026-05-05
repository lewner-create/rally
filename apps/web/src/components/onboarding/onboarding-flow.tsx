'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/actions/profile'
import { saveWeeklyAvailability, type WeeklyAvailability } from '@/lib/actions/availability'

const accent = '#7F77DD'

// ── Availability presets ─────────────────────────────────────────
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
const WEEKDAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const WEEKEND: DayKey[]  = ['sat', 'sun']
const ALL_DAYS: DayKey[] = [...WEEKDAYS, WEEKEND[0], WEEKEND[1]]

const PRESETS = [
  { id: 'weeknights',    label: 'Weeknights',    description: 'Mon–Fri evenings',      emoji: '🌆', days: WEEKDAYS,                          hours: [19, 20, 21, 22] },
  { id: 'weekend_days',  label: 'Weekend days',  description: 'Sat & Sun daytime',     emoji: '☀️', days: WEEKEND,                           hours: [10, 11, 12, 13, 14, 15, 16, 17] },
  { id: 'weekend_nights',label: 'Weekend nights',description: 'Fri–Sun evenings',      emoji: '🌙', days: ['fri' as DayKey, ...WEEKEND],      hours: [20, 21, 22, 23] },
  { id: 'mornings',      label: 'Mornings',      description: 'Every day, 8am–noon',   emoji: '🌅', days: ALL_DAYS,                          hours: [7, 8, 9, 10, 11] },
  { id: 'midday',        label: 'Midday',        description: 'Every day, noon–5pm',   emoji: '⛅', days: WEEKDAYS,                          hours: [11, 12, 13, 14] },
  { id: 'late_nights',   label: 'Late nights',   description: 'Any day, 10pm+',        emoji: '🏙️', days: ALL_DAYS,                          hours: [23] },
]

function presetsToWeekly(selected: string[]): WeeklyAvailability {
  const result: WeeklyAvailability = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
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

function presetSummary(selected: string[]): string {
  if (selected.length === 0) return 'No windows set yet — you can update this any time'
  const labels = selected.map(id => PRESETS.find(p => p.id === id)?.label ?? id)
  if (labels.length === 1) return `Mostly free ${labels[0].toLowerCase()}`
  if (labels.length === 2) return `Mostly free ${labels[0].toLowerCase()} and ${labels[1].toLowerCase()}`
  return `Mostly free ${labels.slice(0, -1).map(l => l.toLowerCase()).join(', ')}, and ${labels[labels.length - 1].toLowerCase()}`
}

// ── Shared styles ────────────────────────────────────────────────
const primaryBtn = (enabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '14px', borderRadius: '9999px', border: 'none',
  cursor: enabled ? 'pointer' : 'default',
  background: enabled ? accent : '#1a1a1a',
  color: enabled ? 'white' : '#444',
  fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
  transition: 'all 0.2s',
})

const ghostBtn: React.CSSProperties = {
  padding: '14px 24px', borderRadius: '9999px',
  border: '1px solid #2a2a2a', background: 'transparent',
  color: '#666', fontSize: '15px', fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}

// ── Main component ───────────────────────────────────────────────
export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep]   = useState<1 | 2>(1)
  const [presets, setPresets] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const togglePreset = (id: string) =>
    setPresets(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleFinish = () => {
    startTransition(async () => {
      await Promise.all([
        saveWeeklyAvailability(presetsToWeekly(presets)),
        updateProfile({
          preferences: {
            onboarded: true,
            tour_completed: false, // triggers dashboard tour on first visit
          },
        }),
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
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Logo + progress dots */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '18px', fontWeight: 800, color: accent, margin: '0 0 22px', letterSpacing: '-0.02em' }}>
            volta
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2].map(n => (
              <div key={n} style={{
                flex: 1, height: '3px', borderRadius: '9999px',
                background: n <= step ? accent : '#222',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* ── Step 1: Volta intro ── */}
        {step === 1 && (
          <div>
            {/* Subtle glow orb */}
            <div style={{
              position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
              width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none',
              background: 'radial-gradient(circle, rgba(127,119,221,0.12) 0%, transparent 70%)',
            }} />

            <div style={{ position: 'relative' }}>
              <h1 style={{
                fontSize: '32px', fontWeight: 800, margin: '0 0 10px',
                letterSpacing: '-0.03em', lineHeight: 1.1,
              }}>
                Find when the{' '}
                <span style={{
                  background: `linear-gradient(120deg, ${accent}, #d77ad8)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>whole crew</span>
                {' '}is free.
              </h1>
              <p style={{ fontSize: '15px', color: '#666', margin: '0 0 32px', lineHeight: 1.5 }}>
                No more "anyone free this weekend?" texts. Here's how Volta works.
              </p>

              {/* Feature rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
                {[
                  { emoji: '🗓', title: 'Drop your free times', sub: 'Mark when you\'re usually around each week. Takes 30 seconds.' },
                  { emoji: '⚡', title: 'See who overlaps', sub: 'Volta finds windows where most of your group is free at once.' },
                  { emoji: '🎉', title: 'Lock in the hang', sub: 'Start a plan, see who\'s in, confirm it — all in a few taps.' },
                ].map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 14,
                    padding: '16px 18px', borderRadius: 16,
                    background: '#161616', border: '1px solid #222',
                  }}>
                    <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{f.emoji}</span>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.4 }}>{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setStep(2)} style={primaryBtn(true)}>
                Get started →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Availability ── */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              When are you usually free?
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 28px', lineHeight: 1.5 }}>
              Pick whatever fits your typical week. You can always adjust this later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{p.emoji}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: active ? '#fff' : '#ccc' }}>
                          {p.label}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                          {p.description}
                        </div>
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

            {/* Live summary */}
            {presets.length > 0 && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                background: `${accent}12`, border: `1px solid ${accent}30`,
                fontSize: 13, color: accent, fontWeight: 500,
              }}>
                ✦ {presetSummary(presets)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={ghostBtn}>Back</button>
              <button
                onClick={handleFinish}
                disabled={isPending}
                style={{ ...primaryBtn(true), flex: 1, opacity: isPending ? 0.7 : 1 }}
              >
                {isPending ? 'Setting up…' : "Let's go →"}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#444', marginTop: 14 }}>
              You can skip this and set availability later
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
