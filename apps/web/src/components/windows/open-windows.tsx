import { getOpenWindows, type OpenWindow, type MemberProfile } from '@/lib/actions/windows'
import { NudgeButton } from '@/components/groups/nudge-button'
import { Calendar, Lock } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function fmtSlot(w: OpenWindow) {
  const d = w.start
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const fmtH = (h: number) => {
    if (h === 0)  return '12 AM'
    if (h < 12)  return `${h} AM`
    if (h === 12) return '12 PM'
    return `${h - 12} PM`
  }

  return {
    shortDate:       `${MONTHS[d.getMonth()]} ${d.getDate()}`,
    time:            `${fmtH(d.getHours())} – ${fmtH(w.end.getHours())}`,
    hours:           Math.round((w.end.getTime() - w.start.getTime()) / 3_600_000),
    windowDate:      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    windowStart:     `${pad(d.getHours())}:00`,
    windowEnd:       `${pad(w.end.getHours())}:00`,
    windowTimeLabel: `${fmtH(d.getHours())} – ${fmtH(w.end.getHours())}`,
  }
}

function getWindowLabel(start: Date): string {
  const now      = new Date()
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const winDay   = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const diffDays = Math.round((winDay.getTime() - today.getTime()) / 86_400_000)
  const h        = start.getHours()
  const period   = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
  const DAYS     = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (diffDays === 0) return h >= 17 ? 'Tonight' : `This ${period}`
  if (diffDays === 1) return `Tomorrow ${period}`
  return `${DAYS[start.getDay()]} ${period}`
}

// Hierarchy label for secondary windows
function getHierarchyLabel(index: number, ratio: number): { text: string; color: string } {
  if (index === 0 && ratio >= 0.66) return { text: 'Good alternative', color: '#1D9E75' }
  if (index === 0)                  return { text: 'Good alternative', color: '#888' }
  return                                   { text: 'Backup option',    color: '#555' }
}

// ─── Avatar stacks ────────────────────────────────────────────────────────────

function AvatarStack({ members, size = 26 }: { members: MemberProfile[]; size?: number }) {
  const shown = members.slice(0, 4)
  const extra = members.length - shown.length
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <div key={m.id} title={m.display_name ?? m.username ?? ''} style={{
          width: size, height: size, borderRadius: '50%',
          background: m.avatar_url ? 'transparent' : '#7F77DD',
          backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          color: 'white', fontSize: size * 0.38, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.15)',
          marginLeft: i > 0 ? -size * 0.28 : 0,
          zIndex: shown.length - i, position: 'relative', flexShrink: 0,
        }}>
          {!m.avatar_url && (m.display_name?.[0] ?? m.username?.[0] ?? '?').toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
          fontSize: size * 0.34, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.15)',
          marginLeft: -size * 0.28, position: 'relative', flexShrink: 0,
        }}>+{extra}</div>
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
        <div key={m.id} title={m.display_name ?? m.username ?? ''} style={{
          width: size, height: size, borderRadius: '50%',
          background: m.avatar_url ? 'transparent' : '#5a5490',
          backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          color: 'rgba(255,255,255,0.7)', fontSize: size * 0.38, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.08)',
          marginLeft: i > 0 ? -size * 0.28 : 0,
          zIndex: shown.length - i, position: 'relative', flexShrink: 0,
        }}>
          {!m.avatar_url && (m.display_name?.[0] ?? m.username?.[0] ?? '?').toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
          fontSize: size * 0.34, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.08)',
          marginLeft: -size * 0.28, position: 'relative', flexShrink: 0,
        }}>+{extra}</div>
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

  if (windows.length === 0) {
    return (
      <div style={{
        borderRadius: '16px', padding: '32px 24px', textAlign: 'center',
        border: '1px dashed #2a2a2a',
      }}>
        <Calendar className="h-8 w-8 mx-auto mb-3" style={{ color: '#333' }} />
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#666', margin: '0 0 4px' }}>
          No open windows yet
        </p>
        <p style={{ fontSize: '12px', color: '#444', margin: 0, lineHeight: 1.6 }}>
          Members can set their availability to unlock suggested times.
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
      {/* overflow-hidden is scoped to the glow orb wrapper only — prevents
          clipping the NudgeButton portal while still masking the decoration */}
      <div
        className="rounded-2xl p-6 relative"
        style={{
          background: 'linear-gradient(145deg, #2C2C2A 0%, #1C1B1A 55%, #26215C 100%)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        {/* Glow orb — isolated so it doesn't clip button */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div
            className="absolute -top-12 -right-12 w-36 h-36 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.2) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative">
          <p className="text-[10px] font-medium tracking-[.07em] uppercase mb-3" style={{ color: '#888780' }}>
            {ratio >= 1
              ? '✦ Best window · everyone free'
              : `✦ Best window · ${best.availableCount} of ${best.totalCount} free`}
          </p>

          <p className="text-[26px] font-semibold leading-tight mb-1" style={{ color: '#fff', letterSpacing: '-0.3px' }}>
            {bestLabel}
          </p>
          <p className="text-[14px] mb-0.5" style={{ color: '#B4B2A9' }}>{bestSlot.shortDate}</p>
          <p className="text-[13px] mb-5" style={{ color: '#5F5E5A' }}>
            {bestSlot.time} · {bestSlot.hours}h
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <AvatarStack members={best.members} size={28} />
              {best.members.length > 0 && (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                  {best.availableCount} {best.availableCount === 1 ? 'person' : 'people'} free
                </span>
              )}
            </div>
            <div style={{ flexShrink: 0 }}>
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
      </div>

      {/* ── Secondary windows ─────────────────────────────────────────────── */}
      {rest.map((w, i) => {
        const slot      = fmtSlot(w)
        const label     = getWindowLabel(w.start)
        const wRatio    = w.availableCount / w.totalCount
        const hierarchy = getHierarchyLabel(i, wRatio)

        return (
          <div
            key={i}
            style={{
              background: '#1a1a1a',
              border: '1px solid #252525',
              borderRadius: '14px',
              padding: '14px 16px',
            }}
          >
            {/* Hierarchy label */}
            <p style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.07em', color: hierarchy.color,
              margin: '0 0 8px',
            }}>
              {hierarchy.text}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              {/* Left: time info */}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0', margin: 0, lineHeight: 1.3 }}>
                  {label}
                </p>
                <p style={{ fontSize: '12px', color: '#555', margin: '3px 0 0' }}>
                  {slot.shortDate} · {slot.time}
                  {w.availableCount > 0 && (
                    <span style={{ color: '#444' }}> · {w.availableCount} free</span>
                  )}
                </p>
              </div>

              {/* Right: avatars + button */}
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
        <div style={{
          borderRadius: '12px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(127,119,221,0.08)', border: '1px solid rgba(127,119,221,0.18)',
        }}>
          <Lock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#7F77DD' }} />
          <p style={{ fontSize: '13px', color: '#9b97cc', margin: 0 }}>
            Free groups see up to 3 windows. Boost your group to unlock more.
          </p>
        </div>
      )}

    </div>
  )
}
