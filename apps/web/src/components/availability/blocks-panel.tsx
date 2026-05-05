'use client'

import { useState, useTransition, useEffect } from 'react'
import { createBlock, deleteBlock, type AvailabilityBlock } from '@/lib/actions/availability-blocks'
import { X, Plus, Calendar } from 'lucide-react'

type Props = {
  initialBlocks: AvailabilityBlock[]
}

const SOURCE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  google: { label: 'Google Calendar', color: '#4285F4', bg: '#4285F420' },
  event:  { label: 'Rally event',     color: '#7F77DD', bg: '#7F77DD20' },
  manual: { label: 'Manual block',    color: '#f59e0b', bg: '#f59e0b20' },
}

function formatRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const date = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const t1   = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const t2   = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${t1} – ${t2}`
}

// Format a local datetime-local input value for display
function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function BlocksPanel({ initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(initialBlocks)

  useEffect(() => { setBlocks(initialBlocks) }, [initialBlocks])
  const [showForm, setShowForm] = useState(false)
  const [label,    setLabel]    = useState('')
  const [startsAt, setStartsAt] = useState(() => toLocalInputValue(new Date()))
  const [endsAt,   setEndsAt]   = useState(() => {
    const d = new Date(); d.setHours(d.getHours() + 2); return toLocalInputValue(d)
  })
  const [saving,   startSave]   = useTransition()
  const [removing, setRemoving] = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  async function handleAdd() {
    if (!startsAt || !endsAt) return
    setError(null)
    startSave(async () => {
      const { id, error } = await createBlock({
        startsAt: new Date(startsAt).toISOString(),
        endsAt:   new Date(endsAt).toISOString(),
        label:    label.trim() || null,
        source:   'manual',
      })
      if (error || !id) { setError(error ?? 'Failed to create block'); return }

      const newBlock: AvailabilityBlock = {
        id,
        user_id:    '',
        start_time:  new Date(startsAt).toISOString(),
        end_time:    new Date(endsAt).toISOString(),
        label:      label.trim() || null,
        source:     'manual',
        event_id:   null,
        created_at: new Date().toISOString(),
      }
      setBlocks(prev => [...prev, newBlock].sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ))
      setShowForm(false)
      setLabel('')
    })
  }

  async function handleDelete(id: string) {
    setRemoving(id)
    const { error } = await deleteBlock(id)
    if (error) { setError(error); setRemoving(null); return }
    setBlocks(prev => prev.filter(b => b.id !== id))
    setRemoving(null)
  }

  const manualBlocks  = blocks.filter(b => b.source === 'manual')
  const googleBlocks  = blocks.filter(b => b.source === 'google')
  const eventBlocks   = blocks.filter(b => b.source === 'event')

  return (
    <div style={{ marginTop: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
            Upcoming blocks
          </h2>
          <p style={{ fontSize: '12px', color: '#444', margin: '3px 0 0' }}>
            These windows mark you as unavailable to your groups
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 12px', borderRadius: '9px',
            background: showForm ? '#2a2a2a' : '#7F77DD18',
            border: `1px solid ${showForm ? '#333' : '#7F77DD33'}`,
            color: showForm ? '#555' : '#7F77DD',
            fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={13} />
          Add block
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          background: '#161616', border: '1px solid #222',
          borderRadius: '14px', padding: '16px', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>
                Label <span style={{ color: '#333', fontWeight: 400, textTransform: 'none' }}>(optional — e.g. "Weekend trip" or "Doctor's appointment")</span>
              </label>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="What's keeping you busy?"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '9px',
                  border: '1px solid #2a2a2a', background: '#1e1e1e',
                  fontSize: '13px', color: '#fff', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => (e.target.style.borderColor = '#7F77DD')}
                onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>Starts</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '9px',
                    border: '1px solid #2a2a2a', background: '#1e1e1e',
                    fontSize: '13px', color: '#fff', outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>Ends</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '9px',
                    border: '1px solid #2a2a2a', background: '#1e1e1e',
                    fontSize: '13px', color: '#fff', outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>

            {error && <p style={{ fontSize: '12px', color: '#f87171', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1, padding: '9px', borderRadius: '9px',
                  border: '1px solid #2a2a2a', background: 'none',
                  fontSize: '13px', color: '#555', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !startsAt || !endsAt}
                style={{
                  flex: 2, padding: '9px', borderRadius: '9px',
                  background: saving ? '#2a2a2a' : '#7F77DD',
                  border: 'none', color: saving ? '#444' : '#fff',
                  fontSize: '13px', fontWeight: 700,
                  cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {saving ? 'Saving…' : 'Block this time'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block list */}
      {blocks.length === 0 && !showForm && (
        <div style={{
          border: '1px dashed #1e1e1e', borderRadius: '12px',
          padding: '28px', textAlign: 'center',
        }}>
          <Calendar size={20} color="#333" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', color: '#444', margin: 0 }}>
            No upcoming blocks — you look free!
          </p>
        </div>
      )}

      {blocks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Group by source */}
          {[
            { source: 'event',  items: eventBlocks,  title: 'Rally events' },
            { source: 'google', items: googleBlocks, title: 'Google Calendar' },
            { source: 'manual', items: manualBlocks, title: 'Manual blocks' },
          ].filter(g => g.items.length > 0).map(group => (
            <div key={group.source}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '.08em', margin: '12px 0 6px' }}>
                {group.title}
              </p>
              {group.items.map(block => {
                const meta = SOURCE_LABEL[block.source] ?? SOURCE_LABEL.manual
                return (
                  <div
                    key={block.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 14px', borderRadius: '11px',
                      background: '#161616', border: '1px solid #1e1e1e',
                      gap: '12px', marginBottom: '4px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {block.label && (
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#ccc', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {block.label}
                        </p>
                      )}
                      <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                        {formatRange(block.start_time, block.end_time)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '3px 8px',
                        borderRadius: '9999px', background: meta.bg, color: meta.color,
                      }}>
                        {meta.label}
                      </span>

                      {/* Only allow deleting manual blocks */}
                      {block.source === 'manual' && (
                        <button
                          onClick={() => handleDelete(block.id)}
                          disabled={removing === block.id}
                          style={{
                            width: '24px', height: '24px', borderRadius: '6px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#444')}
                        >
                          {removing === block.id ? '…' : <X size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
