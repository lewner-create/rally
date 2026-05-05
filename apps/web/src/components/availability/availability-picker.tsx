'use client'

import { useState, useTransition, useMemo } from 'react'
import { saveWeeklyAvailability, type WeeklyAvailability, type DayKey } from '@/lib/actions/availability'
import type { AvailabilityBlock } from '@/lib/actions/availability-blocks'

const ALL_DAYS:    DayKey[] = ['mon','tue','wed','thu','fri','sat','sun']
const WEEKDAYS:    DayKey[] = ['mon','tue','wed','thu','fri']
const WEEKEND:     DayKey[] = ['sat','sun']
const FRI_WEEKEND: DayKey[] = ['fri','sat','sun']

type Preset = { id: string; label: string; emoji: string; desc: string; days: DayKey[]; hours: number[] }

const PRESETS: Preset[] = [
  { id: 'weeknights',     label: 'Weeknights',     emoji: '🌆', desc: 'Mon–Fri evenings',    days: WEEKDAYS,    hours: [18,19,20,21,22] },
  { id: 'weekend-days',   label: 'Weekend days',   emoji: '☀️', desc: 'Sat & Sun daytime',   days: WEEKEND,     hours: [10,11,12,13,14,15,16,17] },
  { id: 'weekend-nights', label: 'Weekend nights', emoji: '🌙', desc: 'Fri–Sun evenings',    days: FRI_WEEKEND, hours: [18,19,20,21,22] },
  { id: 'mornings',       label: 'Mornings',       emoji: '🌅', desc: 'Every day, 8am–noon', days: ALL_DAYS,    hours: [8,9,10,11] },
  { id: 'midday',         label: 'Midday',         emoji: '⛅', desc: 'Every day, noon–5pm', days: ALL_DAYS,    hours: [12,13,14,15,16] },
  { id: 'late-nights',    label: 'Late nights',    emoji: '🌃', desc: 'Any day, 10pm+',      days: ALL_DAYS,    hours: [22] },
]

const DAY_KEY_MAP: Record<number, DayKey> = { 0:'sun', 1:'mon', 2:'tue', 3:'wed', 4:'thu', 5:'fri', 6:'sat' }

function buildAvailability(activeIds: Set<string>): WeeklyAvailability {
  const sets: Record<DayKey, Set<number>> = { mon:new Set(),tue:new Set(),wed:new Set(),thu:new Set(),fri:new Set(),sat:new Set(),sun:new Set() }
  activeIds.forEach(id => {
    const p = PRESETS.find(p => p.id === id)
    if (!p) return
    p.days.forEach(day => p.hours.forEach(h => sets[day].add(h)))
  })
  return Object.fromEntries(Object.entries(sets).map(([day, set]) => [day, [...set].sort((a,b) => a-b)])) as WeeklyAvailability
}

function detectActivePresets(avail: WeeklyAvailability): Set<string> {
  const active = new Set<string>()
  PRESETS.forEach(p => { if (p.days.every(day => p.hours.every(h => avail[day]?.includes(h)))) active.add(p.id) })
  return active
}

function buildSummary(activeIds: Set<string>): string | null {
  if (activeIds.size === 0) return null
  const has = (id: string) => activeIds.has(id)
  const parts: string[] = []
  if (has('weeknights')) parts.push('weeknights')
  if (has('weekend-days') && has('weekend-nights')) parts.push('weekends')
  else { if (has('weekend-days')) parts.push('weekend days'); if (has('weekend-nights')) parts.push('weekend nights') }
  if (has('mornings')) parts.push('mornings')
  if (has('midday')) parts.push('midday')
  if (has('late-nights')) parts.push('late nights')
  if (parts.length === 0) return null
  if (activeIds.size >= 5) return "Looks like you have a lot of flexibility"
  if (parts.length === 1) return `Mostly free ${parts[0]}`
  if (parts.length === 2) return `Mostly free ${parts[0]} and ${parts[1]}`
  const last = parts.pop(); return `Mostly free ${parts.join(', ')}, and ${last}`
}

// Calculate conflict ratio for a preset based on blocks in next 14 days
function getPresetConflict(preset: Preset, blocks: AvailabilityBlock[]): 'none' | 'some' | 'often' {
  if (blocks.length === 0) return 'none'
  const now = new Date(); now.setHours(0,0,0,0)
  let totalSlots = 0; let conflictSlots = 0

  for (let d = 0; d < 14; d++) {
    const date = new Date(now); date.setDate(date.getDate() + d)
    const dayKey = DAY_KEY_MAP[date.getDay()]
    if (!preset.days.includes(dayKey)) continue

    for (const hour of preset.hours) {
      totalSlots++
      const slotStart = new Date(date); slotStart.setHours(hour, 0, 0, 0)
      const slotEnd   = new Date(date); slotEnd.setHours(hour + 1, 0, 0, 0)

      const hasConflict = blocks.some(b => {
        const bs = new Date((b as any).start_time ?? (b as any).starts_at)
        const be = new Date((b as any).end_time   ?? (b as any).ends_at)
        return bs < slotEnd && be > slotStart
      })
      if (hasConflict) conflictSlots++
    }
  }

  if (totalSlots === 0 || conflictSlots === 0) return 'none'
  const ratio = conflictSlots / totalSlots
  if (ratio >= 0.3) return 'often'
  if (ratio >= 0.1) return 'some'
  return 'none'
}

const PERIODS = [
  { label: 'Morning',   hours: [8,9,10,11]         },
  { label: 'Afternoon', hours: [12,13,14,15,16,17] },
  { label: 'Evening',   hours: [18,19,20,21,22]    },
]
const ALL_HOURS = PERIODS.flatMap(p => p.hours)
const GRID_DAYS = ['mon','tue','wed','thu','fri','sat','sun'].map((k,i) => ({ key: k as DayKey, short: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] }))

function fmtH(h: number) { if(h===0)return'12am'; if(h<12)return`${h}am`; if(h===12)return'12pm'; return`${h-12}pm` }

function MiniGrid({ avail, onChange }: { avail: WeeklyAvailability; onChange: (a: WeeklyAvailability) => void }) {
  const [hovCell, setHovCell] = useState<{d:DayKey;h:number}|null>(null)
  const dragRef = { dragging: false, mode: 'paint' as 'paint'|'erase' }
  const isFree  = (d: DayKey, h: number) => avail[d]?.includes(h) ?? false
  const paint   = (d: DayKey, h: number, mode: 'paint'|'erase') => {
    const hours = avail[d] ?? []
    onChange({...avail, [d]: mode==='paint' ? (hours.includes(h)?hours:[...hours,h].sort((a,b)=>a-b)) : hours.filter(x=>x!==h)})
  }
  const toggleDay = (dk: DayKey) => { const any=ALL_HOURS.some(h=>isFree(dk,h)); onChange({...avail,[dk]:any?[]:[...ALL_HOURS]}) }
  const COL = '38px repeat(7,1fr)'
  return (
    <div style={{overflowX:'auto'}}>
      <div style={{minWidth:'440px',userSelect:'none'}} onMouseLeave={()=>setHovCell(null)}>
        <div style={{display:'grid',gridTemplateColumns:COL,gap:'2px',marginBottom:'6px'}}>
          <div/>
          {GRID_DAYS.map(d=>(
            <button key={d.key} onClick={()=>toggleDay(d.key)} style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',textAlign:'center',padding:'4px 2px',background:'none',border:'none',cursor:'pointer',color:ALL_HOURS.some(h=>isFree(d.key,h))?'#10b981':'#333',fontFamily:'inherit',borderRadius:'4px'}}>{d.short}</button>
          ))}
        </div>
        {PERIODS.map(period=>(
          <div key={period.label}>
            <div style={{display:'grid',gridTemplateColumns:COL,gap:'2px',margin:'6px 0 2px'}}>
              <div style={{fontSize:'9px',fontWeight:700,color:'#252525',textTransform:'uppercase',letterSpacing:'.1em',textAlign:'right',paddingRight:'8px',display:'flex',alignItems:'center',justifyContent:'flex-end'}}>{period.label}</div>
              {GRID_DAYS.map(d=><div key={d.key} style={{height:'3px'}}/>)}
            </div>
            {period.hours.map(hour=>(
              <div key={hour} style={{display:'grid',gridTemplateColumns:COL,gap:'2px',marginBottom:'2px'}}>
                <div style={{fontSize:'10px',color:'#333',textAlign:'right',paddingRight:'8px',display:'flex',alignItems:'center',justifyContent:'flex-end',whiteSpace:'nowrap'}}>{(hour%2===0||hour===period.hours[0])?fmtH(hour):''}</div>
                {GRID_DAYS.map(d=>{
                  const free=isFree(d.key,hour); const hov=hovCell?.d===d.key&&hovCell?.h===hour
                  return (
                    <div key={d.key}
                      onMouseDown={e=>{e.preventDefault();const mode=free?'erase':'paint';dragRef.dragging=true;dragRef.mode=mode;paint(d.key,hour,mode)}}
                      onMouseEnter={()=>{setHovCell({d:d.key,h:hour});if(dragRef.dragging)paint(d.key,hour,dragRef.mode)}}
                      onMouseUp={()=>{dragRef.dragging=false}}
                      style={{height:'24px',borderRadius:'3px',cursor:'pointer',background:free?'#059669':hov?'#10b98122':'#1e1e1e',border:free?'1px solid #047857':hov?'1px solid #10b98140':'1px solid #272727',transition:'background .05s'}}
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

const CONFLICT_DOT: Record<'none'|'some'|'often', {color:string;label:string}|null> = {
  none:  null,
  some:  { color: '#f59e0b', label: 'some conflicts' },
  often: { color: '#ef4444', label: 'often busy' },
}

export function AvailabilityPicker({
  initial,
  inline = false,
  blocks = [],
}: {
  initial: WeeklyAvailability
  inline?: boolean
  blocks?: AvailabilityBlock[]
}) {
  const [activeIds, setActiveIds] = useState<Set<string>>(() => detectActivePresets(initial))
  const [avail, setAvail]         = useState<WeeklyAvailability>(initial)
  const [gridOpen, setGridOpen]   = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saving, startSave]       = useTransition()

  const hasSelection = activeIds.size > 0 || ALL_HOURS.some(h => ALL_DAYS.some(d => avail[d]?.includes(h)))
  const summary = buildSummary(activeIds)

  // Pre-compute conflict levels for each preset
  const conflictMap = useMemo(() =>
    Object.fromEntries(PRESETS.map(p => [p.id, getPresetConflict(p, blocks)])),
    [blocks]
  )

  function togglePreset(id: string) {
    setActiveIds(prev => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id)
      setAvail(buildAvailability(next)); setSaved(false); return next
    })
  }

  const inner = (
    <>
      <h1 style={{fontSize:'22px',fontWeight:700,color:'#fff',margin:'0 0 6px',letterSpacing:'-.3px'}}>Your baseline schedule</h1>
      <p style={{fontSize:'13px',color:'#555',margin:'0 0 24px',lineHeight:1.6}}>Pick what fits your typical week. Rally uses this to suggest the best times.</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'20px'}}>
        {PRESETS.map(p => {
          const on       = activeIds.has(p.id)
          const conflict = conflictMap[p.id]
          const dot      = CONFLICT_DOT[conflict]
          return (
            <button key={p.id} onClick={()=>togglePreset(p.id)} style={{
              background: on?'#6366f110':'#161616',
              border:`1px solid ${on?'#6366f155':'#222'}`,
              borderRadius:'14px', padding:'14px 12px 12px',
              cursor:'pointer', textAlign:'left',
              display:'flex', flexDirection:'column', gap:'4px',
              position:'relative', overflow:'hidden',
              transition:'border-color .15s,background .15s,transform .1s',
              transform: on?'scale(1.02)':'scale(1)',
              fontFamily:'inherit',
            }}>
              {/* Selected checkmark */}
              <div style={{position:'absolute',top:'8px',right:'8px',width:'16px',height:'16px',borderRadius:'50%',background:on?'#6366f1':'transparent',border:`1px solid ${on?'#6366f1':'#2a2a2a'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',color:'#fff'}}>
                {on && '✓'}
              </div>
              <div style={{fontSize:'18px',lineHeight:1}}>{p.emoji}</div>
              <div style={{fontSize:'13px',fontWeight:600,color:on?'#a5b4fc':'#ccc',lineHeight:1.2}}>{p.label}</div>
              <div style={{fontSize:'11px',color:on?'#6366f166':'#3a3a3a',lineHeight:1.4}}>{p.desc}</div>
              {/* Conflict indicator */}
              {dot && (
                <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'2px'}}>
                  <div style={{width:'5px',height:'5px',borderRadius:'50%',background:dot.color,flexShrink:0}}/>
                  <span style={{fontSize:'10px',color:dot.color}}>{dot.label}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Summary */}
      {summary && (
        <div style={{borderRadius:'12px',padding:'12px 16px',background:'#161616',border:'1px solid #6366f130',marginBottom:'20px',display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{fontSize:'14px',flexShrink:0}}>✦</span>
          <p style={{fontSize:'13px',color:'#a5b4fc',lineHeight:1.5,margin:0}}>{summary}</p>
        </div>
      )}

      {/* Fine-tune disclosure */}
      <button onClick={()=>setGridOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:'8px',background:'none',border:'none',cursor:'pointer',padding:'4px 0',marginBottom:'14px',fontFamily:'inherit'}}>
        <span style={{fontSize:'11px',color:'#333',display:'inline-block',transform:gridOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform .2s'}}>›</span>
        <span style={{fontSize:'13px',color:'#444'}}>Fine-tune specific times</span>
      </button>

      <div style={{overflow:'hidden',maxHeight:gridOpen?'600px':'0px',opacity:gridOpen?1:0,transition:'max-height .35s ease,opacity .25s ease',marginBottom:gridOpen?'20px':'0'}}>
        <div style={{background:'#161616',border:'1px solid #1e1e1e',borderRadius:'14px',padding:'18px'}}>
          <MiniGrid avail={avail} onChange={a=>{setAvail(a);setActiveIds(detectActivePresets(a));setSaved(false)}} />
        </div>
      </div>

      <button onClick={()=>startSave(async()=>{await saveWeeklyAvailability(avail);setSaved(true)})} disabled={!hasSelection||saving} style={{width:'100%',padding:'13px',borderRadius:'12px',background:saved?'#059669':hasSelection?'#6366f1':'#1a1a1a',color:hasSelection?'#fff':'#333',border:'none',fontSize:'14px',fontWeight:700,cursor:hasSelection&&!saving?'pointer':'default',fontFamily:'inherit',transition:'background .2s,color .2s'}}>
        {saving?'Saving…':saved?'Saved ✓':'Save schedule'}
      </button>
    </>
  )

  if (inline) return <div style={{paddingBottom:'32px'}}>{inner}</div>
  return (
    <div style={{minHeight:'100vh',background:'#0f0f0f',color:'#fff'}}>
      <div style={{maxWidth:'560px',margin:'0 auto',padding:'40px 24px 80px'}}>{inner}</div>
    </div>
  )
}
