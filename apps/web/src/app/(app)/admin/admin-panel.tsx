'use client'

import { useState, useTransition } from 'react'
import { approveRequest, rejectRequest } from '@/lib/actions/access'
import type { AccessRequest } from '@/lib/actions/access'

const accent = '#7F77DD'

const T = {
  bg:     '#0f0f0f',
  bgElev: '#17171a',
  border: 'rgba(255,255,255,0.08)',
  text:   '#f5f4f8',
  mute:   '#6b6878',
  dim:    '#a8a4b8',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${mins}m ago`
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    pending:  { bg: 'rgba(232,182,90,0.15)',   color: '#e8b65a' },
    approved: { bg: 'rgba(95,207,138,0.15)',   color: '#5fcf8a' },
    rejected: { bg: 'rgba(220,80,80,0.15)',    color: '#e87070' },
  }
  const c = colors[status] ?? colors.pending
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: c.bg, color: c.color }}>
      {status}
    </span>
  )
}

function RequestRow({ req, onAction }: { req: AccessRequest; onAction: () => void }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone]            = useState(false)
  const [actionDone, setActionDone] = useState<'approved' | 'rejected' | null>(null)

  if (done) {
    return (
      <tr>
        <td colSpan={5} style={{ padding: '12px 16px', color: T.mute, fontSize: 13, fontStyle: 'italic', borderTop: `1px solid ${T.border}` }}>
          {actionDone === 'approved' ? `✓ Invite sent to ${req.email}` : `✗ Rejected ${req.email}`}
        </td>
      </tr>
    )
  }

  function approve() {
    startTransition(async () => {
      await approveRequest(req.id)
      setActionDone('approved'); setDone(true); onAction()
    })
  }

  function reject() {
    startTransition(async () => {
      await rejectRequest(req.id)
      setActionDone('rejected'); setDone(true); onAction()
    })
  }

  return (
    <tr style={{ opacity: pending ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      <td style={{ padding: '13px 16px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{req.name}</div>
        <div style={{ fontSize: 12, color: T.mute, marginTop: 1 }}>{req.email}</div>
      </td>
      <td style={{ padding: '13px 16px', borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.mute, whiteSpace: 'nowrap' }}>
        {timeAgo(req.created_at)}
      </td>
      <td style={{ padding: '13px 16px', borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.mute }}>
        {req.referrer
          ? (req.referrer as any).display_name ?? (req.referrer as any).username ?? '—'
          : <span style={{ color: T.border }}>—</span>
        }
      </td>
      <td style={{ padding: '13px 16px', borderTop: `1px solid ${T.border}` }}>
        <StatusBadge status={req.status} />
      </td>
      {req.status === 'pending' && (
        <td style={{ padding: '13px 16px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={approve}
              disabled={pending}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(95,207,138,0.15)', color: '#5fcf8a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Approve
            </button>
            <button
              onClick={reject}
              disabled={pending}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.mute, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Reject
            </button>
          </div>
        </td>
      )}
      {req.status !== 'pending' && (
        <td style={{ padding: '13px 16px', borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.mute }}>
          {req.approved_at ? timeAgo(req.approved_at) : '—'}
        </td>
      )}
    </tr>
  )
}

export function AdminPanel({ requests }: { requests: AccessRequest[] }) {
  const [tab, setTab]     = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [tick, setTick]   = useState(0)

  const pending  = requests.filter(r => r.status === 'pending')
  const approved = requests.filter(r => r.status === 'approved')
  const rejected = requests.filter(r => r.status === 'rejected')

  const shown = tab === 'pending' ? pending : tab === 'approved' ? approved : rejected

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '40px 32px 80px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
          Access requests
        </h1>
        <p style={{ fontSize: 14, color: T.mute, margin: 0 }}>
          {pending.length} pending · {approved.length} approved · {rejected.length} rejected
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 24, gap: 0 }}>
        {(['pending', 'approved', 'rejected'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? T.text : T.mute,
              borderBottom: tab === t ? `2px solid ${accent}` : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.15s',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'pending' && pending.length > 0 && (
              <span style={{ marginLeft: 6, background: accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: T.mute }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {tab === 'pending' ? '📭' : tab === 'approved' ? '✅' : '🚫'}
          </div>
          <p style={{ fontSize: 14, margin: 0 }}>No {tab} requests</p>
        </div>
      ) : (
        <div style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name / Email', 'Requested', 'Referred by', 'Status', tab === 'pending' ? 'Actions' : 'Acted'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: T.mute, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.03)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(req => (
                <RequestRow key={`${req.id}-${tick}`} req={req} onAction={() => setTick(t => t + 1)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
