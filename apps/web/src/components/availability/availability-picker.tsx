'use client'

import { useState, useTransition } from 'react'
import { saveWeeklyAvailability, type WeeklyAvailability, type DayKey } from '@/lib/actions/availability'

// ─── Types + constants ────────────────────────────────────────────────────────

const ALL_DAYS:     DayKey[] = ['mon','tue','wed','thu','fri','sat','sun']
const WEEKDAYS:     DayKey[] = ['mon','tue','wed','thu','fri']
const WEEKEND:      DayKey[] = ['sat','sun']
const FRI_WEEKEND:  DayKey[] = ['fri','sat','sun']

type Preset = {
  id: string
  label: string
  emoji: string
  desc: string
  days: DayKey[]
  hours: number[]
}

const PRESETS: Preset[] = [
  { id: 'weeknights',     label: 'Weeknights',     emoji: '🌆', desc: 'Mon–Fri evenings',    days: WEEKDAYS,       hours: [18,19,20,21,22] },
  { id: 'weekend-days',   label: 'Weekend days',   emoji: '☀️', desc: 'Sat & Sun daytime',   days: WEEKEND,        hours: [10,11,12,13,14,15,16,17] },
  { id: 'weekend-nights', label: 'Weekend nights', emoji: '🌙', desc: 'Fri–Sun evenings',    days: FRI_WEEKEND,    hours: [18,19,20,21,22] },
  { id: 'mornings',       label: 'Mornings',       emoji: '🌅', desc: 'Every day, 8am–noon', days: ALL_DAYS,       hours: [8,9,10,11] },
  { id: 'midday',         label: 'Midday',         emoji: '⛅', desc: 'Every day, noon–5pm', days: ALL_DAYS,       hours: [12,13,14,15,16] },
  { id: 'late-nights',    label: 'Late nights',    emoji: '🌃', desc: 'Any day, 10pm+',      days: ALL_DAYS,       hours: [22] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAvailability(activeIds: Set<string>): WeeklyAvailability {
  const sets: Record<DayKey, Set<number>> = {
    mon: new Set(), tue: new Set(), wed: new Set(), thu: new Set(),
    fri: new Set(), sat: new Set(), sun: new Set(),
  }
  activeIds.forEach(id => {
    const p = PRESETS.find(p => p.id === id)
    if (!p) return
    p.days.forEach(day => p.hours.forEach(h => sets[day].add(h)))
  })
  return Object.fromEntries(
    Object.entries(sets).map(([day, set]) => [day, [...set].sort((a, b) => a - b)])
  ) as WeeklyAvailability
}

function detectActivePresets(avail: WeeklyAvailability): Set<string> {
  const active = new Set<string>()
  PRESETS.forEach(p => {
    const allCovered = p.days.every(day =>
      p.hours.every(h => avail[day]?.includes(h))
    )
    if (allCovered) active.add(p.id)
  })
  return active
}

function buildSummary(activeIds: Set<string>): string | null {
  if (activeIds.size === 0) return null

  const has = (id: string) => activeIds.has(id)
  const weekendBoth = has('weekend-days') && has('weekend-nights')

  const parts: string[] = []
  if (has('weeknights'))    parts.push('weeknights')
  if (weekendBoth)          parts.push('weekends')
  else {
    if (has('weekend-days'))   parts.push('weekend days')
    if (has('weekend-nights')) parts.push('weekend nights')
  }
  if (has('mornings'))    parts.push('mornings')
  if (has('midday'))      parts.push('midday')
  if (has('late-nights')) parts.push('late nights')

  if (parts.length === 0) return null
  if (activeIds.size >= 5) return "Looks like you have a lot of flexibility"
  if (parts.length === 1) return `Looks like you're mostly free ${parts[0]}`
  if (parts.length === 2) return `Looks like you're mostly free ${parts[0]} and ${parts[1]}`
  const last = parts.pop()
  return `Looks like you're mostly free ${parts.join(', ')}, and ${last}`
}

// ─── Inline mini grid (avoids importing WeeklyGrid complexity) ────────────────

const PERIODS = [
  { label: 'Morning',   hours: [8,9,10,11]          },
  { label: 'Afternoon', hours: [12,13,14,15,16,17]  },
  { label: 'Evening',   hours: [18,19,20,21,22]     },
]
const ALL_HOURS = PERIODS.flatMap(p => p.hours)
const GRID_DAYS = [
  { key: 'mon' as DayKey, short: 'Mon' },
  { key: 'tue' as DayKey, short: 'Tue' },
  { key: 'wed' as DayKey, short: 'Wed' },
  { key: 'thu' as DayKey, short: 'Thu' },
  { key: 'fri' as DayKey, short: 'Fri' },
  { key: 'sat' as DayKey, short: 'Sat' },
  { key: 'sun' as DayKey, short: 'Sun' },
]

function fmtH(h: number) {
  if (h === 0)  return '12am'
  if (h < 12)  return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function MiniGrid({
  avail, onChange,
}: {
  avail: WeeklyAvailability
  onChange: (a: WeeklyAvailability) => void
}) {
  const [hovCell, setHovCell] = useState<{ d: DayKey; h: number } | null>(null)
  const dragRef = { dragging: false, mode: 'paint' as 'paint' | 'erase' }

  const isFree = (d: DayKey, h: number) => avail[d]?.includes(h) ?? false

  const paint = (d: DayKey, h: number, mode: 'paint' | 'erase') => {
    const hours = avail[d] ?? []
    let next: number[]
    if (mode === 'paint') {
      if (hours.includes(h)) return
      next = [...hours, h].sort((a, b) => a - b)
    } else {
      next = hours.filter(x => x !== h)
    }
    onChange({ ...avail, [d]: next })
  }

  const toggleDay = (dk: DayKey) => {
    const any = ALL_HOURS.some(h => isFree(dk, h))
    onChange({ ...avail, [dk]: any ? [] : [...ALL_HOURS] })
  }

  const COL = '38px repeat(7,1fr)'

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '440px', userSelect: 'none' }}
        onMouseLeave={() => setHovCell(null)}
      >
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: COL, gap: '2px', marginBottom: '6px' }}>
          <div />
          {GRID_DAYS.map(d => {
            const any = ALL_HOURS.some(h => isFree(d.key, h))
            return (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.07em', textAlign: 'center', padding: '4px 2px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: any ? '#10b981' : '#333', fontFamily: 'inherit',
                  borderRadius: '4px', transition: 'color .1s',
                }}
              >{d.short}</button>
            )
          })}
        </div>

        {/* Period rows */}
        {PERIODS.map(period => (
          <div key={period.label}>
            <div style={{ display: 'grid', gridTemplateColumns: COL, gap: '2px', margin: '6px 0 2px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#252525', textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'right', paddingRight: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {period.label}
              </div>
              {GRID_DAYS.map(d => <div key={d.key} style={{ height: '3px' }} />)}
            </div>

            {period.hours.map(hour => {
              const showLabel = hour % 2 === 0 || hour === period.hours[0]
              return (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: COL, gap: '2px', marginBottom: '2px' }}>
                  <div style={{ fontSize: '10px', color: '#333', textAlign: 'right', paddingRight: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                    {showLabel ? fmtH(hour) : ''}
                  </div>
                  {GRID_DAYS.map(d => {
                    const free = isFree(d.key, hour)
                    const hov = hovCell?.d === d.key && hovCell?.h === hour
                    let bg = '#1e1e1e', border = '1px solid #272727'
                    if (free) { bg = '#059669'; border = '1px solid #047857' }
                    else if (hov) { bg = '#10b98122'; border = '1px solid #10b98140' }
                    return (
                      <div
                        key={d.key}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          const mode = free ? 'erase' : 'paint'
                          dragRef.dragging = true
                          dragRef.mode = mode
                          paint(d.key, hour, mode)
                        }}
                        onMouseEnter={() => {
                          setHovCell({ d: d.key, h: hour })
                          if (dragRef.dragging) paint(d.key, hour, dragRef.mode)
                        }}
                        onMouseUp={() => { dragRef.dragging = false }}
                        style={{ height: '24px', borderRadius: '3px', background: bg, border, cursor: 'pointer', transition: 'background .05s, border-color .05s' }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AvailabilityPicker({ initial }: { initial: WeeklyAvailability }) {
  const [activeIds, setActiveIds]   = useState<Set<string>>(() => detectActivePresets(initial))
  const [avail, setAvail]           = useState<WeeklyAvailability>(initial)
  const [gridOpen, setGridOpen]     = useState(false)
  const [saved, setSaved]           = useState(false)
  const [saving, startSave]         = useTransition()

  const hasSelection = activeIds.size > 0 || ALL_HOURS.some(h => ALL_DAYS.some(d => avail[d]?.includes(h)))
  const summary = buildSummary(activeIds)

  function togglePreset(id: string) {
    setActiveIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      const newAvail = buildAvailability(next)
      setAvail(newAvail)
      setSaved(false)
      return next
    })
  }

  function handleGridChange(newAvail: WeeklyAvailability) {
    setAvail(newAvail)
    // Re-detect presets after manual edit
    setActiveIds(detectActivePresets(newAvail))
    setSaved(false)
  }

  function handleSave() {
    startSave(async () => {
      await saveWeeklyAvailability(avail)
      setSaved(true)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-.3px' }}>
          When are you usually free?
        </h1>
        <p style={{ fontSize: '13px', color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
          Pick what fits your week — you can always respond differently later.
        </p>

        {/* Preset cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
          {PRESETS.map(p => {
            const on = activeIds.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => togglePreset(p.id)}
                style={{
                  background: on ? '#6366f110' : '#161616',
                  border: `1px solid ${on ? '#6366f155' : '#222'}`,
                  borderRadius: '14px',
                  padding: '14px 12px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color .15s, background .15s, transform .1s',
                  transform: on ? 'scale(1.02)' : 'scale(1)',
                  fontFamily: 'inherit',
                  boxShadow: on ? `0 0 0 1px #6366f133` : 'none',
                }}
              >
                {/* Checkmark */}
                <div style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: on ? '#6366f1' : 'transparent',
                  border: `1px solid ${on ? '#6366f1' : '#2a2a2a'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: '#fff',
                  transition: 'background .15s, border-color .15s',
                  flexShrink: 0,
                }}>
                  {on && '✓'}
                </div>
                <div style={{ fontSize: '20px', lineHeight: 1 }}>{p.emoji}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: on ? '#a5b4fc' : '#ccc', lineHeight: 1.2, transition: 'color .15s' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: '11px', color: on ? '#6366f166' : '#3a3a3a', lineHeight: 1.4, transition: 'color .15s' }}>
                  {p.desc}
                </div>
              </button>
            )
          })}
        </div>

        {/* Summary / hint */}
        <div style={{
          borderRadius: '12px',
          padding: '14px 16px',
          background: '#161616',
          border: `1px solid ${summary ? '#6366f130' : '#1e1e1e'}`,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'border-color .3s',
          minHeight: '52px',
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>{summary ? '✦' : '○'}</span>
          <p style={{ fontSize: '13px', color: summary ? '#a5b4fc' : '#444', lineHeight: 1.5, margin: 0, transition: 'color .3s' }}>
            {summary ?? 'Pick at least one time that fits your typical week'}
          </p>
        </div>

        {/* Adjust specific times disclosure */}
        <button
          onClick={() => setGridOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 0', marginBottom: '14px', fontFamily: 'inherit',
          }}
        >
          <span style={{
            fontSize: '11px', color: '#333', display: 'inline-block',
            transform: gridOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform .2s',
          }}>›</span>
          <span style={{ fontSize: '13px', color: '#444', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#888')}
            onMouseLeave={e => (e.currentTarget.style.color = '#444')}
          >
            Adjust specific times
          </span>
        </button>

        {/* Grid disclosure */}
        <div style={{
          overflow: 'hidden',
          maxHeight: gridOpen ? '600px' : '0px',
          opacity: gridOpen ? 1 : 0,
          transition: 'max-height .35s ease, opacity .25s ease',
          marginBottom: gridOpen ? '24px' : '0',
        }}>
          <div style={{
            background: '#161616', border: '1px solid #1e1e1e',
            borderRadius: '14px', padding: '18px',
          }}>
            <MiniGrid avail={avail} onChange={handleGridChange} />
            <p style={{ fontSize: '11px', color: '#2a2a2a', marginTop: '12px', textAlign: 'center', lineHeight: 1.6 }}>
              Click a day header to toggle the whole day
            </p>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!hasSelection || saving}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: saved ? '#059669' : hasSelection ? '#6366f1' : '#1a1a1a',
            color: hasSelection ? '#fff' : '#333',
            border: 'none',
            fontSize: '15px',
            fontWeight: 700,
            cursor: hasSelection && !saving ? 'pointer' : 'default',
            fontFamily: 'inherit',
            transition: 'background .2s, color .2s',
            letterSpacing: '-.1px',
          }}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Looks good'}
        </button>

      </div>
    </div>
  )
}
