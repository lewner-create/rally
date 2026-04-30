'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { saveWeeklyAvailability, type WeeklyAvailability, type DayKey } from '@/lib/actions/availability'

const DAYS: { key: DayKey; short: string }[] = [
  { key: 'mon', short: 'Mon' },
  { key: 'tue', short: 'Tue' },
  { key: 'wed', short: 'Wed' },
  { key: 'thu', short: 'Thu' },
  { key: 'fri', short: 'Fri' },
  { key: 'sat', short: 'Sat' },
  { key: 'sun', short: 'Sun' },
]

const PERIODS = [
  { label: 'Morning',   hours: [8, 9, 10, 11]              },
  { label: 'Afternoon', hours: [12, 13, 14, 15, 16, 17]    },
  { label: 'Evening',   hours: [18, 19, 20, 21, 22]        },
] as const

const ALL_HOURS = PERIODS.flatMap((p) => p.hours)

function hourLabel(h: number) {
  if (h === 0)  return '12am'
  if (h < 12)  return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

interface WeeklyGridProps {
  initial: WeeklyAvailability
}

export function WeeklyGrid({ initial }: WeeklyGridProps) {
  const [avail, setAvail] = useState<WeeklyAvailability>({
    mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
    ...initial,
  })
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<{ day: DayKey; hour: number } | null>(null)

  const isDragging = useRef(false)
  const dragMode   = useRef<'paint' | 'erase'>('paint')

  const isFree = (day: DayKey, hour: number) => avail[day]?.includes(hour) ?? false

  const applyCell = useCallback((day: DayKey, hour: number, mode: 'paint' | 'erase') => {
    setAvail(prev => {
      const hours = prev[day] ?? []
      if (mode === 'paint') {
        if (hours.includes(hour)) return prev
        return { ...prev, [day]: [...hours, hour].sort((a, b) => a - b) }
      } else {
        const next = hours.filter(h => h !== hour)
        if (next.length === hours.length) return prev
        return { ...prev, [day]: next }
      }
    })
    setHasChanges(true)
  }, [])

  const handleCellDown = (day: DayKey, hour: number) => {
    const mode = isFree(day, hour) ? 'erase' : 'paint'
    dragMode.current = mode
    isDragging.current = true
    applyCell(day, hour, mode)
  }

  const handleCellEnter = (day: DayKey, hour: number) => {
    setHoveredCell({ day, hour })
    if (!isDragging.current) return
    applyCell(day, hour, dragMode.current)
  }

  const handleCellLeave = () => setHoveredCell(null)

  // Toggle an entire day column on/off
  const toggleDay = (day: DayKey) => {
    const anyFree = ALL_HOURS.some((h) => isFree(day, h))
    setAvail(prev => ({
      ...prev,
      [day]: anyFree ? [] : [...ALL_HOURS],
    }))
    setHasChanges(true)
  }

  useEffect(() => {
    const up = () => { isDragging.current = false }
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up) }
  }, [])

  useEffect(() => {
    const prevent = (e: MouseEvent) => { if (isDragging.current) e.preventDefault() }
    document.addEventListener('selectstart', prevent)
    return () => document.removeEventListener('selectstart', prevent)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await saveWeeklyAvailability(avail)
    setSaving(false)
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const totalFreeHours = Object.values(avail).reduce((n, hrs) => n + hrs.length, 0)

  // Column template: time-label + 7 day columns
  const COL = '40px repeat(7, 1fr)'

  return (
    <div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        <div style={{ minWidth: '480px' }}>

          {/* Day headers — click to toggle whole day */}
          <div style={{ display: 'grid', gridTemplateColumns: COL, gap: '3px', marginBottom: '6px' }}>
            <div /> {/* time-label spacer */}
            {DAYS.map(d => {
              const anyFree = ALL_HOURS.some(h => isFree(d.key, h))
              return (
                <button
                  key={d.key}
                  onClick={() => toggleDay(d.key)}
                  title={`Click to toggle ${d.short}`}
                  style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: anyFree ? '#10b981' : '#444',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    paddingBottom: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color .15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = anyFree ? '#34d399' : '#888'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = anyFree ? '#10b981' : '#444'}
                >
                  {d.short}
                </button>
              )
            })}
          </div>

          {/* Periods + rows */}
          {PERIODS.map((period, pi) => (
            <React.Fragment key={period.label}>
              {/* Period divider */}
              <div style={{ display: 'grid', gridTemplateColumns: COL, gap: '3px', marginTop: pi === 0 ? 0 : '4px', marginBottom: '2px' }}>
                <div style={{
                  fontSize: '9px', fontWeight: 700, color: '#2a2a2a',
                  textTransform: 'uppercase', letterSpacing: '.08em',
                  textAlign: 'right', paddingRight: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                }}>{period.label}</div>
                {DAYS.map(d => <div key={d.key} style={{ height: '4px' }} />)}
              </div>

              {/* Hour rows */}
              {period.hours.map(hour => {
                const showLabel = hour % 2 === 0 || hour === period.hours[0]
                return (
                  <div
                    key={hour}
                    style={{ display: 'grid', gridTemplateColumns: COL, gap: '3px', marginBottom: '2px' }}
                  >
                    {/* Time label */}
                    <div style={{
                      fontSize: '10px', color: '#3a3a3a',
                      textAlign: 'right', paddingRight: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                      whiteSpace: 'nowrap',
                    }}>
                      {showLabel ? hourLabel(hour) : ''}
                    </div>

                    {/* Day cells */}
                    {DAYS.map(day => {
                      const free = isFree(day.key, hour)
                      const hovered = hoveredCell?.day === day.key && hoveredCell?.hour === hour

                      let bg = '#1e1e1e'
                      let border = '1px solid #272727'
                      if (free) { bg = '#059669'; border = '1px solid #047857' }
                      else if (hovered) { bg = '#10b98122'; border = '1px solid #10b98144' }

                      return (
                        <div
                          key={day.key}
                          onMouseDown={() => handleCellDown(day.key, hour)}
                          onMouseEnter={() => handleCellEnter(day.key, hour)}
                          onMouseLeave={handleCellLeave}
                          style={{
                            height: '28px',
                            borderRadius: '4px',
                            background: bg,
                            border,
                            cursor: 'pointer',
                            transition: 'background .06s, border-color .06s',
                          }}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend + save */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: '20px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#059669', border: '1px solid #047857' }} />
            Free
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#1e1e1e', border: '1px solid #272727' }} />
            Busy
          </div>
          {totalFreeHours > 0 && (
            <span style={{ fontSize: '12px', color: '#3a3a3a' }}>
              {totalFreeHours}h free per week
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          style={{
            padding: '9px 22px',
            borderRadius: '9px',
            background: saved ? '#059669' : hasChanges ? '#6366f1' : '#1e1e1e',
            color: hasChanges || saved ? '#fff' : '#333',
            border: 'none',
            fontWeight: 700,
            fontSize: '13px',
            cursor: saving || !hasChanges ? 'default' : 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
