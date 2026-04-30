'use client'

import { useState, useTransition } from 'react'
import { createGroup } from '@/lib/actions/groups'

const ACCENT = '#7F77DD'

const VIBES = [
  { id: 'gaming',    label: 'Gaming',       emoji: '🎮', interests: ['gaming'],              group_type: 'recurring' },
  { id: 'nights',    label: 'Nights out',   emoji: '🌙', interests: ['bars'],                group_type: 'recurring' },
  { id: 'trips',     label: 'Trips',        emoji: '✈️', interests: ['travel', 'road_trips'], group_type: 'recurring' },
  { id: 'events',    label: 'Events',       emoji: '🎉', interests: ['birthday'],            group_type: 'one_time'  },
  { id: 'ongoing',   label: 'Ongoing crew', emoji: '👥', interests: [],                      group_type: 'recurring' },
] as const

type VibeId = typeof VIBES[number]['id']

// ── Name pools ──────────────────────────────────────────────────────
const NAMES: Record<VibeId | 'default', string[]> = {
  gaming: [
    'Final Boss Crew', 'Respawn Squad', 'The Loading Screen', 'No Lifes Club',
    'Save Point', 'Skill Issue Squad', 'The Backlog', 'Lag Champions',
    'Touch Grass Never', 'GG No Re', 'The Grinders', 'Raid Night',
    'AFK Occasionally', 'Meta Breakers', 'The Side Quest', 'Loot Goblins',
    'Party Wipe', 'The Carry Team', 'Permadeath Pact', 'Checkpoint Crew',
  ],
  nights: [
    'Last Round', 'The Usual Suspects', 'Tab Still Open', 'One More Bar',
    'Bad Decisions Club', 'The Night Shift', 'Closing Time Crew', 'Round Two',
    'The After Party', 'Designated Chaos', 'Liquid Courage', 'The Regulars',
    'No Plans Needed', 'Stumble Squad', 'The Midnight Snack', 'Open Bar Energy',
    'We Pregame', 'The Stragglers', 'Last Metro Crew', 'Uber Pool Gang',
  ],
  trips: [
    'No Itinerary', 'The Overpackers', 'Middle Seat Club', 'Delayed Again',
    'Lost in Translation', 'The Passport Holders', 'Window Seat Only',
    'Wrong Terminal', 'Carry-On Champions', 'We Google Translated',
    'The Jet Lagged', 'Spontaneous Detour', 'Off the Map', 'Hostel Vibes',
    'The Long Layover', 'Customs Queue', 'Checked Bag Penalty', 'We Drove',
    'Road Warriors', 'Wrong Turn Right Place',
  ],
  events: [
    'The Occasion', 'Once in a While', 'Special Circumstances',
    'Mark Your Calendar', 'The Main Event', 'RSVP Yes', 'Formal Notice',
    'You Are Invited', 'The Reunion', 'Annual Tradition', 'Guest List',
    'The Gathering', 'Dress Code Unclear', 'Bring a Plus One',
    'The After Party', 'Open Bar Confirmed', 'Save the Date', 'The Turnout',
    'Show Up Crew', 'Headcount Pending',
  ],
  ongoing: [
    'The Usual Gang', 'Group Chat IRL', 'Still Hanging Out',
    'The Core Four', 'The Roster', 'Unlikely Ensemble', 'The Originals',
    'Founding Members', 'Same Time Next Week', 'The Standing Crew',
    'No Drama Zone', 'The Reliable Ones', 'Low Maintenance High Fun',
    'Occasional Check-Ins', 'The Long Haul', 'Still Friends',
    'The Main Group', 'No New Members', 'The Ancients', 'Decade Running',
  ],
  default: [
    'The Squad', 'Dream Team', 'The Collective', 'Chaos Controlled',
    'The Crew', 'Unscheduled', 'The Ensemble', 'Rolling Plans',
    'The Alliance', 'Casual Chaos', 'The Fellowship', 'No Fixed Agenda',
    'The Coalition', 'Loosely Organized', 'The Circle', 'Semi-Spontaneous',
    'The Network', 'Plans Pending', 'The Assembly', 'Good Intentions',
  ],
}

interface Props {
  isPodium: boolean
  boostCount: number
}

export function CreateGroupForm({ isPodium, boostCount }: Props) {
  const [name, setName]           = useState('')
  const [vibe, setVibe]           = useState<VibeId | null>(null)
  const [isPending, start]        = useTransition()
  const [error, setError]         = useState<string | null>(null)
  const [nameIndex, setNameIndex] = useState(0)

  const canSubmit = name.trim().length >= 2

  const suggestName = () => {
    const pool = vibe ? NAMES[vibe] : NAMES.default
    const next = nameIndex % pool.length
    setName(pool[next])
    setNameIndex(next + 1)
  }

  function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    const selected = VIBES.find(v => v.id === vibe)
    start(async () => {
      const formData = new FormData()
      formData.set('name', name.trim())
      formData.set('group_type', selected?.group_type ?? 'recurring')
      formData.set('occasion', '')
      formData.set('interests', JSON.stringify(selected?.interests ?? []))
      formData.set('theme_color', ACCENT)
      formData.set('banner_url', '')
      formData.set('description', '')
      formData.set('use_boost', 'false')
      const result = await createGroup(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back */}
        <a
          href="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555', textDecoration: 'none', marginBottom: '40px' }}
        >
          ← Back to dashboard
        </a>

        {/* Header */}
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-.4px', lineHeight: 1.2 }}>
          What are you starting?
        </h1>
        <p style={{ fontSize: '14px', color: '#555', margin: '0 0 36px', lineHeight: 1.6 }}>
          Give it a name and we'll take it from there.
        </p>

        {/* Name input */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ position: 'relative' }}>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
              maxLength={40}
              placeholder="Barcelona trip, gaming crew, Mike's bachelor…"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 16px',
                paddingRight: '130px',
                borderRadius: '12px',
                border: `1.5px solid ${name.trim().length >= 2 ? `${ACCENT}55` : '#222'}`,
                background: '#161616',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color .2s',
              }}
            />
            <button
              onClick={suggestName}
              style={{
                position: 'absolute', right: '8px', top: '50%',
                transform: 'translateY(-50%)',
                padding: '6px 12px', borderRadius: '8px', border: 'none',
                background: '#222', color: '#888',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                transition: 'background .15s, color .15s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = '#2a2a2a'; (e.target as HTMLElement).style.color = '#bbb' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = '#222'; (e.target as HTMLElement).style.color = '#888' }}
            >
              Suggest name
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#333', marginTop: '6px', textAlign: 'right' }}>
            {name.length}/40
          </div>
        </div>

        {/* Vibe chips */}
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '12px' }}>
            What's the vibe? <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#333' }}>(optional)</span>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {VIBES.map(v => {
              const on = vibe === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => { setVibe(on ? null : v.id); setNameIndex(0) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 16px', borderRadius: '10px',
                    border: `1px solid ${on ? `${ACCENT}55` : '#222'}`,
                    background: on ? `${ACCENT}12` : '#161616',
                    color: on ? '#c4bff5' : '#666',
                    fontSize: '13px', fontWeight: on ? 600 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .12s',
                    transform: on ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{v.emoji}</span>
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '16px' }}>{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isPending}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
            background: canSubmit ? ACCENT : '#1a1a1a',
            color: canSubmit ? '#fff' : '#333',
            fontSize: '16px', fontWeight: 700,
            cursor: canSubmit && !isPending ? 'pointer' : 'default',
            fontFamily: 'inherit', transition: 'background .15s, color .15s',
            letterSpacing: '-.1px',
          }}
        >
          {isPending ? 'Creating…' : "Let's go →"}
        </button>

        <p style={{ fontSize: '12px', color: '#2a2a2a', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
          Colors, banner, and description can all be added in group settings later.
        </p>
      </div>
    </div>
  )
}
