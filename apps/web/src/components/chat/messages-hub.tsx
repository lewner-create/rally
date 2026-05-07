'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChatPanel } from './chat-panel'
import { createClient } from '@/lib/supabase/client'
import { DMPanel } from './dm-panel'
import { searchUsers } from '@/lib/actions/dms'
import type { DMThread, DMMessage } from '@/lib/actions/dms'
import type { MessageWithProfile } from '@/lib/actions/messages'

const EVENT_ICON: Record<string, string> = {
  game_night: '', hangout: '', day_trip: '🗺', road_trip: '', moto_trip: '🏍', vacation: '✈',
}

const BG        = '#0f0f0f'
const SIDEBAR   = '#111'
const BORDER    = '#1e1e1e'
const ACTIVE_BG = '#1a1a1a'
const HOVER_BG  = '#161616'
const ACCENT    = '#7F77DD'
const TEXT      = '#fff'
const MUTED     = '#888'
const LABEL     = '#3a3a3a'

interface GroupThread {
  groupId: string
  groupName: string
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

// ── useIsMobile ─────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [v, setV] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    setV(mq.matches)
    const h = (e: MediaQueryListEvent) => setV(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [bp])
  return v
}

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
  const router    = useRouter()
  const isMobile  = useIsMobile()

  const [messages, setMessages]   = useState(initialMessages)
  const [activeGroupId, setGroup] = useState(initGroup)
  const [activeEventId, setEvent] = useState(initEvent)
  const [activeDMId, setDMId]     = useState(initDM)
  const [dmMsgs, setDMMessages]   = useState(dmMessages)
  const [loading, setLoading]     = useState(false)

  // Mobile navigation: 'list' shows thread list, 'chat' shows active thread
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(
    // If a thread is already selected (via URL params), open chat directly
    initGroup || initDM ? 'chat' : 'list'
  )

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
    if (otherId === activeDMId) {
      if (isMobile) setMobileView('chat')
      return
    }
    setLoading(true)
    setGroup(null); setEvent(null); setDMId(otherId)
    if (isMobile) setMobileView('chat')
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
    if (groupId === activeGroupId && eventId === activeEventId) {
      if (isMobile) setMobileView('chat')
      return
    }
    setDMId(null); setLoading(true); setGroup(groupId); setEvent(eventId ?? null)
    if (isMobile) setMobileView('chat')
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

  const backToList = () => setMobileView('list')

  const activeGroup  = groups.find(g => g.groupId === activeGroupId)
  const activeEvent  = activeGroup?.events.find(e => e.id === activeEventId)
  const threadLabel  = activeEvent?.title ?? activeGroup?.groupName ?? 'Messages'
  const activeDMName = (() => {
    const t = dmThreads.find(d => d.otherId === activeDMId)?.otherName
    if (t) return t
    const r = dmResults.find(r => r.id === activeDMId)
    return r?.display_name ?? r?.username ?? 'Direct message'
  })()

  function Avatar({ url, name, size = 38 }: { url?: string | null; name: string; size?: number }) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: url ? 'transparent' : '#1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: ACCENT, overflow: 'hidden',
      }}>
        {url ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : name[0]?.toUpperCase()}
      </div>
    )
  }

  // ── Thread list panel ──────────────────────────────────────────
  const threadList = (
    <div style={{
      width: isMobile ? '100%' : '264px',
      flexShrink: 0, background: SIDEBAR,
      borderRight: isMobile ? 'none' : `1px solid ${BORDER}`,
      display: isMobile && mobileView === 'chat' ? 'none' : 'flex',
      flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: 0 }}>Messages</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>

        {/* Radio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, #5B52C8)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
          }}></div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Radio</div>
            <div style={{ fontSize: '12px', color: MUTED }}>Notifications & updates</div>
          </div>
        </div>

        <div style={{ height: '1px', background: BORDER, margin: '4px 0 8px' }} />

        {/* DMs header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: LABEL, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Direct messages
          </span>
          <button
            onClick={openNewDM}
            style={{
              width: '20px', height: '20px', borderRadius: '50%', border: 'none',
              background: showNewDM ? ACCENT : '#222', color: showNewDM ? 'white' : MUTED,
              cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, padding: 0,
            }}
          >+</button>
        </div>

        {/* New DM search */}
        {showNewDM && (
          <div style={{ padding: '6px 8px 4px' }}>
            <input
              autoFocus
              value={dmSearch}
              onChange={e => handleDMSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && closeNewDM()}
              placeholder="Search by username…"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 12px',
                borderRadius: '8px', border: `1px solid ${ACCENT}44`, outline: 'none',
                fontSize: '13px', background: '#1a1a1a', color: TEXT, fontFamily: 'inherit',
              }}
            />
            {searching && <div style={{ padding: '8px 12px', fontSize: '12px', color: MUTED }}>Searching…</div>}
            {!searching && dmResults.length > 0 && (
              <div style={{ marginTop: '4px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#161616', overflow: 'hidden' }}>
                {dmResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => selectDM(u.id)}
                    style={{
                      width: '100%', padding: '9px 12px', border: 'none', background: 'none',
                      cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
                      gap: '10px', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = HOVER_BG}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
                    <Avatar url={u.avatar_url} name={u.display_name ?? u.username ?? '?'} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{u.display_name ?? u.username}</div>
                      {u.username && <div style={{ fontSize: '11px', color: MUTED }}>@{u.username}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!searching && dmSearch.trim() && dmResults.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: '12px', color: MUTED }}>No users found</div>
            )}
          </div>
        )}

        {/* DM threads */}
        {dmThreads.map(dm => {
          const isActive = activeDMId === dm.otherId
          return (
            <button
              key={dm.otherId}
              onClick={() => selectDM(dm.otherId)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px', border: 'none',
                background: isActive ? ACTIVE_BG : 'none', cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none' }}
            >
              <Avatar url={dm.otherAvatar} name={dm.otherName} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: isActive ? ACCENT : TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dm.otherName}</div>
                <div style={{ fontSize: '12px', color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dm.lastMessage}</div>
              </div>
            </button>
          )
        })}

        <div style={{ height: '1px', background: BORDER, margin: '4px 0 8px' }} />

        {/* Group threads */}
        {groups.map(g => (
          <div key={g.groupId} style={{ marginBottom: '2px' }}>
            <button
              onClick={() => selectThread(g.groupId)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px', border: 'none',
                background: activeGroupId === g.groupId && !activeEventId ? ACTIVE_BG : 'none',
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
                gap: '10px', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!(activeGroupId === g.groupId && !activeEventId)) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
              onMouseLeave={e => { if (!(activeGroupId === g.groupId && !activeEventId)) (e.currentTarget as HTMLElement).style.background = 'none' }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: '#1e1e1e', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: ACCENT,
              }}>
                {(g.groupName?.[0] ?? '?').toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.groupName}</div>
                <div style={{ fontSize: '12px', color: MUTED }}>Group chat</div>
              </div>
            </button>

            {g.events.map(ev => {
              const isActive = activeEventId === ev.id
              return (
                <button
                  key={ev.id}
                  onClick={() => selectThread(g.groupId, ev.id)}
                  style={{
                    width: '100%', padding: '7px 12px 7px 32px', borderRadius: '10px', border: 'none',
                    background: isActive ? ACTIVE_BG : 'none', cursor: 'pointer',
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none' }}
                >
                  <span style={{ fontSize: '13px' }}>{EVENT_ICON[ev.event_type] ?? ''}</span>
                  <span style={{
                    fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: isActive ? ACCENT : MUTED, fontWeight: isActive ? 600 : 400,
                  }}>{ev.title}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )

  // ── Active chat panel ──────────────────────────────────────────
  const chatPanel = (
    <div style={{
      flex: 1, display: isMobile && mobileView === 'list' ? 'none' : 'flex',
      flexDirection: 'column', overflow: 'hidden', background: '#111',
    }}>
      {activeDMId ? (
        <>
          <div style={{ padding: '14px 16px', background: SIDEBAR, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={backToList} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: '4px 8px 4px 0', fontSize: 18, display: 'flex', alignItems: 'center' }}>
                ←
              </button>
            )}
            <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>{activeDMName}</div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {loading
              ? <LoadingState />
              : <DMPanel key={activeDMId} otherId={activeDMId} initialMessages={dmMsgs} currentUserId={currentUserId} height="100%" />
            }
          </div>
        </>
      ) : activeGroupId ? (
        <>
          <div style={{ padding: '14px 16px', background: SIDEBAR, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={backToList} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: '4px 8px 4px 0', fontSize: 18, display: 'flex', alignItems: 'center' }}>
                ←
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>{threadLabel}</div>
              {activeEvent && <div style={{ fontSize: '12px', color: MUTED, marginTop: '1px' }}>{activeGroup?.groupName}</div>}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {loading
              ? <LoadingState />
              : <ChatPanel
                  key={`${activeGroupId}:${activeEventId}`}
                  groupId={activeGroupId}
                  eventId={activeEventId}
                  initialMessages={messages}
                  currentUserId={currentUserId}
                  height="100%"
                />
            }
          </div>
        </>
      ) : (
        // Empty state — only visible on desktop (mobile starts on list view)
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '48px' }}></div>
          <p style={{ fontSize: '15px', color: MUTED, margin: 0 }}>Select a conversation</p>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: BG, overflow: 'hidden' }}>
      {threadList}
      {chatPanel}
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span style={{ color: '#333', fontSize: '14px' }}>Loading…</span>
    </div>
  )
}
