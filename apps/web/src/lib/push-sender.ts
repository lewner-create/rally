// lib/push-sender.ts
// Server-only module — never import client-side.
// Called from notifications.ts when creating a notification.
//
// Setup required:
//   1. pnpm add web-push  (in apps/web)
//   2. pnpm add -D @types/web-push
//   3. Generate VAPID keys once:
//        npx web-push generate-vapid-keys
//   4. Add to .env.local:
//        NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
//        VAPID_PRIVATE_KEY=<privateKey>
//        VAPID_SUBJECT=mailto:hello@volta.app

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const SUBJECT     = process.env.VAPID_SUBJECT ?? 'mailto:hello@volta.app'

let configured = false

function ensureConfigured() {
  if (configured) return true
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY)
  configured = true
  return true
}

export async function sendPush(
  userId: string,
  payload: { title: string; body: string; url: string }
) {
  if (!ensureConfigured()) return // VAPID keys not set — skip silently

  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const message = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    url:   payload.url,
    icon:  '/icon-192.png',
  })

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        message
      ).catch(async (err: any) => {
        // 410 Gone = subscription expired, clean it up
        if (err.statusCode === 410) {
          await admin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      })
    )
  )
}
