'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface InviteToken {
  id: string
  token: string
  inviter_id: string
  label: string | null
  group_id: string | null
  used_at: string | null
  used_by: string | null
  created_at: string
  expires_at: string
  used_by_profile?: {
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

// ─── Generate invite token ──────────────────────────────────────────────────

export async function generateInviteToken(
  label?: string,
  groupId?: string
): Promise<{ token?: string; url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('invite_credits')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.invite_credits ?? 0) <= 0) {
    return { error: 'No invite credits remaining' }
  }

  // Create token
  const { data: tokenRow, error } = await supabase
    .from('invite_tokens')
    .insert({
      inviter_id: user.id,
      label: label?.trim() || null,
      group_id: groupId ?? null,
    })
    .select('token')
    .single()

  if (error || !tokenRow) return { error: error?.message ?? 'Failed to create invite' }

  // Decrement credits
  await supabase
    .from('profiles')
    .update({ invite_credits: (profile.invite_credits ?? 0) - 1 })
    .eq('id', user.id)

  revalidatePath('/settings')
  if (groupId) revalidatePath(`/groups/${groupId}`)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://volta.app'
  return {
    token: tokenRow.token,
    url: `${baseUrl}/welcome/${tokenRow.token}`,
  }
}

// ─── Get my invites ────────────────────────────────────────────────────────

export async function getMyInvites(): Promise<InviteToken[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('invite_tokens')
    .select(`
      *,
      used_by_profile:profiles!invite_tokens_used_by_fkey(
        display_name, username, avatar_url
      )
    `)
    .eq('inviter_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as InviteToken[]
}

// ─── Get active invite tokens for a group ─────────────────────────────────

export async function getGroupInviteTokens(groupId: string): Promise<InviteToken[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('group_id', groupId)
    .eq('inviter_id', user.id)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return (data ?? []) as InviteToken[]
}

// ─── Look up token (public — called from welcome page) ────────────────────

export async function lookupInviteToken(token: string): Promise<{
  valid: boolean
  inviterName?: string
  inviterAvatar?: string
  groupName?: string
  groupBanner?: string
  groupColor?: string
  error?: string
}> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('invite_tokens')
    .select(`
      used_at, expires_at, group_id,
      inviter:profiles!invite_tokens_inviter_id_fkey(
        display_name, username, avatar_url
      ),
      group:groups!invite_tokens_group_id_fkey(
        name, banner_url, theme_color
      )
    `)
    .eq('token', token)
    .single()

  if (!data) return { valid: false, error: 'Invite not found' }
  if (data.used_at) return { valid: false, error: 'This invite has already been used' }
  if (new Date(data.expires_at) < new Date()) return { valid: false, error: 'This invite has expired' }

  const inviter = data.inviter as any
  const group   = data.group   as any

  return {
    valid: true,
    inviterName:   inviter?.display_name ?? inviter?.username ?? 'Someone',
    inviterAvatar: inviter?.avatar_url ?? null,
    groupName:     group?.name ?? null,
    groupBanner:   group?.banner_url ?? null,
    groupColor:    group?.theme_color ?? null,
  }
}

// ─── Consume token on signup ───────────────────────────────────────────────

export async function consumeInviteToken(params: {
  token: string
  newUserId: string
  email: string
}): Promise<{ ok?: boolean; groupId?: string; error?: string }> {
  const admin = createAdminClient()

  // 1. Read the token
  const { data: tokenRow } = await admin
    .from('invite_tokens')
    .select('id, inviter_id, group_id, used_at, expires_at')
    .eq('token', params.token)
    .single()

  if (!tokenRow) return { error: 'Token not found' }
  if (tokenRow.used_at) return { error: 'Token already used' }
  if (new Date(tokenRow.expires_at) < new Date()) return { error: 'Token expired' }

  // 2. Mark token as used
  await admin
    .from('invite_tokens')
    .update({ used_at: new Date().toISOString(), used_by: params.newUserId })
    .eq('id', tokenRow.id)

  // 3. Create approved access_request
  await admin
    .from('access_requests')
    .upsert(
      {
        email:       params.email,
        status:      'approved',
        invited_by:  tokenRow.inviter_id,
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )

  // 4. Add to group if group-scoped
  if (tokenRow.group_id) {
    await admin
      .from('group_members')
      .upsert(
        {
          group_id: tokenRow.group_id,
          user_id:  params.newUserId,
          role:     'member',
        },
        { onConflict: 'group_id,user_id' }
      )
  }

  return { ok: true, groupId: tokenRow.group_id ?? undefined }
}
