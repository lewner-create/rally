'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, type MessageWithProfile } from '@/lib/actions/messages'
import { PlanCard } from './plan-card'

const ACCENT = '#7F77DD'

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
  const [messages, setMessages] = useState<MessageWithProfile[]>(initialMessages)
  const [input,    setInput]    = useState('')
  const [sending,  setSending]  = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  // Group chat (no eventId) shows a "Start a plan" prompt
  const isGroupChat = !eventId

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Realtime subscription ──────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel  = supabase
      .channel(`messages:${groupId}:${eventId ?? 'general'}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${groupId}` },
        async (payload: any) => {
          const msg = payload.new
          const matchesThread = eventId ? msg.event_id === eventId : msg.event_id === null
          if (!matchesThread) return

          if (msg.user_id === currentUserId && msg.message_type === 'user') {
            setMessages(prev => {
              const tempIdx = prev.findIndex(m => m.id.startsWith('temp_'))
              if (tempIdx === -1) return prev
              const next = [...prev]
              next[tempIdx] = { ...msg, profiles: prev[tempIdx].profiles }
              return next
            })
            return
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, username')
            .eq('id', msg.user_id)
            .single()

          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, { ...msg, profiles: profile }]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, eventId, currentUserId])

  // ── Send ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    const optimistic: MessageWithProfile = {
      id:           `temp_${Date.now()}`,
      group_id:     groupId,
      event_id:     eventId ?? null,
      user_id:      currentUserId,
      content:      text,
      message_type: 'user',
      plan_card_id: null,
      created_at:   new Date().toISOString(),
      profiles:     null,
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await sendMessage(groupId, text, eventId)
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
      gap: '16px', padding: '40px 20px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: `${ACCENT}18`, border: `1px solid ${ACCENT}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
      }}>
        👋
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#e0e0e0', margin: '0 0 6px' }}>
          {isGroupChat ? 'Nothing planned yet' : 'No messages yet'}
        </p>
        <p style={{ fontSize: '13px', color: '#444', margin: 0, lineHeight: 1.5 }}>
          {isGroupChat
            ? 'Check who's in for something — or just say hey.'
            : 'Start the conversation about this plan.'}
        </p>
      </div>
      {isGroupChat && (
        <Link
          href={`/groups/${groupId}/plans/new`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '9999px',
            background: ACCENT, color: '#fff',
            fontSize: '13px', fontWeight: 700,
            textDecoration: 'none',
            boxShadow: `0 4px 16px ${ACCENT}44`,
          }}
        >
          Check who's in →
        </Link>
      )}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>

      {/* Message list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '2px',
      }}>
        {messages.length === 0 && emptyState}

        {messages.map((msg, i) => {
          const isMe    = msg.user_id === currentUserId
          const isRadio = msg.message_type === 'radio'
          const isPlan  = msg.message_type === 'plan_card'
          const isTemp  = msg.id.startsWith('temp_')
          const prevMsg = messages[i - 1]
          const showName = !isMe && !isRadio && !isPlan && msg.user_id !== prevMsg?.user_id

          // ── Radio / system message ── dark pill to match dark theme
          if (isRadio) {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '9999px',
                  background: `${ACCENT}18`, border: `1px solid ${ACCENT}22`,
                  fontSize: '12px', color: '#c4bff5', fontWeight: 600,
                }}>
                  ✦ {msg.content}
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
                  <span style={{
                    fontSize: '11px', color: '#555', marginBottom: '4px',
                    paddingLeft: '4px', fontWeight: 600,
                  }}>
                    {msg.profiles?.display_name ?? msg.profiles?.username ?? 'Member'}
                  </span>
                )}
                <div style={{
                  background: '#1a1a1a', borderRadius: '18px',
                  padding: '3px', border: '1px solid #252525',
                  maxWidth: '300px', width: '100%',
                }}>
                  <PlanCard
                    planCardId={msg.plan_card_id}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            )
          }

          // ── Regular user message ──
          return (
            <div key={msg.id} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
              marginTop: showName ? '10px' : '2px',
            }}>
              {showName && (
                <span style={{
                  fontSize: '11px', color: '#555', marginBottom: '3px',
                  paddingLeft: '4px', fontWeight: 600,
                }}>
                  {msg.profiles?.display_name ?? msg.profiles?.username ?? 'Member'}
                </span>
              )}
              <div style={{
                maxWidth: '72%', padding: '9px 13px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? ACCENT : '#1e1e1e',
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

      {/* Start a plan prompt — group chats only, when there are messages */}
      {isGroupChat && messages.length > 0 && (
        <div style={{
          padding: '10px 16px', borderTop: '1px solid #1a1a1a',
          display: 'flex', justifyContent: 'center',
        }}>
          <Link
            href={`/groups/${groupId}/plans/new`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '9999px',
              background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`,
              color: '#c4bff5', fontSize: '12px', fontWeight: 600,
              textDecoration: 'none', transition: 'background .15s',
            }}
          >
            👋 Check who's in for something
          </Link>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #1e1e1e', background: '#111',
        display: 'flex', gap: '8px', alignItems: 'center',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Message..."
          style={{
            flex: 1, padding: '9px 14px', borderRadius: '9999px',
            border: '1.5px solid #2a2a2a', fontSize: '14px', outline: 'none',
            fontFamily: 'inherit', background: '#1a1a1a', color: '#e0e0e0',
            transition: 'border-color .15s',
          }}
          onFocus={e => (e.target.style.borderColor = ACCENT)}
          onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: input.trim() ? ACCENT : '#1e1e1e', border: 'none',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: input.trim() ? 'white' : '#444',
            transition: 'background 0.15s', fontFamily: 'inherit',
          }}
        >↑</button>
      </div>
    </div>
  )
}
