'use client'

import { useState, useTransition } from 'react'
import { addBlock } from '@/lib/actions/availability'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0')
  const label =
    i === 0 ? '12:00 AM' :
    i < 12 ? `${i}:00 AM` :
    i === 12 ? '12:00 PM' :
    `${i - 12}:00 PM`
  return { value: h, label }
})

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--rally-primary)] focus:border-[var(--rally-primary)]'

export function AddBlockForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [blockType, setBlockType] = useState<'busy' | 'free'>('busy')

  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(formData: FormData) {
    formData.set('block_type', blockType)
    setError(null)
    startTransition(async () => {
      const result = await addBlock(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onSuccess?.()
        const form = document.getElementById('add-block-form') as HTMLFormElement
        form?.reset()
      }
    })
  }

  return (
    <form id="add-block-form" action={handleSubmit} className="space-y-5">

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="date" className="text-sm font-medium">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          min={today}
          required
          className="w-full h-10"
        />
      </div>

      {/* Time range */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_hour" className="text-sm font-medium">From</Label>
          <select id="start_hour" name="start_hour" required className={selectClass} defaultValue="18">
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_hour" className="text-sm font-medium">To</Label>
          <select id="end_hour" name="end_hour" required className={selectClass} defaultValue="22">
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Block type toggle */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Type</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBlockType('busy')}
            className="flex-1 rounded-md border py-2 text-sm font-medium transition-colors"
            style={blockType === 'busy' ? {
              background: 'var(--rally-conflict)',
              color: '#fff',
              borderColor: 'var(--rally-conflict)',
            } : {
              background: 'transparent',
              color: 'var(--rally-conflict-text)',
              borderColor: 'var(--rally-conflict-border)',
            }}
          >
            Busy
          </button>
          <button
            type="button"
            onClick={() => setBlockType('free')}
            className="flex-1 rounded-md border py-2 text-sm font-medium transition-colors"
            style={blockType === 'free' ? {
              background: 'var(--rally-signal)',
              color: '#fff',
              borderColor: 'var(--rally-signal)',
            } : {
              background: 'transparent',
              color: 'var(--rally-signal-text)',
              borderColor: 'var(--rally-signal-border)',
            }}
          >
            Free
          </button>
        </div>
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <Label htmlFor="label" className="text-sm font-medium">
          Label{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="label"
          name="label"
          placeholder="e.g. Work, Gym, Family dinner"
          maxLength={40}
          className="h-10"
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--rally-conflict)' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-10 rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-50"
        style={{ background: 'var(--rally-primary)' }}
      >
        {isPending ? 'Saving…' : 'Add block'}
      </button>
    </form>
  )
}
