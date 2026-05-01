'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, type MessageWithProfile } from '@/lib/actions/messages'
import { PlanCard } from './plan-card'

const EVENT_TYPE_EMOJI: Record<string, string> = {
  vacation: '✈️', day_trip: '🚗', road_trip: '🛣️',
  game_night: '🎮', hangout: '🛋️', meetup: '👋', moto_trip: '🏍️',
}

interface ChatPanelProps {
  groupId: string
  eventId?: string | null
  initialMessages: MessageWithProfile[]
  currentUserId: string
  height?: string
}

export function ChatPanel({
  groupId,
  eventId,
  initialMessages,
  currentUserId,
  height = '100%',
}: ChatPanelProps) {
  const isLensMode = !!eventId

  const [messages,    setMessages]    = useState<MessageWithProfile[]>(initialMessages)
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [loaded,      setLoaded]      = useState(initialMessages.length > 0)

  // Event tag picker state (group chat mode only)
  const [pickerOpen,  setPickerOpen]  = useState(false)
  const [taggedEvent, setTaggedEvent] = useState<{ id: string; title: string; event_type: string } | null>(null)
  const [pickerEvents, setPickerEvents] = useState<{ id: string; title: string; event_type: string }[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)

  // Cache of event titles for realtime messages that arrive with event_id
  const [eventCache, setEventCache] = useState<Record<string, { title: string; event_type: string }>>({})

  const bottomRef  = useRef<HTMLDivElement>(null)
  const pickerRef  = useRef<HTMLDivElement>(null)

  // ── Load initial messages ──────────────────────────────────────────
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages)
      setLoaded(true)
      // Pre-populate event cache from initial messages
      const cache: Record<string, { title: string; event_type: string }> = {}
      for (const msg of initialMessages) {
        if (msg.event_id && msg.event) {
          cache[msg.event_id] = { title: msg.event.title, event_type: msg.event.event_type }
        }
      }
      if (Object.keys(cache).length > 0) setEventCache(cache)
      return
    }

    const supabase = createClient()
    let query = supabase
      .from('chat_messages')
      .select('*, profiles(id, display_name, username), event:event_id(id, title, event_type)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (eventId) {
      query = (query as any).eq('event_id', eventId)
    }

    query.then(({ data }) => {
      const msgs = (data ?? []) as MessageWithProfile[]
      setMessages(msgs)
      setLoaded(true)

      // Pre-populate event cache
      const cache: Record<string, { title: string; event_type: string }> = {}
      for (const msg of msgs) {
        if (msg.event_id && msg.event) {
          cache[msg.event_id] = { title: msg.event.title, event_type: msg.event.event_type }
        }
      }
      if (Object.keys(cache).length > 0) setEventCache(cache)
    })
  }, [groupId, eventId])

  // ── Scroll to bottom ───────────────────────────────────────────────
  useEffect(() => {
    if (loaded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loaded])

  // ── Close picker on outside click ─────────────────────────────────
  useEffect(() => {
    if (!pickerOpen) return
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  // ── Realtime ───────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel  = supabase
      .channel(`messages:${groupId}:${eventId ?? 'all'}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${groupId}` },
        async (payload: any) => {
          const msg = payload.new

          // In lens mode, only show messages for this event
          if (isLensMode && msg.event_id !== eventId) return

          // Replace optimistic message for own sends
          if (msg.user_id === currentUserId && msg.message_type === 'user') {
            setMessages(prev => {
              const tempIdx = prev.findIndex(m => m.id.startsWith('temp_'))
              if (tempIdx === -1) return prev
              const next = [...prev]
              next[tempIdx] = { ...msg, profiles: prev[tempIdx].profiles, event: prev[tempIdx].event ?? null }
              return next
            })
            return
          }

          // Fetch profile for other users' messages
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, username')
            .eq('id', msg.user_id)
            .single()

          // If message has event_id, resolve the event title for the pill
          let eventData: { title: string; event_type: string } | null = null
          if (msg.event_id) {
            if (eventCache[msg.event_id]) {
              eventData = eventCache[msg.event_id]
            } else {
              const { data: ev } = await supabase
                .from('events')
                .select('id, title, event_type')
                .eq('id', msg.event_id)
                .single()
              if (ev) {
                eventData = { title: ev.title, event_type: ev.event_type }
                setEventCache(prev => ({ ...prev, [msg.event_id]: eventData! }))
              }
            }
          }

          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, {
              ...msg,
              profiles: profile,
              event: msg.event_id && eventData
                ? { id: msg.event_id, ...eventData }
                : null,
            }]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, eventId, isLensMode, currentUserId, eventCache])

  // ── Event picker ───────────────────────────────────────────────────
  async function handleOpenPicker() {
    if (pickerOpen) { setPickerOpen(false); return }
    setPickerOpen(true)
    if (pickerEvents.length > 0) return
    setPickerLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('id, title, event_type')
      .eq('group_id', groupId)
      .neq('status', 'cancelled')
      .neq('status', 'completed')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(8)
    setPickerEvents((data ?? []) as { id: string; title: string; event_type: string }[])
    setPickerLoading(false)
  }

  function selectEvent(ev: { id: string; title: string; event_type: string }) {
    setTaggedEvent(ev)
    setPickerOpen(false)
  }

  // ── Send ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    // The message is tagged to: lens mode event, OR manually tagged event, OR null
    const sendEventId = isLensMode ? eventId : (taggedEvent?.id ?? null)

    const optimistic: MessageWithProfile = {
      id:           `temp_${Date.now()}`,
      group_id:     groupId,
      event_id:     sendEventId ?? null,
      user_id:      currentUserId,
      content:      text,
      message_type: 'user',
      plan_card_id: null,
      created_at:   new Date().toISOString(),
      profiles:     null,
      event:        taggedEvent
        ? { id: taggedEvent.id, title: taggedEvent.title, event_type: taggedEvent.event_type }
        : null,
    }
    setMessages(prev => [...prev, optimistic])
    setTaggedEvent(null)

    try {
      await sendMessage(groupId, text, sendEventId)
    } catch (err: any) {
      console.error('sendMessage error:', err?.message ?? err)
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  // ── Empty state ─────────────────────────────────────────────────────
  const emptyState = (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '12px', padding: '40px 20px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        background: '#1e1e1e', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '20px',
      }}>
        {isLensMode ? '📅' : '💬'}
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#aaa', margin: '0 0 4px' }}>
          {isLensMode ? 'No messages about this event yet' : 'No messages yet'}
        </p>
        <p style={{ fontSize: '12px', color: '#444', margin: 0 }}>
          {isLensMode ? 'Tag a message to this event from the group chat' : 'Start the conversation or kick off a plan'}
        </p>
      </div>
      {!isLensMode && (
        <Link
          href={`/groups/${groupId}/plans/new`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '9999px',
            background: '#7F77DD22', border: '1px solid #7F77DD44',
            color: '#7F77DD', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Start a plan
        </Link>
      )}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>

      {/* Lens mode: "See all" link */}
      {isLensMode && (
        <div style={{
          padding: '6px 16px 0',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <Link
            href={`/groups/${groupId}`}
            style={{
              fontSize: '11px', color: '#555', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '3px',
            }}
          >
            See all group messages ↗
          </Link>
        </div>
      )}

      {/* Message list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '2px',
      }}>
        {!loaded && (
          <div style={{ textAlign: 'center', color: '#444', fontSize: '13px', paddingTop: '40px' }}>
            Loading…
          </div>
        )}

        {loaded && messages.length === 0 && emptyState}

        {messages.map((msg, i) => {
          const isMe    = msg.user_id === currentUserId
          const isRadio = msg.message_type === 'radio'
          const isPlan  = msg.message_type === 'plan_card'
          const isTemp  = msg.id.startsWith('temp_')
          const prevMsg = messages[i - 1]
          const showName = !isMe && !isRadio && !isPlan && msg.user_id !== prevMsg?.user_id

          // Show event pill when we're in group chat and message is tagged to an event
          const eventPill = !isLensMode && msg.event_id
            ? (msg.event ?? (eventCache[msg.event_id]
                ? { id: msg.event_id, ...eventCache[msg.event_id] }
                : null))
            : null

          // ── Radio / system message ──
          if (isRadio) {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '9999px',
                  background: '#f4f3ff', fontSize: '12px', color: '#7F77DD', fontWeight: 600,
                }}>
                  {msg.content}
                </div>
              </div>
            )
          }

          // ── Plan card ──
          if (isPlan && msg.plan_card_id) {
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  marginTop: '12px', marginBottom: '4px',
                  minHeight: '120px',
                }}
              >
                {!isMe && (
                  <span style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px', paddingLeft: '4px', fontWeight: 600 }}>
                    {msg.profiles?.display_name ?? msg.profiles?.username ?? 'Member'}
                  </span>
                )}
                <div style={{
                  background: '#1a1a1a', borderRadius: '18px', padding: '3px',
                  border: '1px solid #252525', maxWidth: '300px', width: '100%',
                }}>
                  <PlanCard planCardId={msg.plan_card_id} currentUserId={currentUserId} />
                </div>
              </div>
            )
          }

          // ── Regular user message ──
          return (
            <div key={msg.id} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
              marginTop: showName || eventPill ? '10px' : '2px',
            }}>
              {showName && (
                <span style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px', paddingLeft: '4px', fontWeight: 600 }}>
                  {msg.profiles?.display_name ?? msg.profiles?.username ?? 'Member'}
                </span>
              )}

              {/* Event context pill */}
              {eventPill && (
                <Link
                  href={`/events/${eventPill.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 8px', borderRadius: '9999px',
                    background: '#1e1e1e', border: '1px solid #2a2a2a',
                    fontSize: '11px', color: '#666', textDecoration: 'none',
                    marginBottom: '3px',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <span>{EVENT_TYPE_EMOJI[eventPill.event_type] ?? '📅'}</span>
                  <span>{eventPill.title}</span>
                </Link>
              )}

              <div style={{
                maxWidth: '72%', padding: '9px 13px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? '#7F77DD' : '#1e1e1e',
                color: isMe ? 'white' : '#e0e0e0',
                fontSize: '14px', lineHeight: 1.45, wordBreak: 'break-word',
                opacity: isTemp ? 0.6 : 1, transition: 'opacity 0.2s',
              }}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #1e1e1e', background: '#111' }}>

        {/* Tagged event pill */}
        {taggedEvent && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginBottom: '8px',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '9999px',
              background: '#7F77DD22', border: '1px solid #7F77DD44',
              fontSize: '12px', color: '#7F77DD',
            }}>
              <span>{EVENT_TYPE_EMOJI[taggedEvent.event_type] ?? '📅'}</span>
              <span>{taggedEvent.title}</span>
              <button
                onClick={() => setTaggedEvent(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#7F77DD', fontSize: '12px', padding: '0 0 0 2px',
                  lineHeight: 1, fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>

          {/* Event tag button — only in group chat mode */}
          {!isLensMode && (
            <div ref={pickerRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={handleOpenPicker}
                title="Tag to an event"
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: pickerOpen || taggedEvent ? '#7F77DD33' : '#1e1e1e',
                  border: pickerOpen || taggedEvent ? '1px solid #7F77DD55' : '1px solid #2a2a2a',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '14px', transition: 'all 0.15s',
                }}
              >
                📅
              </button>

              {/* Event picker dropdown */}
              {pickerOpen && (
                <div style={{
                  position: 'absolute', bottom: '40px', left: 0,
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: '12px', padding: '6px',
                  minWidth: '220px', zIndex: 50,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  <p style={{ fontSize: '10px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 6px' }}>
                    Tag to event
                  </p>
                  {pickerLoading && (
                    <p style={{ fontSize: '12px', color: '#555', padding: '8px', textAlign: 'center' }}>Loading…</p>
                  )}
                  {!pickerLoading && pickerEvents.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#555', padding: '8px', textAlign: 'center' }}>No upcoming events</p>
                  )}
                  {pickerEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => selectEvent(ev)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 10px', borderRadius: '8px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left', fontFamily: 'inherit',
                        color: '#ccc', fontSize: '13px',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span>{EVENT_TYPE_EMOJI[ev.event_type] ?? '📅'}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={isLensMode ? 'Message about this event…' : 'Message…'}
            style={{
              flex: 1, padding: '9px 14px', borderRadius: '9999px',
              border: '1.5px solid #2a2a2a', fontSize: '14px', outline: 'none',
              fontFamily: 'inherit', background: '#1a1a1a', color: '#e0e0e0',
            }}
            onFocus={e => (e.target.style.borderColor = '#7F77DD')}
            onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: input.trim() ? '#7F77DD' : '#1e1e1e', border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: input.trim() ? 'white' : '#444',
              transition: 'background 0.15s', fontFamily: 'inherit',
            }}
          >↑</button>
        </div>
      </div>
    </div>
  )
}
