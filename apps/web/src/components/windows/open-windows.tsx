import { getOpenWindows, type OpenWindow, type MemberProfile } from '@/lib/actions/windows'
import { NudgeButton } from '@/components/groups/nudge-button'
import { Calendar, Lock } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function fmtSlot(w: OpenWindow) {
  const d = w.start
  const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const fmtH = (h: number) => {
    if (h === 0)  return '12 AM'
    if (h < 12)  return `${h} AM`
    if (h === 12) return '12 PM'
    return `${h - 12} PM`
  }

  return {
    dayName:    DAYS[d.getDay()],
    shortDate:  `${MONTHS[d.getMonth()]} ${d.getDate()}`,
    time:       `${fmtH(d.getHours())} – ${fmtH(w.end.getHours())}`,
    hours:      Math.round((w.end.getTime() - w.start.getTime()) / 3_600_000),
    windowDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    windowStart:`${pad(d.getHours())}:00`,
    windowEnd:  `${pad(w.end.getHours())}:00`,
    windowTimeLabel: `${fmtH(d.getHours())} – ${fmtH(w.end.getHours())}`,
  }
}

// Human-readable window label: "Tonight", "Friday evening", "Tomorrow afternoon"
function getWindowLabel(start: Date): string {
  const now      = new Date()
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const winDay   = new Date(start.getFullYear(), start.getMonth(), start.getDate())

  const diffDays = Math.round((winDay.getTime() - today.getTime()) / 86_400_000)
  const h        = start.getHours()
  const period   = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (diffDays === 0) return h >= 17 ? 'Tonight' : `This ${period}`
  if (diffDays === 1) return `Tomorrow ${period}`
  return `${DAYS[start.getDay()]} ${period}`
}

// ─── Avatar stack ─────────────────────────────────────────────────────────────

function AvatarStack({ members, size = 26 }: { members: MemberProfile[]; size?: number }) {
  const shown = members.slice(0, 4)
  const extra = members.length - shown.length

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <div
          key={m.id}
          title={m.display_name ?? m.username ?? ''}
          style={{
            width:           size,
            height:          size,
            borderRadius:    '50%',
            background:      m.avatar_url ? 'transparent' : '#7F77DD',
            backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : undefined,
            backgroundSize:  'cover',
            backgroundPosition: 'center',
            color:           'white',
            fontSize:        size * 0.38,
            fontWeight:      700,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            border:          '2px solid white',
            marginLeft:      i > 0 ? -size * 0.28 : 0,
            zIndex:          shown.length - i,
            position:        'relative',
            flexShrink:      0,
          }}
        >
          {!m.avatar_url && (m.display_name?.[0] ?? m.username?.[0] ?? '?').toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width:         size,
          height:        size,
          borderRadius:  '50%',
          background:    'rgba(255,255,255,0.15)',
          color:         'rgba(255,255,255,0.8)',
          fontSize:      size * 0.34,
          fontWeight:    700,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          border:        '2px solid white',
          marginLeft:    -size * 0.28,
          position:      'relative',
          flexShrink:    0,
        }}>
          +{extra}
        </div>
      )}
    </div>
  )
}

function AvatarStackDark({ members, size = 24 }: { members: MemberProfile[]; size?: number }) {
  const shown = members.slice(0, 4)
  const extra = members.length - shown.length

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <div
          key={m.id}
          title={m.display_name ?? m.username ?? ''}
          style={{
            width:           size,
            height:          size,
            borderRadius:    '50%',
            background:      m.avatar_url ? 'transparent' : '#5a5490',
            backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : undefined,
            backgroundSize:  'cover',
            backgroundPosition: 'center',
            color:           'rgba(255,255,255,0.7)',
            fontSize:        size * 0.38,
            fontWeight:      700,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            border:          '2px solid rgba(255,255,255,0.12)',
            marginLeft:      i > 0 ? -size * 0.28 : 0,
            zIndex:          shown.length - i,
            position:        'relative',
            flexShrink:      0,
          }}
        >
          {!m.avatar_url && (m.display_name?.[0] ?? m.username?.[0] ?? '?').toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width:         size,
          height:        size,
          borderRadius:  '50%',
          background:    'rgba(255,255,255,0.1)',
          color:         'rgba(255,255,255,0.5)',
          fontSize:      size * 0.34,
          fontWeight:    700,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          border:        '2px solid rgba(255,255,255,0.12)',
          marginLeft:    -size * 0.28,
          position:      'relative',
          flexShrink:    0,
        }}>
          +{extra}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OpenWindowsProps {
  groupId: string
  tier: number
}

export async function OpenWindows({ groupId, tier }: OpenWindowsProps) {
  const windows = await getOpenWindows(groupId)

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (windows.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center border border-dashed"
        style={{ borderColor: '#D3D1C7' }}
      >
        <Calendar className="h-8 w-8 mx-auto mb-3" style={{ color: '#B4B2A9' }} />
        <p className="text-sm font-medium mb-1">No open windows yet</p>
        <p className="text-xs text-muted-foreground">
          Members can set their typical availability on the availability page.
        </p>
      </div>
    )
  }

  const [best, ...rest] = windows
  const bestSlot  = fmtSlot(best)
  const bestLabel = getWindowLabel(best.start)
  const ratio     = best.availableCount / best.totalCount

  return (
    <div className="space-y-3">

      {/* ── Best window: dark hero card ────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #2C2C2A 0%, #1C1B1A 55%, #26215C 100%)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        {/* Glow orb */}
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.2) 0%, transparent 70%)' }}
        />

        <div className="relative">
          {/* Eyebrow */}
          <p
            className="text-[10px] font-medium tracking-[.07em] uppercase mb-3"
            style={{ color: '#888780' }}
          >
            {ratio >= 1
              ? 'Best window · everyone free'
              : `Best window · ${best.availableCount} of ${best.totalCount} free`}
          </p>

          {/* Label — human-readable */}
          <p
            className="text-[26px] font-semibold leading-tight mb-1"
            style={{ color: '#fff', letterSpacing: '-0.3px' }}
          >
            {bestLabel}
          </p>

          {/* Date + time */}
          <p className="text-[14px] mb-0.5" style={{ color: '#B4B2A9' }}>
            {bestSlot.shortDate}
          </p>
          <p className="text-[13px] mb-5" style={{ color: '#5F5E5A' }}>
            {bestSlot.time} · {bestSlot.hours}h
          </p>

          {/* Avatar stack + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AvatarStack members={best.members} size={28} />
              {best.members.length > 0 && (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                  {best.availableCount} {best.availableCount === 1 ? 'person' : 'people'} free
                </span>
              )}
            </div>
            <NudgeButton
              groupId={groupId}
              windowDate={bestSlot.windowDate}
              windowStart={bestSlot.windowStart}
              windowEnd={bestSlot.windowEnd}
              windowLabel={`${bestLabel} · ${bestSlot.shortDate}`}
              windowTimeLabel={bestSlot.windowTimeLabel}
            />
          </div>
        </div>
      </div>

      {/* ── Secondary windows ─────────────────────────────────────────────── */}
      {rest.map((w, i) => {
        const slot  = fmtSlot(w)
        const label = getWindowLabel(w.start)
        const isGood = w.availableCount / w.totalCount >= 0.66

        return (
          <div
            key={i}
            className="rounded-xl px-4 py-3.5"
            style={{
              background: '#fff',
              border: '0.5px solid #E8E6E0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              {/* Left: indicator + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div
                  style={{
                    width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                    background: isGood ? '#1D9E75' : '#B4B2A9',
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', margin: 0, lineHeight: 1.3 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '12px', color: '#aaa', margin: '2px 0 0' }}>
                    {slot.shortDate} · {slot.time}
                  </p>
                </div>
              </div>

              {/* Right: avatar stack + button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <AvatarStackDark members={w.members} size={22} />
                <NudgeButton
                  groupId={groupId}
                  windowDate={slot.windowDate}
                  windowStart={slot.windowStart}
                  windowEnd={slot.windowEnd}
                  windowLabel={`${label} · ${slot.shortDate}`}
                  windowTimeLabel={slot.windowTimeLabel}
                />
              </div>
            </div>
          </div>
        )
      })}

      {/* ── Free tier cap notice ───────────────────────────────────────────── */}
      {tier === 0 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#EEEDFE', border: '0.5px solid #AFA9EC' }}
        >
          <Lock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#7F77DD' }} />
          <p className="text-sm" style={{ color: '#534AB7' }}>
            Free groups see up to 3 windows. Boost your group to unlock more.
          </p>
        </div>
      )}

    </div>
  )
}
