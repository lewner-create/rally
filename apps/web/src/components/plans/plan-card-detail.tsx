'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { respondToPlanCard, lockInPlanCard } from '@/lib/actions/plan-cards'

// ─── Types ────────────────────────────────────────────────────────────────────

type Response = {
  user_id: string
  response: 'in' | 'maybe' | 'cant'
  profiles: { id: string; display_name: string | null; username: string; avatar_url: string | null } | null
}

type Card = {
  id: string
  title: string
  event_type: string
  proposed_date: string | null
  proposed_start: string | null
  proposed_end: string | null
  status: 'open' | 'locked'
  event_id: string | null
  created_by: string
  group_id: string
  groups: { id: string; name: string; slug: string; theme_color: string | null } | null
}

type Member = {
  id: string
  display_name: string | null
  username: string
  avatar_url: string | null
}

type Props = {
  card: Card
  responses: Response[]
  members: Member[]
  currentUserId: string
  isCreator: boolean
  userResponse: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_META: Record<string, { emoji: string; label: string }> = {
  vacation:   { emoji: '✈️',  label: 'Vacation' },
  day_trip:   { emoji: '🚗',  label: 'Day trip' },
  road_trip:  { emoji: '🛣️',  label: 'Road trip' },
  game_night: { emoji: '🎮',  label: 'Game night' },
  hangout:    { emoji: '🛋️',  label: 'Hangout' },
  meetup:     { emoji: '👋',  label: 'Meetup' },
  moto_trip:  { emoji: '🏍️',  label: 'Moto trip' },
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

function Avatar({ member, size = 8 }: { member: Member; size?: number }) {
  const initials = (member.display_name ?? member.username).charAt(0).toUpperCase()
  const px = size * 4
  return (
    <div
      style={{ width: px, height: px, borderRadius: '50%' }}
      className="bg-[#2a2a2a] overflow-hidden flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
      title={member.display_name ?? member.username}
    >
      {member.avatar_url
        ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
        : initials
      }
    </div>
  )
}

// ─── Response bucket ──────────────────────────────────────────────────────────

function ResponseBucket({
  label, emoji, color, responses, members,
}: {
  label: string
  emoji: string
  color: string
  responses: Response[]
  members: Member[]
}) {
  if (responses.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
          {label} · {responses.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {responses.map((r) => {
          const p = r.profiles
          if (!p) return null
          const m = members.find((m) => m.id === r.user_id) ?? p
          return (
            <div key={r.user_id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#1a1a1a' }}>
              <Avatar member={m} size={6} />
              <span className="text-sm text-white">{p.display_name ?? p.username}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlanCardDetail({
  card, responses: initialResponses, members, currentUserId, isCreator, userResponse: initialUserResponse,
}: Props) {
  const [responses, setResponses]       = useState(initialResponses)
  const [userResponse, setUserResponse] = useState(initialUserResponse)
  const [locking, startLock]            = useTransition()
  const [responding, startRespond]      = useTransition()

  const accent = (card.groups as any)?.theme_color ?? '#6366f1'
  const typeMeta = EVENT_TYPE_META[card.event_type] ?? { emoji: '📅', label: card.event_type }

  const inCount    = responses.filter((r) => r.response === 'in').length
  const maybeCount = responses.filter((r) => r.response === 'maybe').length
  const cantCount  = responses.filter((r) => r.response === 'cant').length
  const total      = responses.length

  const canLockIn = isCreator && card.status === 'open' && (inCount >= 2 || (total > 0 && inCount / total >= 0.5))

  function handleRespond(response: 'in' | 'maybe' | 'cant') {
    startRespond(async () => {
      await respondToPlanCard(card.id, response)
      setUserResponse(response)
      setResponses((prev) => {
        const filtered = prev.filter((r) => r.user_id !== currentUserId)
        const me = members.find((m) => m.id === currentUserId)
        return [...filtered, {
          user_id: currentUserId,
          response,
          profiles: me ? { id: me.id, display_name: me.display_name, username: me.username, avatar_url: me.avatar_url } : null,
        }]
      })
    })
  }

  function handleLockIn() {
    startLock(async () => {
      await lockInPlanCard(card.id)
      // lockInPlanCard redirects to the event page
    })
  }

  if (card.status === 'locked' && card.event_id) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🎉</p>
          <p className="text-white font-semibold text-lg mb-2">Plan locked in!</p>
          <p className="text-[#555] text-sm mb-6">This one's happening.</p>
          <Link
            href={`/events/${card.event_id}`}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: accent }}
          >
            View the plan →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-lg mx-auto px-4 py-8 pb-24">

        {/* Back */}
        <Link
          href={`/groups/${card.group_id}`}
          className="inline-flex items-center gap-1.5 text-[#555] text-sm hover:text-white transition-colors mb-6"
        >
          ← {(card.groups as any)?.name ?? 'Back'}
        </Link>

        {/* Hero */}
        <div
          className="rounded-2xl p-5 mb-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accent}22 0%, #1a1a1a 65%)`,
            border: `1px solid ${accent}30`,
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
            style={{ background: accent }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{typeMeta.emoji}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
                {typeMeta.label} · checking who's in
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mb-3">{card.title}</h1>
            {(card.proposed_date || card.proposed_start) && (
              <div className="flex flex-wrap gap-3 text-sm text-[#aaa]">
                {card.proposed_date && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#555]">📅</span>
                    {formatDate(card.proposed_date)}
                  </span>
                )}
                {card.proposed_start && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#555]">🕐</span>
                    {formatTime(card.proposed_start)}
                    {card.proposed_end && ` – ${formatTime(card.proposed_end)}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Response buttons */}
        {card.status === 'open' && (
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#555] mb-3">
              Are you in?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'in',    label: "I'm in",   emoji: '✅', color: '#22c55e' },
                { value: 'maybe', label: 'Maybe',    emoji: '🤔', color: '#eab308' },
                { value: 'cant',  label: "Can't",    emoji: '❌', color: '#ef4444' },
              ] as const).map((opt) => {
                const isSelected = userResponse === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleRespond(opt.value)}
                    disabled={responding}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isSelected ? `${opt.color}22` : '#1a1a1a',
                      border: `1px solid ${isSelected ? opt.color + '66' : '#252525'}`,
                    }}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: isSelected ? opt.color : '#aaa' }}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Response summary bar */}
        {total > 0 && (
          <div className="mb-6">
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
              {inCount > 0    && <div className="bg-emerald-500 rounded-full" style={{ width: `${(inCount / total) * 100}%` }} />}
              {maybeCount > 0 && <div className="bg-yellow-500 rounded-full" style={{ width: `${(maybeCount / total) * 100}%` }} />}
              {cantCount > 0  && <div className="bg-[#333] rounded-full" style={{ width: `${(cantCount / total) * 100}%` }} />}
            </div>

            <div className="space-y-4">
              <ResponseBucket
                label="In"    emoji="✅" color="#22c55e"
                responses={responses.filter((r) => r.response === 'in')}
                members={members}
              />
              <ResponseBucket
                label="Maybe" emoji="🤔" color="#eab308"
                responses={responses.filter((r) => r.response === 'maybe')}
                members={members}
              />
              <ResponseBucket
                label="Can't" emoji="❌" color="#ef4444"
                responses={responses.filter((r) => r.response === 'cant')}
                members={members}
              />
            </div>
          </div>
        )}

        {total === 0 && (
          <div
            className="rounded-xl p-6 text-center mb-6"
            style={{ background: '#161616', border: '1px dashed #222' }}
          >
            <p className="text-[#444] text-sm">No responses yet — be the first</p>
          </div>
        )}

        {/* Lock in button */}
        {canLockIn && (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              background: `linear-gradient(135deg, ${accent}20 0%, #1a1a1a 60%)`,
              border: `1px solid ${accent}44`,
            }}
          >
            <p className="text-sm font-semibold text-white mb-1">
              {inCount} {inCount === 1 ? 'person is' : 'people are'} in 🎉
            </p>
            <p className="text-[#666] text-xs mb-4">
              Looks good — lock it in to create the plan.
            </p>
            <button
              onClick={handleLockIn}
              disabled={locking}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: accent }}
            >
              {locking ? 'Locking in…' : 'Lock it in →'}
            </button>
          </div>
        )}

        {/* Waiting state for non-creator */}
        {!isCreator && card.status === 'open' && (
          <p className="text-center text-[#444] text-xs mt-4">
            Waiting for {(card.groups as any)?.name ?? 'the group'} to lock this in
          </p>
        )}
      </div>
    </div>
  )
}
