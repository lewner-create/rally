'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatPanel } from './chat-panel'
import { createClient } from '@/lib/supabase/client'
import { DMPanel } from './dm-panel'
import { searchUsers } from '@/lib/actions/dms'
import type { DMThread, DMMessage } from '@/lib/actions/dms'
import type { MessageWithProfile } from '@/lib/actions/messages'

const EVENT_ICON: Record<string, string> = {
  game_night: '🎮', hangout: '☕', day_trip: '🗺️', road_trip: '🚗', moto_trip: '🏍️', vacation: '✈️',
}

// ── Design tokens (aligned with mockup) ───────────────────────
const BG        = '#0f0f0f'
const SIDEBAR   = '#17171a'
const BORDER    = 'rgba(255,255,255,0.08)'
const ACTIVE_BG = 'rgba(127,119,221,0.12)'
const HOVER_BG  = '#1c1c20'
const ACCENT    = '#7F77DD'
const TEXT      = '#f5f4f8'
const DIM       = '#a8a4b8'
const MUTED     = '#6b6878'
const FAINT     = '#4a4757'

interface GroupThread {
  groupId: string
  groupName: string
  themeColor?: string | null
  events: Array<{ id: string; title: string; event_type: string }>
}

interface MessagesHubProps {
  groups: GroupThread[]
  activeGroupId: string | null
  activeEventId: string | null
  initialMessages: MessageWithProfile[]
  currentUserId: string
  dmThreads?: DMThread[]
  activeDMId?: string | null
  dmMessages?: DMMessage[]
}

type UserResult = { id: string; display_name: string | null; username: string | null; avatar_url: string | null }

export function MessagesHub({
  groups,
  activeGroupId: initGroup,
  activeEventId: initEvent,
  initialMessages,
  currentUserId,
  dmThreads = [],
  activeDMId: initDM = null,
  dmMessages = [],
}: MessagesHubProps) {
  const router = useRouter()
  const [messages, setMessages]   = useState(initialMessages)
  const [activeGroupId, setGroup] = useState(initGroup)
  const [activeEventId, setEvent] = useState(initEvent)
  const [activeDMId, setDMId]     = useState(initDM)
  const [dmMsgs, setDMMessages]   = useState(dmMessages)
  const [loading, setLoading]     = useState(false)
  const [showNewDM, setShowNewDM] = useState(false)
  const [dmSearch, setDMSearch]   = useState('')
  const [dmResults, setDMResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)

  const handleDMSearch = async (q: string) => {
    setDMSearch(q)
    if (!q.trim()) { setDMResults([]); return }
    setSearching(true)
    const results = await searchUsers(q)
    setDMResults((results as UserResult[]).filter(r => r.id !== currentUserId))
    setSearching(false)
  }

  const openNewDM  = () => { setShowNewDM(true); setDMSearch(''); setDMResults([]) }
  const closeNewDM = () => { setShowNewDM(false); setDMSearch(''); setDMResults([]) }

  const selectDM = async (otherId: string) => {
    closeNewDM()
    if (otherId === activeDMId) return
    setLoading(true)
    setGroup(null); setEvent(null); setDMId(otherId)
    const { data } = await createClient()
      .from('direct_messages')
      .select('*, sender:sender_id(id, display_name, username, avatar_url)')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
      .limit(50)
    setDMMessages(data ?? [])
    setLoading(false)
    const p = new URLSearchParams(); p.set('dm', otherId)
    router.push(`/messages?${p.toString()}`, { scroll: false })
  }

  const selectThread = async (groupId: string, eventId?: string | null) => {
    if (groupId === activeGroupId && eventId === activeEventId) return
    setDMId(null); setLoading(true); setGroup(groupId); setEvent(eventId ?? null)
    const q = createClient()
      .from('chat_messages')
      .select('*, profiles(id, display_name, username)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(50)
    const { data: msgs } = eventId ? await q.eq('event_id', eventId) : await q.is('event_id', null)
    setMessages(msgs)
    setLoading(false)
    const p = new URLSearchParams(); p.set('g', groupId)
    if (eventId) p.set('e', eventId)
    router.push(`/messages?${p.toString()}`, { scroll: false })
  }

  const activeGroup  = groups.find(g => g.groupId === activeGroupId)
  const activeEvent  = activeGroup?.events.find(e => e.id === activeEventId)
  const threadLabel  = activeEvent?.title ?? activeGroup?.groupName ?? 'Messages'
  const activeDMName = (() => {
    const t = dmThreads.find(d => d.otherId === activeDMId)?.otherName
    if (t) return t
    const r = dmResults.find(r => r.id === activeDMId)
    return r?.display_name ?? r?.username ?? 'Direct message'
  })()

  function Avatar({ url, name, size = 36 }: { url?: string | null; name: string; size?: number }) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: url ? 'transparent' : `linear-gradient(135deg, ${ACCENT}88, ${ACCENT}44)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: '#fff', overflow: 'hidden',
        border: `1px solid ${BORDER}`,
      }}>
        {url ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
      </div>
    )
  }

  function GroupIcon({ name, color }: { name: string; color?: string | null }) {
    return (
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: color ? `linear-gradient(135deg, ${color}, ${color}66)` : `linear-gradient(135deg, #3a2e5e, #2a1f4d)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 11, fontWeight: 700,
      }}>
        {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: BG, overflow: 'hidden' }}>

      {/* ── Thread list ── */}
      <div style={{
        width: 260, flexShrink: 0, background: SIDEBAR,
        borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.01em' }}>Messages</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 16px' }}>

          {/* Radio bot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, marginBottom: 4 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, #b66adb)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Radio</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>Notifications & updates</div>
            </div>
          </div>

          <div style={{ height: 1, background: BORDER, margin: '6px 0' }} />

          {/* DMs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 6px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Direct messages
            </span>
            <button onClick={openNewDM} style={{
              width: 18, height: 18, borderRadius: '50%', border: 'none',
              background: showNewDM ? ACCENT : 'rgba(255,255,255,0.06)',
              color: showNewDM ? '#fff' : MUTED,
              cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, padding: 0,
            }}>+</button>
          </div>

          {showNewDM && (
            <div style={{ padding: '4px 6px 6px' }}>
              <input
                autoFocus
                value={dmSearch}
                onChange={e => handleDMSearch(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && closeNewDM()}
                placeholder="Search by username…"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '7px 10px',
                  borderRadius: 8, border: `1px solid ${ACCENT}44`, outline: 'none',
                  fontSize: 12.5, background: '#1c1c20', color: TEXT, fontFamily: 'inherit',
                }}
              />
              {searching && <div style={{ padding: '7px 10px', fontSize: 12, color: MUTED }}>Searching…</div>}
              {!searching && dmResults.length > 0 && (
                <div style={{ marginTop: 4, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#17171a', overflow: 'hidden' }}>
                  {dmResults.map(u => (
                    <button key={u.id} onClick={() => selectDM(u.id)} style={{
                      width: '100%', padding: '8px 10px', border: 'none', background: 'none',
                      cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
                      gap: 8, fontFamily: 'inherit',
                    }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = HOVER_BG)}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                    >
                      <Avatar url={u.avatar_url} name={u.display_name ?? u.username ?? '?'} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{u.display_name ?? u.username}</div>
                        {u.username && <div style={{ fontSize: 11, color: MUTED }}>@{u.username}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!searching && dmSearch.trim() && dmResults.length === 0 && (
                <div style={{ padding: '7px 10px', fontSize: 12, color: MUTED }}>No users found</div>
              )}
            </div>
          )}

          {dmThreads.map(dm => {
            const isActive = activeDMId === dm.otherId
            return (
              <button key={dm.otherId} onClick={() => selectDM(dm.otherId)} style={{
                width: '100%', padding: '8px 10px', borderRadius: 9, border: 'none',
                background: isActive ? ACTIVE_BG : 'none', cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
              }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <Avatar url={dm.otherAvatar} name={dm.otherName} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? ACCENT : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dm.otherName}</div>
                  <div style={{ fontSize: 11.5, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dm.lastMessage}</div>
                </div>
              </button>
            )
          })}

          <div style={{ height: 1, background: BORDER, margin: '6px 0' }} />

          {/* Group threads */}
          <div style={{ padding: '4px 10px 6px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Groups</span>
          </div>

          {groups.map(g => (
            <div key={g.groupId} style={{ marginBottom: 2 }}>
              <button onClick={() => selectThread(g.groupId)} style={{
                width: '100%', padding: '8px 10px', borderRadius: 9, border: 'none',
                background: activeGroupId === g.groupId && !activeEventId ? ACTIVE_BG : 'none',
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
                gap: 10, fontFamily: 'inherit',
              }}
                onMouseEnter={e => { if (!(activeGroupId === g.groupId && !activeEventId)) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
                onMouseLeave={e => { if (!(activeGroupId === g.groupId && !activeEventId)) (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <GroupIcon name={g.groupName} color={g.themeColor} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.groupName}</div>
                  <div style={{ fontSize: 11.5, color: MUTED }}>Group chat</div>
                </div>
              </button>

              {g.events.map(ev => {
                const isActive = activeEventId === ev.id
                return (
                  <button key={ev.id} onClick={() => selectThread(g.groupId, ev.id)} style={{
                    width: '100%', padding: '6px 10px 6px 28px', borderRadius: 9, border: 'none',
                    background: isActive ? ACTIVE_BG : 'none', cursor: 'pointer',
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit',
                  }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none' }}
                  >
                    <span style={{ fontSize: 12 }}>{EVENT_ICON[ev.event_type] ?? '📅'}</span>
                    <span style={{
                      fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: isActive ? ACCENT : DIM, fontWeight: isActive ? 600 : 400,
                    }}>{ev.title}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Active thread ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: BG }}>
        {activeDMId ? (
          <>
            <div style={{ padding: '14px 22px', background: SIDEBAR, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{activeDMName}</div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {loading ? <LoadingState /> : <DMPanel key={activeDMId} otherId={activeDMId} initialMessages={dmMsgs} currentUserId={currentUserId} height="100%" />}
            </div>
          </>
        ) : activeGroupId ? (
          <>
            <div style={{ padding: '14px 22px', background: SIDEBAR, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{threadLabel}</div>
              {activeEvent && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>{activeGroup?.groupName}</div>}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {loading ? <LoadingState /> : (
                <ChatPanel
                  key={`${activeGroupId}:${activeEventId}`}
                  groupId={activeGroupId}
                  eventId={activeEventId}
                  initialMessages={messages}
                  currentUserId={currentUserId}
                  height="100%"
                />
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span style={{ color: '#4a4757', fontSize: 13 }}>Loading…</span>
    </div>
  )
}
