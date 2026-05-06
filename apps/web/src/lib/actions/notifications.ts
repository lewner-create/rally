'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ─────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_plan'
  | 'plan_locked'
  | 'nudge'
  | 'new_member'
  | 'rsvp_reminder'
  | 'new_message'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  read_at: string | null
  created_at: string
  group_id: string | null
  event_id: string | null
  plan_card_id: string | null
  actor_id: string | null
  actor?: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

// ─── Fetch ─────────────────────────────────────────────────────────────────

export async function getNotifications(limit = 30): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(display_name, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as Notification[]
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return count ?? 0
}

// ─── Mark read ─────────────────────────────────────────────────────────────

export async function markNotificationRead(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)
}

// ─── Create (internal — called from other server actions) ──────────────────
// Uses admin client to bypass RLS restrictions when notifying other users.

export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  body?: string
  groupId?: string
  eventId?: string
  planCardId?: string
  actorId?: string
}) {
  try {
    const admin = createAdminClient()

    await admin
      .from('notifications')
      .insert({
        user_id:      params.userId,
        type:         params.type,
        title:        params.title,
        body:         params.body ?? null,
        group_id:     params.groupId ?? null,
        event_id:     params.eventId ?? null,
        plan_card_id: params.planCardId ?? null,
        actor_id:     params.actorId ?? null,
      })

    // Fire push notification (non-blocking)
    sendPushToUser(params.userId, {
      title: params.title,
      body: params.body ?? '',
      url: params.groupId
        ? `/groups/${params.groupId}`
        : params.eventId
          ? `/events/${params.eventId}`
          : '/dashboard',
    }).catch(() => {
      // push is best-effort, never throw
    })
  } catch (err) {
    console.error('[createNotification] failed:', err)
  }
}

// Notify all members of a group except one user (e.g. the actor)
export async function notifyGroupMembers(params: {
  groupId: string
  excludeUserId: string
  type: NotificationType
  title: string
  body?: string
  planCardId?: string
  eventId?: string
  actorId?: string
}) {
  try {
    const admin = createAdminClient()

    const { data: members } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', params.groupId)
      .neq('user_id', params.excludeUserId)

    if (!members?.length) return

    const rows = members.map(m => ({
      user_id:      m.user_id,
      type:         params.type,
      title:        params.title,
      body:         params.body ?? null,
      group_id:     params.groupId,
      event_id:     params.eventId ?? null,
      plan_card_id: params.planCardId ?? null,
      actor_id:     params.actorId ?? null,
    }))

    await admin.from('notifications').insert(rows)

    // Push all members (best-effort, parallel)
    const url = params.eventId
      ? `/events/${params.eventId}`
      : `/groups/${params.groupId}`

    await Promise.allSettled(
      members.map(m =>
        sendPushToUser(m.user_id, {
          title: params.title,
          body: params.body ?? '',
          url,
        })
      )
    )
  } catch (err) {
    console.error('[notifyGroupMembers] failed:', err)
  }
}

// ─── Push (imported here to avoid circular dep) ───────────────────────────
// We inline a lightweight version here; the full API is in push.ts

async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url: string }
) {
  const webpush = await import('@/lib/push-sender').then(m => m.sendPush).catch(() => null)
  if (!webpush) return
  await webpush(userId, payload)
}
