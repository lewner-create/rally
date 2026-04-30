'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateGroup, removeMember, deleteGroup } from '@/lib/actions/groups'
import BannerPicker from '@/components/groups/banner-picker'

type Member = {
  user_id: string
  role: 'admin' | 'member'
  profiles: {
    id: string
    display_name: string | null
    username: string
    avatar_url: string | null
  } | null
}

type Group = {
  id: string
  name: string
  description: string | null
  theme_color: string | null
  banner_url: string | null
  interests?: string[]
  tier?: string
  group_members: Member[]
}

type Props = {
  group: Group
  currentUserId: string
  isAdmin: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THEME_COLORS = [
  '#7F77DD', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

const INTEREST_CHIPS = [
  { id: 'gaming',  label: 'Gaming',       icon: '🎮' },
  { id: 'hiking',  label: 'Hiking',       icon: '🥾' },
  { id: 'dining',  label: 'Dining',       icon: '🍽️' },
  { id: 'travel',  label: 'Travel',       icon: '✈️' },
  { id: 'movies',  label: 'Movies',       icon: '🎬' },
  { id: 'music',   label: 'Music',        icon: '🎵' },
  { id: 'sports',  label: 'Sports',       icon: '⚽' },
  { id: 'fitness', label: 'Fitness',      icon: '💪' },
  { id: 'cars',    label: 'Cars & Motos', icon: '🏍️' },
  { id: 'other',   label: 'Other',        icon: '✨' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
  borderRadius: '10px', padding: '10px 12px', fontSize: '14px',
  color: '#fff', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const LABEL: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, letterSpacing: '.06em',
  textTransform: 'uppercase', color: '#555', display: 'block', marginBottom: '8px',
}

const SECTION: React.CSSProperties = { marginBottom: '28px' }

// ─── Component ────────────────────────────────────────────────────────────────

export function GroupSettingsForm({ group, currentUserId, isAdmin }: Props) {
  const router = useRouter()
  const [name,        setName]        = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [themeColor,  setThemeColor]  = useState(group?.theme_color ?? '#7F77DD')
  const [interests,   setInterests]   = useState<string[]>(group?.interests ?? [])
  const [bannerValue, setBannerValue] = useState<any>(null)
  const [saving,      startSave]      = useTransition()
  const [deleting,    startDelete]    = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [removeId,    setRemoveId]    = useState<string | null>(null)

  if (!group) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#444', fontSize: '14px' }}>Loading…</p>
      </div>
    )
  }

  async function resolveBannerUrl(): Promise<string | null | undefined> {
    if (bannerValue === null) return null
    if (!bannerValue) return undefined
    if (bannerValue.type === 'template') return `gradient:${bannerValue.css}`
    if (bannerValue.type === 'upload') return bannerValue.url
    return undefined
  }

  function toggleInterest(id: string) {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function handleSave() {
    startSave(async () => {
      const resolvedBanner = await resolveBannerUrl()
      await updateGroup(group.id, {
        name:        name.trim(),
        description: description.trim() || null,
        theme_color: themeColor,
        interests,
        ...(resolvedBanner !== undefined ? { banner_url: resolvedBanner } : {}),
      })
      router.refresh()
    })
  }

  function handleRemoveMember(userId: string) {
    setRemoveId(userId)
    startSave(async () => {
      await removeMember(group.id, userId)
      setRemoveId(null)
      router.refresh()
    })
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteGroup(group.id)
      router.push('/dashboard')
    })
  }

  const accent = themeColor

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '560px', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <a
            href={`/groups/${group.id}`}
            style={{ fontSize: '12px', color: '#555', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}
          >
            ← Back to group
          </a>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-.2px' }}>
            Group settings
          </h1>
          {!isAdmin && (
            <p style={{ fontSize: '13px', color: '#555', margin: '6px 0 0' }}>
              You have member access — only admins can edit group settings.
            </p>
          )}
        </div>

        {isAdmin && (
          <>
            {/* Name */}
            <div style={SECTION}>
              <label style={LABEL}>Group name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={INPUT}
                placeholder="Give your group a name"
              />
            </div>

            {/* Description */}
            <div style={SECTION}>
              <label style={LABEL}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ ...INPUT, resize: 'none', lineHeight: 1.5 }}
                placeholder="What's this group about?"
              />
            </div>

            {/* Interests */}
            <div style={SECTION}>
              <label style={LABEL}>Activities</label>
              <p style={{ fontSize: '12px', color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>
                Helps Rally surface the right features for your group.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {INTEREST_CHIPS.map(chip => {
                  const active = interests.includes(chip.id)
                  return (
                    <button
                      key={chip.id}
                      onClick={() => toggleInterest(chip.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '7px 12px', borderRadius: '9999px',
                        background: active ? `${accent}22` : '#1a1a1a',
                        border: `1px solid ${active ? accent : '#2a2a2a'}`,
                        color: active ? accent : '#666',
                        fontSize: '13px', fontWeight: active ? 600 : 400,
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{chip.icon}</span>
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Theme color */}
            <div style={SECTION}>
              <label style={LABEL}>Theme color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {THEME_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setThemeColor(c)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: c, border: 'none', cursor: 'pointer',
                      outline: themeColor === c ? `3px solid ${c}` : 'none',
                      outlineOffset: '2px',
                      transform: themeColor === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform .15s',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Banner */}
            <div style={SECTION}>
              <label style={LABEL}>Banner</label>
              <BannerPicker
                currentBannerUrl={group.banner_url}
                groupName={name}
                onChange={val => setBannerValue(val)}
              />
            </div>

            {/* Save */}
            <div style={{ marginBottom: '40px' }}>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                style={{
                  padding: '10px 24px', background: accent, color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 600, cursor: saving || !name.trim() ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: saving || !name.trim() ? 0.5 : 1,
                  transition: 'opacity .15s',
                  boxShadow: `0 2px 12px ${accent}44`,
                }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid #1e1e1e', marginBottom: '32px' }} />
          </>
        )}

        {/* Members */}
        <div style={SECTION}>
          <label style={LABEL}>Members · {group.group_members.length}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {group.group_members.map(m => {
              const p = m.profiles
              if (!p) return null
              const isYou = m.user_id === currentUserId
              return (
                <div
                  key={m.user_id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: '10px', background: '#161616',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: '#2a2a2a', overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 600, color: '#fff',
                    }}>
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (p.display_name ?? p.username).charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#fff' }}>
                        {p.display_name ?? p.username}
                        {isYou && (
                          <span style={{ fontSize: '11px', color: '#555', marginLeft: '6px' }}>(you)</span>
                        )}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>
                        {m.role === 'admin' ? 'Admin' : 'Member'}
                      </p>
                    </div>
                  </div>

                  {isAdmin && !isYou && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      disabled={removeId === m.user_id}
                      style={{
                        fontSize: '12px', color: '#555', background: 'none',
                        border: 'none', cursor: 'pointer', padding: '4px 8px',
                        borderRadius: '6px', fontFamily: 'inherit',
                      }}
                    >
                      {removeId === m.user_id ? '…' : 'Remove'}
                    </button>
                  )}
                  {isYou && !isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(currentUserId)}
                      style={{
                        fontSize: '12px', color: '#f87171', background: 'none',
                        border: 'none', cursor: 'pointer', padding: '4px 8px',
                        fontFamily: 'inherit',
                      }}
                    >
                      Leave group
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Danger zone */}
        {isAdmin && (
          <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: '28px' }}>
            <label style={{ ...LABEL, color: '#7f1d1d' }}>Danger zone</label>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  fontSize: '13px', color: '#f87171',
                  background: '#1a0a0a', border: '1px solid #3f1212',
                  borderRadius: '10px', padding: '9px 16px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Delete group
              </button>
            ) : (
              <div style={{ background: '#1a0a0a', border: '1px solid #3f1212', borderRadius: '12px', padding: '16px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#fca5a5', lineHeight: 1.5 }}>
                  This will permanently delete the group, all members, messages and plans. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      fontSize: '13px', fontWeight: 600, color: '#fff',
                      background: '#dc2626', border: 'none', borderRadius: '8px',
                      padding: '8px 16px', cursor: 'pointer',
                      opacity: deleting ? 0.6 : 1, fontFamily: 'inherit',
                    }}
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete it'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      fontSize: '13px', color: '#555', background: 'none',
                      border: '1px solid #333', borderRadius: '8px',
                      padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
