'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatPanel } from './chat-panel'
import { createClient } from '@/lib/supabase/client'
import { DMPanel } from './dm-panel'
import { searchUsers } from '@/lib/actions/dms'
import type { DMThread, DMMessage } from '@/lib/actions/dms'
import type { MessageWithProfile } from '@/lib/actions/messages'

// Dark palette — matches app shell
const BG        = '#0f0f0f'
const SIDEBAR   = '#111'
const BORDER    = '#1e1e1e'
const ACTIVE_BG = '#1a1a1a'
const HOVER_BG  = '#161616'
const ACCENT    = '#7F77DD'
const TEXT      = '#fff'
const MUTED     = '#666'

interface GroupThread {
  groupId:    string
  groupName:  string
  themeColor?: string | null
  // Events kept in type for backwards compat but no longer shown as sub-threads
  events?: Array<{ id: string; title: string; event_type: string }>
}

interface MessagesHubProps {
  groups:          GroupThread[]
  activeGroupId:   string | null
  activeEventId?:  string | null   // kept for compat — ignored in unified model
  initialMessages: MessageWithProfile[]
  currentUserId:   string
  dmThreads?:      DMThread[]
  activeDMId?:     string | null
  dmMessages?:     DMMessage[]
}

type UserResult = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

export function MessagesHub({
  groups,
  activeGroupId:  initGroup,
  initialMessages,
  currentUserId,
  dmThreads = [],
  activeDMId: initDM = null,
  dmMessages = [],
}: MessagesHubProps) {
  const router = useRouter()

  const [messages,     setMessages]  = useState(initialMessages)
  const [activeGroupId, setGroup]    = useState(initGroup)
  const [activeDMId,   setDMId]      = useState(initDM)
  const [dmMsgs,       setDMMessages] = useState(dmMessages)
  const [loading,      setLoading]   = useState(false)

  const [showNewDM,  setShowNewDM]  = useState(false)
  const [dmSearch,   setDMSearch]   = useState('')
  const [dmResults,  setDMResults]  = useState<UserResult[]>([])
  const [searching,  setSearching]  = useState(false)

  // ── DM search ───────────────────────────────────────────────────────────────
  const handleDMSearch = async (q: string) => {
    setDMSearch(q)
    if (!q.trim()) { setDMResults([]); return }
    setSearching(true)
    const results = await searchUsers(q)
    setDMResults((results as UserResult[]).filter(r => r.id !== currentUserId))
    setSearching(false)
  }

  const openNewDM  = () => { setShowNewDM(true);  setDMSearch(''); setDMResults([]) }
  const closeNewDM = () => { setShowNewDM(false); setDMSearch(''); setDMResults([]) }

  const selectDM = async (otherId: string) => {
    closeNewDM()
    if (otherId === activeDMId) return
    setLoading(true)
    setGroup(null); setDMId(otherId)
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

  // ── Group select — unified chat, no event threading ──────────────────────
  const selectGroup = async (groupId: string) => {
    if (groupId === activeGroupId) return
    setDMId(null); setLoading(true); setGroup(groupId)
    // Load ALL group messages — no event_id filter (unified model)
    const { data: msgs } = await createClient()
      .from('chat_messages')
      .select('*, profiles(id, display_name, username), event:event_id(id, title, event_type)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(50)
    setMessages((msgs ?? []) as MessageWithProfile[])
    setLoading(false)
    const p = new URLSearchParams(); p.set('g', groupId)
    router.push(`/messages?${p.toString()}`, { scroll: false })
  }

  // ── Labels ───────────────────────────────────────────────────────────────
  const activeGroup = groups.find(g => g.groupId === activeGroupId)
  const threadLabel = activeGroup?.groupName ?? 'Messages'
  const activeDMName = (() => {
    const t = dmThreads.find(d => d.otherId === activeDMId)?.otherName
    if (t) return t
    const r = dmResults.find(r => r.id === activeDMId)
    return r?.display_name ?? r?.username ?? 'Direct message'
  })()

  // ── Avatar ───────────────────────────────────────────────────────────────
  function Avatar({ url, name, color, size = 36 }: { url?: string | null; name: string; color?: string | null; size?: number }) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: url ? 'transparent' : (color ?? '#1e1e1e'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700, color: 'white', overflow: 'hidden',
        border: `1px solid ${BORDER}`,
      }}>
        {url
          ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : name[0]?.toUpperCase()
        }
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: BG, overflow: 'hidden' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div style={{
        width: '256px', flexShrink: 0, background: SIDEBAR,
        borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: TEXT, margin: 0 }}>Messages</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>

          {/* Radio */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 10px', borderRadius: '10px', marginBottom: '2px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, #5B52C8)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              border: `1px solid ${BORDER}`,
            }}>⚡</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>Radio</div>
              <div style={{ fontSize: '11px', color: MUTED }}>Notifications & updates</div>
            </div>
          </div>

          <div style={{ height: '1px', background: BORDER, margin: '6px 4px 8px' }} />

          {/* DMs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 10px 6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Direct messages
            </span>
            <button
              onClick={openNewDM}
              style={{
                width: '18px', height: '18px', borderRadius: '50%', border: 'none',
                background: showNewDM ? ACCENT : '#222', color: showNewDM ? 'white' : MUTED,
                cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, padding: 0,
              }}
            >+</button>
          </div>

          {/* New DM search */}
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
                  borderRadius: '8px', border: `1px solid ${ACCENT}44`, outline: 'none',
                  fontSize: '12px', background: '#1a1a1a', color: TEXT, fontFamily: 'inherit',
                }}
              />
              {searching && <div style={{ padding: '6px 10px', fontSize: '11px', color: MUTED }}>Searching…</div>}
              {!searching && dmResults.length > 0 && (
                <div style={{ marginTop: '4px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#161616', overflow: 'hidden' }}>
                  {dmResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => selectDM(u.id)}
                      style={{
                        width: '100%', padding: '8px 10px', border: 'none', background: 'none',
                        cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
                        gap: '8px', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = HOVER_BG)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
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
                <div style={{ padding: '6px 10px', fontSize: '11px', color: MUTED }}>No users found</div>
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
                  width: '100%', padding: '9px 10px', borderRadius: '10px', border: 'none',
                  background: isActive ? ACTIVE_BG : 'none', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <Avatar url={dm.otherAvatar} name={dm.otherName} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? ACCENT : TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dm.otherName}
                  </div>
                  <div style={{ fontSize: '11px', color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dm.lastMessage}
                  </div>
                </div>
              </button>
            )
          })}

          <div style={{ height: '1px', background: BORDER, margin: '6px 4px 8px' }} />

          {/* Group threads — unified, no event sub-threads */}
          <div style={{ padding: '2px 10px 6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Groups
            </span>
          </div>

          {groups.map(g => {
            const isActive = activeGroupId === g.groupId && !activeDMId
            const color    = g.themeColor ?? ACCENT
            return (
              <button
                key={g.groupId}
                onClick={() => selectGroup(g.groupId)}
                style={{
                  width: '100%', padding: '9px 10px', borderRadius: '10px', border: 'none',
                  background: isActive ? ACTIVE_BG : 'none', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: `${color}22`,
                  border: `1px solid ${isActive ? color + '66' : BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 800, color: color,
                }}>
                  {(g.groupName?.[0] ?? '?').toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? color : TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.groupName}
                  </div>
                  <div style={{ fontSize: '11px', color: MUTED }}>Group chat</div>
                </div>
                {isActive && (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0, marginLeft: 'auto' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main chat area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#111' }}>
        {activeDMId ? (
          <>
            <div style={{ padding: '14px 20px', background: SIDEBAR, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>{activeDMName}</span>
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
            <div style={{ padding: '14px 20px', background: SIDEBAR, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: `${activeGroup?.themeColor ?? ACCENT}22`,
                border: `1px solid ${activeGroup?.themeColor ?? ACCENT}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 800, color: activeGroup?.themeColor ?? ACCENT,
              }}>
                {(activeGroup?.groupName?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>{threadLabel}</div>
                <div style={{ fontSize: '11px', color: MUTED }}>Group chat · event tags visible</div>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {loading
                ? <LoadingState />
                : <ChatPanel
                    key={activeGroupId}
                    groupId={activeGroupId}
                    eventId={null}
                    initialMessages={messages}
                    currentUserId={currentUserId}
                    height="100%"
                  />
              }
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#1a1a1a', border: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
            }}>💬</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#aaa', margin: '0 0 4px' }}>No conversation selected</p>
              <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>Pick a group or DM from the sidebar</p>
            </div>
          </div>
        )}
      </div>
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
