import { createClient } from '@/lib/supabase/server'
import { getMyGroups } from '@/lib/actions/groups'
import { getEventsForGroup } from '@/lib/actions/events'
import { getMessages } from '@/lib/actions/messages'
import { getDMThreads, getDMMessages } from '@/lib/actions/dms'
import { MessagesHub } from '@/components/chat/messages-hub'

export const metadata = { title: 'Messages — Rally' }

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string; e?: string; dm?: string }>
}) {
  const { g: groupId, e: eventId, dm: activeDMId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const groups = await getMyGroups()
  const dmThreads = await getDMThreads()

  const groupThreads = await Promise.all(
    groups.map(async g => ({
      groupId:   (g.groups as any)?.id ?? g.group_id,
      groupName: (g.groups as any)?.name ?? 'Group',
      events:    await getEventsForGroup((g.groups as any)?.id ?? g.group_id),
    }))
  )

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const activeGroupId = groupId ?? (groups[0] as any)?.groups?.id ?? null
  const safeGroupId = activeGroupId && UUID_RE.test(activeGroupId) ? activeGroupId : null
  const safeEventId = eventId && UUID_RE.test(eventId) ? eventId : null
  const safeDMId = activeDMId && UUID_RE.test(activeDMId) ? activeDMId : null

  const initialMessages = safeGroupId
    ? await getMessages(safeGroupId, safeEventId ?? null)
    : []

  const dmMessages = safeDMId ? await getDMMessages(safeDMId) : []

  return (
    <MessagesHub
      groups={groupThreads}
      activeGroupId={safeGroupId}
      activeEventId={safeEventId ?? null}
      initialMessages={initialMessages}
      currentUserId={user?.id ?? ''}
      dmThreads={dmThreads}
      activeDMId={safeDMId}
      dmMessages={dmMessages}
    />
  )
}