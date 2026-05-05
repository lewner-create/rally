'use client'

import { useState, useTransition, useEffect } from 'react'
import { createBlock, deleteBlock, type AvailabilityBlock } from '@/lib/actions/availability-blocks'
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react'

type Props = { initialBlocks: AvailabilityBlock[] }

const SOURCE_BORDER: Record<string, string> = {
  google: '#4285F4',
  event:  '#7F77DD',
  manual: '#f59e0b',
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2,'0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getStartTime(b: AvailabilityBlock): Date {
  return new Date((b as any).start_time ?? (b as any).starts_at)
}
function getEndTime(b: AvailabilityBlock): Date {
  return new Date((b as any).end_time ?? (b as any).ends_at)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function dayLabel(date: Date): string {
  const today    = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1)
  const d        = new Date(date); d.setHours(0,0,0,0)
  if (d.getTime()===today.getTime())    return 'Today'
  if (d.getTime()===tomorrow.getTime()) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function buildSummary(blocks: AvailabilityBlock[]): string {
  if (blocks.length === 0) return ''
  const today = new Date(); today.setHours(0,0,0,0)
  const todayEnd = new Date(today); todayEnd.setHours(23,59,59,999)
  const weekEnd  = new Date(today); weekEnd.setDate(today.getDate()+7)

  const todayCount = blocks.filter(b => { const s=getStartTime(b); return s>=today && s<=todayEnd }).length
  const weekCount  = blocks.filter(b => { const s=getStartTime(b); return s>=today && s<weekEnd }).length

  if (todayCount > 0) return `${todayCount} busy ${todayCount===1?'window':'windows'} today · ${weekCount} this week`
  if (weekCount  > 0) return `${weekCount} busy ${weekCount===1?'window':'windows'} this week`
  return `${blocks.length} upcoming`
}

function BlockRow({ block, onDelete, removing }: { block: AvailabilityBlock; onDelete?: (id: string)=>void; removing: string|null }) {
  const color   = SOURCE_BORDER[block.source] ?? '#f59e0b'
  const startIso = (block as any).start_time ?? (block as any).starts_at
  const endIso   = (block as any).end_time   ?? (block as any).ends_at

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'9px', background:'#111', marginBottom:'3px' }}>
      <div style={{ width:'3px', height:'28px', borderRadius:'9999px', background:color, flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        {block.label && (
          <p style={{ fontSize:'12px', fontWeight:500, color:'#bbb', margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{block.label}</p>
        )}
        <p style={{ fontSize:'11px', color:'#555', margin:0 }}>
          {formatTime(startIso)} – {formatTime(endIso)}
        </p>
      </div>
      {onDelete && block.source==='manual' && (
        <button onClick={()=>onDelete(block.id)} disabled={removing===block.id}
          style={{ width:'22px',height:'22px',borderRadius:'6px',background:'none',border:'none',cursor:'pointer',color:'#333',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}
          onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color='#f87171')}
          onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color='#333')}
        >
          {removing===block.id ? '…' : <X size={12}/>}
        </button>
      )}
    </div>
  )
}

export function BusyTimesPanel({ initialBlocks }: Props) {
  const [blocks,   setBlocks]   = useState<AvailabilityBlock[]>(initialBlocks)
  const [showForm, setShowForm] = useState(false)
  const [showAll,  setShowAll]  = useState(false)
  const [label,    setLabel]    = useState('')
  const [startsAt, setStartsAt] = useState(()=>toLocalInputValue(new Date()))
  const [endsAt,   setEndsAt]   = useState(()=>{const d=new Date();d.setHours(d.getHours()+2);return toLocalInputValue(d)})
  const [saving,   startSave]   = useTransition()
  const [removing, setRemoving] = useState<string|null>(null)
  const [error,    setError]    = useState<string|null>(null)

  useEffect(()=>{ setBlocks(initialBlocks) }, [initialBlocks])

  async function handleAdd() {
    if (!startsAt||!endsAt) return
    setError(null)
    startSave(async()=>{
      const { id, error } = await createBlock({
        startsAt: new Date(startsAt).toISOString(),
        endsAt:   new Date(endsAt).toISOString(),
        label:    label.trim()||undefined,
        source:   'manual',
      })
      if (error||!id) { setError(error??'Failed'); return }
      setBlocks(prev=>[...prev,{
        id, user_id:'', start_time:new Date(startsAt).toISOString(),
        end_time:new Date(endsAt).toISOString(), label:label.trim()||null,
        source:'manual', event_id:null, created_at:new Date().toISOString()
      } as any].sort((a,b)=>getStartTime(a as any).getTime()-getStartTime(b as any).getTime()))
      setShowForm(false); setLabel('')
    })
  }

  async function handleDelete(id: string) {
    setRemoving(id)
    const { error } = await deleteBlock(id)
    if (error) { setError(error); setRemoving(null); return }
    setBlocks(prev=>prev.filter(b=>b.id!==id)); setRemoving(null)
  }

  // Bucket blocks into time groups
  const now      = new Date(); now.setSeconds(0,0)
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)
  const tmrwEnd  = new Date(); tmrwEnd.setDate(tmrwEnd.getDate()+1); tmrwEnd.setHours(23,59,59,999)
  const wkndEnd  = new Date()
  // next Saturday + Sunday
  const dow = wkndEnd.getDay()
  const daysToSat = dow===6?7:(6-dow)
  const satEnd = new Date(); satEnd.setDate(satEnd.getDate()+daysToSat); satEnd.setHours(23,59,59,999)
  const sunEnd = new Date(satEnd); sunEnd.setDate(satEnd.getDate()+1)

  const todayBlocks   = blocks.filter(b=>{ const s=getStartTime(b); return s>=now && s<=todayEnd })
  const tmrwBlocks    = blocks.filter(b=>{ const s=getStartTime(b); return s>todayEnd && s<=tmrwEnd })
  const wkndBlocks    = blocks.filter(b=>{ const s=getStartTime(b); return s>tmrwEnd && s<=sunEnd })
  const laterBlocks   = blocks.filter(b=>{ const s=getStartTime(b); return s>sunEnd })
  const manualBlocks  = blocks.filter(b=>b.source==='manual')

  const summary = buildSummary(blocks)

  const featuredGroups = [
    { label: 'Today',        items: todayBlocks },
    { label: 'Tomorrow',     items: tmrwBlocks  },
    { label: 'This weekend', items: wkndBlocks  },
  ].filter(g=>g.items.length>0)

  return (
    <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #1a1a1a' }}>

      {/* Section header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
        <div>
          <h2 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Busy times</h2>
          {summary && <p style={{ fontSize:'12px', color:'#555', margin:'3px 0 0' }}>{summary} · we'll work around these</p>}
          {!summary && <p style={{ fontSize:'12px', color:'#444', margin:'3px 0 0' }}>Nothing upcoming — you look free</p>}
        </div>
        <button
          onClick={()=>setShowForm(v=>!v)}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 10px', borderRadius:'8px', background:showForm?'#2a2a2a':'transparent', border:`1px solid ${showForm?'#333':'#222'}`, color:showForm?'#555':'#555', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}
          onMouseEnter={e=>{ if(!showForm)(e.currentTarget as HTMLElement).style.borderColor='#444' }}
          onMouseLeave={e=>{ if(!showForm)(e.currentTarget as HTMLElement).style.borderColor='#222' }}
        >
          <Plus size={12}/> Block time
        </button>
      </div>

      {/* Add manual block form */}
      {showForm && (
        <div style={{ background:'#161616', border:'1px solid #222', borderRadius:'12px', padding:'14px', marginBottom:'16px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="What's keeping you busy? (optional)"
              style={INPUT} onFocus={e=>(e.target.style.borderColor='#7F77DD')} onBlur={e=>(e.target.style.borderColor='#2a2a2a')}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <div>
                <p style={LABEL_S}>Starts</p>
                <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} style={{...INPUT,colorScheme:'dark'}}/>
              </div>
              <div>
                <p style={LABEL_S}>Ends</p>
                <input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} style={{...INPUT,colorScheme:'dark'}}/>
              </div>
            </div>
            {error && <p style={{fontSize:'12px',color:'#f87171',margin:0}}>{error}</p>}
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setShowForm(false)} style={{flex:1,padding:'8px',borderRadius:'8px',border:'1px solid #2a2a2a',background:'none',fontSize:'12px',color:'#555',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
              <button onClick={handleAdd} disabled={saving||!startsAt||!endsAt} style={{flex:2,padding:'8px',borderRadius:'8px',background:saving?'#2a2a2a':'#7F77DD',border:'none',color:saving?'#444':'#fff',fontSize:'12px',fontWeight:700,cursor:saving?'default':'pointer',fontFamily:'inherit'}}>
                {saving?'Saving…':'Block this time'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured groups: Today / Tomorrow / This weekend */}
      {featuredGroups.map(group=>(
        <div key={group.label} style={{marginBottom:'14px'}}>
          <p style={DAY_LABEL}>{group.label}</p>
          {group.items.map(b=><BlockRow key={b.id} block={b} onDelete={handleDelete} removing={removing}/>)}
        </div>
      ))}

      {/* Manual blocks not in featured groups */}
      {manualBlocks.filter(b=>getStartTime(b)>sunEnd).length > 0 && (
        <div style={{marginBottom:'14px'}}>
          <p style={DAY_LABEL}>Manually blocked</p>
          {manualBlocks.filter(b=>getStartTime(b)>sunEnd).map(b=>(
            <BlockRow key={b.id} block={b} onDelete={handleDelete} removing={removing}/>
          ))}
        </div>
      )}

      {/* "View more" expander for later blocks */}
      {laterBlocks.filter(b=>b.source!=='manual').length > 0 && (
        <div>
          <button
            onClick={()=>setShowAll(v=>!v)}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'9px', borderRadius:'9px', background:'transparent', border:'1px solid #1e1e1e', cursor:'pointer', fontFamily:'inherit', color:'#444', fontSize:'12px', fontWeight:600, transition:'border-color .15s' }}
            onMouseEnter={e=>((e.currentTarget as HTMLElement).style.borderColor='#333')}
            onMouseLeave={e=>((e.currentTarget as HTMLElement).style.borderColor='#1e1e1e')}
          >
            {showAll ? <><ChevronUp size={13}/> Show less</> : <><ChevronDown size={13}/> {laterBlocks.filter(b=>b.source!=='manual').length} more coming up</>}
          </button>

          {showAll && (
            <div style={{marginTop:'12px'}}>
              {/* Group remaining by day */}
              {Object.entries(
                laterBlocks.filter(b=>b.source!=='manual').reduce<Record<string,AvailabilityBlock[]>>((acc,b)=>{
                  const k=getStartTime(b).toDateString()
                  if(!acc[k])acc[k]=[]
                  acc[k].push(b)
                  return acc
                },{})
              ).sort(([a],[b])=>new Date(a).getTime()-new Date(b).getTime()).map(([dateKey,items])=>(
                <div key={dateKey} style={{marginBottom:'12px'}}>
                  <p style={DAY_LABEL}>{dayLabel(new Date(dateKey))}</p>
                  {items.map(b=><BlockRow key={b.id} block={b} onDelete={handleDelete} removing={removing}/>)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

const INPUT: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:'8px', border:'1px solid #2a2a2a', background:'#1a1a1a', fontSize:'12px', color:'#fff', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color .15s' }
const LABEL_S: React.CSSProperties = { fontSize:'10px', fontWeight:700, color:'#444', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 4px' }
const DAY_LABEL: React.CSSProperties = { fontSize:'10px', fontWeight:700, color:'#444', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 6px' }
