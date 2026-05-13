'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push-sender'

export async function sendPostEventNudges() {
  const admin = createAdminClient()
  let sent = 0
  let errors = 0

  const now = new Date()
  const windowEnd   = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()
  const windowStart = new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString()

  const { data: events, error: fetchErr } = await admin
    .from('events')
    .select('id, title, group_id')
    .eq('status', 'published')
    .eq('post_event_notified', false)
    .lt('ends_at', windowEnd)
    .gt('ends_at', windowStart)

  if (fetchErr || !events?.length) return { sent, errors }

  for (const event of events) {
    const { data: members } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', event.group_id)

    if (!members?.length) continue

    for (const { user_id } of members) {
      try {
        await sendPush(user_id, {
          title: 'How did it go?',
          body:  `Plan the next "${event.title}" with your crew`,
          url:   `/groups/${event.group_id}`,
          icon:  '/icon-192.png',
        })
        sent++
      } catch {
        errors++
      }
    }

    await admin
      .from('events')
      .update({ post_event_notified: true })
      .eq('id', event.id)
  }

  return { sent, errors }
}
