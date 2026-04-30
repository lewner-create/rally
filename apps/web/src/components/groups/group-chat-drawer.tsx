'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatPanel } from '@/components/chat/chat-panel'
import type { MessageWithProfile } from '@/lib/actions/messages'
import { X, MessageCircle } from 'lucide-react'

interface GroupChatDrawerProps {
  groupId: string
  currentUserId: string
  accentColor?: string
}

export function GroupChatDrawer({ groupId, currentUserId, accentColor = '#7F77DD' }: GroupChatDrawerProps) {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loaded,   setLoaded]   = useState(false)
  const [unread,   setUnread]   = useState(0)

  useEffect(() => {
    if (!open || loaded) return
    createClient()
      .from('chat_messages')
      .select('*, profiles(id, display_name, username)')
      .eq('group_id', groupId)
      .is('event_id', null)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        setMessages((data ?? []) as MessageWithProfile[])
        setLoaded(true)
      })
  }, [open, groupId, loaded])

  useEffect(() => {
    if (open) { setUnread(0); return }
    const supabase = createClient()
    const channel = supabase
      .channel(`drawer-unread-${groupId}`)
      .on('postgres_changes' as any, {
        event: 'INSERT', schema: 'public',
        table: 'chat_messages', filter: `group_id=eq.${groupId}`,
      }, (payload: any) => {
        if (payload.new?.user_id !== currentUserId && payload.new?.event_id === null) {
          setUnread(n => n + 1)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [open, groupId, currentUserId])

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: '28px', right: '28px',
          width: '52px', height: '52px', borderRadius: '50%',
          background: accentColor, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px ${accentColor}55`,
          zIndex: 100, transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <MessageCircle size={22} color="white" />
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: '#ef4444', border: '2px solid #0f0f0f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 800, color: 'white',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '380px', zIndex: 201,
        background: '#111',
        borderLeft: '1px solid #1e1e1e',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.32, 0, 0.16, 1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
            Group chat
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#1e1e1e', border: '1px solid #2a2a2a',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#666',
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Chat */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {loaded ? (
            <ChatPanel
              groupId={groupId}
              initialMessages={messages}
              currentUserId={currentUserId}
              height="100%"
            />
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: '#333', fontSize: '13px',
            }}>
              Loading…
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  )
}
