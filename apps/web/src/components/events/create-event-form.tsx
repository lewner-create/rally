'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createEvent } from '@/lib/actions/events'
import type { EventType, EventStatus } from '@/lib/actions/events'
import { generateEventTitle } from '@/lib/name-generator'
import Link from 'next/link'

const ALL_EVENT_TYPES: Array<{ id: EventType; label: string; icon: string; interests: string[]; gradient: string }> = [
  { id: 'game_night', label: 'Game night', icon: '🎮', interests: ['gaming'],                                          gradient: 'linear-gradient(145deg, #1a1040, #2d1f6e)' },
  { id: 'hangout',    label: 'Hangout',    icon: '☕', interests: ['dining','bars','movies','music','kids','wellness'], gradient: 'linear-gradient(145deg, #1a1208, #3d2b10)' },
  { id: 'meetup',     label: 'Meetup',     icon: '🤝', interests: [],                                                   gradient: 'linear-gradient(145deg, #0d1f2d, #1a3a4a)' },
  { id: 'day_trip',   label: 'Day trip',   icon: '🗺️', interests: ['hiking','cycling','photography'],                   gradient: 'linear-gradient(145deg, #0d2010, #1a4020)' },
  { id: 'road_trip',  label: 'Road trip',  icon: '🚗', interests: ['road_trips','travel'],                              gradient: 'linear-gradient(145deg, #1a1a1a, #2d2d2d)' },
  { id: 'moto_trip',  label: 'Moto trip',  icon: '🏍️', interests: ['motorcycles'],                                      gradient: 'linear-gradient(145deg, #2d0f00, #4a1a00)' },
  { id: 'vacation',   label: 'Vacation',   icon: '✈️', interests: ['travel','vacation'],                                gradient: 'linear-gradient(145deg, #001a2d, #003a5c)' },
]

const OCCASION_EVENT_MAP: Record<string, EventType> = {
  birthday:'hangout', wedding:'hangout', bachelorette:'hangout',
  bachelor:'hangout', family_trip:'road_trip', festival:'hangout',
  concert:'hangout', vacation:'vacation', kids_party:'hangout',
  family_reunion:'hangout', spa_day:'hangout',
}

const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function TimePicker({ value, onChange, themeColor }: {
  value: string; onChange: (v: string) => void; themeColor: string
}) {
  const [h, m] = value.split(':').map(Number)
  const hour12   = h % 12 || 12
  const ampm     = h >= 12 ? 'PM' : 'AM'

  const setHour = (newH12: number, newAmpm: string) => {
    let h24 = newH12 % 12
    if (newAmpm === 'PM') h24 += 12
    onChange(`${String(h24).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }
  const setMinute = (newM: number) => onChange(`${String(h).padStart(2,'0')}:${String(newM).padStart(2,'0')}`)
  const setAmpm   = (newAmpm: string) => setHour(hour12, newAmpm)

  const sel: React.CSSProperties = {
    padding:'10px 8px', borderRadius:'10px', border:'1.5px solid #eee',
    fontSize:'14px', fontFamily:'inherit', color:'#111', background:'white',
    outline:'none', cursor:'pointer', appearance:'none' as any,
    WebkitAppearance:'none' as any, textAlign:'center',
  }

  return (
    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
      <select value={hour12} onChange={e=>setHour(Number(e.target.value),ampm)} style={{...sel,flex:1}}
        onFocus={e=>(e.target.style.borderColor=themeColor)} onBlur={e=>(e.target.style.borderColor='#eee')}>
        {Array.from({length:12},(_,i)=>i+1).map(h=><option key={h} value={h}>{h}</option>)}
      </select>
      <span style={{color:'#ccc',fontWeight:700,fontSize:'14px'}}>:</span>
      <select value={m} onChange={e=>setMinute(Number(e.target.value))} style={{...sel,flex:1}}
        onFocus={e=>(e.target.style.borderColor=themeColor)} onBlur={e=>(e.target.style.borderColor='#eee')}>
        {[0,5,10,15,20,25,30,35,40,45,50,55].map(min=><option key={min} value={min}>{String(min).padStart(2,'0')}</option>)}
      </select>
      <select value={ampm} onChange={e=>setAmpm(e.target.value)} style={{...sel,width:'64px'}}
        onFocus={e=>(e.target.style.borderColor=themeColor)} onBlur={e=>(e.target.style.borderColor='#eee')}>
        <option>AM</option><option>PM</option>
      </select>
    </div>
  )
}

function CalendarPicker({ value, onChange, themeColor }: {
  value: string; onChange: (v: string) => void; themeColor: string
}) {
  const today    = new Date()
  const selected = value ? new Date(value+'T12:00:00') : null
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [open, setOpen] = useState(!value)

  const firstDay    = new Date(viewYear,viewMonth,1).getDay()
  const daysInMonth = new Date(viewYear,viewMonth+1,0).getDate()

  const prevMonth = () => { if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1)}else setViewMonth(m=>m-1) }
  const nextMonth = () => { if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1)}else setViewMonth(m=>m+1) }

  const isSelected = (d:number) => selected?selected.getFullYear()===viewYear&&selected.getMonth()===viewMonth&&selected.getDate()===d:false
  const isToday    = (d:number) => today.getFullYear()===viewYear&&today.getMonth()===viewMonth&&today.getDate()===d
  const isPast     = (d:number) => { const dt=new Date(viewYear,viewMonth,d);dt.setHours(0,0,0,0);const t=new Date();t.setHours(0,0,0,0);return dt<t }

  const handleSelect = (d:number) => {
    if(isPast(d)) return
    onChange(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
    setOpen(false)
  }

  const displayValue = selected
    ? selected.toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric',year:'numeric'})
    : 'Pick a date'

  const cells:(number|null)[] = [...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)]

  return (
    <div>
      <button onClick={()=>setOpen(o=>!o)} style={{
        width:'100%',padding:'11px 14px',borderRadius:'10px',
        border:`1.5px solid ${value?themeColor:'#eee'}`,
        fontSize:'14px',color:value?'#111':'#999',
        marginBottom:open?'10px':'0',
        background:value?`${themeColor}08`:'#fafafa',
        fontWeight:value?600:400,cursor:'pointer',
        textAlign:'left',fontFamily:'inherit',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        transition:'all 0.15s',
      }}>
        <span>📅 {displayValue}</span>
        <span style={{fontSize:'11px',color:'#bbb'}}>{open?'▲':'▼'}</span>
      </button>

      {open&&(
        <div style={{border:'1.5px solid #eee',borderRadius:'14px',overflow:'hidden',background:'white'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #f5f5f5',background:'#fafafa'}}>
            <button onClick={prevMonth} style={navBtnStyle}>‹</button>
            <span style={{fontSize:'14px',fontWeight:700,color:'#111'}}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={navBtnStyle}>›</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'#fafafa'}}>
            {DAYS.map(d=><div key={d} style={{textAlign:'center',padding:'6px 0',fontSize:'11px',fontWeight:700,color:'#bbb'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'4px 8px 10px',gap:'2px'}}>
            {cells.map((d,i)=>{
              if(!d) return <div key={i}/>
              const sel=isSelected(d),tod=isToday(d),past=isPast(d)
              return(
                <button key={i} onClick={()=>handleSelect(d)} disabled={past} style={{
                  width:'100%',aspectRatio:'1',borderRadius:'8px',border:'none',
                  background:sel?themeColor:'transparent',
                  color:sel?'white':past?'#ddd':tod?themeColor:'#333',
                  fontWeight:sel||tod?700:400,fontSize:'13px',
                  cursor:past?'not-allowed':'pointer',fontFamily:'inherit',
                  transition:'all 0.1s',
                  outline:tod&&!sel?`2px solid ${themeColor}40`:'none',
                }}>{d}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const navBtnStyle:React.CSSProperties={width:'28px',height:'28px',borderRadius:'50%',border:'none',background:'white',cursor:'pointer',fontSize:'18px',color:'#555',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',fontFamily:'inherit',lineHeight:'1'}

function getEventTypesForGroup(interests:string[],groupType:string,occasion:string){
  if(groupType==='one_time'){
    const mapped=OCCASION_EVENT_MAP[occasion]
    return [...ALL_EVENT_TYPES].sort((a,b)=>a.id===mapped?-1:b.id===mapped?1:0)
  }
  if(!interests.length) return ALL_EVENT_TYPES
  return [...ALL_EVENT_TYPES].sort((a,b)=>{
    const aM=a.interests.some(i=>interests.includes(i))
    const bM=b.interests.some(i=>interests.includes(i))
    return aM&&!bM?-1:!aM&&bM?1:0
  })
}

function getDefaultEventType(interests:string[],groupType:string,occasion:string):EventType{
  if(groupType==='one_time'&&occasion&&OCCASION_EVENT_MAP[occasion]) return OCCASION_EVENT_MAP[occasion]
  return getEventTypesForGroup(interests,groupType,occasion)[0]?.id??'hangout'
}

function formatPreviewDate(date:string){
  if(!date) return null
  return new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})
}

function formatPreviewTime(start:string,end:string){
  const fmt=(t:string)=>{
    const[h,m]=t.split(':').map(Number)
    const ampm=h>=12?'PM':'AM'
    const hour=h%12||12
    return m===0?`${hour} ${ampm}`:`${hour}:${String(m).padStart(2,'0')} ${ampm}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

interface CreateEventFormProps {
  groupId: string
  groupName?: string
  groupType?: string
  interests?: string[]
  themeColor?: string
  memberCount?: number  // ← add this
}

export function CreateEventForm({
  groupId, groupName, groupType='recurring',
  interests=[], themeColor='#7F77DD', memberCount=0,
}: CreateEventFormProps) {
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)
  const occasion = ''
  const sortedTypes  = getEventTypesForGroup(interests,groupType,occasion)
  const defaultType  = getDefaultEventType(interests,groupType,occasion)

  const [title,setTitle]                 = useState('')
  const [eventType,setEventType]         = useState<EventType>(defaultType)
  const [date,setDate]                   = useState('')
  const [startTime,setStartTime]         = useState('18:00')
  const [endTime,setEndTime]             = useState('21:00')
  const [description,setDesc]            = useState('')
  const [bannerFile,setBannerFile]       = useState<File|null>(null)
  const [bannerPreview,setBannerPreview] = useState('')
  const [submitting,setSubmitting]       = useState<EventStatus|null>(null)
  const [suggesting,setSuggesting]       = useState(false)
  const [uploadError,setUploadError]     = useState('')

  const canSubmit   = title.trim().length>0 && date.length>0 && !submitting
  const currentType = ALL_EVENT_TYPES.find(t=>t.id===eventType)

  const handleFileChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]
    if(!file) return
    if(file.size>5*1024*1024){setUploadError('Image must be under 5MB');return}
    setUploadError('')
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleSuggestTitle = () => {
  setSuggesting(true)
  setTitle(generateEventTitle(eventType, memberCount))
  setTimeout(() => setSuggesting(false), 400)
}

  const handleSubmit=async(status:EventStatus)=>{
    if(!canSubmit) return
    setSubmitting(status)
    try{
      let bannerUrl:string|undefined
      if(bannerFile){
        const supabase=createClient()
        const ext=bannerFile.name.split('.').pop()??'jpg'
        const path=`events/${Date.now()}.${ext}`
        const{error:upErr}=await supabase.storage.from('banners').upload(path,bannerFile,{upsert:true})
        if(upErr){setUploadError('Banner upload failed: '+upErr.message);setSubmitting(null);return}
        const{data:{publicUrl}}=supabase.storage.from('banners').getPublicUrl(path)
        bannerUrl=publicUrl
      }
      const event=await createEvent({
        groupId,title:title.trim(),eventType,
        startsAt:`${date}T${startTime}:00`,
        endsAt:`${date}T${endTime}:00`,
        description:description.trim()||undefined,
        status, bannerUrl,
      })
      router.push(status==='published'?`/events/${event.id}`:`/groups/${groupId}`)
    }catch(err){
      console.error(err)
      setSubmitting(null)
    }
  }

  const bannerImageStyle = bannerPreview ? {
    backgroundImage:`url(${bannerPreview})`,
    backgroundSize:'cover' as const,
    backgroundPosition:'center' as const,
    backgroundColor:'transparent',
  } : {
    backgroundImage:'none',
    backgroundSize:'cover' as const,
    backgroundPosition:'center' as const,
    backgroundColor:'transparent',
  }

  return(
    <div style={{minHeight:'100vh',background:'#F1EFE8'}}>

      {/* Sticky header */}
      <div style={{background:'white',borderBottom:'1px solid #eee',padding:'14px 24px',display:'flex',alignItems:'center',gap:'12px',position:'sticky',top:0,zIndex:10}}>
        <Link href={`/groups/${groupId}`} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',color:'#555',fontSize:'14px',flexShrink:0}}>←</Link>
        <div>
          <div style={{fontSize:'12px',color:'#bbb',fontWeight:500}}>{groupName}</div>
          <div style={{fontSize:'14px',fontWeight:800,color:'#111',lineHeight:1.1}}>New plan</div>
        </div>
        <button
          onClick={()=>handleSubmit('published')}
          disabled={!canSubmit}
          style={{marginLeft:'auto',padding:'9px 20px',borderRadius:'9999px',background:canSubmit?themeColor:'#e5e5e5',border:'none',color:'white',fontSize:'13px',fontWeight:700,cursor:canSubmit?'pointer':'not-allowed',boxShadow:canSubmit?`0 4px 14px ${themeColor}50`:'none',fontFamily:'inherit',transition:'all 0.15s'}}
        >
          {submitting==='published'?'Locking in…':'Lock it in →'}
        </button>
      </div>

      <div style={{maxWidth:'980px',margin:'0 auto',padding:'24px 20px 60px',display:'grid',gridTemplateColumns:'420px 1fr',gap:'24px',alignItems:'start'}}>

        {/* ── LEFT: Preview + name + type ── */}
        <div style={{position:'sticky',top:'72px',display:'flex',flexDirection:'column',gap:'10px',maxHeight:'calc(100vh - 96px)',overflowY:'auto',paddingBottom:'8px'}}>          <p style={{fontSize:'11px',fontWeight:700,color:'#999',textTransform:'uppercase',letterSpacing:'.07em',margin:'0 0 2px'}}>Preview</p>

          {/* Live card */}
          <div style={{borderRadius:'20px',overflow:'hidden',position:'relative',minHeight:'300px',...bannerImageStyle}}>
            {/* Event type gradient bg when no banner */}
            {!bannerPreview&&(
              <div style={{position:'absolute',inset:0,background:currentType?.gradient??'linear-gradient(145deg,#2C2C2A,#1C1B1A)'}}/>
            )}
            {/* Overlay */}
            <div style={{position:'absolute',inset:0,background:bannerPreview?'linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.75) 100%)':'linear-gradient(to bottom,rgba(0,0,0,0.0) 0%,rgba(0,0,0,0.45) 100%)'}}/>

            <div style={{position:'relative',padding:'22px',display:'flex',flexDirection:'column',justifyContent:'space-between',minHeight:'300px'}}>
              <div>
                <div style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'4px 11px',borderRadius:'9999px',background:'rgba(255,255,255,0.14)',fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.8)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'14px'}}>
                  {currentType?.icon} {currentType?.label}
                </div>
                <h2 style={{fontSize:'24px',fontWeight:800,color:'white',margin:'0 0 10px',letterSpacing:'-0.4px',lineHeight:1.15,textShadow:'0 1px 8px rgba(0,0,0,0.4)',minHeight:'30px'}}>
                  {title||<span style={{color:'rgba(255,255,255,0.2)',fontWeight:400,fontSize:'20px'}}>Event name…</span>}
                </h2>
                {date?(
                  <>
                    <p style={{fontSize:'14px',color:'rgba(255,255,255,0.85)',margin:'0 0 3px',textShadow:'0 1px 4px rgba(0,0,0,0.3)'}}>{formatPreviewDate(date)}</p>
                    <p style={{fontSize:'13px',color:'rgba(255,255,255,0.55)',margin:0}}>{formatPreviewTime(startTime,endTime)}</p>
                  </>
                ):(
                  <p style={{fontSize:'14px',color:'rgba(255,255,255,0.2)',margin:0}}>Date & time…</p>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'28px'}}>
                <span style={{fontSize:'12px',color:'rgba(255,255,255,0.45)',fontWeight:500}}>{groupName}</span>
                <div style={{padding:'9px 20px',borderRadius:'9999px',background:themeColor,fontSize:'13px',fontWeight:700,color:'white',boxShadow:`0 4px 14px ${themeColor}70`}}>Going?</div>
              </div>
            </div>
          </div>

          {/* Banner upload */}
          <div>
            <button onClick={()=>fileRef.current?.click()} style={{width:'100%',padding:'11px',borderRadius:'12px',border:`1.5px dashed ${bannerPreview?themeColor:'#ddd'}`,background:bannerPreview?`${themeColor}08`:'white',fontSize:'13px',fontWeight:600,color:bannerPreview?themeColor:'#bbb',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',transition:'all 0.15s'}}>
              <span style={{fontSize:'15px'}}>{bannerPreview?'🖼️':'📷'}</span>
              {bannerPreview?'Change banner image':'Add a banner image'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{display:'none'}}/>
            {bannerPreview&&<button onClick={()=>{setBannerFile(null);setBannerPreview('')}} style={{width:'100%',marginTop:'5px',padding:'7px',borderRadius:'9px',border:'none',background:'none',fontSize:'12px',color:'#D85A30',cursor:'pointer',fontFamily:'inherit'}}>Remove banner</button>}
            {uploadError&&<p style={{fontSize:'12px',color:'#D85A30',margin:'5px 0 0',textAlign:'center'}}>{uploadError}</p>}
            <p style={{fontSize:'11px',color:'#ccc',marginTop:'5px',textAlign:'center'}}>JPG or PNG · max 5MB</p>
          </div>

          {/* Event name — in left column */}
          <div style={{background:'white',borderRadius:'18px',padding:'18px 20px',boxShadow:'0 1px 8px rgba(0,0,0,0.05)'}}>
            <Label>Plan name</Label>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <input
                autoFocus
                value={title}
                onChange={e=>setTitle(e.target.value)}
                placeholder="Name your plan…"
                style={{...inputStyle,flex:1}}
                onFocus={e=>(e.target.style.borderColor=themeColor)}
                onBlur={e=>(e.target.style.borderColor='#eee')}
              />
              <button onClick={handleSuggestTitle} title="Generate a fun name" style={{width:'44px',height:'44px',borderRadius:'10px',border:'1.5px solid #eee',background:suggesting?`${themeColor}15`:'#fafafa',fontSize:'18px',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.15s'}}>🎲</button>
            </div>
            <p style={{fontSize:'11px',color:'#ccc',marginTop:'5px'}}>Hit 🎲 to generate a fun name for your plan</p>
          </div>

          {/* Event type — in left column */}
          <div style={{background:'white',borderRadius:'18px',padding:'18px 20px',boxShadow:'0 1px 8px rgba(0,0,0,0.05)'}}>
            <Label>Type</Label>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {sortedTypes.map(t=>{
                const active=eventType===t.id
                return(
                  <button key={t.id} onClick={()=>setEventType(t.id)} style={{display:'inline-flex',alignItems:'center',gap:'7px',padding:'7px 12px',borderRadius:'9999px',flexShrink:0,border:`2px solid ${active?themeColor:'#eee'}`,background:active?`${themeColor}12`:'#fafafa',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',whiteSpace:'nowrap'}}>
                    <span style={{fontSize:'14px'}}>{t.icon}</span>
                    <span style={{fontSize:'12px',fontWeight:active?700:500,color:active?themeColor:'#666'}}>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: When + details + actions ── */}
        <div style={{background:'white',borderRadius:'20px',boxShadow:'0 1px 12px rgba(0,0,0,0.06)',overflow:'hidden'}}>

          {/* Date */}
          <div style={{padding:'20px 22px',borderBottom:'1px solid #f5f5f5'}}>
            <Label>Date</Label>
            <CalendarPicker value={date} onChange={setDate} themeColor={themeColor}/>
          </div>

          {/* Time */}
          <div style={{padding:'20px 22px',borderBottom:'1px solid #f5f5f5'}}>
            <div style={{marginBottom:'14px'}}>
              <Label>Start time</Label>
              <TimePicker value={startTime} onChange={setStartTime} themeColor={themeColor}/>
            </div>
            <div>
              <Label>End time</Label>
              <TimePicker value={endTime} onChange={setEndTime} themeColor={themeColor}/>
            </div>
          </div>

          {/* Details */}
          <div style={{padding:'20px 22px'}}>
            <Label>Details <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:'11px'}}>(optional)</span></Label>
            <textarea
              value={description}
              onChange={e=>setDesc(e.target.value)}
              placeholder="Address, what to bring, parking notes…"
              rows={4}
              style={{...inputStyle,resize:'vertical',lineHeight:1.6,minHeight:'90px'} as React.CSSProperties}
              onFocus={e=>(e.target.style.borderColor=themeColor)}
              onBlur={e=>(e.target.style.borderColor='#eee')}
            />

            <div style={{display:'flex',gap:'10px',marginTop:'16px'}}>
              <button onClick={()=>handleSubmit('draft')} disabled={!canSubmit} style={{flex:1,padding:'13px',borderRadius:'12px',border:'1.5px solid #e5e5e5',background:'white',fontSize:'14px',fontWeight:600,color:'#666',cursor:canSubmit?'pointer':'not-allowed',opacity:canSubmit?1:0.5,fontFamily:'inherit'}}>
                {submitting==='draft'?'Saving…':'Save draft'}
              </button>
              <button onClick={()=>handleSubmit('published')} disabled={!canSubmit} style={{flex:2,padding:'13px',borderRadius:'12px',background:canSubmit?themeColor:'#ddd',border:'none',color:'white',fontSize:'14px',fontWeight:700,cursor:canSubmit?'pointer':'not-allowed',boxShadow:canSubmit?`0 4px 20px ${themeColor}50`:'none',fontFamily:'inherit',transition:'all 0.15s'}}>
                {submitting==='published'?'Locking in…':'Lock it in →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({children}:{children:React.ReactNode}){
  return <div style={{fontSize:'11px',fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:'8px'}}>{children}</div>
}

const inputStyle:React.CSSProperties={
  width:'100%',padding:'11px 13px',borderRadius:'10px',
  border:'1.5px solid #eee',fontSize:'14px',outline:'none',
  boxSizing:'border-box',fontFamily:'inherit',
  background:'white',color:'#111',transition:'border-color 0.15s',
}
