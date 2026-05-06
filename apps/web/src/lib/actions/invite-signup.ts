'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { consumeInviteToken } from './invites'

export async function createAdminSignup(params: {
  email: string
  password: string
  displayName: string
  token: string
}): Promise<{ ok?: boolean; error?: string }> {
  const admin = createAdminClient()

  // 1. Check token is still valid before creating the user
  const { data: tokenRow } = await admin
    .from('invite_tokens')
    .select('id, used_at, expires_at')
    .eq('token', params.token)
    .single()

  if (!tokenRow) return { error: 'Invite not found or expired' }
  if (tokenRow.used_at) return { error: 'This invite has already been used' }
  if (new Date(tokenRow.expires_at) < new Date()) return { error: 'This invite has expired' }

  // 2. Create auth user (email confirmed = skip email verification)
  const { data: authData, error: createErr } = await admin.auth.admin.createUser({
    email:          params.email,
    password:       params.password,
    email_confirm:  true,
    user_metadata:  { display_name: params.displayName },
  })

  if (createErr || !authData.user) {
    // Friendly error for duplicate email
    if (createErr?.message?.toLowerCase().includes('already')) {
      return { error: 'An account with this email already exists' }
    }
    return { error: createErr?.message ?? 'Failed to create account' }
  }

  const newUserId = authData.user.id

  // 3. Supabase should auto-create a profile via trigger,
  //    but ensure display_name is set
  await admin
    .from('profiles')
    .update({ display_name: params.displayName })
    .eq('id', newUserId)

  // 4. Consume token + create approved access_request
  const consume = await consumeInviteToken({
    token:     params.token,
    newUserId,
    email:     params.email,
  })

  if (consume.error) {
    // Token consume failed — still let them in (access_request will be missing
    // but we can recover). Log it server-side.
    console.error('[createAdminSignup] consumeInviteToken failed:', consume.error)
  }

  return { ok: true }
}
