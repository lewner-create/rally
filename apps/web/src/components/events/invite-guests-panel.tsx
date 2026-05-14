'use client'
import { useState, useTransition } from 'react'
import { sendEventInvites, getEventInvites, revokeInvite, type EventInvite } from '@/lib/actions/guest-invites'

export default function InviteGuestsPanel({ eventId }: { eventId: string }) {
  const [open,    setOpen]    = useState(false)
  const [emails,  setEmails]  = useState('')
  const [invites, setInvites] = useState<EventInvite[]>([])
  const [loaded,  setLoaded]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [pending, startTx]    = useTransition()
  const SC: Record<string, string> = { pending: '#fbbf24', accepted: '#34d399', declined: '#ef4444' }

  const load = () => startTx(async () => { const d = await getEventInvites(eventId); setInvites(d); setLoaded(true) })
  const handleOpen = () => { setOpen(true); load() }
  const handleSend = () => {
    setError(null)
    const list = emails.split(/[,\n]+/).map(e => e.trim()).filter(Boolean)
    if (!list.length) return
    startTx(async () => {
      const res = await sendEventInvites(eventId, list)
      if (res.error) { setError(res.error); return }
      setEmails(''); load()
    })
  }
  const handleRevoke = (id: string) => startTx(async () => { await revokeInvite(id); load() })

  if (!open) return (
    <button onClick={handleOpen} className='px-3 py-1.5 rounded-lg text-xs font-semibold'
      style={{ background: 'rgba(127,119,221,0.12)', border: '1px solid rgba(127,119,221,0.3)', color: '#7F77DD' }}>
      Invite guests
    </button>
  )
  return (
    <div className='rounded-xl p-4' style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
      <div className='flex items-center justify-between mb-3'>
        <p className='text-sm font-semibold text-white'>Invite guests</p>
        <button onClick={() => setOpen(false)} className='text-[#555] text-xs'>Close</button>
      </div>
      <p className='text-xs text-[#555] mb-2'>Enter email addresses, one per line or comma-separated</p>
      <textarea value={emails} onChange={e => setEmails(e.target.value)} placeholder='friend@email.com, another@email.com' rows={3}
        className='w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#555] outline-none resize-none mb-2'
        style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
      {error && <p className='text-xs text-[#ef4444] mb-2'>{error}</p>}
      <button onClick={handleSend} disabled={pending || !emails.trim()} className='w-full py-2 rounded-lg text-sm font-semibold mb-4'
        style={{ background: '#7F77DD', color: 'white', opacity: !emails.trim() ? 0.5 : 1 }}>
        {pending ? 'Sending...' : 'Send invites'}
      </button>
      {loaded && invites.length > 0 && (
        <div className='space-y-2'>
          <p className='text-[10px] uppercase tracking-wider text-[#444] mb-1'>Guest list</p>
          {invites.map(inv => (
            <div key={inv.id} className='flex items-center justify-between'>
              <p className='text-xs text-white truncate flex-1 min-w-0 mr-2'>{inv.email}</p>
              <div className='flex items-center gap-2 shrink-0'>
                <span className='text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full'
                  style={{ background: (SC[inv.status] ?? '#555') + '20', color: SC[inv.status] ?? '#555' }}>
                  {inv.status}
                </span>
                {inv.status === 'pending' && (
                  <button onClick={() => handleRevoke(inv.id)} disabled={pending} className='text-[10px] text-[#555] hover:text-[#ef4444]'>Revoke</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}