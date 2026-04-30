'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatPanel } from '@/components/chat/chat-panel'
import type { MessageWithProfile } from '@/lib/actions/messages'

interface GroupChatProps {
  groupId: string
  currentUserId: string
}

export function GroupChat({ groupId, currentUserId }: GroupChatProps) {
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loaded,   setLoaded]   = useState(false)

  useEffect(() => {
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
  }, [groupId])

  if (!loaded) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '120px', color: '#ccc', fontSize: '13px',
      }}>
        Loading…
      </div>
    )
  }

  return (
    <ChatPanel
      groupId={groupId}
      initialMessages={messages}
      currentUserId={currentUserId}
      height="400px"
    />
  )
}
