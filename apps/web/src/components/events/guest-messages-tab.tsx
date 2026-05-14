'use client'
import { useState, useEffect, useTransition } from 'react'
import { getGuestMessages, replyToGuest, type GuestMessage } from '@/lib/actions/guest-invites'

export default function GuestMessagesTab({ eventId }: { eventId: string }) {
  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [loaded,   setLoaded]   = useState(false)
  const [reply,    setReply]    = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [pending,  startTx]    = useTransition()

  useEffect(() => {
    startTx(async () => { const d = await getGuestMessages(eventId); setMessages(d); setLoaded(true) })
  }, [eventId])
  const reload = () => startTx(async () => { const d = await getGuestMessages(eventId); setMessages(d) })

  const threads = messages.reduce((acc, m) => {
    const key = m.sender_invite_id ?? m.sender_profile_id ?? 'unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, GuestMessage[]>)

  const handleReply = () => {
    if (!reply.trim() || !activeKey) return
    startTx(async () => { await replyToGuest(eventId, activeKey, reply.trim()); setReply(''); reload() })
  }

  if (!loaded) return <div className='py-8 text-center text-[#555] text-sm'>Loading...</div>
  const keys = Object.keys(threads)
  if (!keys.length) return (
    <div className='py-10 text-center'>
      <p className='text-[#555] text-sm'>No guest messages yet.</p>
      <p className='text-[#444] text-xs mt-1'>Messages from invited guests will appear here.</p>
    </div>
  )
  return (
    <div className='space-y-3'>
      {keys.map(key => {
        const thread = threads[key]
        const senderName = thread[0].sender_display_name ?? 'Guest'
        const isActive = activeKey === key
        return (
          <div key={key} className='rounded-xl overflow-hidden' style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
            <div className='flex items-center justify-between p-3 cursor-pointer' onClick={() => setActiveKey(isActive ? null : key)}>
              <div className='flex items-center gap-2'>
                <div className='w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white' style={{ background: '#7F77DD44' }}>
                  {senderName[0].toUpperCase()}
                </div>
                <div>
                  <p className='text-sm text-white font-medium'>{senderName}</p>
                  <p className='text-[10px] text-[#555]'>{thread.length} message{thread.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <span className='text-[#555] text-xs'>{isActive ? '?' : '?'}</span>
            </div>
            {isActive && (
              <div className='px-3 pb-3'>
                <div className='space-y-2 mb-3 max-h-48 overflow-y-auto'>
                  {thread.map(m => (
                    <div key={m.id} className={`rounded-lg px-3 py-2 ${m.sender_profile_id ? 'ml-6' : 'mr-6'}`}
                      style={{ background: m.sender_profile_id ? 'rgba(127,119,221,0.15)' : 'rgba(255,255,255,0.05)' }}>
                      <p className='text-[10px] text-[#555] mb-0.5'>{m.sender_profile_id ? 'You' : senderName}</p>
                      <p className='text-white text-xs'>{m.body}</p>
                    </div>
                  ))}
                </div>
                <div className='flex gap-2'>
                  <input value={reply} onChange={e => setReply(e.target.value)} placeholder='Reply...'
                    className='flex-1 px-3 py-1.5 rounded-lg text-sm text-white placeholder-[#555] outline-none'
                    style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
                  <button onClick={handleReply} disabled={pending || !reply.trim()}
                    className='px-3 py-1.5 rounded-lg text-xs font-semibold'
                    style={{ background: '#7F77DD', color: 'white', opacity: !reply.trim() ? 0.4 : 1 }}>Send</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}