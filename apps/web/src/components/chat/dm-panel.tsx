'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendDM, type DMMessage } from '@/lib/actions/dms'

interface DMPanelProps {
  otherId: string
  initialMessages: DMMessage[]
  currentUserId: string
  height?: string
}

export function DMPanel({ otherId, initialMessages, currentUserId, height = '100%' }: DMPanelProps) {
  const [messages, setMessages] = useState<DMMessage[]>(initialMessages)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const channel  = supabase
      .channel(`dm:${[currentUserId, otherId].sort().join(':')}`)
      .on('postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        async (payload: any) => {
          const msg = payload.new
          const isRelevant = (msg.sender_id === currentUserId && msg.receiver_id === otherId) ||
                             (msg.sender_id === otherId && msg.receiver_id === currentUserId)
          if (!isRelevant) return

          if (msg.sender_id === currentUserId) {
            setMessages(prev => {
              const idx = prev.findIndex(m => m.id.startsWith('temp_'))
              if (idx === -1) return prev
              const next = [...prev]
              next[idx] = { ...msg, sender: prev[idx].sender }
              return next
            })
            return
          }

          const { data: sender } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .eq('id', msg.sender_id)
            .single()

          setMessages(prev => [...prev, { ...msg, sender }])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, otherId])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    const optimistic: DMMessage = {
      id: `temp_${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: otherId,
      content: text,
      created_at: new Date().toISOString(),
      sender: null,
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await sendDM(otherId, text)
    } catch (err) {
      console.error(err)
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '14px', paddingTop: '40px' }}>
            No messages yet. Say hi! 
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe    = msg.sender_id === currentUserId
          const isTemp  = msg.id.startsWith('temp_')
          const prevMsg = messages[i - 1]
          const showName = !isMe && msg.sender_id !== prevMsg?.sender_id
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginTop: showName ? '10px' : '2px' }}>
              {showName && (
                <span style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px', paddingLeft: '4px', fontWeight: 600 }}>
                  {msg.sender?.display_name ?? msg.sender?.username ?? 'User'}
                </span>
              )}
              <div style={{ maxWidth: '72%', padding: '9px 13px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? '#7F77DD' : '#1e1e1e', color: isMe ? 'white' : '#e0e0e0', fontSize: '14px', lineHeight: 1.45, wordBreak: 'break-word', boxShadow: isMe ? '0 2px 8px rgba(127,119,221,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', opacity: isTemp ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e1e', background: '#111', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Message..."
          style={{ flex: 1, padding: '9px 14px', borderRadius: '9999px', border: '1.5px solid #eee', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: '#fafafa', color: '#111' }}
          onFocus={e => (e.target.style.borderColor = '#7F77DD')}
          onBlur={e  => (e.target.style.borderColor = '#eee')}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: input.trim() ? '#7F77DD' : '#eee', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: input.trim() ? 'white' : '#bbb', transition: 'background 0.15s', fontFamily: 'inherit' }}
        >↑</button>
      </div>
    </div>
  )
}