'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import {
  getEventExpenses, createExpense, respondToExpenseSplit,
  markSplitPaid, uploadExpenseFile, deleteExpense,
  type EventExpense, type ExpenseCategory,
} from '@/lib/actions/expenses'

type Member = { id: string; display_name: string | null; username: string }
type Props  = { eventId: string; members: Member[]; currentUserId: string }

const CATS: { id: ExpenseCategory; label: string }[] = [
  { id: 'food',       label: 'Food'       },
  { id: 'lodging',    label: 'Lodging'    },
  { id: 'gas',        label: 'Gas'        },
  { id: 'transport',  label: 'Transport'  },
  { id: 'activities', label: 'Activities' },
  { id: 'other',      label: 'Other'      },
]

const CAT_EMOJI: Record<string, string> = {
  food: '🍕', lodging: '🏠', gas: '⛽', transport: '🚗', activities: '🎯', other: '💰',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#fbbf24', approved: '#34d399', rejected: '#ef4444',
  paid: '#7F77DD', pending_approval: '#fbbf24', active: '#34d399', cancelled: '#ef4444',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ExpensesTab({ eventId, members, currentUserId }: Props) {
  const [expenses, setExpenses]   = useState<EventExpense[]>([])
  const [loaded,   setLoaded]     = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [pending,  startTx]       = useTransition()
  const [title,      setTitle]      = useState('')
  const [category,   setCategory]   = useState<ExpenseCategory>('other')
  const [amount,     setAmount]     = useState('')
  const [expDate,    setExpDate]    = useState('')
  const [payByDate,  setPayByDate]  = useState('')
  const [splitAll,   setSplitAll]   = useState(true)
  const [splitIds,   setSplitIds]   = useState<string[]>([])
  const receiptRef                  = useRef<HTMLInputElement>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [uploading,  setUploading]  = useState(false)

  useEffect(() => {
    startTx(async () => {
      const data = await getEventExpenses(eventId)
      setExpenses(data)
      setLoaded(true)
    })
  }, [eventId])

  const reload = () => startTx(async () => {
    const data = await getEventExpenses(eventId)
    setExpenses(data)
  })

  const toggleMember = (id: string) =>
    setSplitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${currentUserId}/receipt-${Date.now()}.${ext}`
      const url  = await uploadExpenseFile(file, path)
      setReceiptUrl(url)
    } catch { /* ignore */ } finally { setUploading(false) }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !amount) return
    const ids       = splitAll ? members.map(m => m.id) : [currentUserId, ...splitIds]
    const uniqueIds = [...new Set([currentUserId, ...ids])]
    startTx(async () => {
      const res = await createExpense(eventId, {
        title: title.trim(), category,
        total_amount: parseFloat(amount),
        expense_date: expDate || null,
        pay_by_date:  payByDate || null,
        receipt_url:  receiptUrl,
        split_user_ids: uniqueIds,
      })
      if (!res.error) {
        setTitle(''); setAmount(''); setExpDate(''); setPayByDate('')
        setReceiptUrl(null); setSplitAll(true); setSplitIds([])
        setShowForm(false); reload()
      }
    })
  }

  if (!loaded) return (
    <div className="flex items-center justify-center py-12">
      <span className="text-[#555] text-sm">Loading expenses...</span>
    </div>
  )

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(127,119,221,0.12)', border: '1px solid rgba(127,119,221,0.3)', color: '#7F77DD' }}
        >
          + Add expense
        </button>
      )}
      {showForm && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <p className="text-sm font-semibold text-white mb-1">New expense</p>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What was it for?"
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#555] outline-none"
            style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
          <div className="flex gap-2">
            <input value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Amount" type="number" min="0" step="0.01"
              className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-[#555] outline-none"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
            <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
              {CATS.map(c => <option key={c.id} value={c.id}>{CAT_EMOJI[c.id]} {c.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-[#555] uppercase tracking-wider">Expense date</label>
              <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none mt-1"
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[#555] uppercase tracking-wider">Pay by</label>
              <input type="date" value={payByDate} onChange={e => setPayByDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none mt-1"
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#555] uppercase tracking-wider">Receipt (optional)</label>
            <div className="mt-1 flex items-center gap-2">
              <button onClick={() => receiptRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#888' }}>
                {uploading ? 'Uploading...' : receiptUrl ? 'Receipt added' : 'Upload receipt'}
              </button>
              {receiptUrl && <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-[#7F77DD]">View</a>}
            </div>
            <input ref={receiptRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
          </div>
          <div>
            <label className="text-[10px] text-[#555] uppercase tracking-wider mb-2 block">Split with</label>
            <div className="flex gap-2 mb-2">
              {[true, false].map(all => (
                <button key={String(all)} onClick={() => setSplitAll(all)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: splitAll === all ? 'rgba(127,119,221,0.15)' : '#1e1e1e',
                    border: `1px solid ${splitAll === all ? 'rgba(127,119,221,0.4)' : '#2a2a2a'}`,
                    color: splitAll === all ? '#7F77DD' : '#666',
                  }}
                >{all ? 'Everyone' : 'Select'}</button>
              ))}
            </div>
            {!splitAll && (
              <div className="space-y-1">
                {members.filter(m => m.id !== currentUserId).map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={splitIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)} className="accent-[#7F77DD]" />
                    <span className="text-sm text-white">{m.display_name ?? m.username}</span>
                  </label>
                ))}
              </div>
            )}
            {amount && (
              <p className="text-xs text-[#555] mt-2">
                {fmt(parseFloat(amount) / (splitAll ? members.length : (splitIds.length + 1)) || 0)} per person
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSubmit} disabled={pending || !title.trim() || !amount}
              className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#7F77DD', color: 'white', opacity: pending || !title.trim() || !amount ? 0.5 : 1 }}
            >{pending ? 'Adding...' : 'Add expense'}</button>
            <button onClick={() => { setShowForm(false); setTitle(''); setAmount(''); setReceiptUrl(null) }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#666' }}
            >Cancel</button>
          </div>
        </div>
      )}
      {expenses.length === 0 && !showForm && (
        <div className="text-center py-10">
          <p className="text-[#555] text-sm">No expenses yet.</p>
          <p className="text-[#444] text-xs mt-1">Add an expense to split costs with the group.</p>
        </div>
      )}
      {expenses.map(exp => (
        <ExpenseCard key={exp.id} expense={exp} currentUserId={currentUserId} onUpdate={reload} />
      ))}
    </div>
  )
}

function ExpenseCard({ expense, currentUserId, onUpdate }: {
  expense: EventExpense; currentUserId: string; onUpdate: () => void
}) {
  const [pending,   startTx]      = useTransition()
  const [expanded,  setExpanded]  = useState(false)
  const screenshotRef              = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const isCreator  = expense.created_by === currentUserId
  const mySplit    = expense.splits.find(s => s.user_id === currentUserId)
  const paidCount  = expense.splits.filter(s => s.status === 'paid').length
  const totalCount = expense.splits.filter(s => s.status !== 'rejected').length
  const progress   = totalCount > 0 ? (paidCount / totalCount) * 100 : 0
  const handleRespond = (response: 'approved' | 'rejected') => {
    if (!mySplit) return
    startTx(async () => { await respondToExpenseSplit(mySplit.id, response); onUpdate() })
  }
  const handleMarkPaid = (screenshotUrl?: string) => {
    if (!mySplit) return
    startTx(async () => { await markSplitPaid(mySplit.id, screenshotUrl); onUpdate() })
  }
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${currentUserId}/${mySplit?.id}-${Date.now()}.${ext}`
      const url  = await uploadExpenseFile(file, path)
      handleMarkPaid(url)
    } catch { /* ignore */ } finally { setUploading(false) }
  }
  const creatorSplit    = expense.splits.find(s => s.user_id === expense.created_by)
  const creatorPayLinks = creatorSplit?.profiles?.payment_links ?? {}
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
      <div className="flex items-start justify-between p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{CAT_EMOJI[expense.category] ?? '💰'}</span>
            <p className="text-white font-semibold text-sm leading-tight truncate">{expense.title}</p>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ml-auto shrink-0"
              style={{ background: (STATUS_COLOR[expense.status] ?? '#555') + '20', color: STATUS_COLOR[expense.status] ?? '#555' }}>
              {expense.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#555]">
            <span className="font-semibold text-white">{fmt(expense.total_amount)}</span>
            {expense.expense_date && <span>📅 {fmtDate(expense.expense_date)}</span>}
            {expense.pay_by_date  && <span style={{ color: '#fbbf24' }}>⏰ Pay by {fmtDate(expense.pay_by_date)}</span>}
          </div>
          <p className="text-[10px] text-[#444] mt-0.5">
            Added by {expense.creator?.display_name ?? expense.creator?.username ?? 'someone'}
          </p>
        </div>
        <span className="text-[#555] text-xs ml-2 shrink-0 mt-0.5">{expanded ? '▲' : '▼'}</span>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#555]">{paidCount}/{totalCount} paid</span>
          <span className="text-[10px] text-[#555]">{fmt(expense.total_amount * (paidCount / (totalCount || 1)))} collected</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: progress === 100 ? '#34d399' : '#7F77DD' }} />
        </div>
      </div>
      {mySplit && expense.status !== 'cancelled' && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-[#999]">Your share: </span>
              <span className="text-sm font-semibold text-white">{fmt(mySplit.amount)}</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: (STATUS_COLOR[mySplit.status] ?? '#555') + '20', color: STATUS_COLOR[mySplit.status] ?? '#555' }}>
              {mySplit.status}
            </span>
          </div>
          {mySplit.status === 'pending' && !isCreator && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleRespond('approved')} disabled={pending}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: '#22c55e18', border: '1px solid #22c55e66', color: '#22c55e' }}>Approve</button>
              <button onClick={() => handleRespond('rejected')} disabled={pending}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: '#ef444418', border: '1px solid #ef444466', color: '#ef4444' }}>Decline</button>
            </div>
          )}
          {mySplit.status === 'approved' && !isCreator && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.entries(creatorPayLinks).filter(([, v]) => v).map(([key, val]) => (
                <a key={key} href={String(val)} target="_blank" rel="noreferrer"
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-center"
                  style={{ background: '#7F77DD18', border: '1px solid #7F77DD44', color: '#7F77DD' }}
                  onClick={e => e.stopPropagation()}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </a>
              ))}
              <button onClick={e => { e.stopPropagation(); screenshotRef.current?.click() }}
                disabled={pending || uploading}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: '#7F77DD18', border: '1px solid #7F77DD44', color: '#7F77DD' }}>
                {uploading ? 'Uploading...' : 'Mark paid'}
              </button>
              <input ref={screenshotRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
            </div>
          )}
          {mySplit.status === 'paid' && mySplit.payment_screenshot_url && (
            <div className="mt-2">
              <a href={mySplit.payment_screenshot_url} target="_blank" rel="noreferrer"
                className="text-xs" style={{ color: '#7F77DD' }} onClick={e => e.stopPropagation()}>
                View payment screenshot
              </a>
            </div>
          )}
        </div>
      )}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-[#444] mb-2">All splits</p>
          {expense.splits.map(split => {
            const profile = split.profiles
            const name    = profile?.display_name ?? profile?.username ?? 'Unknown'
            const initial = name[0]?.toUpperCase() ?? '?'
            return (
              <div key={split.id} className="flex items-center gap-3">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  : <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: '#7F77DD44' }}>{initial}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white leading-tight truncate">{name}</p>
                  <p className="text-[10px] text-[#555]">{fmt(split.amount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {split.payment_screenshot_url && (
                    <a href={split.payment_screenshot_url} target="_blank" rel="noreferrer"
                      className="text-[10px]" style={{ color: '#7F77DD' }} onClick={e => e.stopPropagation()}>
                      Receipt
                    </a>
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: (STATUS_COLOR[split.status] ?? '#555') + '20', color: STATUS_COLOR[split.status] ?? '#555' }}>
                    {split.status}
                  </span>
                </div>
              </div>
            )
          })}
          {expense.receipt_url && (
            <a href={expense.receipt_url} target="_blank" rel="noreferrer"
              className="text-xs mt-2 block" style={{ color: '#7F77DD' }} onClick={e => e.stopPropagation()}>
              View receipt
            </a>
          )}
          {isCreator && expense.status !== 'cancelled' && (
            <button
              onClick={e => { e.stopPropagation(); startTx(async () => { await deleteExpense(expense.id); onUpdate() }) }}
              disabled={pending} className="text-xs mt-2" style={{ color: '#ef4444' }}>
              Delete expense
            </button>
          )}
        </div>
      )}
    </div>
  )
}