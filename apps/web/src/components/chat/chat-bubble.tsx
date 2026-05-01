'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatPanel } from './chat-panel'
import type { MessageWithProfile } from '@/lib/actions/messages'

export function ChatBubble() {
  const pathname              = usePathname()
  const router                = useRouter()
  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState<MessageWithProfile[]>([])
  const [uid, setUid]         = useState('')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [unread, setUnread]   = useState(0)

  const hidden =
    pathname.startsWith('/messages') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')

  useEffect(() => {
    const m = pathname.match(/\/groups\/([0-9a-f-]{36})/)
    setGroupId(m ? m[1] : null)
    setOpen(false)
    setUnread(0)
  }, [pathname])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUid(data.user.id)
    })
  }, [])

  useEffect(() => {
    if (!groupId || !uid) return
    const supabase = createClient()
    const channel  = supabase
      .channel(`unread:${groupId}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${groupId}` },
        (payload: any) => {
          // Count unread for ALL group messages (not just non-event ones)
          if (!open && payload.new?.user_id !== uid) setUnread(n => n + 1)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [groupId, uid, open])

  useEffect(() => { if (open) setUnread(0) }, [open])

  useEffect(() => {
    if (!open || !groupId) return
    createClient()
      .from('chat_messages')
      .select('*, profiles(id, display_name, username), event:event_id(id, title, event_type)')
      .eq('group_id', groupId)
      // No event_id filter — bubble shows all group messages including event-tagged ones
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => setMsgs((data ?? []) as MessageWithProfile[]))
  }, [open, groupId])

  if (hidden) return null

  return (
    <>
      <button
        onClick={() => { if (!groupId) { router.push('/messages'); return } setOpen(v => !v) }}
        style={{ position: 'fixed', bottom: '24px', right: '24px', width: '52px', height: '52px', borderRadius: '50%', background: '#7F77DD', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 20px rgba(127,119,221,0.5)', zIndex: 1000, transition: 'transform 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        💬
        {unread > 0 && (
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', background: '#D85A30', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && groupId && (
        <div style={{ position: 'fixed', bottom: '88px', right: '24px', width: '360px', height: '480px', background: '#111', borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #1e1e1e' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Group chat</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => router.push('/messages')} style={{ fontSize: '12px', color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Open →</button>
              <button onClick={() => setOpen(false)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1e1e1e', border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>×</button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatPanel groupId={groupId} initialMessages={msgs} currentUserId={uid} height="100%" />
          </div>
        </div>
      )}
    </>
  )
}
