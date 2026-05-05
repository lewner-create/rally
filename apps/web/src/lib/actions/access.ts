'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AccessRequest = {
  id: string
  email: string
  name: string
  status: 'pending' | 'approved' | 'rejected'
  invited_by: string | null
  created_at: string
  approved_at: string | null
  referrer?: { display_name: string | null; username: string | null } | null
}

// ── Public: submit a request ──────────────────────────────────────
export async function requestAccess(
  email: string,
  name: string,
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const lower = email.toLowerCase().trim()

  const { data: existing } = await admin
    .from('access_requests')
    .select('status')
    .eq('email', lower)
    .maybeSingle()

  if (existing?.status === 'approved') {
    return { error: 'This email already has access — try signing in.' }
  }
  if (existing?.status === 'pending') {
    return { error: "You're already on the list! We'll be in touch soon." }
  }

  const { error } = await admin
    .from('access_requests')
    .insert({ email: lower, name: name.trim() })

  if (error) return { error: error.message }
  return {}
}

// ── Admin: approve a request and send invite email ────────────────
export async function approveRequest(
  requestId: string,
): Promise<{ error?: string }> {
  const admin = createAdminClient()

  const { data: req } = await admin
    .from('access_requests')
    .select('email, name')
    .eq('id', requestId)
    .single()

  if (!req) return { error: 'Request not found' }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(req.email, {
    data: { display_name: req.name },
  })

  if (inviteError) return { error: inviteError.message }

  await admin
    .from('access_requests')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', requestId)

  revalidatePath('/admin')
  return {}
}

// ── Admin: reject a request ───────────────────────────────────────
export async function rejectRequest(
  requestId: string,
): Promise<{ error?: string }> {
  const admin = createAdminClient()

  await admin
    .from('access_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)

  revalidatePath('/admin')
  return {}
}

// ── User: send a direct invite (uses credits) ─────────────────────
export async function sendUserInvite(
  email: string,
): Promise<{ error?: string; creditsLeft?: number }> {
  const supabase = await createClient()
  const admin    = createAdminClient()
  const lower    = email.toLowerCase().trim()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('invite_credits')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.invite_credits ?? 0) <= 0) {
    return { error: "You've used all your invite credits." }
  }

  // Check if already approved or pending
  const { data: existing } = await admin
    .from('access_requests')
    .select('id, status')
    .eq('email', lower)
    .maybeSingle()

  if (existing?.status === 'approved') {
    return { error: 'This person already has access.' }
  }

  // Send invite via Supabase auth
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(lower)
  if (inviteError) return { error: inviteError.message }

  // Log / update access_requests
  if (existing) {
    await admin
      .from('access_requests')
      .update({ status: 'approved', invited_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await admin
      .from('access_requests')
      .insert({
        email: lower,
        name: lower.split('@')[0],
        status: 'approved',
        invited_by: user.id,
        approved_at: new Date().toISOString(),
      })
  }

  // Deduct credit
  const newCredits = (profile.invite_credits ?? 1) - 1
  await supabase
    .from('profiles')
    .update({ invite_credits: newCredits })
    .eq('id', user.id)

  return { creditsLeft: newCredits }
}

// ── Admin: fetch all requests ─────────────────────────────────────
export async function getAccessRequests(): Promise<AccessRequest[]> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('access_requests')
    .select(`
      id, email, name, status, invited_by, created_at, approved_at,
      referrer:invited_by ( display_name, username )
    `)
    .order('created_at', { ascending: false })

  return (data ?? []) as AccessRequest[]
}
