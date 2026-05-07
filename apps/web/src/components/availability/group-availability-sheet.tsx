'use client'

import { useState, useTransition, useEffect } from 'react'
import { saveGroupAvailability, clearGroupAvailability } from '@/lib/actions/availability'
import { defaultWeekly, type WeeklyAvailability, type DayKey } from '@/lib/actions/availability-utils'

// ─── Types + constants ────────────────────────────────────────────────────────

const ALL_DAYS:    DayKey[] = ['mon','tue','wed','thu','fri','sat','sun']
const WEEKDAYS:    DayKey[] = ['mon','tue','wed','thu','fri']
const WEEKEND:     DayKey[] = ['sat','sun']
const FRI_WEEKEND: DayKey[] = ['fri','sat','sun']

type Preset = { id: string; label: string; emoji: string; desc: string; days: DayKey[]; hours: number[] }

const PRESETS: Preset[] = [
  { id: 'weeknights',     label: 'Weeknights',     emoji: '', desc: 'Mon–Fri evenings',    days: WEEKDAYS,    hours: [18,19,20,21,22] },
  { id: 'weekend-days',   label: 'Weekend days',   emoji: '☀', desc: 'Sat & Sun daytime',   days: WEEKEND,     hours: [10,11,12,13,14,15,16,17] },
  { id: 'weekend-nights', label: 'Weekend nights', emoji: '', desc: 'Fri–Sun evenings',    days: FRI_WEEKEND, hours: [18,19,20,21,22] },
  { id: 'mornings',       label: 'Mornings',       emoji: '', desc: 'Every day, 8am–noon', days: ALL_DAYS,    hours: [8,9,10,11] },
  { id: 'midday',         label: 'Midday',         emoji: '', desc: 'Every day, noon–5pm', days: ALL_DAYS,    hours: [12,13,14,15,16] },
  { id: 'late-nights',    label: 'Late nights',    emoji: '', desc: 'Any day, 10pm+',      days: ALL_DAYS,    hours: [22] },
]

const PERIODS = [
  { label: 'Morning',   hours: [8,9,10,11] },
  { label: 'Afternoon', hours: [12,13,14,15,16,17] },
  { label: 'Evening',   hours: [18,19,20,21,22] },
]
const ALL_HOURS   = PERIODS.flatMap(p => p.hours)
const GRID_DAYS   = [
  { key: 'mon' as DayKey, short: 'M' },
  { key: 'tue' as DayKey, short: 'T' },
  { key: 'wed' as DayKey, short: 'W' },
  { key: 'thu' as DayKey, short: 'T' },
  { key: 'fri' as DayKey, short: 'F' },
  { key: 'sat' as DayKey, short: 'S' },
  { key: 'sun' as DayKey, short: 'S' },
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
    const allCovered = p.days.every(day => p.hours.every(h => avail[day]?.includes(h)))
    if (allCovered) active.add(p.id)
  })
  return active
}

function fmtH(h: number) {
  if (h === 0)  return '12am'
  if (h < 12)  return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

// ─── Compact Mini Grid ────────────────────────────────────────────────────────

function MiniGrid({ avail, onChange }: { avail: WeeklyAvailability; onChange: (a: WeeklyAvailability) => void }) {
  const [hovCell, setHovCell] = useState<{ d: DayKey; h: number } | null>(null)
  const dragRef = { dragging: false, mode: 'paint' as 'paint' | 'erase' }
  const isFree = (d: DayKey, h: number) => avail[d]?.includes(h) ?? false

  const paint = (d: DayKey, h: number, mode: 'paint' | 'erase') => {
    const hours = avail[d] ?? []
    const next  = mode === 'paint'
      ? hours.includes(h) ? hours : [...hours, h].sort((a, b) => a - b)
      : hours.filter(x => x !== h)
    onChange({ ...avail, [d]: next })
  }

  const toggleDay = (dk: DayKey) => {
    const any = ALL_HOURS.some(h => isFree(dk, h))
    onChange({ ...avail, [dk]: any ? [] : [...ALL_HOURS] })
  }

  const COL = '28px repeat(7,1fr)'

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '340px', userSelect: 'none' }} onMouseLeave={() => setHovCell(null)}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: COL, gap: '2px', marginBottom: '4px' }}>
          <div />
          {GRID_DAYS.map((d, i) => {
            const any = ALL_HOURS.some(h => isFree(d.key, h))
            return (
              <button key={i} onClick={() => toggleDay(d.key)}
                style={{ fontSize: '10px', fontWeight: 700, textAlign: 'center', padding: '2px',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  color: any ? '#10b981' : '#444', borderRadius: '3px' }}
              >{d.short}</button>
            )
          })}
        </div>
        {PERIODS.map(period => (
          <div key={period.label}>
            <div style={{ display: 'grid', gridTemplateColumns: COL, gap: '2px', margin: '4px 0 2px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#333', textTransform: 'uppercase',
                letterSpacing: '.1em', textAlign: 'right', paddingRight: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {period.label[0]}
              </div>
              {GRID_DAYS.map((d, i) => <div key={i} style={{ height: '2px' }} />)}
            </div>
            {period.hours.map(hour => (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: COL, gap: '2px', marginBottom: '2px' }}>
                <div style={{ fontSize: '8px', color: '#333', textAlign: 'right', paddingRight: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                  {hour % 3 === 0 ? fmtH(hour) : ''}
                </div>
                {GRID_DAYS.map((d, i) => {
                  const free = isFree(d.key, hour)
                  const hov  = hovCell?.d === d.key && hovCell?.h === hour
                  return (
                    <div key={i}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const mode = free ? 'erase' : 'paint'
                        dragRef.dragging = true; dragRef.mode = mode
                        paint(d.key, hour, mode)
                      }}
                      onMouseEnter={() => {
                        setHovCell({ d: d.key, h: hour })
                        if (dragRef.dragging) paint(d.key, hour, dragRef.mode)
                      }}
                      onMouseUp={() => { dragRef.dragging = false }}
                      style={{
                        height: '18px', borderRadius: '2px', cursor: 'pointer',
                        background: free ? '#059669' : hov ? '#10b98122' : '#1e1e1e',
                        border: `1px solid ${free ? '#047857' : hov ? '#10b98140' : '#272727'}`,
                        transition: 'background .05s',
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sheet component ──────────────────────────────────────────────────────────

interface Props {
  groupId: string
  groupName: string
  themeColor: string
  initialAvailability: WeeklyAvailability
  initialIsCustom: boolean
  open: boolean
  onClose: () => void
  onSaved: (isCustom: boolean) => void
}

export function GroupAvailabilitySheet({
  groupId,
  groupName,
  themeColor,
  initialAvailability,
  initialIsCustom,
  open,
  onClose,
  onSaved,
}: Props) {
  const [activeIds, setActiveIds] = useState<Set<string>>(() => detectActivePresets(initialAvailability))
  const [avail, setAvail]         = useState<WeeklyAvailability>(initialAvailability)
  const [gridOpen, setGridOpen]   = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saving, startSave]       = useTransition()
  const [clearing, startClear]    = useTransition()

  // Re-init when sheet opens with fresh data
  useEffect(() => {
    if (open) {
      setAvail(initialAvailability)
      setActiveIds(detectActivePresets(initialAvailability))
      setSaved(false)
      setGridOpen(false)
    }
  }, [open])

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return ()  => { document.body.style.overflow = '' }
  }, [open])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  function togglePreset(id: string) {
    setActiveIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      const newAvail = buildAvailability(next)
      setAvail(newAvail)
      setSaved(false)
      return next
    })
  }

  function handleGridChange(newAvail: WeeklyAvailability) {
    setAvail(newAvail)
    setActiveIds(detectActivePresets(newAvail))
    setSaved(false)
  }

  function handleSave() {
    startSave(async () => {
      await saveGroupAvailability(groupId, avail)
      setSaved(true)
      onSaved(true)
      setTimeout(onClose, 600)
    })
  }

  function handleClear() {
    startClear(async () => {
      await clearGroupAvailability(groupId)
      onSaved(false)
      onClose()
    })
  }

  const hasSelection = activeIds.size > 0 || ALL_HOURS.some(h => ALL_DAYS.some(d => avail[d]?.includes(h)))

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .25s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%', zIndex: 51,
          transform: open ? 'translate(-50%, 0)' : 'translate(-50%, 100%)',
          transition: 'transform .35s cubic-bezier(0.32,0.72,0,1)',
          width: '100%', maxWidth: '560px',
          background: '#111', borderRadius: '20px 20px 0 0',
          border: '1px solid #1e1e1e', borderBottom: 'none',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#333' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 24px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.2px' }}>
                Availability for {groupName}
              </h2>
              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                {initialIsCustom
                  ? 'You have custom availability set for this group'
                  : 'Currently using your default availability — set a custom one below'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444',
                fontSize: '18px', padding: '0 0 0 12px', lineHeight: 1, flexShrink: 0 }}
            >✕</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 32px' }}>

          {/* Preset chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '20px' }}>
            {PRESETS.map(p => {
              const on = activeIds.has(p.id)
              return (
                <button key={p.id} onClick={() => togglePreset(p.id)}
                  style={{
                    background: on ? `${themeColor}15` : '#161616',
                    border: `1px solid ${on ? `${themeColor}50` : '#222'}`,
                    borderRadius: '12px', padding: '12px 10px 10px',
                    cursor: 'pointer', textAlign: 'left', display: 'flex',
                    flexDirection: 'column', gap: '4px', fontFamily: 'inherit',
                    transition: 'border-color .15s, background .15s',
                    boxShadow: on ? `0 0 0 1px ${themeColor}25` : 'none',
                  }}
                >
                  <div style={{ fontSize: '18px', lineHeight: 1 }}>{p.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: on ? themeColor : '#ccc', lineHeight: 1.2 }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: '10px', color: on ? `${themeColor}80` : '#3a3a3a', lineHeight: 1.4 }}>
                    {p.desc}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Grid toggle */}
          <button
            onClick={() => setGridOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: '12px', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: '10px', color: '#444',
              transform: gridOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s',
              display: 'inline-block' }}>›</span>
            <span style={{ fontSize: '12px', color: '#444' }}>Adjust specific hours</span>
          </button>

          {/* Grid */}
          <div style={{
            overflow: 'hidden',
            maxHeight: gridOpen ? '400px' : '0px',
            opacity: gridOpen ? 1 : 0,
            transition: 'max-height .35s ease, opacity .25s ease',
            marginBottom: gridOpen ? '20px' : 0,
          }}>
            <div style={{ background: '#161616', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px' }}>
              <MiniGrid avail={avail} onChange={handleGridChange} />
              <p style={{ fontSize: '10px', color: '#2a2a2a', marginTop: '8px', textAlign: 'center' }}>
                Click a day letter to toggle all
              </p>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasSelection || saving}
            style={{
              width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
              background: saved ? '#059669' : hasSelection ? themeColor : '#1a1a1a',
              color: hasSelection ? '#fff' : '#333',
              fontSize: '14px', fontWeight: 700, cursor: hasSelection && !saving ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'background .2s',
            }}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save for this group'}
          </button>

          {/* Reset to default — only shown if custom is set */}
          {initialIsCustom && (
            <button
              onClick={handleClear}
              disabled={clearing}
              style={{
                width: '100%', padding: '11px', borderRadius: '12px', border: '1px solid #222',
                background: 'transparent', color: '#555',
                fontSize: '13px', fontWeight: 500, cursor: clearing ? 'default' : 'pointer',
                fontFamily: 'inherit', marginTop: '10px', transition: 'color .15s, border-color .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#999'; e.currentTarget.style.borderColor = '#333' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#222' }}
            >
              {clearing ? 'Resetting…' : '↩ Reset to default availability'}
            </button>
          )}

        </div>
      </div>
    </>
  )
}
