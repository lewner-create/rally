'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  getEventDetails,
  getEventCosts,
  saveEventDetails,
  addEventCost,
  toggleCostPaid,
  deleteEventCost,
} from '@/lib/actions/event-details'

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | 'vacation'
  | 'day_trip'
  | 'road_trip'
  | 'game_night'
  | 'hangout'
  | 'meetup'
  | 'moto_trip'
  | string

type CostCategory = 'Lodging' | 'Food' | 'Gas' | 'Activities' | 'Other'

type Cost = {
  id: string
  label: string
  category: CostCategory
  amount: number
  responsible_user_id: string | null
  paid: boolean
  payment_url: string | null
}

type Details = {
  address: string | null
  location_url: string | null
  booking_links: string | null
  notes: string | null
  confirmation: string | null
  pay_by: string | null
}

type Member = {
  id: string
  display_name: string | null
  username: string
}

type Props = {
  eventId: string
  eventType: EventType
  members: Member[]
  isCreator: boolean
}

// ─── Config: what to show per event type ─────────────────────────────────────

const ALL_CATEGORIES: CostCategory[] = ['Lodging', 'Food', 'Gas', 'Activities', 'Other']

const CATEGORIES_BY_TYPE: Record<string, CostCategory[]> = {
  vacation:  ['Lodging', 'Food', 'Gas', 'Activities', 'Other'],
  day_trip:  ['Lodging', 'Food', 'Gas', 'Activities', 'Other'],
  road_trip: ['Gas', 'Food', 'Lodging', 'Other'],
  game_night:['Food', 'Other'],
  hangout:   ['Food', 'Other'],
  meetup:    ['Food', 'Other'],
  moto_trip: ['Gas', 'Food', 'Other'],
}

type DetailFields = {
  address: boolean
  location_url: boolean
  booking_links: boolean
  confirmation: boolean
  pay_by: boolean
  notes: boolean
}

const DETAIL_FIELDS_BY_TYPE: Record<string, DetailFields> = {
  vacation:  { address: true,  location_url: true,  booking_links: true,  confirmation: true,  pay_by: true,  notes: true },
  day_trip:  { address: true,  location_url: true,  booking_links: true,  confirmation: true,  pay_by: true,  notes: true },
  road_trip: { address: true,  location_url: true,  booking_links: false, confirmation: false, pay_by: false, notes: true },
  game_night:{ address: true,  location_url: true,  booking_links: false, confirmation: false, pay_by: false, notes: true },
  hangout:   { address: true,  location_url: true,  booking_links: false, confirmation: false, pay_by: false, notes: true },
  meetup:    { address: true,  location_url: true,  booking_links: false, confirmation: false, pay_by: false, notes: true },
  moto_trip: { address: false, location_url: false, booking_links: false, confirmation: false, pay_by: false, notes: true },
}

const DEFAULT_DETAIL_FIELDS: DetailFields = {
  address: true, location_url: true, booking_links: true,
  confirmation: true, pay_by: true, notes: true,
}

function getCategoriesForType(type: EventType): CostCategory[] {
  return CATEGORIES_BY_TYPE[type] ?? ALL_CATEGORIES
}

function getDetailFieldsForType(type: EventType): DetailFields {
  return DETAIL_FIELDS_BY_TYPE[type] ?? DEFAULT_DETAIL_FIELDS
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-2 mt-5 first:mt-0">
      {children}
    </p>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-[#666] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#444] disabled:opacity-50 transition-colors"
      />
    </div>
  )
}

function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-[#666] mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#444] disabled:opacity-50 transition-colors resize-none"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventDetails({ eventId, eventType, members, isCreator }: Props) {
  const categories = getCategoriesForType(eventType)
  const detailFields = getDetailFieldsForType(eventType)

  const [costs, setCosts] = useState<Cost[]>([])
  const [details, setDetails] = useState<Details>({
    address: null, location_url: null, booking_links: null,
    notes: null, confirmation: null, pay_by: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, startSave] = useTransition()

  // New cost form
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState<CostCategory>(categories[0])
  const [newAmount, setNewAmount] = useState('')
  const [newResponsible, setNewResponsible] = useState('')
  const [newPayUrl, setNewPayUrl] = useState('')
  const [addingCost, setAddingCost] = useState(false)

  useEffect(() => {
    async function load() {
      const [d, c] = await Promise.all([
        getEventDetails(eventId),
        getEventCosts(eventId),
      ])
      if (d) setDetails(d as Details)
      if (c) setCosts(c as Cost[])
      setLoading(false)
    }
    load()
  }, [eventId])

  // Auto-update new category default when eventType changes
  useEffect(() => {
    setNewCategory(categories[0])
  }, [eventType])

  function handleDetailChange(field: keyof Details, value: string) {
    setDetails((prev) => ({ ...prev, [field]: value || null }))
  }

  function handleSaveDetails() {
    startSave(async () => {
      await saveEventDetails(eventId, details)
    })
  }

  async function handleAddCost() {
    if (!newLabel.trim() || !newAmount) return
    const cost = await addEventCost(eventId, {
      label: newLabel.trim(),
      category: newCategory,
      amount: parseFloat(newAmount),
      responsible_user_id: newResponsible || null,
      payment_url: newPayUrl || null,
    })
    if (cost) setCosts((prev) => [...prev, cost as Cost])
    setNewLabel('')
    setNewAmount('')
    setNewResponsible('')
    setNewPayUrl('')
    setAddingCost(false)
  }

  async function handleTogglePaid(costId: string) {
    await toggleCostPaid(costId)
    setCosts((prev) => prev.map((c) => c.id === costId ? { ...c, paid: !c.paid } : c))
  }

  async function handleDeleteCost(costId: string) {
    await deleteEventCost(costId)
    setCosts((prev) => prev.filter((c) => c.id !== costId))
  }

  const totalAmount = costs.reduce((s, c) => s + c.amount, 0)
  const perPerson = members.length > 0 ? totalAmount / members.length : 0

  if (loading) {
    return <div className="py-8 text-center text-[#555] text-sm">Loading…</div>
  }

  return (
    <div className="space-y-6">

      {/* ── Costs section ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm">Costs</h3>
          {totalAmount > 0 && (
            <span className="text-xs text-[#666]">
              {fmtAmount(totalAmount)} total · {fmtAmount(perPerson)}/person
            </span>
          )}
        </div>

        {costs.length === 0 && !addingCost && (
          <p className="text-[#444] text-sm mb-3">No costs added yet.</p>
        )}

        {/* Cost line items grouped by category */}
        {categories.map((cat) => {
          const catCosts = costs.filter((c) => c.category === cat)
          if (catCosts.length === 0) return null
          return (
            <div key={cat} className="mb-3">
              <SectionLabel>{cat}</SectionLabel>
              {catCosts.map((cost) => (
                <div
                  key={cost.id}
                  className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleTogglePaid(cost.id)}
                      className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors ${
                        cost.paid
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'border-[#333] text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${cost.paid ? 'line-through text-[#555]' : 'text-white'}`}>
                        {cost.label}
                      </p>
                      {cost.responsible_user_id && (
                        <p className="text-xs text-[#555]">
                          {members.find((m) => m.id === cost.responsible_user_id)?.display_name ?? 'Someone'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {cost.payment_url && (
                      <a
                        href={cost.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Pay
                      </a>
                    )}
                    <span className={`text-sm font-medium ${cost.paid ? 'text-[#555]' : 'text-white'}`}>
                      {fmtAmount(cost.amount)}
                    </span>
                    {isCreator && (
                      <button
                        onClick={() => handleDeleteCost(cost.id)}
                        className="text-[#444] hover:text-red-400 transition-colors text-xs ml-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {/* Add cost form */}
        {addingCost ? (
          <div
            className="rounded-xl p-4 mt-2"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
          >
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                placeholder="Label (e.g. Airbnb)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="col-span-2 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#555]"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CostCategory)}
                className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none"
              />
              <select
                value={newResponsible}
                onChange={(e) => setNewResponsible(e.target.value)}
                className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="">Who's responsible?</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name ?? m.username}
                  </option>
                ))}
              </select>
              <input
                placeholder="Payment link (optional)"
                value={newPayUrl}
                onChange={(e) => setNewPayUrl(e.target.value)}
                className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCost}
                disabled={!newLabel.trim() || !newAmount}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-500 transition-colors"
              >
                Add cost
              </button>
              <button
                onClick={() => setAddingCost(false)}
                className="px-4 py-2 rounded-lg text-sm text-[#666] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCost(true)}
            className="flex items-center gap-2 text-sm text-[#555] hover:text-white transition-colors mt-2"
          >
            <span className="w-5 h-5 rounded-md bg-[#1e1e1e] flex items-center justify-center text-xs">+</span>
            Add a cost
          </button>
        )}
      </div>

      {/* ── Details section ───────────────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold text-white text-sm mb-3">The details</h3>

        {detailFields.address && (
          <FieldInput
            label="Address / location"
            value={details.address ?? ''}
            onChange={(v) => handleDetailChange('address', v)}
            placeholder="123 Main St, City"
          />
        )}

        {detailFields.location_url && (
          <FieldInput
            label="Maps link"
            value={details.location_url ?? ''}
            onChange={(v) => handleDetailChange('location_url', v)}
            placeholder="https://maps.google.com/..."
          />
        )}

        {detailFields.booking_links && (
          <TextareaInput
            label="Booking links"
            value={details.booking_links ?? ''}
            onChange={(v) => handleDetailChange('booking_links', v)}
            placeholder="Airbnb, flights, rental car…"
          />
        )}

        {detailFields.confirmation && (
          <FieldInput
            label="Confirmation #"
            value={details.confirmation ?? ''}
            onChange={(v) => handleDetailChange('confirmation', v)}
            placeholder="CONF-12345"
          />
        )}

        {detailFields.pay_by && (
          <FieldInput
            label="Pay by date"
            value={details.pay_by ?? ''}
            onChange={(v) => handleDetailChange('pay_by', v)}
            type="date"
          />
        )}

        {detailFields.notes && (
          <TextareaInput
            label="Notes"
            value={details.notes ?? ''}
            onChange={(v) => handleDetailChange('notes', v)}
            placeholder="Anything else the group should know…"
          />
        )}

        <button
          onClick={handleSaveDetails}
          disabled={saving}
          className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#1e1e1e] border border-[#2a2a2a] text-white hover:bg-[#252525] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save details'}
        </button>
      </div>
    </div>
  )
}
