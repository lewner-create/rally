'use client'

import { useTransition } from 'react'
import { deleteBlock, type AvailabilityBlock } from '@/lib/actions/availability'
import { Trash2 } from 'lucide-react'

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

interface BlockListProps {
  blocks: AvailabilityBlock[]
}

export function BlockList({ blocks }: BlockListProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBlock(id)
    })
  }

  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No upcoming blocks. You appear free to everyone by default.
        </p>
      </div>
    )
  }

  const grouped = blocks.reduce<Record<string, AvailabilityBlock[]>>((acc, block) => {
    const key = formatDate(block.start_time)
    if (!acc[key]) acc[key] = []
    acc[key].push(block)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateBlocks]) => (
        <div key={date}>
          <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground mb-2.5">
            {date}
          </p>
          <ul className="space-y-2">
            {dateBlocks.map((block) => {
              const isBusy = block.block_type === 'busy'
              return (
                <li
                  key={block.id}
                  className="flex items-center gap-3 rounded-r-lg py-2.5 px-3"
                  style={{
                    background: isBusy ? 'var(--rally-conflict-surface)' : 'var(--rally-signal-surface)',
                    borderLeft: `3px solid ${isBusy ? 'var(--rally-conflict)' : 'var(--rally-signal)'}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: isBusy ? 'var(--rally-conflict-text)' : 'var(--rally-signal-text)' }}
                    >
                      {formatTime(block.start_time)} – {formatTime(block.end_time)}
                    </p>
                    {block.label && (
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: isBusy ? 'var(--rally-coral-600)' : 'var(--rally-teal-600)' }}
                      >
                        {block.label}
                      </p>
                    )}
                  </div>

                  <span
                    className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded"
                    style={{
                      background: isBusy ? 'var(--rally-coral-100)' : 'var(--rally-teal-100)',
                      color: isBusy ? 'var(--rally-conflict-text)' : 'var(--rally-signal-text)',
                    }}
                  >
                    {block.block_type}
                  </span>

                  <button
                    onClick={() => handleDelete(block.id)}
                    disabled={isPending}
                    className="shrink-0 p-1 rounded transition-opacity hover:opacity-70 disabled:opacity-30"
                    style={{ color: isBusy ? 'var(--rally-conflict)' : 'var(--rally-signal)' }}
                    aria-label="Delete block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
