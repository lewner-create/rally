'use client'

import { useState, useTransition, useEffect } from 'react'
import { createInviteLink, inviteByUsername, revokeInvite } from '@/lib/actions/groups'
import { generateInviteToken, getGroupInviteTokens, type InviteToken } from '@/lib/actions/invites'
import { getMyInviteCredits } from '@/lib/actions/get-invite-credits'
import { Input } from '@/components/ui/input'
import { Copy, Check, Link2, Trash2, UserPlus, Sparkles } from 'lucide-react'

interface Invite {
  id: string
  token: string
  use_count: number
  expires_at: string
}

interface InvitePanelProps {
  groupId: string
  groupName: string
  initialInvites: Invite[]
}

export function InvitePanel({ groupId, groupName, initialInvites }: InvitePanelProps) {
  const [invites, setInvites]           = useState<Invite[]>(initialInvites)
  const [copied, setCopied]             = useState<string | null>(null)
  const [username, setUsername]         = useState('')
  const [usernameMsg, setUsernameMsg]   = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition]    = useTransition()

  // Volta invite tokens for this group
  const [voltaTokens, setVoltaTokens]   = useState<InviteToken[]>([])
  const [credits, setCredits]           = useState<number | null>(null)
  const [generating, setGenerating]     = useState(false)
  const [genError, setGenError]         = useState<string | null>(null)
  const [newUrl, setNewUrl]             = useState<string | null>(null)

  useEffect(() => {
    getGroupInviteTokens(groupId).then(setVoltaTokens)
    getMyInviteCredits().then(setCredits)
  }, [groupId])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // ── Existing invite link handlers ──────────────────────────────────────

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${baseUrl}/join/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleCreateLink() {
    startTransition(async () => {
      const result = await createInviteLink(groupId)
      if (result.token) window.location.reload()
    })
  }

  function handleRevoke(inviteId: string) {
    startTransition(async () => {
      await revokeInvite(inviteId)
      setInvites(prev => prev.filter(i => i.id !== inviteId))
    })
  }

  function handleInviteByUsername(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    setUsernameMsg(null)
    startTransition(async () => {
      const result = await inviteByUsername(groupId, username.trim())
      if (result.error) {
        setUsernameMsg({ type: 'error', text: result.error })
      } else {
        setUsernameMsg({ type: 'success', text: `${result.name} was added!` })
        setUsername('')
      }
    })
  }

  // ── Volta invite handler ──────────────────────────────────────────────

  async function handleGenerateVoltaInvite() {
    setGenerating(true)
    setGenError(null)
    setNewUrl(null)

    const result = await generateInviteToken(groupName, groupId)

    if (result.error) {
      setGenError(result.error)
    } else if (result.url) {
      setNewUrl(result.url)
      setCredits(c => c === null ? null : Math.max(0, c - 1))
      navigator.clipboard.writeText(result.url).catch(() => {})
      setCopied('volta-new')
      setTimeout(() => setCopied(null), 2000)
      // Refresh token list
      getGroupInviteTokens(groupId).then(setVoltaTokens)
    getMyInviteCredits().then(setCredits)
    }

    setGenerating(false)
  }

  function copyVoltaLink(token: string, id: string) {
    navigator.clipboard.writeText(`${baseUrl}/welcome/${token}`)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5">

      {/* Add by username */}
      <div>
        <p className="text-[11px] font-medium tracking-[.07em] uppercase text-muted-foreground mb-2">
          Add by username
        </p>
        <form onSubmit={handleInviteByUsername} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              className="pl-7 h-9"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isPending}
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !username.trim()}
            className="h-9 w-9 flex items-center justify-center rounded-md text-white flex-shrink-0 disabled:opacity-40"
            style={{ background: '#7F77DD' }}
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </form>
        {usernameMsg && (
          <p className="mt-1.5 text-xs" style={{ color: usernameMsg.type === 'error' ? '#D85A30' : '#1D9E75' }}>
            {usernameMsg.text}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '0.5px solid #D3D1C7' }} />

      {/* Existing invite links (existing Volta users) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-medium tracking-[.07em] uppercase text-muted-foreground">
            Invite links
          </p>
          <button
            onClick={handleCreateLink}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border disabled:opacity-40"
            style={{ borderColor: '#AFA9EC', color: '#7F77DD', background: '#EEEDFE' }}
          >
            <Link2 className="h-3 w-3" />
            New link
          </button>
        </div>

        {invites.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active invite links. Create one above.</p>
        ) : (
          <ul className="space-y-2">
            {invites.map(invite => {
              const url     = `${baseUrl}/join/${invite.token}`
              const isCopied = copied === invite.token
              return (
                <li
                  key={invite.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: '#F1EFE8', border: '0.5px solid #D3D1C7' }}
                >
                  <code className="flex-1 text-xs truncate text-muted-foreground" suppressHydrationWarning>
                    {url}
                  </code>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{invite.use_count} uses</span>
                  <button onClick={() => copyLink(invite.token)} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
                    {isCopied
                      ? <Check className="h-3.5 w-3.5" style={{ color: '#1D9E75' }} />
                      : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleRevoke(invite.id)}
                    disabled={isPending}
                    className="h-6 w-6 flex items-center justify-center rounded transition-colors hover:opacity-70 disabled:opacity-30"
                    style={{ color: '#D85A30' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="text-xs text-muted-foreground mt-2">Links expire 7 days after creation.</p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '0.5px solid #D3D1C7' }} />

      {/* Invite to Volta (new users) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-medium tracking-[.07em] uppercase text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" style={{ color: '#7F77DD' }} />
            Invite to Volta
          </p>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: (credits ?? 0) > 0 ? '#EEEDFE' : '#f0f0f0',
              color: (credits ?? 0) > 0 ? '#7F77DD' : '#999',
            }}
          >
            {credits === null ? "…" : `${credits} left`}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Share a personal link — they sign up and join {groupName} automatically.
        </p>

        <button
          onClick={handleGenerateVoltaInvite}
          disabled={generating || credits === null || credits <= 0}
          className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{
            borderColor: '#AFA9EC',
            color: (credits ?? 0) > 0 ? '#7F77DD' : '#999',
            background: (credits ?? 0) > 0 ? '#EEEDFE' : '#f5f5f5',
          }}
        >
          <Sparkles className="h-3 w-3" />
          {generating ? 'Generating…' : credits === null ? '…' : credits <= 0 ? 'No invites left' : 'Generate invite link'}
        </button>

        {genError && (
          <p className="mt-2 text-xs" style={{ color: '#D85A30' }}>{genError}</p>
        )}

        {/* Newly generated link feedback */}
        {newUrl && copied === 'volta-new' && (
          <div
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: '#F1EFE8', border: '0.5px solid #D3D1C7' }}
          >
            <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#1D9E75' }} />
            <span className="text-xs text-muted-foreground flex-1 truncate" suppressHydrationWarning>
              Copied!
            </span>
          </div>
        )}

        {/* Existing active Volta tokens for this group */}
        {voltaTokens.length > 0 && (
          <ul className="space-y-2 mt-2">
            {voltaTokens.map(t => {
              const url      = `${baseUrl}/welcome/${t.token}`
              const isCopied = copied === t.id
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: '#F1EFE8', border: '0.5px solid #D3D1C7' }}
                >
                  <code className="flex-1 text-xs truncate text-muted-foreground" suppressHydrationWarning>
                    {url}
                  </code>
                  <button
                    onClick={() => copyVoltaLink(t.token, t.id)}
                    className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isCopied
                      ? <Check className="h-3.5 w-3.5" style={{ color: '#1D9E75' }} />
                      : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

    </div>
  )
}
